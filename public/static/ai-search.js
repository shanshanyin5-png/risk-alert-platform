// AI搜索分析页面的JavaScript

let currentPage = 1;
let totalResults = 0;
let currentResults = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadCompanyList();
    initEventListeners();
});

// 加载公司列表
async function loadCompanyList() {
    try {
        const response = await axios.get('/api/statistics');
        const companies = response.data.data.companyDistribution || [];
        
        const companySelect = document.getElementById('company');
        companies.forEach(item => {
            const option = document.createElement('option');
            option.value = item.company;
            option.textContent = `${item.company} (${item.count})`;
            companySelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载公司列表失败:', error);
    }
}

// 初始化事件监听器
function initEventListeners() {
    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    
    // 回车键搜索
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 快速关键词
    document.querySelectorAll('.quick-keyword').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('searchInput').value = btn.textContent.trim();
            performSearch();
        });
    });
    
    // 导出按钮
    document.getElementById('exportBtn').addEventListener('click', exportResults);
}

// 执行搜索
async function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    
    currentPage = 1;
    showLoading();
    
    try {
        // 调用搜索API
        const searchResults = await searchRisks(keyword);
        currentResults = searchResults;
        totalResults = searchResults.length;
        
        if (totalResults === 0) {
            showNoResults();
            return;
        }
        
        // 显示结果
        displayResults(searchResults);
        
        // 调用AI分析
        await performAIAnalysis(keyword, searchResults);
        
    } catch (error) {
        console.error('搜索失败:', error);
        alert('搜索失败，请稍后重试');
        showEmpty();
    }
}

// 搜索风险数据
async function searchRisks(keyword) {
    const riskLevel = document.getElementById('riskLevel').value;
    const company = document.getElementById('company').value;
    const timeRange = parseInt(document.getElementById('timeRange').value);
    
    try {
        // 获取所有风险数据
        const response = await axios.get('/api/risks', {
            params: {
                page: 1,
                limit: 1000  // 获取足够多的数据用于搜索
            }
        });
        
        let results = response.data.data || [];
        
        // 关键词过滤（支持标题和风险事项搜索）
        results = results.filter(risk => {
            const matchKeyword = risk.title.includes(keyword) || 
                                 risk.risk_item.includes(keyword) ||
                                 risk.company_name.includes(keyword);
            return matchKeyword;
        });
        
        // 风险等级过滤
        if (riskLevel) {
            results = results.filter(risk => risk.risk_level === riskLevel);
        }
        
        // 公司过滤
        if (company) {
            results = results.filter(risk => risk.company_name === company);
        }
        
        // 时间范围过滤
        if (timeRange > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - timeRange);
            results = results.filter(risk => {
                const riskDate = new Date(risk.risk_time);
                return riskDate >= cutoffDate;
            });
        }
        
        // 按时间倒序排序
        results.sort((a, b) => new Date(b.risk_time) - new Date(a.risk_time));
        
        return results;
    } catch (error) {
        console.error('搜索失败:', error);
        return [];
    }
}

// 显示搜索结果
function displayResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('resultsList');
    const resultCount = document.getElementById('resultCount');
    
    // 分页
    const pageSize = 10;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageResults = results.slice(start, end);
    
    resultCount.textContent = `(共 ${results.length} 条)`;
    resultsList.innerHTML = '';
    
    pageResults.forEach(risk => {
        const card = createResultCard(risk);
        resultsList.appendChild(card);
    });
    
    // 更新分页
    updatePagination(results.length, pageSize);
    
    // 显示结果区域
    resultsDiv.classList.remove('hidden');
    hideLoading();
    hideEmpty();
    hideNoResults();
}

// 创建结果卡片
function createResultCard(risk) {
    const card = document.createElement('div');
    card.className = 'result-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg';
    
    const riskLevelColor = {
        '高风险': 'bg-red-100 text-red-800',
        '中风险': 'bg-yellow-100 text-yellow-800',
        '低风险': 'bg-green-100 text-green-800'
    };
    
    card.innerHTML = `
        <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
                <h4 class="text-lg font-bold text-gray-800 mb-1">${escapeHtml(risk.title)}</h4>
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                    <span class="px-2 py-1 ${riskLevelColor[risk.risk_level] || 'bg-gray-100 text-gray-800'} rounded-full text-xs font-medium">
                        ${risk.risk_level}
                    </span>
                    <span>
                        <i class="fas fa-building text-gray-400 mr-1"></i>
                        ${escapeHtml(risk.company_name)}
                    </span>
                    <span>
                        <i class="fas fa-calendar text-gray-400 mr-1"></i>
                        ${formatDate(risk.risk_time)}
                    </span>
                </div>
            </div>
        </div>
        <div class="text-gray-700 mb-2">
            <strong class="text-gray-800">风险事项：</strong>
            ${escapeHtml(risk.risk_item)}
        </div>
        ${risk.source ? `
        <div class="flex items-center justify-between text-sm text-gray-500">
            <span>
                <i class="fas fa-newspaper mr-1"></i>
                来源：${escapeHtml(risk.source)}
            </span>
            ${risk.source_url ? `
            <a href="${escapeHtml(risk.source_url)}" target="_blank" class="text-purple-600 hover:text-purple-800">
                <i class="fas fa-external-link-alt mr-1"></i>
                查看原文
            </a>
            ` : ''}
        </div>
        ` : ''}
    `;
    
    return card;
}

// 更新分页
function updatePagination(total, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // 上一页
    const prevBtn = createPageButton('«', currentPage > 1, () => {
        currentPage--;
        displayResults(currentResults);
    });
    paginationDiv.appendChild(prevBtn);
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            const pageBtn = createPageButton(i, true, () => {
                currentPage = i;
                displayResults(currentResults);
            });
            if (i === currentPage) {
                pageBtn.classList.add('bg-purple-600', 'text-white');
            }
            paginationDiv.appendChild(pageBtn);
        } else if (Math.abs(i - currentPage) === 3) {
            const dots = document.createElement('span');
            dots.className = 'px-3 py-2 text-gray-500';
            dots.textContent = '...';
            paginationDiv.appendChild(dots);
        }
    }
    
    // 下一页
    const nextBtn = createPageButton('»', currentPage < totalPages, () => {
        currentPage++;
        displayResults(currentResults);
    });
    paginationDiv.appendChild(nextBtn);
}

// 创建分页按钮
function createPageButton(text, enabled, onClick) {
    const btn = document.createElement('button');
    btn.className = `px-4 py-2 border rounded-lg ${enabled ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`;
    btn.textContent = text;
    btn.disabled = !enabled;
    if (enabled) {
        btn.addEventListener('click', onClick);
    }
    return btn;
}

// AI分析
async function performAIAnalysis(keyword, results) {
    const analysisDiv = document.getElementById('aiAnalysis');
    const contentDiv = document.getElementById('aiAnalysisContent');
    
    // 显示分析区域
    analysisDiv.classList.remove('hidden');
    contentDiv.innerHTML = `
        <div class="typing-indicator">
            <span>●</span>
            <span>●</span>
            <span>●</span>
            AI正在分析中...
        </div>
    `;
    
    try {
        // 获取筛选条件
        const filters = {
            riskLevel: document.getElementById('riskLevel').value,
            company: document.getElementById('company').value,
            timeRange: parseInt(document.getElementById('timeRange').value) || null
        };
        
        // 调用后端AI分析API
        const response = await axios.post('/api/ai-analysis', {
            keyword: keyword,
            results: results,
            filters: filters
        });
        
        if (response.data.success) {
            const analysis = response.data.data;
            contentDiv.innerHTML = renderAIAnalysis(analysis);
        } else {
            throw new Error(response.data.error || 'AI分析失败');
        }
    } catch (error) {
        console.error('AI分析失败:', error);
        // 降级到规则分析
        const analysis = generateFallbackAnalysis(keyword, results);
        contentDiv.innerHTML = analysis;
    }
}

// 渲染AI分析结果
function renderAIAnalysis(analysis) {
    const riskLevelColors = {
        'high': { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', icon: 'text-red-600' },
        'medium': { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', icon: 'text-yellow-600' },
        'low': { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800', icon: 'text-green-600' }
    };
    
    const levelColor = riskLevelColors[analysis.riskAssessment.level] || riskLevelColors['low'];
    
    return `
        <div class="space-y-4">
            <!-- 总体评估 -->
            <div class="${levelColor.bg} border-l-4 ${levelColor.border} rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold ${levelColor.text} text-lg">
                        <i class="fas fa-chart-line mr-2"></i>
                        总体风险评估
                    </h4>
                    <span class="px-3 py-1 ${levelColor.bg} ${levelColor.text} rounded-full text-sm font-bold border-2 ${levelColor.border}">
                        风险评分: ${analysis.riskAssessment.score}/100
                    </span>
                </div>
                <p class="${levelColor.text}">
                    ${escapeHtml(analysis.summary)}
                </p>
                <p class="text-sm ${levelColor.text} mt-2 opacity-80">
                    <i class="fas fa-info-circle mr-1"></i>
                    ${escapeHtml(analysis.riskAssessment.reasoning)}
                </p>
            </div>
            
            <!-- 关键发现 -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">
                    <i class="fas fa-lightbulb text-purple-600 mr-2"></i>
                    关键发现
                </h4>
                <ul class="space-y-2">
                    ${analysis.keyFindings.map(finding => `
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-purple-600 mr-2 mt-1"></i>
                            <span class="text-gray-700">${escapeHtml(finding)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <!-- 应对建议 -->
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 class="font-bold text-blue-800 mb-3">
                    <i class="fas fa-tasks text-blue-600 mr-2"></i>
                    应对建议
                </h4>
                <ol class="space-y-2 list-decimal list-inside">
                    ${analysis.recommendations.map(rec => `
                        <li class="text-blue-900">
                            <span class="text-blue-700">${escapeHtml(rec)}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>
            
            <!-- AI标识 -->
            <div class="text-center text-xs text-gray-500 mt-3">
                <i class="fas fa-robot mr-1"></i>
                由GenSpark AI提供智能分析 · 
                ${new Date().toLocaleString('zh-CN')}
            </div>
        </div>
    `;
}

// 降级分析（当AI API不可用时）
function generateFallbackAnalysis(keyword, results) {
    if (results.length === 0) {
        return '<p class="text-gray-600">未找到相关风险信息。</p>';
    }
    
    // 统计分析
    const highRisks = results.filter(r => r.risk_level === '高风险').length;
    const mediumRisks = results.filter(r => r.risk_level === '中风险').length;
    const lowRisks = results.filter(r => r.risk_level === '低风险').length;
    
    // 公司分布
    const companies = {};
    results.forEach(r => {
        companies[r.company_name] = (companies[r.company_name] || 0) + 1;
    });
    const topCompany = Object.keys(companies).sort((a, b) => companies[b] - companies[a])[0];
    
    // 时间趋势
    const recentRisks = results.filter(r => {
        const days = (new Date() - new Date(r.risk_time)) / (1000 * 60 * 60 * 24);
        return days <= 7;
    }).length;
    
    let analysis = `<div class="space-y-3">`;
    
    // 总体概况
    analysis += `
        <div class="bg-white rounded-lg p-4 mb-3">
            <h4 class="font-bold text-gray-800 mb-2">
                <i class="fas fa-chart-bar text-purple-600 mr-2"></i>
                总体概况
            </h4>
            <p class="text-gray-700">
                关于"<strong class="text-purple-600">${escapeHtml(keyword)}</strong>"的搜索共发现 
                <strong class="text-purple-600">${results.length}</strong> 条风险信息。
                其中高风险 <strong class="text-red-600">${highRisks}</strong> 条，
                中风险 <strong class="text-yellow-600">${mediumRisks}</strong> 条，
                低风险 <strong class="text-green-600">${lowRisks}</strong> 条。
            </p>
        </div>
    `;
    
    // 关键发现
    if (highRisks > 0) {
        analysis += `
            <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-3">
                <h4 class="font-bold text-red-800 mb-2">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    高风险预警
                </h4>
                <p class="text-red-700">
                    发现 <strong>${highRisks}</strong> 条高风险事项，建议立即关注并采取相应措施。
                    主要涉及公司：<strong>${topCompany}</strong>。
                </p>
            </div>
        `;
    }
    
    // 时间趋势
    if (recentRisks > 0) {
        analysis += `
            <div class="bg-blue-50 rounded-lg p-4 mb-3">
                <h4 class="font-bold text-blue-800 mb-2">
                    <i class="fas fa-clock text-blue-600 mr-2"></i>
                    时间趋势
                </h4>
                <p class="text-blue-700">
                    最近7天内出现了 <strong>${recentRisks}</strong> 条新风险，
                    ${recentRisks > results.length * 0.5 ? '风险事件呈上升趋势，需要密切关注。' : '风险事件相对平稳。'}
                </p>
            </div>
        `;
    }
    
    // 公司分布
    const topCompanies = Object.entries(companies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (topCompanies.length > 0) {
        analysis += `
            <div class="bg-purple-50 rounded-lg p-4">
                <h4 class="font-bold text-purple-800 mb-2">
                    <i class="fas fa-building text-purple-600 mr-2"></i>
                    重点公司
                </h4>
                <p class="text-purple-700">
                    风险主要集中在以下公司：
                    ${topCompanies.map(([company, count]) => 
                        `<strong>${escapeHtml(company)}</strong> (${count}条)`
                    ).join('、')}
                </p>
            </div>
        `;
    }
    
    analysis += `</div>`;
    
    return analysis;
}

// 导出结果
function exportResults() {
    if (currentResults.length === 0) {
        alert('没有可导出的结果');
        return;
    }
    
    // 生成CSV
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '公司名称,风险等级,标题,风险事项,时间,来源\n';
    
    currentResults.forEach(risk => {
        csv += `"${risk.company_name}",`;
        csv += `"${risk.risk_level}",`;
        csv += `"${risk.title.replace(/"/g, '""')}",`;
        csv += `"${risk.risk_item.replace(/"/g, '""')}",`;
        csv += `"${formatDate(risk.risk_time)}",`;
        csv += `"${risk.source || ''}"\n`;
    });
    
    // 下载文件
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `风险搜索结果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
    document.getElementById('aiAnalysis').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

function showEmpty() {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
    document.getElementById('aiAnalysis').classList.add('hidden');
}

function hideEmpty() {
    document.getElementById('emptyState').classList.add('hidden');
}

function showNoResults() {
    document.getElementById('noResults').classList.remove('hidden');
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('aiAnalysis').classList.add('hidden');
}

function hideNoResults() {
    document.getElementById('noResults').classList.add('hidden');
}
