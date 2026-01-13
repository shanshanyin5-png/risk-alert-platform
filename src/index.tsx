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
             source_url, risk_level, 
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
    
    // 使用规则分析器分析风险
    const risks: any[] = []
    for (const article of articles.slice(0, 20)) { // 限制20篇
      const analysis = await analyzeNewsRisk(article.title, article.content, article.time)
      
      if (analysis.isRelevant) {
        // 检查是否已存在（去重）
        const existing = await env.DB.prepare(`
          SELECT id FROM risks WHERE title = ?
        `).bind(article.title).first()
        
        if (!existing) {
          risks.push({
            company_name: analysis.companyName,
            title: article.title,
            risk_item: analysis.riskItem,
            risk_level: analysis.riskLevel,
            risk_time: article.time,
            source: source.name,
            source_url: article.url,
            risk_reason: analysis.analysis
          })
        }
      }
    }
    
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
    
    // 爬取每个数据源（限制前10个以避免超时）
    const sourcesToCrawl = (sources.results || []).slice(0, 10)
    
    for (const source of sourcesToCrawl) {
      try {
        console.log(`正在爬取: ${source.name}`)
        
        const result = await crawlAndAnalyze(source, env)
        
        if (result.success && result.risks.length > 0) {
          // 保存风险到数据库
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
    // 从 companies 表查询
    const { results } = await env.DB.prepare(`
      SELECT 
        id,
        name,
        credit_code as creditCode,
        current_level as currentLevel,
        risk_count as riskCount,
        last_adjust_time as lastAdjustTime,
        adjusted_by as adjustedBy,
        created_at as createdAt
      FROM companies
      ORDER BY risk_count DESC, name ASC
    `).all()
    
    console.log(`查询到 ${results.length} 家企业`)
    
    return c.json<ApiResponse>({
      success: true,
      data: results || []
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
        risk_level, risk_reason, remark, source_type, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?)
    `).bind(
      body.company_name,
      body.title,
      body.risk_item || '',
      body.risk_time || new Date().toISOString(),
      body.source || '人工录入',
      body.risk_level || 'medium',
      body.risk_reason || '',
      body.remark || '',
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
            risk_level, risk_reason, remark, source_type, source_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'import', ?)
        `).bind(
          risk.company_name.trim(),
          risk.title.trim(),
          risk.risk_item || '',
          riskTime,
          risk.source || 'Excel导入',
          riskLevel,
          risk.risk_reason || '',
          risk.remark || '',
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
    
    // 验证必填字段
    if (!body.company_name || !body.title) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: '公司名称和标题为必填项' 
      }, 400);
    }
    
    // 更新风险信息
    const result = await env.DB.prepare(`
      UPDATE risks 
      SET company_name = ?, title = ?, risk_item = ?, risk_level = ?,
          source = ?, source_url = ?, risk_reason = ?, remark = ?
      WHERE id = ?
    `).bind(
      body.company_name,
      body.title,
      body.risk_item || '',
      body.risk_level || 'medium',
      body.source || '',
      body.source_url || '',
      body.risk_reason || '',
      body.remark || '',
      id
    ).run();
    
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

export default app
