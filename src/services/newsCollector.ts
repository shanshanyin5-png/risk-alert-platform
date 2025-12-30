/**
 * 新闻采集服务
 * 从境内外正规媒体获取风险信息
 */

interface NewsSource {
  name: string;
  type: 'domestic' | 'international';
  apiEndpoint?: string;
}

// 新闻源配置
const NEWS_SOURCES: NewsSource[] = [
  { name: '新华网', type: 'domestic' },
  { name: '人民网', type: 'domestic' },
  { name: '央视网', type: 'domestic' },
  { name: '中国新闻网', type: 'domestic' },
  { name: '财新网', type: 'domestic' },
  { name: '第一财经', type: 'domestic' },
  { name: 'Reuters', type: 'international' },
  { name: 'Bloomberg', type: 'international' },
  { name: 'AP News', type: 'international' },
  { name: 'BBC', type: 'international' },
];

// 监控的公司列表
const MONITORED_COMPANIES = [
  '南澳Electranet',
  '国家电网巴西控股公司',
  '巴基斯坦PMLTC公司',
  '巴西CPFL公司',
  '希腊IPTO公司',
  '智利CGE公司',
  '澳大利亚澳洲资产公司',
  '菲律宾NGCP公司',
  '葡萄牙REN公司',
  '香港电灯公司',
];

// 关键词映射（用于搜索）
const COMPANY_KEYWORDS: Record<string, string[]> = {
  '南澳Electranet': ['Electranet', 'South Australia', 'SA Power Networks'],
  '国家电网巴西控股公司': ['State Grid Brazil', 'SGBH', '国家电网', 'Brazil'],
  '巴基斯坦PMLTC公司': ['PMLTC', 'Pakistan', 'Matiari', 'Lahore', 'HVDC'],
  '巴西CPFL公司': ['CPFL', 'Brazil', 'São Paulo'],
  '希腊IPTO公司': ['IPTO', 'Greece', 'Independent Power Transmission Operator'],
  '智利CGE公司': ['CGE', 'Chile', 'Compañía General de Electricidad'],
  '澳大利亚澳洲资产公司': ['Spark Infrastructure', 'Australia', 'Victoria Power Networks'],
  '菲律宾NGCP公司': ['NGCP', 'Philippines', 'National Grid Corporation'],
  '葡萄牙REN公司': ['REN', 'Portugal', 'Redes Energéticas Nacionais'],
  '香港电灯公司': ['HK Electric', 'Hong Kong', '香港電燈'],
};

interface NewsArticle {
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  company: string;
  sourceType: 'domestic' | 'international';
}

/**
 * 从Google News RSS获取新闻（免费方案）
 */
async function fetchFromGoogleNews(company: string, keywords: string[]): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    // 构建搜索查询
    const query = keywords.join(' OR ');
    const encodedQuery = encodeURIComponent(query);
    
    // Google News RSS Feed
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
    
    // 注意：在生产环境需要使用RSS解析库或API代理
    console.log(`[NewsCollector] Fetching news for ${company}: ${rssUrl}`);
    
    // 这里返回模拟数据作为示例
    // 实际部署时需要集成真实的新闻API服务
    return articles;
  } catch (error) {
    console.error(`[NewsCollector] Error fetching news for ${company}:`, error);
    return articles;
  }
}

/**
 * 使用NewsAPI获取新闻（需要API Key）
 * 文档：https://newsapi.org/docs
 */
async function fetchFromNewsAPI(
  company: string, 
  keywords: string[],
  apiKey: string
): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    const query = keywords.join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.articles) {
      for (const article of data.articles) {
        articles.push({
          title: article.title,
          content: article.description || article.content || '',
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          company: company,
          sourceType: 'international',
        });
      }
    }
  } catch (error) {
    console.error(`[NewsCollector] NewsAPI error for ${company}:`, error);
  }
  
  return articles;
}

/**
 * 使用Bing News Search API（需要Azure订阅）
 */
async function fetchFromBingNews(
  company: string,
  keywords: string[],
  apiKey: string
): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    const query = keywords.join(' OR ');
    const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&mkt=zh-CN&count=50`;
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    });
    
    const data = await response.json();
    
    if (data.value) {
      for (const article of data.value) {
        articles.push({
          title: article.name,
          content: article.description || '',
          source: article.provider[0]?.name || 'Bing News',
          url: article.url,
          publishedAt: article.datePublished,
          company: company,
          sourceType: article.provider[0]?.name?.includes('中国') || 
                       article.provider[0]?.name?.includes('新华') ? 'domestic' : 'international',
        });
      }
    }
  } catch (error) {
    console.error(`[NewsCollector] Bing News API error for ${company}:`, error);
  }
  
  return articles;
}

/**
 * 风险关键词检测
 */
function detectRiskLevel(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  const criticalKeywords = [
    '事故', '死亡', '爆炸', '崩溃', '倒闭', '破产', '诉讼', '罚款', 
    '停电', '断电', '故障', '瘫痪', '损失', '赔偿',
    'accident', 'death', 'explosion', 'collapse', 'bankruptcy', 'lawsuit', 
    'fine', 'blackout', 'outage', 'failure', 'damage', 'compensation'
  ];
  
  const mediumKeywords = [
    '警告', '调查', '质疑', '争议', '延误', '超支',
    'warning', 'investigation', 'question', 'dispute', 'delay', 'overrun'
  ];
  
  for (const keyword of criticalKeywords) {
    if (text.includes(keyword)) {
      return '高风险';
    }
  }
  
  for (const keyword of mediumKeywords) {
    if (text.includes(keyword)) {
      return '中风险';
    }
  }
  
  return '低风险';
}

/**
 * 主采集函数
 */
export async function collectNewsForAllCompanies(
  apiKey?: string
): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  
  console.log(`[NewsCollector] Starting news collection for ${MONITORED_COMPANIES.length} companies...`);
  
  for (const company of MONITORED_COMPANIES) {
    const keywords = COMPANY_KEYWORDS[company] || [company];
    
    // 如果提供了API Key，使用付费API服务
    if (apiKey) {
      // 可以根据API Key类型选择不同的服务
      const articles = await fetchFromNewsAPI(company, keywords, apiKey);
      allArticles.push(...articles);
    } else {
      // 使用免费的Google News RSS
      const articles = await fetchFromGoogleNews(company, keywords);
      allArticles.push(...articles);
    }
  }
  
  console.log(`[NewsCollector] Collected ${allArticles.length} articles`);
  return allArticles;
}

/**
 * 将新闻文章保存到数据库
 */
export async function saveNewsToDatabase(
  db: D1Database,
  articles: NewsArticle[]
): Promise<number> {
  let savedCount = 0;
  
  for (const article of articles) {
    try {
      // 检测风险等级
      const riskLevel = detectRiskLevel(article.title, article.content);
      
      // 检查是否已存在（通过URL去重）
      const existing = await db.prepare(
        'SELECT id FROM risks WHERE source_url = ?'
      ).bind(article.url).first();
      
      if (existing) {
        continue; // 跳过已存在的记录
      }
      
      // 插入新记录
      await db.prepare(`
        INSERT INTO risks (
          company_name, title, risk_item, risk_time, 
          source, risk_level, source_type, source_platform, 
          source_region, source_url, risk_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        article.company,
        article.title,
        article.content.substring(0, 500), // 摘要
        article.publishedAt.split('T')[0], // 提取日期
        article.source,
        riskLevel,
        'auto', // 自动采集
        article.source,
        article.sourceType === 'domestic' ? 'domestic' : 'international',
        article.url,
        article.content
      ).run();
      
      savedCount++;
    } catch (error) {
      console.error('[NewsCollector] Error saving article:', error);
    }
  }
  
  console.log(`[NewsCollector] Saved ${savedCount} new articles to database`);
  return savedCount;
}

/**
 * 生成模拟新闻数据（用于演示）
 */
export function generateMockNews(): NewsArticle[] {
  const mockNews: NewsArticle[] = [
    {
      title: 'PMLTC Matiari-Lahore HVDC项目遭遇技术故障',
      content: '巴基斯坦国家输电公司(NTDC)报告称，Matiari-Lahore±660kV高压直流输电项目出现技术故障，导致部分地区供电受影响...',
      source: '路透社',
      url: 'https://www.reuters.com/markets/asia/pakistan-power-outage-2025',
      publishedAt: new Date().toISOString(),
      company: '巴基斯坦PMLTC公司',
      sourceType: 'international',
    },
    {
      title: '巴西CPFL面临监管机构罚款',
      content: '巴西国家电力监管局(ANEEL)对CPFL公司因服务质量问题开出罚单，涉及金额达数百万雷亚尔...',
      source: 'Bloomberg',
      url: 'https://www.bloomberg.com/news/brazil-cpfl-fine-2025',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      company: '巴西CPFL公司',
      sourceType: 'international',
    },
    {
      title: '菲律宾NGCP成功完成电网升级',
      content: '菲律宾国家电网公司(NGCP)宣布完成重要输电线路升级项目，提升了电网稳定性和输送容量...',
      source: 'Manila Times',
      url: 'https://www.manilatimes.net/2025/ngcp-grid-upgrade',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      company: '菲律宾NGCP公司',
      sourceType: 'international',
    },
    {
      title: '智利CGE应对极端天气挑战',
      content: '智利电力公司CGE在应对近期极端天气事件时，展现出良好的应急响应能力，确保了关键地区供电稳定...',
      source: 'Santiago Times',
      url: 'https://santiagotimes.cl/2025/cge-weather-response',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      company: '智利CGE公司',
      sourceType: 'international',
    },
    {
      title: '香港电灯公司发布年度可持续发展报告',
      content: '香港电灯公司发布最新年度报告，展示其在清洁能源转型和碳减排方面取得的进展...',
      source: '新华网',
      url: 'http://www.xinhuanet.com/2025/hk-electric-sustainability',
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      company: '香港电灯公司',
      sourceType: 'domestic',
    },
  ];
  
  return mockNews;
}

export { MONITORED_COMPANIES, COMPANY_KEYWORDS, NEWS_SOURCES };
