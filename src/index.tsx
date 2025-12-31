import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, ApiResponse, Risk, StatisticsData } from './types/bindings'
import { collectNewsForAllCompanies, saveNewsToDatabase, generateMockNews } from './services/newsCollector'

const app = new Hono<{ Bindings: Bindings }>()

// 启用CORS
app.use('/api/*', cors())

// 静态文件服务
app.use('/static/*', serveStatic({ root: './public' }))

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

    // 数据源类型筛选
    if (sourceType) {
      whereClause += ' AND source_type = ?'
      params.push(sourceType)
    }

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
             risk_level, risk_level_review, risk_value_confirm, 
             substr(risk_reason, 1, 200) as risk_reason_preview,
             created_at
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

// 5. 实时数据获取（轮询方式替代SSE）
app.get('/api/realtime', async (c) => {
  const { DB } = c.env

  try {
    // 获取最新10条风险
    const result = await DB.prepare(`
      SELECT id, company_name, title, risk_level, risk_time, created_at
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

// 7. 获取数据源列表（改为模拟数据）
app.get('/api/datasources', async (c) => {
  // 模拟爬取网站源数据
  const datasources = [
    {
      id: 1,
      name: '新华网风险信息',
      url: 'http://www.xinhuanet.com',
      xpathRules: '//div[@class="news-item"]',
      fieldMapping: JSON.stringify({ title: '//h3', content: '//p' }),
      enableJS: false,
      userAgent: 'Mozilla/5.0',
      interval: 3600,
      timeout: 30,
      enabled: true,
      status: 'normal',
      lastCrawlTime: new Date().toISOString(),
      successRate: 95.5
    }
  ]
  
  return c.json<ApiResponse>({
    success: true,
    data: datasources
  })
})

// 8. 手动触发数据爬取（示例接口）
app.post('/api/crawl', async (c) => {
  const { DB } = c.env
  
  try {
    const { sourceId, sourceUrl, sourceName, sourceRegion } = await c.req.json()

    // 这里是数据爬取的占位逻辑
    // 实际使用需要：
    // 1. 使用 fetch 获取网页内容
    // 2. 使用 cheerio 或正则解析HTML
    // 3. 提取标题、内容、时间等信息
    // 4. 使用AI模型（如GPT）分析风险等级
    // 5. 插入数据库

    console.log(`开始爬取数据源: ${sourceName} (${sourceUrl})`)

    // 模拟爬取结果
    const mockData = {
      title: `【${sourceName}】检测到新的风险信息`,
      risk_item: '这是从外部媒体爬取的风险信息示例...',
      company_name: '测试公司',
      risk_level: '高风险',
      risk_time: new Date().toISOString().split('T')[0],
      source: sourceUrl,
      source_type: 'crawler',
      source_platform: sourceName,
      source_region: sourceRegion
    }

    // 插入到数据库
    await DB.prepare(`
      INSERT INTO risks (
        company_name, title, risk_item, risk_time, source,
        source_type, source_platform, source_region, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mockData.company_name,
      mockData.title,
      mockData.risk_item,
      mockData.risk_time,
      mockData.source,
      mockData.source_type,
      mockData.source_platform,
      mockData.source_region,
      mockData.risk_level
    ).run()

    // 更新数据源的最后爬取时间
    if (sourceId) {
      await DB.prepare(`
        UPDATE data_sources 
        SET last_crawled_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(sourceId).run()
    }

    return c.json<ApiResponse>({ 
      success: true, 
      message: '数据爬取完成',
      data: mockData
    })
  } catch (error: any) {
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
    const body = await c.req.json()
    // 这里应该保存到数据库，现在只返回成功
    return c.json<ApiResponse>({
      success: true,
      message: '爬取网站源配置成功',
      data: { id: Date.now(), ...body }
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  }
})

app.put('/api/datasources/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const body = await c.req.json()
    return c.json<ApiResponse>({
      success: true,
      message: '更新成功',
      data: { id, ...body }
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  }
})

app.delete('/api/datasources/:id', async (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({
    success: true,
    message: '删除成功'
  })
})

// 11. 风险等级调整API
app.get('/api/risk-level/companies', async (c) => {
  const { DB } = c.env
  
  try {
    const result = await DB.prepare(`
      SELECT DISTINCT company_name as name, 
             COUNT(*) as risk_count
      FROM risks 
      GROUP BY company_name
      ORDER BY risk_count DESC
    `).all()
    
    const companies = result.results.map((row: any, index: number) => ({
      id: row.name,
      name: row.name,
      creditCode: `91${Math.random().toString().substring(2, 20)}`,
      currentLevel: index < 3 ? '高风险' : index < 6 ? '中风险' : '低风险',
      riskCount: row.risk_count,
      lastAdjustTime: null,
      adjustedBy: null
    }))
    
    return c.json<ApiResponse>({
      success: true,
      data: companies
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  }
})

app.post('/api/risk-level/adjust', async (c) => {
  try {
    const body = await c.req.json()
    const { companyIds, targetLevel, reason } = body
    
    // 这里应该保存到数据库
    const history = {
      id: Date.now(),
      companyIds,
      targetLevel,
      reason,
      adjustedBy: '系统管理员',
      adjustedAt: new Date().toISOString()
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: `成功调整 ${companyIds.length} 家企业的风险等级`,
      data: history
    })
  } catch (error: any) {
    return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  }
})

app.get('/api/risk-level/history', async (c) => {
  // 模拟历史记录
  const history = [
    {
      id: 1,
      companyName: '巴基斯坦PMLTC公司',
      fromLevel: '高风险',
      toLevel: '中风险',
      reason: '项目进度正常，风险可控',
      adjustedBy: '张三',
      adjustedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
  
  return c.json<ApiResponse>({
    success: true,
    data: history
  })
})

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
</body>
</html>
  `)
})

export default app
