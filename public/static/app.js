const { createApp, ref, reactive, onMounted, computed, onUnmounted } = Vue;

const App = {
  setup() {
    // ========== 状态管理 ==========
    const activeTab = ref('dashboard');  // dashboard, risks, alerts, datasources, riskLevel
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
      keyword: '',
      startDate: '',  // 新增：开始时间
      endDate: ''     // 新增：结束时间
    });

    // 公司列表
    const companies = ref([]);

    // 当前查看的风险详情
    const currentRisk = ref(null);
    const showDetail = ref(false);

    // 实时连接状态
    const realtimeConnected = ref(true);
    const latestRisks = ref([]);
    let pollingInterval = null;

    // ========== 新增：爬取网站源管理 ==========
    const dataSources = ref([]);
    const showDataSourceModal = ref(false);
    const currentDataSource = ref(null);
    const dataSourceForm = reactive({
      name: '',
      url: '',
      xpathRules: '',
      fieldMapping: '',
      enableJS: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      interval: 3600,
      timeout: 30,
      enabled: true
    });

    // ========== 新增：风险等级调整 ==========
    const riskLevelList = ref([]);
    const showRiskLevelModal = ref(false);
    const selectedCompanies = ref([]);
    const riskLevelForm = reactive({
      companyId: null,
      targetLevel: '',
      reason: '',
      attachment: null
    });
    const riskLevelHistory = ref([]);

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

    // 轮询获取实时数据
    const fetchRealtimeData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/realtime`);
        if (response.data.success) {
          latestRisks.value = response.data.data.risks;
          realtimeConnected.value = true;
        }
      } catch (error) {
        console.error('获取实时数据失败:', error);
        realtimeConnected.value = false;
      }
    };

    // 启动轮询
    const startPolling = () => {
      // 立即获取一次
      fetchRealtimeData();
      
      // 每5秒轮询一次实时数据
      pollingInterval = setInterval(fetchRealtimeData, 5000);
      
      // 每30秒触发一次新闻采集
      setInterval(triggerNewsCollection, 30000);
    };

    // 停止轮询
    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
    
    // 触发新闻采集
    const triggerNewsCollection = async () => {
      try {
        console.log('[NewsCollector] 触发新闻采集...');
        const response = await axios.post(`${API_BASE}/news/collect?useMock=true`);
        if (response.data.success) {
          console.log('[NewsCollector] 采集成功:', response.data.data);
          // 采集成功后，刷新统计数据和风险列表
          if (activeTab.value === 'dashboard') {
            await fetchStatistics();
          }
          if (activeTab.value === 'risks') {
            await fetchRisks(false);
          }
        }
      } catch (error) {
        console.error('[NewsCollector] 采集失败:', error);
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

    // 风险等级分布雷达图
    const renderLevelChart = () => {
      const dom = document.getElementById('level-chart');
      if (!dom) return;

      if (levelChart) levelChart.dispose();
      levelChart = echarts.init(dom);

      // 计算最大值用于雷达图范围
      const maxValue = Math.max(
        statistics.value.highRisks,
        statistics.value.mediumRisks,
        statistics.value.lowRisks
      );
      const radarMax = Math.ceil(maxValue * 1.2); // 增加20%余量

      const option = {
        title: { 
          text: '风险等级分布', 
          left: 'center', 
          top: 10,
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: { 
          trigger: 'item',
          formatter: (params) => {
            const indicators = ['高风险', '中风险', '低风险'];
            return indicators[params.componentIndex] + ': ' + params.value[params.componentIndex] + '条';
          }
        },
        legend: {
          bottom: 10,
          left: 'center',
          data: ['风险数量']
        },
        radar: {
          center: ['50%', '55%'],
          radius: '65%',
          indicator: [
            { name: '高风险', max: radarMax, color: '#ef4444' },
            { name: '中风险', max: radarMax, color: '#f97316' },
            { name: '低风险', max: radarMax, color: '#eab308' }
          ],
          axisName: {
            fontSize: 13,
            fontWeight: 'bold'
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(239, 68, 68, 0.05)', 'rgba(249, 115, 22, 0.05)', 
                      'rgba(234, 179, 8, 0.05)', 'rgba(255, 255, 255, 0.05)']
            }
          }
        },
        series: [{
          name: '风险数量',
          type: 'radar',
          data: [
            {
              value: [
                statistics.value.highRisks,
                statistics.value.mediumRisks,
                statistics.value.lowRisks
              ],
              name: '风险数量',
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.3)'
              },
              lineStyle: {
                color: '#3b82f6',
                width: 2
              },
              itemStyle: {
                color: '#3b82f6',
                borderWidth: 2
              },
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 'bold',
                color: '#1f2937',
                formatter: (params) => {
                  return params.value + '条';
                }
              }
            }
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
      startPolling();

      // 监听窗口大小变化，重新渲染图表
      window.addEventListener('resize', () => {
        levelChart?.resize();
        companyChart?.resize();
        trendChart?.resize();
      });
    });

    onUnmounted(() => {
      stopPolling();
      levelChart?.dispose();
      companyChart?.dispose();
      trendChart?.dispose();
    });

    // ========== 新增：数据源管理功能 ==========
    const fetchDataSources = async () => {
      try {
        const response = await axios.get(`${API_BASE}/datasources`);
        if (response.data.success) {
          dataSources.value = response.data.data;
        }
      } catch (error) {
        console.error('获取数据源失败:', error);
      }
    };

    const showAddDataSource = () => {
      alert('新增爬取网站源功能开发中...');
    };

    // ========== 新增：风险等级调整功能 ==========
    const riskLevelFilters = reactive({
      name: '',
      level: ''
    });

    const fetchRiskLevelCompanies = async () => {
      try {
        const response = await axios.get(`${API_BASE}/risk-level/companies`);
        if (response.data.success) {
          riskLevelList.value = response.data.data;
        }
      } catch (error) {
        console.error('获取企业列表失败:', error);
      }
    };

    const searchRiskLevelCompanies = () => {
      // 应用筛选逻辑
      fetchRiskLevelCompanies();
    };

    const toggleAllCompanies = (e) => {
      if (e.target.checked) {
        selectedCompanies.value = riskLevelList.value.map(c => c.id);
      } else {
        selectedCompanies.value = [];
      }
    };

    const showAdjustModal = (company) => {
      alert(`调整 ${company.name} 的风险等级（功能开发中）`);
    };

    const showBatchAdjust = () => {
      alert(`批量调整 ${selectedCompanies.value.length} 家企业的风险等级（功能开发中）`);
    };

    // 监听标签页切换，加载对应数据
    const handleTabChange = () => {
      if (activeTab.value === 'datasources' && dataSources.value.length === 0) {
        fetchDataSources();
      }
      if (activeTab.value === 'riskLevel' && riskLevelList.value.length === 0) {
        fetchRiskLevelCompanies();
      }
    };

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
      sseConnected: realtimeConnected,
      latestRisks,
      fetchStatistics,
      fetchRisks,
      fetchCompanies,
      viewRiskDetail,
      closeDetail,
      getRiskLevelClass,
      getRiskLevelIcon,
      formatDate,
      truncateText,
      // 新增：数据源管理
      dataSources,
      showAddDataSource,
      // 新增：风险等级调整
      riskLevelList,
      riskLevelFilters,
      selectedCompanies,
      searchRiskLevelCompanies,
      toggleAllCompanies,
      showAdjustModal,
      showBatchAdjust,
      handleTabChange,
      // 导出功能
      exportRiskList: window.exportRiskList
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
                <h1 class="text-2xl font-bold">国网风险预警平台</h1>
                <p class="text-sm text-blue-100">7×24小时实时监控 · State Grid Risk Alert System</p>
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
          <button 
            @click="activeTab = 'datasources'" 
            :class="['px-6 py-3 font-medium transition-colors', activeTab === 'datasources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600']"
          >
            <i class="fas fa-database mr-2"></i>数据源管理
          </button>
          <button 
            @click="activeTab = 'riskLevel'" 
            :class="['px-6 py-3 font-medium transition-colors', activeTab === 'riskLevel' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-blue-600']"
          >
            <i class="fas fa-sliders-h mr-2"></i>风险等级调整
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
          <!-- 标题和导出按钮 -->
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">风险信息列表</h2>
            <button 
              @click="exportRiskList(filters, pagination)" 
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <i class="fas fa-download mr-2"></i>导出Excel
            </button>
          </div>
          
          <!-- 筛选条件 -->
          <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                <input 
                  v-model="filters.startDate" 
                  @change="fetchRisks(true)"
                  type="date" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                <input 
                  v-model="filters.endDate" 
                  @change="fetchRisks(true)"
                  type="date" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">关键词</label>
                <div class="flex space-x-2">
                  <input 
                    v-model="filters.keyword" 
                    @keyup.enter="fetchRisks(true)"
                    type="text" 
                    placeholder="搜索..." 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button @click="fetchRisks(true)" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-search"></i>
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
                    <span v-if="risk.source_url" class="text-blue-600 hover:underline" @click.stop="window.open(risk.source_url, '_blank')">
                      <i class="fas fa-external-link-alt mr-1"></i>查看原文
                    </span>
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

        <!-- 数据源管理页面 -->
        <div v-show="activeTab === 'datasources'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">爬取网站源配置</h2>
            <div class="space-x-2">
              <button onclick="exportDataSourceList()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <i class="fas fa-download mr-2"></i>导出Excel
              </button>
              <button @click="showAddDataSource" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-plus mr-2"></i>新增爬取网站源
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">网站名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">爬取地址</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成功率</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最近爬取</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="ds in dataSources" :key="ds.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ ds.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ truncateText(ds.url, 40) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['px-2 py-1 text-xs rounded-full', ds.status === 'normal' ? 'bg-green-100 text-green-800' : ds.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800']">
                      {{ ds.status === 'normal' ? '正常' : ds.status === 'error' ? '异常' : '停用' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ds.successRate }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(ds.lastCrawlTime) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button class="text-blue-600 hover:text-blue-900">编辑</button>
                    <button class="text-green-600 hover:text-green-900">测试</button>
                    <button class="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 风险等级调整页面 -->
        <div v-show="activeTab === 'riskLevel'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">风险等级手动调整</h2>
            <div class="space-x-2">
              <button onclick="exportCompanyList()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <i class="fas fa-download mr-2"></i>导出企业列表
              </button>
              <button onclick="exportRiskLevelHistory()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <i class="fas fa-download mr-2"></i>导出调整历史
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">企业名称</label>
                <input v-model="riskLevelFilters.name" type="text" placeholder="输入企业名称" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">当前风险等级</label>
                <select v-model="riskLevelFilters.level" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">全部等级</option>
                  <option value="高风险">高风险</option>
                  <option value="中风险">中风险</option>
                  <option value="低风险">低风险</option>
                </select>
              </div>
              <div class="flex items-end">
                <button @click="searchRiskLevelCompanies" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-search mr-2"></i>搜索
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <span class="text-sm text-gray-500">已选择 {{ selectedCompanies.length }} 家企业</span>
              </div>
              <button v-if="selectedCompanies.length > 0" @click="showBatchAdjust" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-edit mr-2"></i>批量调整
              </button>
            </div>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left">
                    <input type="checkbox" @change="toggleAllCompanies" class="rounded border-gray-300">
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">信用代码</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前风险等级</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">风险数量</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后调整时间</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="company in riskLevelList" :key="company.id">
                  <td class="px-6 py-4">
                    <input type="checkbox" :value="company.id" v-model="selectedCompanies" class="rounded border-gray-300">
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ company.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ company.creditCode }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="['px-2 py-1 text-xs rounded-full border', getRiskLevelClass(company.currentLevel)]">
                      {{ company.currentLevel }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ company.riskCount }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ company.lastAdjustTime || '未调整' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button @click="showAdjustModal(company)" class="text-blue-600 hover:text-blue-900">
                      <i class="fas fa-edit mr-1"></i>调整等级
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
                <label class="text-sm font-medium text-gray-500">来源</label>
                <p class="mt-1 text-gray-800">{{ currentRisk.source }}</p>
              </div>

              <div v-if="currentRisk.source_url">
                <label class="text-sm font-medium text-gray-500">原文链接</label>
                <p class="mt-1">
                  <a :href="currentRisk.source_url" target="_blank" class="text-blue-600 hover:underline break-all flex items-center">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    {{ currentRisk.source_url }}
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
