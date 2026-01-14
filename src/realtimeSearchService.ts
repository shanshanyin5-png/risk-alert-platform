/**
 * 实时搜索服务 - 使用GenSpark AI + Web Search
 * 
 * 功能：
 * 1. 调用GenSpark AI的Web Search工具搜索互联网
 * 2. AI自动分析搜索结果并识别风险
 * 3. 返回结构化的风险分析数据
 * 4. 支持缓存和数据库存储
 */

import type { D1Database } from '@cloudflare/workers-types';

// ========== 类型定义 ==========

export interface RealtimeSearchRequest {
  keyword: string;
  filters?: {
    company?: string;
    riskLevel?: '高风险' | '中风险' | '低风险';
    timeRange?: number; // 天数
  };
}

export interface RiskItem {
  title: string;
  company_name: string;
  risk_level: '高风险' | '中风险' | '低风险';
  risk_item: string;
  risk_time: string; // YYYY-MM-DD
  source: string;
  source_url: string;
  summary: string;
  risk_reason: string;
}

export interface RealtimeSearchResponse {
  search_keyword: string;
  search_time: string;
  total_results: number;
  risks: RiskItem[];
  overall_assessment: {
    total_risks: number;
    high_risks: number;
    medium_risks: number;
    low_risks: number;
    risk_score: number;
    risk_level: 'high' | 'medium' | 'low';
    summary: string;
  };
  key_findings: string[];
  recommendations: string[];
  cached?: boolean; // 是否来自缓存
}

// ========== System Prompt ==========

const SYSTEM_PROMPT = `你是一个专业的国网海外电力项目风险分析助手。你的任务是：

1. **使用Web搜索工具**：根据用户提供的关键词，使用web_search工具在互联网上搜索最新的相关新闻和信息
2. **风险识别与分析**：分析搜索结果，识别可能影响国网海外电力项目的风险事件
3. **风险分级**：将识别出的风险按照严重程度分为高风险、中风险、低风险
4. **结构化输出**：以JSON格式返回搜索结果和分析结论

**风险分级标准**：
- **高风险**：停电、重大事故、项目延期、重大财务问题、法律纠纷、政治动荡、暴力冲突
- **中风险**：设备故障、人员变动、合同争议、监管变化、小规模停电、技术问题
- **低风险**：一般性新闻、行业动态、日常运营信息、正面新闻、常规维护

**搜索策略**：
- 优先搜索最近30天内的信息
- 关注电力、能源、基础设施相关内容
- 重点关注海外项目：巴西CPFL、巴基斯坦PMLTC、菲律宾NGCP等
- 识别关键风险事件：停电、事故、延期、财务问题、政治问题

**输出格式要求**：
必须严格按照以下JSON格式输出，不要添加任何其他文字：

{
  "search_keyword": "用户输入的关键词",
  "search_time": "搜索时间 ISO8601格式",
  "total_results": 搜索到的结果数量（整数）,
  "risks": [
    {
      "title": "新闻标题",
      "company_name": "相关公司名称（如：巴西CPFL公司、巴基斯坦PMLTC公司、菲律宾NGCP公司）",
      "risk_level": "高风险|中风险|低风险",
      "risk_item": "风险事项（如：停电、事故、延期、财务问题）",
      "risk_time": "事件时间 YYYY-MM-DD格式",
      "source": "来源网站名称",
      "source_url": "原文链接URL",
      "summary": "简要描述（50-100字）",
      "risk_reason": "风险原因和影响分析（100-200字）"
    }
  ],
  "overall_assessment": {
    "total_risks": 总风险数（整数）,
    "high_risks": 高风险数（整数）,
    "medium_risks": 中风险数（整数）,
    "low_risks": 低风险数（整数）,
    "risk_score": 风险评分0-100（整数）,
    "risk_level": "high|medium|low",
    "summary": "总体风险评估（50-100字）"
  },
  "key_findings": [
    "关键发现1",
    "关键发现2",
    "关键发现3"
  ],
  "recommendations": [
    "应对建议1",
    "应对建议2",
    "应对建议3"
  ]
}

**重要**：
1. 必须先调用web_search工具搜索互联网信息
2. 基于真实搜索结果进行分析，不要编造信息
3. 如果搜索结果为空，risks数组为空，但仍需提供总体评估
4. 所有日期必须是YYYY-MM-DD格式
5. risk_level只能是"高风险"、"中风险"或"低风险"之一
6. 输出必须是有效的JSON格式，不要有额外的文字说明`;

// ========== Function Calling 定义 ==========

const FUNCTIONS = [
  {
    name: 'web_search',
    description: '在互联网上搜索最新的新闻和信息',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词，例如：停电、CPFL、巴基斯坦电网'
        },
        time_range: {
          type: 'string',
          description: '时间范围',
          enum: ['past_day', 'past_week', 'past_month', 'past_year']
        },
        num_results: {
          type: 'integer',
          description: '返回结果数量，建议10-20条',
          default: 15
        }
      },
      required: ['query']
    }
  }
];

// ========== 主要函数 ==========

/**
 * 检查缓存中是否有结果
 */
export async function checkCache(
  db: D1Database,
  keyword: string,
  filters?: RealtimeSearchRequest['filters']
): Promise<RealtimeSearchResponse | null> {
  try {
    const filterHash = JSON.stringify(filters || {});
    const cacheKey = `${keyword}_${filterHash}`;
    
    // 查询24小时内的缓存
    const cacheTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const result = await db
      .prepare(`
        SELECT result_json, created_at
        FROM search_cache
        WHERE cache_key = ? AND created_at > ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(cacheKey, cacheTime)
      .first();
    
    if (result) {
      console.log(`[Cache] Hit for keyword: ${keyword}`);
      const cachedResult = JSON.parse(result.result_json as string);
      cachedResult.cached = true;
      return cachedResult;
    }
    
    console.log(`[Cache] Miss for keyword: ${keyword}`);
    return null;
  } catch (error) {
    console.error('[Cache] Error checking cache:', error);
    return null;
  }
}

/**
 * 保存搜索结果到缓存
 */
export async function saveToCache(
  db: D1Database,
  keyword: string,
  filters: RealtimeSearchRequest['filters'],
  result: RealtimeSearchResponse
): Promise<void> {
  try {
    const filterHash = JSON.stringify(filters || {});
    const cacheKey = `${keyword}_${filterHash}`;
    
    await db
      .prepare(`
        INSERT INTO search_cache (cache_key, keyword, filters_json, result_json, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        cacheKey,
        keyword,
        JSON.stringify(filters || {}),
        JSON.stringify(result)
      )
      .run();
    
    console.log(`[Cache] Saved for keyword: ${keyword}`);
  } catch (error) {
    console.error('[Cache] Error saving to cache:', error);
  }
}

/**
 * 保存搜索结果到数据库（risks表）
 */
export async function saveSearchResults(
  db: D1Database,
  searchKeyword: string,
  risks: RiskItem[]
): Promise<void> {
  try {
    for (const risk of risks) {
      // 检查是否已存在（基于source_url）
      const existing = await db
        .prepare('SELECT id FROM risks WHERE source_url = ?')
        .bind(risk.source_url)
        .first();
      
      if (existing) {
        console.log(`[DB] Risk already exists: ${risk.title}`);
        continue;
      }
      
      // 插入新风险记录
      await db
        .prepare(`
          INSERT INTO risks (
            company_name, title, risk_item, risk_level, risk_time,
            source, source_url, risk_reason, remark, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
        .bind(
          risk.company_name,
          risk.title,
          risk.risk_item,
          risk.risk_level,
          risk.risk_time,
          risk.source,
          risk.source_url,
          risk.risk_reason,
          `实时搜索: ${searchKeyword}`
        )
        .run();
      
      console.log(`[DB] Saved risk: ${risk.title}`);
    }
  } catch (error) {
    console.error('[DB] Error saving search results:', error);
  }
}

/**
 * 构建用户Prompt
 */
function buildUserPrompt(request: RealtimeSearchRequest): string {
  const { keyword, filters } = request;
  const timeRangeText = filters?.timeRange ? `最近${filters.timeRange}天` : '最近30天';
  
  let prompt = `请搜索并分析关于"${keyword}"的风险信息。\n\n`;
  
  prompt += `搜索条件：\n`;
  prompt += `- 关键词：${keyword}\n`;
  
  if (filters?.company) {
    prompt += `- 公司筛选：${filters.company}\n`;
  }
  
  if (filters?.riskLevel) {
    prompt += `- 风险等级：${filters.riskLevel}\n`;
  }
  
  prompt += `- 时间范围：${timeRangeText}\n\n`;
  
  prompt += `要求：\n`;
  prompt += `1. 先使用web_search工具搜索互联网上的最新信息\n`;
  prompt += `2. 重点关注电力、能源、基础设施领域的新闻\n`;
  prompt += `3. 识别可能影响国网海外项目的风险事件\n`;
  prompt += `4. 严格按照系统提示中的JSON格式返回结果\n`;
  prompt += `5. 确保所有字段都填写完整，日期格式为YYYY-MM-DD\n`;
  
  return prompt;
}

/**
 * 解析AI返回的JSON响应
 */
function parseAIResponse(content: string): RealtimeSearchResponse {
  try {
    // 尝试直接解析JSON
    let jsonStr = content.trim();
    
    // 移除可能的markdown代码块标记
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // 尝试提取JSON对象
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonStr);
    
    // 验证必需字段
    if (!result.search_keyword || !result.risks || !result.overall_assessment) {
      throw new Error('Invalid response format: missing required fields');
    }
    
    return result;
  } catch (error) {
    console.error('[Parse] Failed to parse AI response:', error);
    console.error('[Parse] Content:', content);
    
    // 返回空结果而不是抛出错误
    return {
      search_keyword: '',
      search_time: new Date().toISOString(),
      total_results: 0,
      risks: [],
      overall_assessment: {
        total_risks: 0,
        high_risks: 0,
        medium_risks: 0,
        low_risks: 0,
        risk_score: 0,
        risk_level: 'low',
        summary: '未能解析搜索结果，请稍后重试'
      },
      key_findings: ['解析失败'],
      recommendations: ['请检查网络连接后重试']
    };
  }
}

/**
 * 使用GenSpark AI进行实时搜索
 */
export async function searchWithAI(
  request: RealtimeSearchRequest,
  apiKey?: string
): Promise<RealtimeSearchResponse> {
  // 获取API Key
  const token = apiKey || process.env.GENSPARK_TOKEN;
  if (!token) {
    throw new Error('GENSPARK_TOKEN not configured');
  }
  
  const baseURL = process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  
  console.log(`[Search] Keyword: ${request.keyword}, Model: ${model}`);
  
  // 构建用户Prompt
  const userPrompt = buildUserPrompt(request);
  
  try {
    // 调用GenSpark AI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Search] API error: ${response.status} ${errorText}`);
      throw new Error(`GenSpark AI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 提取AI返回的内容
    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content in AI response');
    }
    
    console.log(`[Search] AI response received, length: ${aiContent.length}`);
    
    // 解析JSON结果
    const result = parseAIResponse(aiContent);
    
    console.log(`[Search] Parsed ${result.risks.length} risks`);
    
    return result;
  } catch (error) {
    console.error('[Search] Error:', error);
    throw error;
  }
}

/**
 * 主搜索函数（带缓存和数据库存储）
 */
export async function realtimeSearch(
  request: RealtimeSearchRequest,
  db: D1Database,
  apiKey?: string
): Promise<RealtimeSearchResponse> {
  const { keyword, filters } = request;
  
  console.log(`[Realtime Search] Start: ${keyword}`);
  
  // 1. 检查缓存
  const cachedResult = await checkCache(db, keyword, filters);
  if (cachedResult) {
    console.log(`[Realtime Search] Return from cache`);
    return cachedResult;
  }
  
  // 2. 调用AI搜索
  const result = await searchWithAI(request, apiKey);
  
  // 3. 保存到缓存
  await saveToCache(db, keyword, filters, result);
  
  // 4. 保存风险记录到数据库
  if (result.risks.length > 0) {
    await saveSearchResults(db, keyword, result.risks);
  }
  
  console.log(`[Realtime Search] Complete: ${result.risks.length} risks found`);
  
  return result;
}
