import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, ApiResponse, Risk, StatisticsData } from './types/bindings'
import { collectNewsForAllCompanies, saveNewsToDatabase, generateMockNews } from './services/newsCollector'
// 使用免费的基于规则的分析器，不依赖 OpenAI API
import { analyzeNewsRisk } from './ruleBasedAnalyzer'
// RSS解析器
import { parseRSSFeed } from './rssParser'
import * as cheerio from 'cheerio'

const app = new Hono<{ Bindings: Bindings }>()

// ========== 爬取配置 ==========
// 每个数据源最多分析的文章数（0表示无限制，建议20-50以防超时）
const MAX_ARTICLES_PER_SOURCE = 50

// ========== CORS配置 ==========
app.use('/api/*', cors())

// 静态文件服务
app.use('/static/*', serveStatic({ root: './' }))

// AI搜索页面（完整HTML内联）
app.get('/ai-search', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI智能搜索分析 - 风险预警平台</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .typing-indicator span {
            animation: blink 1.4s infinite both;
        }
        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }
        @keyframes blink {
            0%, 80%, 100% { opacity: 0; }
            40% { opacity: 1; }
        }
        .result-card {
            transition: all 0.3s ease;
        }
        .result-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- 导航栏 -->
    <nav class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <i class="fas fa-brain text-2xl mr-3"></i>
                    <h1 class="text-xl font-bold">AI智能搜索分析</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="hover:text-gray-200 transition">
                        <i class="fas fa-home mr-2"></i>返回主页
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 搜索区域 -->
        <div class="bg-white rounded-lg card-shadow p-6 mb-8">
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">
                    <i class="fas fa-search text-purple-600 mr-2"></i>
                    智能风险搜索
                </h2>
                <p class="text-gray-600">输入关键词，AI将帮您搜索并分析相关风险信息</p>
            </div>

            <!-- 搜索框 -->
            <div class="mb-4">
                <div class="relative">
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="例如：停电、事故、延期、巴西CPFL..." 
                        class="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                    <button 
                        id="searchBtn"
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                        <i class="fas fa-search mr-2"></i>搜索
                    </button>
                </div>
            </div>

            <!-- 高级筛选 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
                    <select id="riskLevel" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">全部</option>
                        <option value="高风险">高风险</option>
                        <option value="中风险">中风险</option>
                        <option value="低风险">低风险</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">公司</label>
                    <select id="company" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="">全部公司</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
                    <select id="timeRange" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        <option value="7">最近7天</option>
                        <option value="30">最近30天</option>
                        <option value="90">最近90天</option>
                        <option value="0">全部时间</option>
                    </select>
                </div>
            </div>

            <!-- 快速关键词 -->
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">快速搜索：</label>
                <div class="flex flex-wrap gap-2">
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        停电
                    </button>
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        事故
                    </button>
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        延期
                    </button>
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        巴西CPFL
                    </button>
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        巴基斯坦PMLTC
                    </button>
                    <button class="quick-keyword px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition text-sm">
                        菲律宾NGCP
                    </button>
                </div>
            </div>
        </div>

        <!-- AI分析区域 -->
        <div id="aiAnalysis" class="hidden bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg card-shadow p-6 mb-8">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-robot text-white text-xl"></i>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">
                        <i class="fas fa-brain text-purple-600 mr-2"></i>
                        AI智能分析
                    </h3>
                    <div id="aiAnalysisContent" class="text-gray-700">
                        <div class="typing-indicator">
                            <span>●</span>
                            <span>●</span>
                            <span>●</span>
                            AI正在分析中...
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 搜索结果 -->
        <div id="searchResults" class="hidden">
            <div class="bg-white rounded-lg card-shadow p-6 mb-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-list text-purple-600 mr-2"></i>
                        搜索结果 <span id="resultCount" class="text-purple-600"></span>
                    </h3>
                    <button id="exportBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        <i class="fas fa-download mr-2"></i>导出结果
                    </button>
                </div>
                <div id="resultsList" class="space-y-4"></div>
            </div>

            <!-- 分页 -->
            <div id="pagination" class="flex justify-center items-center space-x-2"></div>
        </div>

        <!-- 加载状态 -->
        <div id="loadingState" class="hidden text-center py-12">
            <div class="inline-block">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                <p class="text-gray-600">正在搜索分析中...</p>
            </div>
        </div>

        <!-- 空状态 -->
        <div id="emptyState" class="text-center py-12">
            <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">输入关键词开始搜索</p>
        </div>

        <!-- 无结果状态 -->
        <div id="noResults" class="hidden text-center py-12">
            <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">未找到相关风险信息</p>
            <p class="text-gray-400 mt-2">尝试更换关键词或调整筛选条件</p>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/ai-search.js"></script>
</body>
</html>
  `)
})

// ========== API 路由 ==========

// 1. 获取风险列表（支持分页、筛选、排序、时间范围）
app.get('/api/risks', async (c) => {
  const { DB } = c.env
  const { 
    page = '1', 
    limit = '20', 
    company, 
    level, 
    keyword, 
    startDate,  // 新增：开始时间
    endDate,    // 新增：结束时间
    sourceType, // 新增：数据源类型
    sourceRegion, // 新增：来源地区
    sort = 'created_at', 
    order = 'DESC' 
  } = c.req.query()
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum

  try {
    // 构建查询条件
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (company) {
      whereClause += ' AND company_name LIKE ?'
      params.push(`%${company}%`)
    }
    
    if (level) {
      whereClause += ' AND risk_level = ?'
      params.push(level)
    }
    
    if (keyword) {
      whereClause += ' AND (title LIKE ? OR risk_item LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    // 时间筛选
    if (startDate) {
      whereClause += ' AND DATE(risk_time) >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND DATE(risk_time) <= ?'
      params.push(endDate)
    }

    // 数据源类型筛选 - 暂不支持（字段不存在）
    // if (sourceType) {
    //   whereClause += ' AND source_type = ?'
    //   params.push(sourceType)
    // }

    // 来源地区筛选
    if (sourceRegion) {
      whereClause += ' AND source_region = ?'
      params.push(sourceRegion)
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM risks ${whereClause}`
    const countResult = await DB.prepare(countQuery).bind(...params).first<{ total: number }>()
    const total = countResult?.total || 0

    // 获取数据列表
    const dataQuery = `
      SELECT id, company_name, title, risk_item, risk_time, source, 
             source_url, risk_level, 
             substr(risk_reason, 1, 200) as risk_reason_preview,
             created_at,
             project_name, project_location, project_type, 
             project_capacity, project_investment, project_status,
             project_start_date, project_completion_date
      FROM risks ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `
    params.push(limitNum, offset)
    
    const result = await DB.prepare(dataQuery).bind(...params).all<Risk>()

    const response: ApiResponse = {
      success: true,
      data: {
        list: result.results || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    }

    return c.json(response)
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 2. 获取风险详情
app.get('/api/risks/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')

  try {
    const result = await DB.prepare('SELECT * FROM risks WHERE id = ?')
      .bind(id)
      .first<Risk>()

    if (!result) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '风险记录不存在' 
      }, 404)
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: result 
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 3. 获取统计数据
app.get('/api/statistics', async (c) => {
  const { DB } = c.env

  try {
    // 总风险数
    const totalResult = await DB.prepare('SELECT COUNT(*) as count FROM risks').first<{ count: number }>()
    const totalRisks = totalResult?.count || 0

    // 高风险数量
    const highResult = await DB.prepare('SELECT COUNT(*) as count FROM risks WHERE risk_level = ?')
      .bind('高风险')
      .first<{ count: number }>()
    const highRisks = highResult?.count || 0

    // 中风险数量
    const mediumResult = await DB.prepare('SELECT COUNT(*) as count FROM risks WHERE risk_level = ?')
      .bind('中风险')
      .first<{ count: number }>()
    const mediumRisks = mediumResult?.count || 0

    // 低风险数量
    const lowResult = await DB.prepare('SELECT COUNT(*) as count FROM risks WHERE risk_level = ?')
      .bind('低风险')
      .first<{ count: number }>()
    const lowRisks = lowResult?.count || 0

    // 今日新增风险（模拟数据）
    const todayRisks = 0  // 由于测试数据都是历史数据，这里返回0

    // 公司分布（Top 10）
    const companyResult = await DB.prepare(`
      SELECT company_name as company, COUNT(*) as count 
      FROM risks 
      GROUP BY company_name 
      ORDER BY count DESC 
      LIMIT 10
    `).all<{ company: string; count: number }>()

    // 最近7天风险趋势
    const trendResult = await DB.prepare(`
      SELECT DATE(risk_time) as date, COUNT(*) as count 
      FROM risks 
      WHERE risk_time IS NOT NULL AND risk_time != ''
      GROUP BY DATE(risk_time) 
      ORDER BY date DESC 
      LIMIT 7
    `).all<{ date: string; count: number }>()

    const statistics: StatisticsData = {
      totalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      todayRisks,
      companyDistribution: companyResult.results || [],
      riskTrend: (trendResult.results || []).reverse()
    }

    return c.json<ApiResponse>({ 
      success: true, 
      data: statistics 
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 4. 获取公司列表（用于筛选）
app.get('/api/companies', async (c) => {
  const { DB } = c.env

  try {
    const result = await DB.prepare(`
      SELECT DISTINCT company_name as name, COUNT(*) as risk_count
      FROM risks 
      GROUP BY company_name 
      ORDER BY risk_count DESC
    `).all<{ name: string; risk_count: number }>()

    return c.json<ApiResponse>({ 
      success: true, 
      data: result.results || [] 
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 5. AI智能分析 API
app.post('/api/ai-analysis', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json()
    const { keyword, filters } = body
    
    // 构建查询条件
    let query = 'SELECT * FROM risks WHERE 1=1'
    const params: any[] = []
    
    // 关键词搜索
    if (keyword) {
      query += ' AND (title LIKE ? OR risk_item LIKE ? OR company_name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    // 风险等级筛选
    if (filters?.riskLevel) {
      query += ' AND risk_level = ?'
      params.push(filters.riskLevel)
    }
    
    // 公司筛选
    if (filters?.company) {
      query += ' AND company_name = ?'
      params.push(filters.company)
    }
    
    // 时间范围筛选
    if (filters?.timeRange) {
      const days = parseInt(filters.timeRange)
      query += ' AND DATE(risk_time) >= DATE("now", ?)'
      params.push(`-${days} days`)
    }
    
    query += ' ORDER BY risk_time DESC LIMIT 100'
    
    // 执行查询
    const result = await DB.prepare(query).bind(...params).all()
    const results = result.results || []
    
    // 调用AI分析服务
    const apiKey = c.env.GENSPARK_TOKEN || c.env.OPENAI_API_KEY
    const baseURL = c.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    
    if (!apiKey) {
      // 如果没有API密钥，使用规则分析
      return c.json<ApiResponse>({
        success: true,
        data: performRuleBasedAnalysis(results, keyword, filters)
      })
    }
    
    // 调用GenSpark AI进行分析
    const aiResponse = await callGenSparkAI(apiKey, baseURL, results, keyword, filters)
    
    return c.json<ApiResponse>({
      success: true,
      data: aiResponse
    })
    
  } catch (error: any) {
    console.error('AI分析错误:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error.message
    }, 500)
  }
})

// 6. 实时搜索API（GenSpark AI + Web Search）
app.post('/api/realtime-search', async (c) => {
  const { DB } = c.env
  
  try {
    const { keyword, filters } = await c.req.json()
    
    if (!keyword || keyword.trim() === '') {
      return c.json<ApiResponse>({
        success: false,
        error: '请输入搜索关键词'
      }, 400)
    }
    
    console.log(`[API] Realtime search: ${keyword}`, filters)
    
    // 导入实时搜索服务
    const { realtimeSearch } = await import('./realtimeSearchService')
    
    // 获取API Key
    const apiKey = c.env.GENSPARK_TOKEN || c.env.OPENAI_API_KEY
    
    // 执行搜索（带缓存和数据库存储）
    const result = await realtimeSearch(
      { keyword: keyword.trim(), filters },
      DB,
      apiKey
    )
    
    return c.json<ApiResponse>({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('[API] Realtime search error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error.message || '搜索失败'
    }, 500)
  }
})

// 7. 实时数据获取（轮询方式替代SSE）
app.get('/api/realtime', async (c) => {
  const { DB } = c.env

  try {
    // 获取最新10条风险
    const result = await DB.prepare(`
      SELECT id, company_name, title, risk_level, risk_time, created_at,
             project_name, project_location, project_type
      FROM risks 
      ORDER BY id DESC 
      LIMIT 10
    `).all<Risk>()

    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        type: 'update',
        risks: result.results || [],
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 6. 发送预警通知（邮件/钉钉）
app.post('/api/notify', async (c) => {
  try {
    const { type, riskId, message } = await c.req.json()

    // 这里是预警推送的占位逻辑
    // 实际使用时需要配置邮件服务和钉钉Webhook
    console.log(`发送${type}预警: 风险ID=${riskId}, 消息=${message}`)

    // 模拟发送成功
    return c.json<ApiResponse>({ 
      success: true, 
      message: `${type}预警发送成功` 
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 7. 获取数据源列表（从数据库读取）
app.get('/api/datasources', async (c) => {
  try {
    const { env } = c;
    const result = await env.DB.prepare(`
      SELECT 
        id,
        name,
        url,
        xpath_rules as xpathRules,
        field_mapping as fieldMapping,
        enable_js as enableJS,
        user_agent as userAgent,
        interval,
        timeout,
        enabled,
        status,
        last_crawl_time as lastCrawlTime,
        success_rate as successRate,
        created_at as createdAt
      FROM data_sources
      ORDER BY created_at DESC
    `).all();
    
    return c.json<ApiResponse>({
      success: true,
      data: result.results || [],
      total: result.results?.length || 0
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

// 7.5 一键更新所有数据源（核心功能）
// 简化的爬取函数（不依赖外部API）
async function crawlAndAnalyze(source: any, env: any) {
  try {
    console.log(`正在爬取: ${source.url}`)
    
    let articles: any[] = []
    
    // 判断是RSS源还是HTML源
    const isRSS = source.category?.includes('RSS') || 
                  source.url.includes('/rss') || 
                  source.url.includes('/feed') ||
                  source.url.includes('news.google.com/rss')
    
    if (isRSS) {
      // RSS解析
      console.log('使用RSS解析器')
      const feed = await parseRSSFeed(source.url)
      
      articles = feed.items.map(item => ({
        title: item.title,
        content: item.description || item.content || '',
        url: item.link,
        time: new Date(item.pubDate).toISOString().split('T')[0]
      }))
      
      console.log(`RSS解析成功，提取到 ${articles.length} 篇文章`)
    } else {
      // HTML爬取
      console.log('使用HTML爬取')
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': source.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      const xpathRules = source.xpath_rules || source.xpathRules || '//article'
      
      $(xpathRules.split('|').map((s: string) => s.trim().replace('//', '')).join(',')).each((_, el) => {
        const $el = $(el)
        const title = $el.find('h1, h2, h3').first().text().trim() || $el.text().substring(0, 100)
        const content = $el.find('p').text().trim() || $el.text().trim()
        const link = $el.find('a').first().attr('href') || ''
        
        if (title.length > 10) {
          articles.push({
            title,
            content: content.substring(0, 500),
            url: link.startsWith('http') ? link : new URL(link, source.url).href,
            time: new Date().toISOString().split('T')[0]
          })
        }
      })
      
      console.log(`HTML爬取成功，提取到 ${articles.length} 篇文章`)
    }
    
    console.log(`开始分析 ${articles.length} 篇文章，限制处理前20篇`)
    
    // 数据源到公司的映射（解决RSS标题不含公司名的问题）
    const sourceCompanyMap: { [key: string]: string } = {
      'Google News - PMLTC Pakistan': '巴基斯坦PMLTC公司',
      'Google News - CPFL Brazil': '巴西CPFL公司',
      'Google News - NGCP Philippines': '菲律宾NGCP公司',
      'Google News - 国家电网测试': '国家电网巴西控股公司',
      'BBC News - World': '', // 全球新闻，需要从内容识别
      'Reuters - World News': '',
      'Reuters - Business': '',
      'Al Jazeera - English': '',
      'New York Times - World': '',
    }
    
    // 从数据源名称获取默认公司
    const defaultCompany = sourceCompanyMap[source.name] || ''
    
    console.log(`数据源: "${source.name}", 默认公司: "${defaultCompany}"`)
    
    // 使用规则分析器分析风险
    const risks: any[] = []
    let analyzedCount = 0
    let relevantCount = 0
    
    // 处理文章数量：如果配置为0则处理全部，否则按配置限制
    const articlesToProcess = MAX_ARTICLES_PER_SOURCE > 0 
      ? articles.slice(0, MAX_ARTICLES_PER_SOURCE) 
      : articles
    
    console.log(`准备分析：文章总数 ${articles.length}，将处理 ${articlesToProcess.length} 篇`)
    
    for (const article of articlesToProcess) {
      console.log(`[循环 ${analyzedCount + 1}] 开始分析`)
      analyzedCount++
      
      // 将数据源名称也加入分析上下文（帮助识别公司）
      const contextText = `${source.name} ${article.title} ${article.content}`
      const analysis = await analyzeNewsRisk(article.title, contextText, article.time)
      
      // 如果分析器无法识别公司，使用数据源的默认公司
      const companyName = analysis.companyName || defaultCompany
      
      // 简化收录规则：只要有公司就收录，不做任何过滤
      const shouldInclude = !!companyName
      
      // 调试输出（只输出前3条）
      if (analyzedCount <= 3) {
        console.log(`[分析 ${analyzedCount}] 源: ${source.name}`)
        console.log(`  标题: ${article.title.substring(0, 50)}...`)
        console.log(`  → 分析器相关: ${analysis.isRelevant}`)
        console.log(`  → 分析器公司: ${analysis.companyName || '无'}`)
        console.log(`  → 默认公司: ${defaultCompany || '无'}`)
        console.log(`  → 最终公司: ${companyName || '无'}`)
        console.log(`  → 是否收录: ${shouldInclude}`)
        console.log(`  → 风险等级: ${analysis.riskLevel}`)
      }
      
      if (shouldInclude && companyName) {
        relevantCount++
        
        // 检查是否已存在（去重）
        const existing = await env.DB.prepare(`
          SELECT id FROM risks WHERE title = ?
        `).bind(article.title).first()
        
        if (!existing) {
          risks.push({
            company_name: companyName,
            title: article.title,
            risk_item: analysis.riskItem,
            risk_level: analysis.riskLevel, // ruleBasedAnalyzer返回中文格式
            risk_time: article.time,
            source: source.name,
            source_url: article.url,
            risk_reason: analysis.analysis
          })
        }
      }
    }
    
    console.log(`分析完成: 分析${analyzedCount}条, 相关${relevantCount}条, 新增${risks.length}条`)
    
    console.log(`发现 ${risks.length} 条相关风险`)
    
    return {
      success: true,
      risks,
      totalArticles: articles.length,
      newRisks: risks.length
    }
  } catch (error: any) {
    console.error(`爬取失败: ${error.message}`)
    return {
      success: false,
      risks: [],
      totalArticles: 0,
      newRisks: 0,
      error: error.message
    }
  }
}

app.post('/api/crawl/all', async (c) => {
  const { env } = c
  
  try {
    console.log('🚀 开始一键更新所有数据源...')
    
    // 获取所有启用的数据源
    const sources = await env.DB.prepare(`
      SELECT id, name, url, category, xpath_rules, user_agent
      FROM data_sources 
      WHERE enabled = 1
      ORDER BY id
    `).all()
    
    const totalSources = sources.results?.length || 0
    console.log(`找到 ${totalSources} 个启用的数据源`)
    
    if (totalSources === 0) {
      return c.json<ApiResponse>({
        success: false,
        error: '没有启用的数据源'
      })
    }
    
    // 统计信息
    let success = 0
    let failed = 0
    let totalRisks = 0
    
    // 爬取所有启用的数据源（移除10个的限制）
    const sourcesToCrawl = sources.results || []
    console.log(`将爬取 ${sourcesToCrawl.length} 个数据源`)
    
    for (const source of sourcesToCrawl) {
      try {
        console.log(`正在爬取: ${source.name}`)
        
        const result = await crawlAndAnalyze(source, env)
        
        // 爬取成功（无论是否发现新风险）
        if (result.success) {
          // 如果发现新风险，保存到数据库
          if (result.risks.length > 0) {
            for (const risk of result.risks) {
              await env.DB.prepare(`
                INSERT INTO risks (
                  company_name, title, risk_item, risk_level,
                  risk_time, source, source_url, risk_reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(
                risk.company_name,
                risk.title,
                risk.risk_item,
                risk.risk_level,
                risk.risk_time,
                risk.source,
                risk.source_url,
                risk.risk_reason
              ).run()
            }
            
            totalRisks += result.newRisks
          }
          
          success++
          
          // 更新数据源状态和成功率
          await env.DB.prepare(`
            UPDATE data_sources 
            SET 
              last_crawl_time = CURRENT_TIMESTAMP,
              success_count = success_count + 1,
              success_rate = ROUND((success_count + 1) * 100.0 / (success_count + fail_count + 1), 2),
              status = 'normal'
            WHERE id = ?
          `).bind(source.id).run()
        } else {
          failed++
        }
      } catch (err: any) {
        console.error(`爬取 ${source.name} 失败:`, err.message)
        failed++
      }
    }
    
    console.log(`✅ 更新完成: ${success}/${sourcesToCrawl.length} 成功, 新增 ${totalRisks} 条风险`)
    
    return c.json<ApiResponse>({
      success: true,
      message: `更新完成！成功: ${success}, 失败: ${failed}, 新增风险: ${totalRisks}`,
      data: {
        success,
        failed,
        totalRisks
      }
    })
  } catch (error: any) {
    console.error('一键更新失败:', error)
    return c.json<ApiResponse>({
      success: false,
      error: error.message
    }, 500)
  }
})

// 8. 手动触发数据爬取（单个数据源）
// 8. 手动触发数据爬取（单个数据源）
app.post('/api/crawl', async (c) => {
  const { env } = c
  
  try {
    const { sourceId } = await c.req.json()
    
    if (!sourceId) {
      return c.json<ApiResponse>({
        success: false,
        error: '缺少 sourceId 参数'
      }, 400)
    }
    
    // 获取数据源信息
    const source = await env.DB.prepare(`
      SELECT id, name, url, category, xpath_rules, user_agent
      FROM data_sources 
      WHERE id = ?
    `).bind(sourceId).first()
    
    if (!source) {
      return c.json<ApiResponse>({
        success: false,
        error: '数据源不存在'
      }, 404)
    }
    
    console.log(`开始爬取单个数据源: ${source.name}`)
    
    // 调用爬取函数
    const result = await crawlAndAnalyze(source, env)
    
    // 保存风险到数据库
    if (result.success && result.risks && result.risks.length > 0) {
      for (const risk of result.risks) {
        await env.DB.prepare(`
          INSERT INTO risks (
            company_name, title, risk_item, risk_level,
            risk_time, source, source_url, risk_reason, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          risk.company_name || '未知公司',
          risk.title || '未知标题',
          risk.risk_item || '未知风险',
          risk.risk_level || 'low',
          risk.risk_time || new Date().toISOString().split('T')[0],
          risk.source || source.name,
          risk.source_url || source.url,
          risk.risk_reason || '规则分析'
        ).run()
      }
    }
    
    // 更新数据源状态
    // 更新数据源状态和成功率
    if (result.success) {
      await env.DB.prepare(`
        UPDATE data_sources 
        SET 
          last_crawl_time = CURRENT_TIMESTAMP,
          success_count = success_count + 1,
          success_rate = ROUND((success_count + 1) * 100.0 / (success_count + fail_count + 1), 2),
          status = 'normal'
        WHERE id = ?
      `).bind(sourceId).run()
    } else {
      await env.DB.prepare(`
        UPDATE data_sources 
        SET 
          last_crawl_time = CURRENT_TIMESTAMP,
          fail_count = fail_count + 1,
          success_rate = ROUND(success_count * 100.0 / (success_count + fail_count + 1), 2),
          status = 'error'
        WHERE id = ?
      `).bind(sourceId).run()
    }
    
    return c.json<ApiResponse>({ 
      success: result.success, 
      message: result.success ? `成功爬取，发现 ${result.newRisks} 条新风险` : '爬取失败',
      data: result
    })
  } catch (error: any) {
    console.error('爬取失败:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 7. 新闻采集API（触发实时抓取）
app.post('/api/news/collect', async (c) => {
  const { DB } = c.env
  const { useMock = 'true' } = c.req.query()
  
  try {
    let articles;
    
    if (useMock === 'true') {
      // 使用模拟数据演示
      articles = generateMockNews()
      console.log('[NewsAPI] Using mock news data')
    } else {
      // 实际采集（需要API Key）
      const apiKey = c.env.NEWS_API_KEY || ''
      articles = await collectNewsForAllCompanies(apiKey)
    }
    
    // 保存到数据库
    const savedCount = await saveNewsToDatabase(DB, articles)
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: `成功采集并保存 ${savedCount} 条新闻`,
      data: {
        total: articles.length,
        saved: savedCount,
        skipped: articles.length - savedCount
      }
    })
  } catch (error: any) {
    console.error('[NewsAPI] Collection error:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 8. 获取监控公司列表
app.get('/api/companies/monitored', async (c) => {
  const companies = [
    { name: '南澳Electranet', region: 'international', country: '澳大利亚' },
    { name: '国家电网巴西控股公司', region: 'international', country: '巴西' },
    { name: '巴基斯坦PMLTC公司', region: 'international', country: '巴基斯坦' },
    { name: '巴西CPFL公司', region: 'international', country: '巴西' },
    { name: '希腊IPTO公司', region: 'international', country: '希腊' },
    { name: '智利CGE公司', region: 'international', country: '智利' },
    { name: '澳大利亚澳洲资产公司', region: 'international', country: '澳大利亚' },
    { name: '菲律宾NGCP公司', region: 'international', country: '菲律宾' },
    { name: '葡萄牙REN公司', region: 'international', country: '葡萄牙' },
    { name: '香港电灯公司', region: 'domestic', country: '中国香港' },
  ]
  
  return c.json<ApiResponse>({ 
    success: true, 
    data: {
      companies,
      total: companies.length
    }
  })
})

// 9. 新闻源配置
app.get('/api/news/sources', async (c) => {
  const sources = [
    { name: '新华网', type: 'domestic', status: 'active' },
    { name: '人民网', type: 'domestic', status: 'active' },
    { name: '央视网', type: 'domestic', status: 'active' },
    { name: '中国新闻网', type: 'domestic', status: 'active' },
    { name: '财新网', type: 'domestic', status: 'active' },
    { name: '第一财经', type: 'domestic', status: 'active' },
    { name: 'Reuters', type: 'international', status: 'active' },
    { name: 'Bloomberg', type: 'international', status: 'active' },
    { name: 'AP News', type: 'international', status: 'active' },
    { name: 'BBC', type: 'international', status: 'active' },
  ]
  
  return c.json<ApiResponse>({ 
    success: true, 
    data: { sources, total: sources.length }
  })
})

// 10. 爬取网站源管理API（POST/PUT/DELETE）
app.post('/api/datasources', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    
    const result = await env.DB.prepare(`
      INSERT INTO data_sources (
        name, url, xpath_rules, field_mapping, enable_js, 
        user_agent, interval, timeout, enabled, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.url,
      body.xpathRules || '',
      body.fieldMapping || '{}',
      body.enableJS ? 1 : 0,
      body.userAgent || 'Mozilla/5.0',
      body.interval || 3600,
      body.timeout || 30,
      body.enabled ? 1 : 0,
      'normal'
    ).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: '爬取网站源配置成功',
      data: { id: result.meta.last_row_id, ...body }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

app.put('/api/datasources/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { env } = c;
    const body = await c.req.json();
    
    await env.DB.prepare(`
      UPDATE data_sources 
      SET name = ?, url = ?, xpath_rules = ?, field_mapping = ?,
          enable_js = ?, user_agent = ?, interval = ?, timeout = ?, 
          enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.name,
      body.url,
      body.xpathRules || '',
      body.fieldMapping || '{}',
      body.enableJS ? 1 : 0,
      body.userAgent || 'Mozilla/5.0',
      body.interval || 3600,
      body.timeout || 30,
      body.enabled ? 1 : 0,
      id
    ).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: '更新成功',
      data: { id, ...body }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

app.delete('/api/datasources/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { env } = c;
    await env.DB.prepare(`DELETE FROM data_sources WHERE id = ?`).bind(id).run();
    return c.json<ApiResponse>({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

// 批量导入RSS数据源
app.post('/api/datasources/batch-import', async (c) => {
  try {
    const { env } = c;
    const { sources } = await c.req.json();
    
    if (!sources || !Array.isArray(sources)) {
      return c.json<ApiResponse>({
        success: false,
        error: '数据格式错误，需要sources数组'
      }, 400);
    }
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    for (const source of sources) {
      try {
        await env.DB.prepare(`
          INSERT INTO data_sources (
            name, url, category, xpath_rules, field_mapping, enable_js, 
            user_agent, interval, timeout, enabled, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          source.name,
          source.url,
          source.category || '新闻媒体',
          source.xpathRules || '//item',
          source.fieldMapping || '{"title":"//title","content":"//description","time":"//pubDate"}',
          source.enableJS ? 1 : 0,
          source.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          source.interval || 3600,
          source.timeout || 30,
          source.enabled !== false ? 1 : 0,
          'normal'
        ).run();
        
        successCount++;
      } catch (error: any) {
        failCount++;
        errors.push(`${source.name}: ${error.message}`);
      }
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: `批量导入完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      data: {
        successCount,
        failCount,
        errors: errors.slice(0, 10) // 最多返回10个错误
      }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

// 初始化可靠的RSS数据源
app.post('/api/datasources/init-reliable', async (c) => {
  try {
    const { env } = c;
    
    // 定义可靠的RSS源
    const reliableSources = [
      {
        name: 'BBC News - World',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        category: '新闻媒体'
      },
      {
        name: 'Reuters - Business',
        url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
        category: '新闻媒体'
      },
      {
        name: 'CNN - Top Stories',
        url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
        category: '新闻媒体'
      },
      {
        name: 'The Guardian - World',
        url: 'https://www.theguardian.com/world/rss',
        category: '新闻媒体'
      },
      {
        name: 'NPR - News',
        url: 'https://feeds.npr.org/1001/rss.xml',
        category: '新闻媒体'
      },
      {
        name: 'Al Jazeera - English',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: '新闻媒体'
      },
      {
        name: '新华网 - 英文',
        url: 'http://www.xinhuanet.com/english/rss.xml',
        category: '新闻媒体'
      },
      {
        name: 'New York Times - World',
        url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        category: '新闻媒体'
      },
      {
        name: 'Google News - PMLTC Pakistan',
        url: 'https://news.google.com/rss/search?q=PMLTC+OR+Matiari+Lahore+HVDC+OR+Pakistan+power&hl=en',
        category: '搜索引擎RSS'
      },
      {
        name: 'Google News - CPFL Brazil',
        url: 'https://news.google.com/rss/search?q=CPFL+Brazil+OR+Grupo+CPFL&hl=pt',
        category: '搜索引擎RSS'
      },
      {
        name: 'Google News - NGCP Philippines',
        url: 'https://news.google.com/rss/search?q=NGCP+Philippines+OR+National+Grid+Philippines&hl=en',
        category: '搜索引擎RSS'
      },
      {
        name: 'Google News - 国家电网',
        url: 'https://news.google.com/rss/search?q=国家电网+OR+State+Grid+OR+SGCC&hl=zh-CN',
        category: '搜索引擎RSS'
      }
    ];
    
    // 先删除所有旧数据源
    await env.DB.prepare(`DELETE FROM data_sources`).run();
    
    let successCount = 0;
    for (const source of reliableSources) {
      try {
        await env.DB.prepare(`
          INSERT INTO data_sources (
            name, url, category, xpath_rules, field_mapping, enable_js, 
            user_agent, interval, timeout, enabled, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          source.name,
          source.url,
          source.category,
          '//item',
          '{"title":"//title","content":"//description","time":"//pubDate"}',
          0,
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          3600,
          30,
          1,
          'normal'
        ).run();
        
        successCount++;
      } catch (error: any) {
        console.error(`导入数据源失败 (${source.name}):`, error.message);
      }
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: `成功初始化 ${successCount}/${reliableSources.length} 个可靠RSS数据源`,
      data: { count: successCount }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
})

// 11. 风险等级调整API
app.get('/api/risk-level/companies', async (c) => {
  const { env } = c
  
  try {
    // 获取查询参数
    const name = c.req.query('name') || ''
    const level = c.req.query('level') || ''
    
    // 从 risks 表聚合查询公司信息
    let sql = `
      SELECT 
        company_name as name,
        company_name as creditCode,
        risk_level as currentLevel,
        COUNT(*) as riskCount,
        MAX(created_at) as lastAdjustTime,
        'system' as adjustedBy,
        MIN(created_at) as createdAt
      FROM risks
      WHERE 1=1
    `
    
    const params: any[] = []
    
    // 添加名称筛选
    if (name) {
      sql += ' AND company_name LIKE ?'
      params.push(`%${name}%`)
    }
    
    // 添加等级筛选
    if (level) {
      sql += ' AND risk_level = ?'
      params.push(level)
    }
    
    sql += ' GROUP BY company_name, risk_level'
    sql += ' ORDER BY riskCount DESC, name ASC'
    
    // 执行查询
    const { results } = await env.DB.prepare(sql).bind(...params).all()
    
    // 为每个公司添加ID（使用公司名的hash作为临时ID）
    const companiesWithId = (results || []).map((company: any, index: number) => ({
      id: index + 1,
      ...company
    }))
    
    console.log(`查询到 ${companiesWithId.length} 家企业 (name=${name}, level=${level})`)
    
    return c.json<ApiResponse>({
      success: true,
      data: companiesWithId
    })
  } catch (error: any) {
    console.error('查询企业列表失败:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

app.post('/api/risk-level/adjust', async (c) => {
  try {
    const { env } = c
    const body = await c.req.json()
    
    // 支持单个和批量调整
    let companyIds = body.companyIds || []
    if (body.companyId) {
      companyIds = [body.companyId]
    }
    
    const { targetLevel, reason, adjustedBy = '系统管理员' } = body
    
    console.log('调整风险等级请求:', { companyIds, targetLevel, reason, adjustedBy })
    
    if (!companyIds || companyIds.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '请选择要调整的企业' 
      }, 400)
    }
    
    if (!targetLevel) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '请选择目标风险等级' 
      }, 400)
    }
    
    // 批量更新企业风险等级
    const updateResults = []
    for (const companyId of companyIds) {
      // 获取企业当前等级
      const company = await env.DB.prepare(
        'SELECT name, currentLevel FROM companies WHERE id = ? OR name = ?'
      ).bind(companyId, companyId).first()
      
      if (!company) {
        console.warn(`企业不存在: ${companyId}`)
        continue
      }
      
      const fromLevel = company.currentLevel
      
      // 更新企业风险等级
      await env.DB.prepare(
        `UPDATE companies 
         SET currentLevel = ?, lastAdjustTime = CURRENT_TIMESTAMP, adjustedBy = ?
         WHERE id = ? OR name = ?`
      ).bind(targetLevel, adjustedBy, companyId, companyId).run()
      
      // 插入历史记录
      await env.DB.prepare(
        `INSERT INTO risk_level_history 
         (companyId, companyName, fromLevel, toLevel, reason, adjustedBy, adjustedAt)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(companyId, company.name, fromLevel, targetLevel, reason || '', adjustedBy).run()
      
      updateResults.push({
        companyId,
        companyName: company.name,
        fromLevel,
        toLevel: targetLevel
      })
    }
    
    console.log('调整完成:', updateResults)
    
    return c.json<ApiResponse>({
      success: true,
      message: `成功调整 ${updateResults.length} 家企业的风险等级`,
      data: {
        adjustedCount: updateResults.length,
        results: updateResults
      }
    })
  } catch (error: any) {
    console.error('调整风险等级失败:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message || '调整失败' 
    }, 500)
  }
})

app.get('/api/risk-level/history', async (c) => {
  try {
    const { env } = c
    
    // 从数据库查询历史记录
    const { results } = await env.DB.prepare(
      `SELECT 
         id,
         company_id as companyId,
         company_name as companyName,
         from_level as fromLevel,
         to_level as toLevel,
         reason,
         adjusted_by as adjustedBy,
         adjusted_at as adjustedAt
       FROM risk_level_history
       ORDER BY adjusted_at DESC
       LIMIT 100`
    ).all()
    
    console.log(`查询到 ${results.length} 条历史记录`)
    
    return c.json<ApiResponse>({
      success: true,
      data: results || []
    })
  } catch (error: any) {
    console.error('查询历史记录失败:', error)
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// 12. 人工输入风险信息API
app.post('/api/risks/manual', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    
    // 验证必填字段
    if (!body.company_name || !body.title) {
      return c.json<ApiResponse>({
        success: false,
        error: '公司名称和标题为必填项'
      }, 400);
    }
    
    // 插入风险信息
    const result = await env.DB.prepare(`
      INSERT INTO risks (
        company_name, title, risk_item, risk_time, source, 
        risk_level, risk_reason, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.company_name,
      body.title,
      body.risk_item || '',
      body.risk_time || new Date().toISOString(),
      body.source || '人工录入',
      body.risk_level || 'medium',
      body.risk_reason || '',
      body.source_url || ''
    ).run();
    
    return c.json<ApiResponse>({
      success: true,
      message: '风险信息录入成功',
      data: { id: result.meta.last_row_id, ...body }
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500);
  }
});

// 12.5. 批量导入风险信息API
app.post('/api/risks/import', async (c) => {
  try {
    const { env } = c;
    const body = await c.req.json();
    const risks = body.risks || [];
    
    if (!Array.isArray(risks) || risks.length === 0) {
      return c.json<ApiResponse>({
        success: false,
        error: '没有有效的导入数据'
      }, 400);
    }
    
    const results = {
      total: risks.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>
    };
    
    // 逐条插入数据
    for (let i = 0; i < risks.length; i++) {
      const risk = risks[i];
      const rowNum = i + 1;
      
      try {
        // 数据校验
        if (!risk.company_name) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: '公司名称不能为空',
            data: risk
          });
          continue;
        }
        
        if (!risk.title) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: '标题不能为空',
            data: risk
          });
          continue;
        }
        
        // 风险等级验证
        const validLevels = ['高风险', '中风险', '低风险', 'high', 'medium', 'low'];
        let riskLevel = risk.risk_level || 'medium';
        
        // 转换中文等级到英文
        const levelMap: Record<string, string> = {
          '高风险': 'high',
          '中风险': 'medium',
          '低风险': 'low'
        };
        
        if (levelMap[riskLevel]) {
          riskLevel = levelMap[riskLevel];
        }
        
        if (!validLevels.includes(riskLevel)) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `无效的风险等级: ${risk.risk_level}，必须是"高风险"、"中风险"或"低风险"`,
            data: risk
          });
          continue;
        }
        
        // 日期验证和处理
        let riskTime = risk.risk_time;
        if (riskTime) {
          const date = new Date(riskTime);
          if (isNaN(date.getTime())) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              error: `无效的日期格式: ${riskTime}`,
              data: risk
            });
            continue;
          }
          riskTime = date.toISOString();
        } else {
          riskTime = new Date().toISOString();
        }
        
        // 插入数据
        await env.DB.prepare(`
          INSERT INTO risks (
            company_name, title, risk_item, risk_time, source,
            risk_level, risk_reason, source_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          risk.company_name.trim(),
          risk.title.trim(),
          risk.risk_item || '',
          riskTime,
          risk.source || 'Excel导入',
          riskLevel,
          risk.risk_reason || '',
          risk.source_url || ''
        ).run();
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: `数据库错误: ${error.message}`,
          data: risk
        });
      }
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: `导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
      data: results
    });
  } catch (error: any) {
    return c.json<ApiResponse>({ 
      success: false, 
      error: `导入失败: ${error.message}` 
    }, 500);
  }
});

// 13. 更新风险信息API
app.put('/api/risks/:id', async (c) => {
  try {
    const { env } = c;
    const id = c.req.param('id');
    const body = await c.req.json();
    
    console.log('更新风险信息 ID:', id, '数据:', body);
    
    // 构建动态更新SQL（只更新提供的字段）
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.company_name !== undefined) {
      updates.push('company_name = ?');
      values.push(body.company_name);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.risk_item !== undefined) {
      updates.push('risk_item = ?');
      values.push(body.risk_item);
    }
    if (body.risk_level !== undefined) {
      updates.push('risk_level = ?');
      values.push(body.risk_level);
    }
    if (body.risk_time !== undefined) {
      updates.push('risk_time = ?');
      values.push(body.risk_time);
    }
    if (body.source !== undefined) {
      updates.push('source = ?');
      values.push(body.source);
    }
    if (body.source_url !== undefined) {
      updates.push('source_url = ?');
      values.push(body.source_url);
    }
    if (body.risk_reason !== undefined) {
      updates.push('risk_reason = ?');
      values.push(body.risk_reason);
    }
    
    // 如果没有要更新的字段
    if (updates.length === 0) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '没有要更新的字段' 
      }, 400);
    }
    
    // 执行更新
    values.push(id); // WHERE id = ?
    const result = await env.DB.prepare(`
      UPDATE risks 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
    
    console.log('更新结果:', result);
    
    return c.json<ApiResponse>({
      success: true,
      message: '风险信息更新成功',
      data: { id, ...body }
    });
  } catch (error: any) {
    console.error('更新风险信息失败:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: error.message || '更新失败' 
    }, 500);
  }
});

// ========== 前端页面 ==========
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>国网风险预警平台</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.prod.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.7/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css" rel="stylesheet">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
      .fade-enter-from, .fade-leave-to { opacity: 0; }
      .risk-card { transition: all 0.3s; }
      .risk-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      .status-dot { animation: pulse 2s infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body class="bg-gray-50">
    <div id="app"></div>
    <script src="/static/app.js"></script>
    <script src="/static/app-extensions.js"></script>
    <script src="/static/export-fix.js"></script>
</body>
</html>
  `)
})

// ========== AI分析辅助函数 ==========

/**
 * 调用GenSpark AI进行分析
 */
async function callGenSparkAI(
  apiKey: string, 
  baseURL: string, 
  results: any[], 
  keyword: string, 
  filters: any
) {
  const prompt = buildAnalysisPrompt(results, keyword, filters)
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的风险分析助手，专门分析国网海外电力项目的风险信息。请用中文回答，提供专业、简洁的分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })
    
    if (!response.ok) {
      console.error('AI API请求失败:', response.status, await response.text())
      throw new Error(`AI API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // 尝试解析JSON响应
    return parseAIResponse(content, results)
    
  } catch (error: any) {
    console.error('AI调用失败，使用规则分析:', error)
    return performRuleBasedAnalysis(results, keyword, filters)
  }
}

/**
 * 构建AI分析提示词
 */
function buildAnalysisPrompt(results: any[], keyword: string, filters: any): string {
  const totalRisks = results.length
  const highRisks = results.filter(r => r.risk_level === '高风险').length
  const mediumRisks = results.filter(r => r.risk_level === '中风险').length
  const lowRisks = results.filter(r => r.risk_level === '低风险').length
  
  // 公司统计
  const companies: {[key: string]: number} = {}
  results.forEach(r => {
    companies[r.company_name] = (companies[r.company_name] || 0) + 1
  })
  const topCompanies = Object.entries(companies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  // 提取样本风险
  const samples = results.slice(0, 8).map(r => ({
    title: r.title,
    company: r.company_name,
    level: r.risk_level,
    item: r.risk_item,
    time: r.risk_time
  }))
  
  return `
请分析以下国网海外电力项目的风险搜索结果：

**搜索关键词**: "${keyword || '全部'}"
${filters?.riskLevel ? `**风险等级筛选**: ${filters.riskLevel}` : ''}
${filters?.company ? `**公司筛选**: ${filters.company}` : ''}
${filters?.timeRange ? `**时间范围**: 最近${filters.timeRange}天` : ''}

**统计数据**:
- 总计: ${totalRisks} 条风险
- 高风险: ${highRisks} 条 (${totalRisks > 0 ? Math.round(highRisks/totalRisks*100) : 0}%)
- 中风险: ${mediumRisks} 条 (${totalRisks > 0 ? Math.round(mediumRisks/totalRisks*100) : 0}%)
- 低风险: ${lowRisks} 条 (${totalRisks > 0 ? Math.round(lowRisks/totalRisks*100) : 0}%)

**涉及公司**:
${topCompanies.map(([company, count]) => `- ${company}: ${count}条`).join('\n')}

**样本风险事项** (前8条):
${samples.map((s, i) => `${i+1}. [${s.level}] ${s.company} - ${s.title.substring(0, 60)}...
   风险事项: ${s.item}
   时间: ${s.time || '未知'}`).join('\n\n')}

请以JSON格式提供分析结果：
\`\`\`json
{
  "summary": "一段话总结整体风险态势（80-150字）",
  "keyFindings": [
    "关键发现1（具体指出主要风险模式或趋势）",
    "关键发现2（分析公司或地区的风险集中情况）",
    "关键发现3（识别时间上的风险变化）",
    "关键发现4（其他重要洞察）"
  ],
  "recommendations": [
    "建议1（针对高风险事项的应对措施）",
    "建议2（风险监控和预警机制）",
    "建议3（与相关公司的协调建议）"
  ],
  "riskAssessment": {
    "level": "high/medium/low",
    "score": 0-100,
    "reasoning": "风险等级判断依据（说明为什么是这个等级）"
  }
}
\`\`\`

注意：
1. 分析要具体、专业，避免空泛
2. 关注高风险事项和趋势变化
3. 建议要可操作
`.trim()
}

/**
 * 解析AI响应
 */
function parseAIResponse(content: string, results: any[]) {
  try {
    // 提取JSON内容
    const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1])
      
      // 验证必要字段
      if (parsed.summary && parsed.keyFindings && parsed.recommendations && parsed.riskAssessment) {
        return parsed
      }
    }
  } catch (error) {
    console.error('解析AI响应失败:', error)
  }
  
  // 解析失败，使用规则分析
  return performRuleBasedAnalysis(results, '', {})
}

/**
 * 规则分析（降级方案）
 */
function performRuleBasedAnalysis(results: any[], keyword: string, filters: any) {
  const totalRisks = results.length
  const highRisks = results.filter(r => r.risk_level === '高风险').length
  const mediumRisks = results.filter(r => r.risk_level === '中风险').length
  const lowRisks = results.filter(r => r.risk_level === '低风险').length
  
  // 计算风险分数
  const score = totalRisks > 0 
    ? Math.round((highRisks * 100 + mediumRisks * 50 + lowRisks * 20) / totalRisks)
    : 0
  
  let level: 'high' | 'medium' | 'low' = 'low'
  if (score >= 70 || highRisks > totalRisks * 0.3) level = 'high'
  else if (score >= 40 || highRisks > 0) level = 'medium'
  
  // 公司统计
  const companies: {[key: string]: number} = {}
  results.forEach(r => {
    companies[r.company_name] = (companies[r.company_name] || 0) + 1
  })
  const topCompanies = Object.entries(companies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  // 风险类型统计
  const riskTypes = extractRiskTypes(results)
  
  return {
    summary: `${keyword ? `关于"${keyword}"的搜索` : '搜索'}共发现${totalRisks}条风险信息。其中高风险${highRisks}条（${Math.round(highRisks/totalRisks*100 || 0)}%），中风险${mediumRisks}条，低风险${lowRisks}条。${
      highRisks > totalRisks * 0.3 
        ? '高风险事项占比较高，需要重点关注和应对。' 
        : highRisks > 0 
          ? '存在部分高风险事项，需要及时处理。'
          : '总体风险可控，建议持续监控。'
    }${topCompanies.length > 0 ? ` 主要涉及${topCompanies[0][0]}等公司。` : ''}`,
    
    keyFindings: [
      `共发现${totalRisks}条相关风险信息`,
      `高风险事项${highRisks}条${highRisks > 0 ? '，占比' + Math.round(highRisks/totalRisks*100) + '%' : ''}`,
      topCompanies.length > 0 
        ? `风险主要集中在${topCompanies.map(c => `${c[0]}(${c[1]}条)`).join('、')}` 
        : '风险分布较为分散',
      riskTypes.length > 0 
        ? `主要风险类型：${riskTypes.slice(0, 4).join('、')}` 
        : '风险类型多样'
    ].filter(Boolean),
    
    recommendations: [
      highRisks > 0 
        ? `立即评估${highRisks}条高风险事项的影响范围和应对方案` 
        : '建立风险预警机制，及时发现新风险',
      topCompanies.length > 0
        ? `加强与${topCompanies[0][0]}等重点公司的沟通协调`
        : '保持与各相关公司的常规沟通',
      '持续监控风险发展态势，定期更新风险评估'
    ],
    
    riskAssessment: {
      level,
      score,
      reasoning: `基于${totalRisks}条风险数据分析，高风险占比${Math.round(highRisks/totalRisks*100 || 0)}%（${highRisks}条），中风险${Math.round(mediumRisks/totalRisks*100 || 0)}%（${mediumRisks}条），综合风险评分${score}分，评估为${level === 'high' ? '高' : level === 'medium' ? '中' : '低'}风险等级。${
        level === 'high' 
          ? '建议立即采取应对措施。' 
          : level === 'medium'
            ? '需要密切关注并做好准备。'
            : '当前态势总体可控。'
      }`
    }
  }
}

/**
 * 提取风险类型
 */
function extractRiskTypes(results: any[]): string[] {
  const types = new Set<string>()
  results.forEach(r => {
    const text = (r.risk_item || '') + (r.title || '')
    if (text.includes('停电')) types.add('停电')
    if (text.includes('事故')) types.add('事故')
    if (text.includes('延期') || text.includes('推迟')) types.add('延期')
    if (text.includes('财务') || text.includes('资金') || text.includes('债务')) types.add('财务')
    if (text.includes('法律') || text.includes('诉讼') || text.includes('合规')) types.add('法律')
    if (text.includes('政策') || text.includes('监管')) types.add('政策')
    if (text.includes('安全') || text.includes('火灾') || text.includes('爆炸')) types.add('安全')
    if (text.includes('环境') || text.includes('污染')) types.add('环境')
  })
  return Array.from(types)
}

export default app
