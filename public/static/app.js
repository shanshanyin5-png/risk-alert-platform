const { createApp, ref, reactive, onMounted, computed, onUnmounted } = Vue;

const App = {
  setup() {
    // ========== 状态管理 ==========
    const activeTab = ref('dashboard');  // dashboard, risks, alerts
    const loading = ref(false);
    const statistics = ref({
      totalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      todayRisks: 0,
      companyDistribution: [],
      riskTrend: []
    });

    // 风险列表数据
    const risks = ref([]);
    const pagination = reactive({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    });

    // 筛选条件
    const filters = reactive({
      company: '',
      level: '',
      keyword: ''
    });

    // 公司列表
    const companies = ref([]);

    // 当前查看的风险详情
    const currentRisk = ref(null);
    const showDetail = ref(false);

    // SSE连接状态
    const sseConnected = ref(false);
    const latestRisks = ref([]);
    let eventSource = null;

    // ========== API 请求 ==========
    const API_BASE = '/api';

    // 获取统计数据
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`${API_BASE}/statistics`);
        if (response.data.success) {
          statistics.value = response.data.data;
          // 渲染图表
          renderCharts();
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    // 获取风险列表
    const fetchRisks = async (resetPage = false) => {
      if (resetPage) pagination.page = 1;
      
      loading.value = true;
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };

        const response = await axios.get(`${API_BASE}/risks`, { params });
        if (response.data.success) {
          risks.value = response.data.data.list;
          Object.assign(pagination, response.data.data.pagination);
        }
      } catch (error) {
        console.error('获取风险列表失败:', error);
      } finally {
        loading.value = false;
      }
    };

    // 获取公司列表
    const fetchCompanies = async () => {
      try {
        const response = await axios.get(`${API_BASE}/companies`);
        if (response.data.success) {
          companies.value = response.data.data;
        }
      } catch (error) {
        console.error('获取公司列表失败:', error);
      }
    };

    // 获取风险详情
    const viewRiskDetail = async (riskId) => {
      try {
        const response = await axios.get(`${API_BASE}/risks/${riskId}`);
        if (response.data.success) {
          currentRisk.value = response.data.data;
          showDetail.value = true;
        }
      } catch (error) {
        console.error('获取风险详情失败:', error);
      }
    };

    // 关闭详情弹窗
    const closeDetail = () => {
      showDetail.value = false;
      currentRisk.value = null;
    };

    // 连接SSE实时数据流
    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${API_BASE}/realtime`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') {
            sseConnected.value = true;
            console.log('✅ SSE连接成功');
          } else if (data.type === 'update') {
            latestRisks.value = data.data;
            console.log('📡 收到实时数据:', data.data.length, '条');
          }
        } catch (error) {
          console.error('SSE数据解析失败:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        sseConnected.value = false;
      };
    };

    // 断开SSE连接
    const disconnectSSE = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        sseConnected.value = false;
      }
    };

    // ========== ECharts 图表渲染 ==========
    let levelChart = null;
    let companyChart = null;
    let trendChart = null;

    const renderCharts = () => {
      // 延迟渲染确保DOM已加载
      setTimeout(() => {
        renderLevelChart();
        renderCompanyChart();
        renderTrendChart();
      }, 100);
    };

    // 风险等级分布饼图
    const renderLevelChart = () => {
      const dom = document.getElementById('level-chart');
      if (!dom) return;

      if (levelChart) levelChart.dispose();
      levelChart = echarts.init(dom);

      const option = {
        title: { text: '风险等级分布', left: 'center', top: 10 },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 10, left: 'center' },
        color: ['#ef4444', '#f97316', '#eab308'],
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          label: { show: true, formatter: '{b}\n{c}条' },
          data: [
            { value: statistics.value.highRisks, name: '高风险' },
            { value: statistics.value.mediumRisks, name: '中风险' },
            { value: statistics.value.lowRisks, name: '低风险' }
          ]
        }]
      };

      levelChart.setOption(option);
    };

    // 公司分布柱状图
    const renderCompanyChart = () => {
      const dom = document.getElementById('company-chart');
      if (!dom) return;

      if (companyChart) companyChart.dispose();
      companyChart = echarts.init(dom);

      const data = statistics.value.companyDistribution;
      const option = {
        title: { text: '公司风险分布 TOP10', left: 'center', top: 10 },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: data.map(item => item.company),
          axisLabel: { rotate: 45, interval: 0 }
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: data.map(item => item.count),
          itemStyle: { color: '#3b82f6' },
          label: { show: true, position: 'top' }
        }]
      };

      companyChart.setOption(option);
    };

    // 风险趋势折线图
    const renderTrendChart = () => {
      const dom = document.getElementById('trend-chart');
      if (!dom) return;

      if (trendChart) trendChart.dispose();
      trendChart = echarts.init(dom);

      const data = statistics.value.riskTrend;
      const option = {
        title: { text: '最近7天风险趋势', left: 'center', top: 10 },
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: data.map(item => item.date),
          boundaryGap: false
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: data.map(item => item.count),
          smooth: true,
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16, 185, 129, 0.1)' },
          label: { show: true, position: 'top' }
        }]
      };

      trendChart.setOption(option);
    };

    // ========== 工具函数 ==========
    const getRiskLevelClass = (level) => {
      if (level === '高风险') return 'bg-red-100 text-red-700 border-red-300';
      if (level === '中风险') return 'bg-orange-100 text-orange-700 border-orange-300';
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    };

    const getRiskLevelIcon = (level) => {
      if (level === '高风险') return 'fas fa-exclamation-triangle text-red-500';
      if (level === '中风险') return 'fas fa-exclamation-circle text-orange-500';
      return 'fas fa-info-circle text-yellow-500';
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    const truncateText = (text, maxLength = 100) => {
      if (!text) return '-';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // ========== 生命周期 ==========
    onMounted(() => {
      fetchStatistics();
      fetchCompanies();
      fetchRisks();
      connectSSE();

      // 监听窗口大小变化，重新渲染图表
      window.addEventListener('resize', () => {
        levelChart?.resize();
        companyChart?.resize();
        trendChart?.resize();
      });
    });

    onUnmounted(() => {
      disconnectSSE();
      levelChart?.dispose();
      companyChart?.dispose();
      trendChart?.dispose();
    });

    // ========== 返回模板数据 ==========
    return {
      activeTab,
      loading,
      statistics,
      risks,
      pagination,
      filters,
      companies,
      currentRisk,
      showDetail,
      sseConnected,
      latestRisks,
      fetchStatistics,
      fetchRisks,
      fetchCompanies,
      viewRiskDetail,
      closeDetail,
      getRiskLevelClass,
      getRiskLevelIcon,
      formatDate,
      truncateText
    };
  },

  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- 顶部导航栏 -->
      <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-shield-alt text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold">实时风险预警平台</h1>
                <p class="text-sm text-blue-100">Risk Alert Monitoring System</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <span class="status-dot inline-block w-2 h-2 rounded-full" :class="sseConnected ? 'bg-green-400' : 'bg-red-400'"></span>
                <span class="text-sm">{{ sseConnected ? '实时连接' : '连接断开' }}</span>
              </div>
              <div class="text-sm">
                <i class="far fa-clock mr-1"></i>
                {{ new Date().toLocaleString('zh-CN') }}
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 标签导航 -->
      <div class="container mx-auto px-6 mt-6">
        <div class="flex space-x-2 border-b border-gray-200">
          <button 
            @click="activeTab = 'dashboard'" 
            :class="['px-6 py-3 font-medium transition-colors', activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600']"
          >
            <i class="fas fa-chart-pie mr-2"></i>监控大屏
          </button>
          <button 
            @click="activeTab = 'risks'" 
            :class="['px-6 py-3 font-medium transition-colors', activeTab === 'risks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600']"
          >
            <i class="fas fa-list mr-2"></i>风险列表
          </button>
        </div>
      </div>

      <!-- 主内容区 -->
      <main class="container mx-auto px-6 py-6">
        <!-- 监控大屏 -->
        <div v-show="activeTab === 'dashboard'">
          <!-- 统计卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm">总风险数</p>
                  <p class="text-3xl font-bold text-gray-800 mt-1">{{ statistics.totalRisks }}</p>
                </div>
                <i class="fas fa-database text-4xl text-blue-500 opacity-20"></i>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm">高风险</p>
                  <p class="text-3xl font-bold text-red-600 mt-1">{{ statistics.highRisks }}</p>
                </div>
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 opacity-20"></i>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm">中风险</p>
                  <p class="text-3xl font-bold text-orange-600 mt-1">{{ statistics.mediumRisks }}</p>
                </div>
                <i class="fas fa-exclamation-circle text-4xl text-orange-500 opacity-20"></i>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm">低风险</p>
                  <p class="text-3xl font-bold text-yellow-600 mt-1">{{ statistics.lowRisks }}</p>
                </div>
                <i class="fas fa-info-circle text-4xl text-yellow-500 opacity-20"></i>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-500 text-sm">今日新增</p>
                  <p class="text-3xl font-bold text-green-600 mt-1">{{ statistics.todayRisks }}</p>
                </div>
                <i class="fas fa-plus-circle text-4xl text-green-500 opacity-20"></i>
              </div>
            </div>
          </div>

          <!-- ECharts 图表区域 -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <div id="level-chart" style="width: 100%; height: 300px;"></div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 lg:col-span-2">
              <div id="company-chart" style="width: 100%; height: 300px;"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <div id="trend-chart" style="width: 100%; height: 300px;"></div>
            </div>
          </div>

          <!-- 实时风险流 -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center">
              <i class="fas fa-broadcast-tower mr-2 text-blue-600"></i>
              实时风险流
              <span v-if="sseConnected" class="ml-2 text-sm text-green-600">(实时更新中...)</span>
            </h3>
            <div v-if="latestRisks.length > 0" class="space-y-3">
              <div v-for="risk in latestRisks" :key="risk.id" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <i :class="getRiskLevelIcon(risk.risk_level) + ' mt-1'"></i>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-800">{{ risk.company_name }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(risk.risk_time) }}</span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ truncateText(risk.title, 60) }}</p>
                  <span :class="['inline-block px-2 py-1 text-xs rounded mt-2 border', getRiskLevelClass(risk.risk_level)]">
                    {{ risk.risk_level }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-400 py-8">
              <i class="fas fa-signal text-4xl mb-2"></i>
              <p>等待实时数据...</p>
            </div>
          </div>
        </div>

        <!-- 风险列表 -->
        <div v-show="activeTab === 'risks'">
          <!-- 筛选条件 -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">公司筛选</label>
                <select v-model="filters.company" @change="fetchRisks(true)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">全部公司</option>
                  <option v-for="company in companies" :key="company.name" :value="company.name">
                    {{ company.name }} ({{ company.risk_count }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
                <select v-model="filters.level" @change="fetchRisks(true)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">全部等级</option>
                  <option value="高风险">高风险</option>
                  <option value="中风险">中风险</option>
                  <option value="低风险">低风险</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">关键词搜索</label>
                <div class="flex space-x-2">
                  <input 
                    v-model="filters.keyword" 
                    @keyup.enter="fetchRisks(true)"
                    type="text" 
                    placeholder="搜索标题或风险事项..." 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button @click="fetchRisks(true)" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-search mr-2"></i>搜索
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 风险列表 -->
          <div v-if="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
            <p class="text-gray-600 mt-4">加载中...</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="risk in risks" :key="risk.id" class="bg-white rounded-lg shadow p-6 risk-card cursor-pointer" @click="viewRiskDetail(risk.id)">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <span :class="['px-3 py-1 text-sm rounded-full border', getRiskLevelClass(risk.risk_level)]">
                      {{ risk.risk_level }}
                    </span>
                    <span class="text-sm text-gray-500">{{ risk.company_name }}</span>
                    <span class="text-sm text-gray-400">{{ formatDate(risk.risk_time) }}</span>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-800 mb-2">{{ risk.title }}</h3>
                  <p class="text-gray-600 text-sm mb-3">{{ truncateText(risk.risk_item, 200) }}</p>
                  <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i class="fas fa-link mr-1"></i>来源: {{ truncateText(risk.source, 50) }}</span>
                    <span><i class="far fa-clock mr-1"></i>{{ formatDate(risk.created_at) }}</span>
                  </div>
                </div>
                <i class="fas fa-chevron-right text-gray-400 ml-4"></i>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="pagination.totalPages > 1" class="flex items-center justify-center space-x-2 mt-6">
            <button 
              @click="pagination.page--; fetchRisks()" 
              :disabled="pagination.page === 1"
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="px-4 py-2 text-gray-700">
              第 {{ pagination.page }} / {{ pagination.totalPages }} 页 (共 {{ pagination.total }} 条)
            </span>
            <button 
              @click="pagination.page++; fetchRisks()" 
              :disabled="pagination.page === pagination.totalPages"
              class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </main>

      <!-- 风险详情弹窗 -->
      <transition name="fade">
        <div v-if="showDetail" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeDetail">
          <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-800">风险详情</h2>
              <button @click="closeDetail" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>

            <div v-if="currentRisk" class="p-6 space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">风险等级</label>
                <div class="mt-1">
                  <span :class="['inline-block px-4 py-2 rounded-lg border', getRiskLevelClass(currentRisk.risk_level)]">
                    {{ currentRisk.risk_level }}
                  </span>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">公司名称</label>
                <p class="mt-1 text-gray-800">{{ currentRisk.company_name }}</p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">标题</label>
                <p class="mt-1 text-gray-800 font-medium">{{ currentRisk.title }}</p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">风险事项</label>
                <p class="mt-1 text-gray-700 whitespace-pre-wrap">{{ currentRisk.risk_item }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-500">风险时间</label>
                  <p class="mt-1 text-gray-800">{{ formatDate(currentRisk.risk_time) }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-500">记录时间</label>
                  <p class="mt-1 text-gray-800">{{ formatDate(currentRisk.created_at) }}</p>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">来源链接</label>
                <p class="mt-1">
                  <a :href="currentRisk.source" target="_blank" class="text-blue-600 hover:underline break-all">
                    {{ currentRisk.source }}
                  </a>
                </p>
              </div>

              <div>
                <label class="text-sm font-medium text-gray-500">风险判定原因</label>
                <p class="mt-1 text-gray-700 whitespace-pre-wrap">{{ currentRisk.risk_reason }}</p>
              </div>

              <div v-if="currentRisk.remark">
                <label class="text-sm font-medium text-gray-500">备注</label>
                <p class="mt-1 text-gray-700">{{ currentRisk.remark }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  `
};

createApp(App).mount('#app');
