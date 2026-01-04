// 新闻爬取模块（完全免费，无需任何付费API）
import * as cheerio from 'cheerio'

// 国网及子公司关键词
const SGCC_KEYWORDS = [
  '国家电网', '国网', 'State Grid', 'SGCC',
  '国网国际', '国网巴西', 'State Grid Brazil',
  '巴基斯坦PMLTC', 'PMLTC', 'Matiari', 'Lahore',
  '巴西CPFL', 'CPFL', 'Grupo CPFL',
  '菲律宾NGCP', 'NGCP', 'National Grid Corporation',
  '智利CGE', 'CGE', 'Chilectra',
  '葡萄牙REN', 'REN', 'Redes Energéticas',
  '希腊IPTO', 'IPTO', 'Independent Power',
  '澳大利亚', 'Australia', 'ElectraNet', 'Ausgrid',
  '香港电灯', 'HK Electric', 'Hongkong Electric'
]

// 负面关键词
const NEGATIVE_KEYWORDS = [
  // 安全事故
  '事故', '故障', '停电', '断电', '爆炸', '火灾', '伤亡', '死亡',
  'accident', 'failure', 'blackout', 'outage', 'explosion', 'fire',
  
  // 财务问题
  '亏损', '债务', '违约', '破产', '资金链', '财务危机',
  'loss', 'debt', 'default', 'bankruptcy', 'financial crisis',
  
  // 法律纠纷
  '诉讼', '仲裁', '违规', '罚款', '调查', '起诉',
  'lawsuit', 'litigation', 'violation', 'fine', 'investigation',
  
  // 项目问题
  '延期', '停工', '暂停', '取消', '质量问题',
  'delay', 'suspended', 'cancelled', 'quality issue',
  
  // 负面评价
  '抗议', '反对', '不满', '批评', '争议',
  'protest', 'oppose', 'criticism', 'controversy'
]

/**
 * 检查文本是否包含国网相关内容
 */
export function containsSGCCKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return SGCC_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

/**
 * 检查文本是否包含负面关键词
 */
export function containsNegativeKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return NEGATIVE_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

/**
 * 爬取网页内容
 */
export async function crawlWebpage(url: string, timeout: number = 30000): Promise<{
  title: string
  content: string
  articles: Array<{ title: string; content: string; link: string }>
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // 移除脚本和样式
    $('script, style, nav, header, footer, aside').remove()
    
    // 提取标题
    const title = $('title').text() || $('h1').first().text() || '无标题'
    
    // 提取文章列表
    const articles: Array<{ title: string; content: string; link: string }> = []
    
    // 常见的文章容器选择器
    const articleSelectors = [
      'article',
      '.article',
      '.news-item',
      '.post',
      '[class*="article"]',
      '[class*="news"]',
      'main article',
      '.content article'
    ]
    
    for (const selector of articleSelectors) {
      $(selector).each((_, elem) => {
        const $elem = $(elem)
        const articleTitle = $elem.find('h1, h2, h3, .title, [class*="title"]').first().text().trim()
        const articleContent = $elem.find('p').map((_, p) => $(p).text().trim()).get().join(' ')
        const articleLink = $elem.find('a').first().attr('href') || url
        
        if (articleTitle && articleContent && articleContent.length > 50) {
          articles.push({
            title: articleTitle,
            content: articleContent.substring(0, 1000), // 限制长度
            link: articleLink.startsWith('http') ? articleLink : new URL(articleLink, url).href
          })
        }
      })
      
      if (articles.length > 0) break
    }
    
    // 提取页面主要内容
    const content = $('main, article, .content, #content, [role="main"]')
      .find('p')
      .map((_, elem) => $(elem).text().trim())
      .get()
      .join(' ')
      .substring(0, 5000) // 限制长度
    
    return {
      title,
      content: content || $('body').text().substring(0, 5000),
      articles: articles.slice(0, 10) // 最多返回10篇文章
    }
  } catch (error: any) {
    console.error(`爬取失败 ${url}:`, error.message)
    throw error
  }
}

/**
 * 使用免费规则分析新闻风险（不依赖任何付费API）
 */
export async function analyzeNewsRisk(title: string, content: string): Promise<{
  isRelevant: boolean
  riskLevel: 'high' | 'medium' | 'low'
  company: string
  riskItem: string
  reason: string
}> {
  // 检查是否包含国网关键词
  const hasSGCC = containsSGCCKeywords(title + ' ' + content)
  
  if (!hasSGCC) {
    return {
      isRelevant: false,
      riskLevel: 'low',
      company: '',
      riskItem: '',
      reason: ''
    }
  }
  
  // 检查负面关键词
  const hasNegative = containsNegativeKeywords(title + ' ' + content)
  
  if (!hasNegative) {
    return {
      isRelevant: false,
      riskLevel: 'low',
      company: '',
      riskItem: '',
      reason: ''
    }
  }
  
  // 提取公司名
  let company = '国家电网相关'
  const text = title + ' ' + content
  
  // 公司映射
  const companyMap: { [key: string]: string } = {
    'PMLTC': '巴基斯坦PMLTC公司',
    'Pakistan': '巴基斯坦PMLTC公司',
    'Matiari': '巴基斯坦PMLTC公司',
    'Lahore': '巴基斯坦PMLTC公司',
    'CPFL': '巴西CPFL公司',
    'Brazil': '巴西CPFL公司',
    'NGCP': '菲律宾NGCP公司',
    'Philippines': '菲律宾NGCP公司',
    'CGE': '智利CGE公司',
    'Chile': '智利CGE公司',
    'REN': '葡萄牙REN公司',
    'Portugal': '葡萄牙REN公司',
    'IPTO': '希腊IPTO公司',
    'Greece': '希腊IPTO公司',
    'ElectraNet': '南澳Electranet',
    'Australia': '澳大利亚澳洲资产公司',
    'HK Electric': '香港电灯公司',
    'Hong Kong': '香港电灯公司'
  }
  
  for (const [keyword, name] of Object.entries(companyMap)) {
    if (text.includes(keyword)) {
      company = name
      break
    }
  }
  
  // 判断风险等级
  const highRiskKeywords = [
    '事故', '爆炸', '火灾', '伤亡', '死亡', '破产', '违约',
    'accident', 'explosion', 'fire', 'death', 'bankruptcy', 'default'
  ]
  
  const mediumRiskKeywords = [
    '停电', '故障', '延期', '罚款', '诉讼', '亏损',
    'outage', 'failure', 'delay', 'fine', 'lawsuit', 'loss'
  ]
  
  let riskLevel: 'high' | 'medium' | 'low' = 'low'
  
  const lowerText = text.toLowerCase()
  if (highRiskKeywords.some(k => lowerText.includes(k.toLowerCase()))) {
    riskLevel = 'high'
  } else if (mediumRiskKeywords.some(k => lowerText.includes(k.toLowerCase()))) {
    riskLevel = 'medium'
  }
  
  return {
    isRelevant: true,
    riskLevel,
    company,
    riskItem: title.substring(0, 50),
    reason: '基于规则的免费风险分析'
  }
}

/**
 * 爬取单个数据源并分析
 */
export async function crawlAndAnalyzeSource(source: {
  id: number
  name: string
  url: string
  category: string
}): Promise<{
  success: boolean
  newRisks: number
  totalArticles: number
  errors: string[]
}> {
  const results = {
    success: true,
    newRisks: 0,
    totalArticles: 0,
    errors: [] as string[]
  }
  
  try {
    console.log(`开始爬取: ${source.name} (${source.url})`)
    
    // 爬取网页
    const { title, articles } = await crawlWebpage(source.url, 30000)
    results.totalArticles = articles.length
    
    console.log(`爬取到 ${articles.length} 篇文章`)
    
    // 分析每篇文章
    const risks = []
    for (const article of articles) {
      try {
        // 先用关键词快速过滤
        if (!containsSGCCKeywords(article.title + ' ' + article.content)) {
          continue
        }
        
        // AI分析
        const analysis = await analyzeNewsRisk(article.title, article.content)
        
        if (analysis.isRelevant) {
          risks.push({
            company_name: analysis.company,
            title: article.title,
            risk_item: analysis.riskItem,
            risk_level: analysis.riskLevel,
            risk_time: new Date().toISOString().split('T')[0],
            source: source.name,
            source_url: article.link,
            risk_reason: analysis.reason
          })
          
          results.newRisks++
        }
      } catch (err: any) {
        console.error(`分析文章失败:`, err.message)
        results.errors.push(`文章分析失败: ${err.message}`)
      }
    }
    
    console.log(`发现 ${results.newRisks} 条相关风险`)
    
    return {
      ...results,
      risks
    } as any
  } catch (error: any) {
    console.error(`数据源爬取失败:`, error.message)
    results.success = false
    results.errors.push(error.message)
    return results
  }
}
