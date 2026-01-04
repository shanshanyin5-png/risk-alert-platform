// RSS Feed 解析器模块
// 支持 RSS 2.0 和 Atom 格式

export interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
  content?: string
  author?: string
  category?: string
}

export interface RSSFeed {
  title: string
  description: string
  link: string
  items: RSSItem[]
}

/**
 * 解析 RSS/Atom Feed
 * 支持多种策略以绕过防爬虫机制
 */
export async function parseRSSFeed(url: string): Promise<RSSFeed> {
  try {
    console.log(`正在获取RSS: ${url}`)
    
    // 策略1: 直接请求
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    })
    
    console.log(`RSS响应状态: ${response.status}`)
    
    // 如果直接请求失败，尝试策略2: 使用RSS代理
    if (!response.ok && response.status >= 400) {
      console.log('直接请求失败，尝试使用RSS代理...')
      
      // 使用 rss2json.com 作为代理（免费版）
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`
      
      const proxyResponse = await fetch(proxyUrl)
      
      if (proxyResponse.ok) {
        const jsonData = await proxyResponse.json() as any
        
        if (jsonData.status === 'ok') {
          console.log(`RSS代理成功，获取到 ${jsonData.items?.length || 0} 条数据`)
          
          // 转换JSON为RSSFeed格式
          return {
            title: jsonData.feed?.title || 'RSS Feed',
            description: jsonData.feed?.description || '',
            link: jsonData.feed?.link || url,
            items: (jsonData.items || []).map((item: any) => ({
              title: item.title || 'Untitled',
              description: cleanHTML(item.description || item.content || ''),
              link: item.link || '',
              pubDate: item.pubDate || new Date().toISOString(),
              content: cleanHTML(item.content || item.description || ''),
              author: item.author || '',
              category: item.category?.[0] || ''
            }))
          }
        }
      }
      
      throw new Error(`HTTP ${response.status}: 无法访问RSS源`)
    }
    
    const xmlText = await response.text()
    console.log(`RSS内容长度: ${xmlText.length}`)
    
    if (xmlText.length < 50) {
      throw new Error('RSS内容为空或太短')
    }
    
    // 简单的XML解析（不依赖外部库）
    return parseXML(xmlText)
  } catch (error: any) {
    console.error(`解析RSS失败 (${url}):`, error.message)
    throw error
  }
}

/**
 * 简单XML解析器
 */
function parseXML(xml: string): RSSFeed {
  // 检测是RSS还是Atom
  const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"')
  
  if (isAtom) {
    return parseAtomFeed(xml)
  } else {
    return parseRSS2Feed(xml)
  }
}

/**
 * 解析RSS 2.0格式
 */
function parseRSS2Feed(xml: string): RSSFeed {
  const items: RSSItem[] = []
  
  // 提取channel标题
  const channelTitle = extractTag(xml, 'title') || 'RSS Feed'
  const channelDesc = extractTag(xml, 'description') || ''
  const channelLink = extractTag(xml, 'link') || ''
  
  // 提取所有item
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/g) || []
  
  for (const itemXml of itemMatches) {
    const item: RSSItem = {
      title: extractTag(itemXml, 'title') || 'Untitled',
      description: cleanHTML(extractTag(itemXml, 'description') || ''),
      link: extractTag(itemXml, 'link') || '',
      pubDate: extractTag(itemXml, 'pubDate') || new Date().toISOString(),
      content: cleanHTML(extractTag(itemXml, 'content:encoded') || ''),
      author: extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator') || '',
      category: extractTag(itemXml, 'category') || ''
    }
    
    items.push(item)
  }
  
  return {
    title: channelTitle,
    description: channelDesc,
    link: channelLink,
    items
  }
}

/**
 * 解析Atom格式
 */
function parseAtomFeed(xml: string): RSSFeed {
  const items: RSSItem[] = []
  
  // 提取feed标题
  const feedTitle = extractTag(xml, 'title') || 'Atom Feed'
  const feedSubtitle = extractTag(xml, 'subtitle') || ''
  const feedLink = extractAtomLink(xml) || ''
  
  // 提取所有entry
  const entryMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/g) || []
  
  for (const entryXml of entryMatches) {
    const item: RSSItem = {
      title: extractTag(entryXml, 'title') || 'Untitled',
      description: cleanHTML(extractTag(entryXml, 'summary') || extractTag(entryXml, 'content') || ''),
      link: extractAtomLink(entryXml) || '',
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated') || new Date().toISOString(),
      content: cleanHTML(extractTag(entryXml, 'content') || ''),
      author: extractTag(entryXml, 'author') || '',
      category: extractTag(entryXml, 'category') || ''
    }
    
    items.push(item)
  }
  
  return {
    title: feedTitle,
    description: feedSubtitle,
    link: feedLink,
    items
  }
}

/**
 * 提取XML标签内容
 */
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * 提取Atom的link标签
 */
function extractAtomLink(xml: string): string {
  const match = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)
  return match ? match[1] : ''
}

/**
 * 清理HTML标签
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
}

/**
 * 创建Google News RSS URL
 */
export function createGoogleNewsRSSUrl(keyword: string, language = 'zh-CN'): string {
  const encodedKeyword = encodeURIComponent(keyword)
  return `https://news.google.com/rss/search?q=${encodedKeyword}&hl=${language}&gl=CN&ceid=CN:${language}`
}

/**
 * 批量创建公司专属RSS源
 */
export function createCompanyRSSSources() {
  const companies = [
    { name: '国家电网', keywords: '国家电网 OR State Grid OR SGCC' },
    { name: '巴基斯坦PMLTC', keywords: 'PMLTC OR Matiari Lahore HVDC OR Pakistan power' },
    { name: '巴西CPFL', keywords: 'CPFL Brazil OR Grupo CPFL' },
    { name: '菲律宾NGCP', keywords: 'NGCP Philippines OR National Grid Philippines' },
    { name: '智利CGE', keywords: 'CGE Chile OR Chilectra' },
    { name: '葡萄牙REN', keywords: 'REN Portugal OR Redes Energéticas' },
    { name: '希腊IPTO', keywords: 'IPTO Greece OR Independent Power Transmission' },
    { name: '澳大利亚ElectraNet', keywords: 'ElectraNet Australia OR South Australia power' },
    { name: '香港电灯', keywords: 'HK Electric OR Hong Kong Electric OR 香港电灯' }
  ]
  
  const sources = []
  
  // Google News RSS源（中英文）
  for (const company of companies) {
    sources.push({
      name: `Google News - ${company.name} (中文)`,
      url: createGoogleNewsRSSUrl(company.keywords, 'zh-CN'),
      type: 'rss',
      category: '搜索引擎RSS'
    })
    
    sources.push({
      name: `Google News - ${company.name} (英文)`,
      url: createGoogleNewsRSSUrl(company.keywords, 'en-US'),
      type: 'rss',
      category: '搜索引擎RSS'
    })
  }
  
  // 通用RSS源
  sources.push(
    {
      name: 'Reuters Energy',
      url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
      type: 'rss',
      category: '新闻媒体'
    },
    {
      name: 'BBC News RSS',
      url: 'http://feeds.bbci.co.uk/news/rss.xml',
      type: 'rss',
      category: '新闻媒体'
    },
    {
      name: '新华网能源',
      url: 'http://www.xinhuanet.com/power/news_power.xml',
      type: 'rss',
      category: '新闻媒体'
    },
    {
      name: '人民网能源',
      url: 'http://energy.people.com.cn/rss/energy.xml',
      type: 'rss',
      category: '新闻媒体'
    }
  )
  
  return sources
}
