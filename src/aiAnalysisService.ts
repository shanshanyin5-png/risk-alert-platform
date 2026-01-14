// AI分析服务 - 使用GenSpark内置的OpenAI API

export interface AIAnalysisRequest {
  keyword: string;
  results: any[];
  filters?: {
    riskLevel?: string;
    company?: string;
    timeRange?: number;
  };
}

export interface AIAnalysisResponse {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskAssessment: {
    level: 'high' | 'medium' | 'low';
    score: number;
    reasoning: string;
  };
}

/**
 * 使用AI分析搜索结果
 * 基于GenSpark内置的OpenAI兼容API
 */
export async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  // 获取环境变量
  const apiKey = process.env.OPENAI_API_KEY || process.env.GENSPARK_TOKEN;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';
  
  if (!apiKey) {
    throw new Error('AI API密钥未配置');
  }
  
  // 构建提示词
  const prompt = buildAnalysisPrompt(request);
  
  try {
    // 调用OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini', // 使用快速模型
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
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // 解析AI响应
    return parseAIResponse(content, request.results);
    
  } catch (error: any) {
    console.error('AI分析失败:', error);
    // 降级到规则分析
    return fallbackAnalysis(request);
  }
}

/**
 * 构建AI分析提示词
 */
function buildAnalysisPrompt(request: AIAnalysisRequest): string {
  const { keyword, results, filters } = request;
  
  // 统计信息
  const totalRisks = results.length;
  const highRisks = results.filter(r => r.risk_level === '高风险').length;
  const mediumRisks = results.filter(r => r.risk_level === '中风险').length;
  const lowRisks = results.filter(r => r.risk_level === '低风险').length;
  
  // 公司统计
  const companies: {[key: string]: number} = {};
  results.forEach(r => {
    companies[r.company_name] = (companies[r.company_name] || 0) + 1;
  });
  const topCompanies = Object.entries(companies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // 提取样本风险
  const samples = results.slice(0, 5).map(r => ({
    title: r.title,
    company: r.company_name,
    level: r.risk_level,
    item: r.risk_item
  }));
  
  return `
请分析以下风险搜索结果：

**搜索关键词**: "${keyword}"
${filters?.riskLevel ? `**风险等级筛选**: ${filters.riskLevel}` : ''}
${filters?.company ? `**公司筛选**: ${filters.company}` : ''}
${filters?.timeRange ? `**时间范围**: 最近${filters.timeRange}天` : ''}

**统计数据**:
- 总计: ${totalRisks} 条风险
- 高风险: ${highRisks} 条
- 中风险: ${mediumRisks} 条  
- 低风险: ${lowRisks} 条

**涉及公司**:
${topCompanies.map(([company, count]) => `- ${company}: ${count}条`).join('\n')}

**样本风险事项** (前5条):
${samples.map((s, i) => `${i+1}. [${s.level}] ${s.company} - ${s.title.substring(0, 50)}...`).join('\n')}

请提供以下内容（使用JSON格式）:
{
  "summary": "一段话总结（50-100字）",
  "keyFindings": ["关键发现1", "关键发现2", "关键发现3"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "riskAssessment": {
    "level": "high/medium/low",
    "score": 0-100,
    "reasoning": "风险等级判断依据"
  }
}
`.trim();
}

/**
 * 解析AI响应
 */
function parseAIResponse(content: string, results: any[]): AIAnalysisResponse {
  try {
    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (error) {
    console.error('解析AI响应失败:', error);
  }
  
  // 如果解析失败，使用规则分析
  return fallbackAnalysis({ keyword: '', results });
}

/**
 * 降级分析（当AI不可用时）
 */
function fallbackAnalysis(request: AIAnalysisRequest): AIAnalysisResponse {
  const { results } = request;
  
  const highRisks = results.filter(r => r.risk_level === '高风险').length;
  const mediumRisks = results.filter(r => r.risk_level === '中风险').length;
  const totalRisks = results.length;
  
  // 计算风险分数
  const score = Math.round((highRisks * 100 + mediumRisks * 50) / Math.max(totalRisks, 1));
  
  let level: 'high' | 'medium' | 'low' = 'low';
  if (score >= 70) level = 'high';
  else if (score >= 40) level = 'medium';
  
  return {
    summary: `搜索共发现${totalRisks}条风险信息，其中高风险${highRisks}条，中风险${mediumRisks}条。${
      highRisks > 0 ? '存在多个高风险事项需要重点关注。' : '总体风险可控。'
    }`,
    keyFindings: [
      `发现${totalRisks}条相关风险信息`,
      `高风险事项${highRisks}条${highRisks > 0 ? '，需要立即关注' : ''}`,
      `主要风险类型包括${extractRiskTypes(results).slice(0, 3).join('、')}`
    ],
    recommendations: [
      highRisks > 0 ? '立即评估高风险事项的影响范围' : '继续监控风险发展态势',
      '加强与相关公司的沟通协调',
      '建立风险预警机制，及时响应新风险'
    ],
    riskAssessment: {
      level,
      score,
      reasoning: `基于${totalRisks}条风险数据分析，高风险占比${Math.round(highRisks/totalRisks*100)}%，综合评估为${level === 'high' ? '高' : level === 'medium' ? '中' : '低'}风险等级。`
    }
  };
}

/**
 * 提取风险类型
 */
function extractRiskTypes(results: any[]): string[] {
  const types = new Set<string>();
  results.forEach(r => {
    if (r.risk_item.includes('停电')) types.add('停电');
    if (r.risk_item.includes('事故')) types.add('事故');
    if (r.risk_item.includes('延期')) types.add('延期');
    if (r.risk_item.includes('财务')) types.add('财务');
    if (r.risk_item.includes('法律')) types.add('法律');
  });
  return Array.from(types);
}
