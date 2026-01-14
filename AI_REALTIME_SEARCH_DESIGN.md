# AI实时搜索功能设计方案

## 📋 需求理解

用户输入关键词（如"停电"、"CPFL"、"巴基斯坦电网"），系统通过**大模型的搜索工具**在互联网上实时搜索相关新闻和风险信息，然后在页面上展示搜索结果并进行AI分析。

**关键点**：
- ✅ 使用大模型的搜索工具（如GenSpark的Web Search）
- ✅ 搜索互联网上的最新信息，而非内部数据库
- ✅ 在AI搜索页面展示搜索结果
- ✅ 对搜索结果进行AI风险分析

---

## 🎯 技术方案

### 方案选择：GenSpark AI + Web Search Tool

**GenSpark AI 支持的搜索方式**：
1. **Function Calling with WebSearch Tool** - 推荐 ⭐
2. **Direct Web Search Integration**
3. **Custom Search API Integration**

我们选择 **方案1：Function Calling with WebSearch Tool**

**原因**：
- GenSpark AI 原生支持 Function Calling
- 可以直接使用 WebSearch 工具搜索互联网
- AI 会自动调用搜索工具并分析结果
- 无需额外的搜索API（Google/Bing）
- 成本可控，集成简单

---

## 📝 完整Prompt设计

### 1. System Prompt（系统角色定义）

```text
你是一个专业的国网海外电力项目风险分析助手。你的任务是：

1. **使用Web搜索工具**：根据用户提供的关键词，使用web_search工具在互联网上搜索最新的相关新闻和信息
2. **风险识别与分析**：分析搜索结果，识别可能影响国网海外电力项目的风险事件
3. **风险分级**：将识别出的风险按照严重程度分为高风险、中风险、低风险
4. **结构化输出**：以JSON格式返回搜索结果和分析结论

**风险分级标准**：
- **高风险**：停电、事故、项目延期、重大财务问题、法律纠纷、政治动荡
- **中风险**：设备故障、人员变动、合同争议、监管变化
- **低风险**：一般性新闻、行业动态、日常运营信息

**搜索策略**：
- 优先搜索最近30天内的信息
- 关注电力、能源、基础设施相关内容
- 重点关注海外项目：巴西CPFL、巴基斯坦PMLTC、菲律宾NGCP等

**输出格式**（JSON）：
{
  "search_keyword": "用户输入的关键词",
  "search_time": "搜索时间 ISO8601",
  "total_results": 搜索到的结果数量,
  "risks": [
    {
      "title": "新闻标题",
      "company_name": "相关公司名称（如：巴西CPFL公司、巴基斯坦PMLTC公司）",
      "risk_level": "高风险|中风险|低风险",
      "risk_item": "风险事项（如：停电、事故、延期）",
      "risk_time": "事件时间 YYYY-MM-DD",
      "source": "来源网站",
      "source_url": "原文链接",
      "summary": "简要描述（50-100字）",
      "risk_reason": "风险原因和影响分析（100-200字）"
    }
  ],
  "overall_assessment": {
    "total_risks": 总风险数,
    "high_risks": 高风险数,
    "medium_risks": 中风险数,
    "low_risks": 低风险数,
    "risk_score": 风险评分0-100,
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
```

---

### 2. User Prompt Template（用户输入模板）

```javascript
// 基础搜索
const userPrompt = `
请搜索并分析关于"${keyword}"的风险信息。

要求：
1. 使用web_search工具搜索互联网上的最新信息
2. 重点关注电力、能源、基础设施领域
3. 识别可能影响国网海外项目的风险事件
4. 按照系统提示的JSON格式返回结果

关键词：${keyword}
搜索时间范围：最近30天
`;

// 带筛选条件的搜索
const userPromptWithFilters = `
请搜索并分析关于"${keyword}"的风险信息。

搜索条件：
- 关键词：${keyword}
${filters.company ? `- 公司筛选：${filters.company}` : ''}
${filters.riskLevel ? `- 风险等级：${filters.riskLevel}` : ''}
${filters.timeRange ? `- 时间范围：最近${filters.timeRange}天` : '- 时间范围：最近30天'}

要求：
1. 使用web_search工具搜索互联网上的最新信息
2. 重点关注指定的公司和风险等级
3. 识别可能影响国网海外项目的风险事件
4. 按照系统提示的JSON格式返回结果
`;
```

---

### 3. Function Calling 定义

```json
{
  "functions": [
    {
      "name": "web_search",
      "description": "在互联网上搜索最新的新闻和信息",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "搜索关键词，例如：停电、CPFL、巴基斯坦电网"
          },
          "time_range": {
            "type": "string",
            "description": "时间范围，如：past_day, past_week, past_month",
            "enum": ["past_day", "past_week", "past_month", "past_year"]
          },
          "num_results": {
            "type": "integer",
            "description": "返回结果数量，建议10-20条",
            "default": 15
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

---

## 🔧 实现方案

### 后端API设计（Hono + GenSpark AI）

```typescript
// src/realtimeSearchService.ts

interface RealtimeSearchRequest {
  keyword: string;
  filters?: {
    company?: string;
    riskLevel?: '高风险' | '中风险' | '低风险';
    timeRange?: number; // 天数
  };
}

interface RealtimeSearchResponse {
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
    risk_level: string;
    summary: string;
  };
  key_findings: string[];
  recommendations: string[];
}

export async function searchWithAI(request: RealtimeSearchRequest): Promise<RealtimeSearchResponse> {
  const apiKey = process.env.GENSPARK_TOKEN;
  if (!apiKey) {
    throw new Error('GENSPARK_TOKEN not configured');
  }

  const baseURL = 'https://www.genspark.ai/api/llm_proxy/v1';
  
  // System Prompt
  const systemPrompt = `你是一个专业的国网海外电力项目风险分析助手...`; // 完整System Prompt

  // User Prompt
  const { keyword, filters } = request;
  const timeRangeText = filters?.timeRange ? `最近${filters.timeRange}天` : '最近30天';
  
  const userPrompt = `
请搜索并分析关于"${keyword}"的风险信息。

搜索条件：
- 关键词：${keyword}
${filters?.company ? `- 公司筛选：${filters.company}` : ''}
${filters?.riskLevel ? `- 风险等级：${filters.riskLevel}` : ''}
- 时间范围：${timeRangeText}

要求：
1. 使用web_search工具搜索互联网上的最新信息
2. 重点关注电力、能源、基础设施领域
3. 识别可能影响国网海外项目的风险事件
4. 按照系统提示的JSON格式返回结果
`;

  // Function Calling Definition
  const functions = [
    {
      name: 'web_search',
      description: '在互联网上搜索最新的新闻和信息',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词'
          },
          time_range: {
            type: 'string',
            description: '时间范围',
            enum: ['past_day', 'past_week', 'past_month', 'past_year']
          },
          num_results: {
            type: 'integer',
            description: '返回结果数量',
            default: 15
          }
        },
        required: ['query']
      }
    }
  ];

  // 调用GenSpark AI
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      functions: functions,
      function_call: 'auto', // 让AI自动决定是否调用函数
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`GenSpark AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // 解析AI返回的JSON结果
  const aiContent = data.choices[0].message.content;
  const result = parseAIResponse(aiContent);
  
  return result;
}

function parseAIResponse(content: string): RealtimeSearchResponse {
  try {
    // 尝试从AI输出中提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in AI response');
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}
```

---

### API路由设计

```typescript
// src/index.tsx

import { searchWithAI } from './realtimeSearchService';

// 实时搜索API
app.post('/api/realtime-search', async (c) => {
  try {
    const { keyword, filters } = await c.req.json();
    
    if (!keyword || keyword.trim() === '') {
      return c.json({
        success: false,
        error: '请输入搜索关键词'
      }, 400);
    }

    console.log(`[Realtime Search] Keyword: ${keyword}, Filters:`, filters);

    const result = await searchWithAI({ keyword, filters });

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Realtime Search] Error:', error);
    return c.json({
      success: false,
      error: error.message || '搜索失败'
    }, 500);
  }
});
```

---

### 前端集成（ai-search.js）

```javascript
// 实时搜索函数
async function performRealtimeSearch(keyword, filters = {}) {
  try {
    showLoadingState('正在搜索互联网...');

    const response = await axios.post('/api/realtime-search', {
      keyword: keyword.trim(),
      filters: {
        company: filters.company || '',
        riskLevel: filters.riskLevel || '',
        timeRange: filters.timeRange || 30
      }
    });

    if (response.data.success) {
      const result = response.data.data;
      
      // 显示搜索结果
      displaySearchResults(result.risks);
      
      // 显示AI分析
      displayAIAnalysis({
        summary: result.overall_assessment.summary,
        keyFindings: result.key_findings,
        recommendations: result.recommendations,
        riskAssessment: {
          level: result.overall_assessment.risk_level,
          score: result.overall_assessment.risk_score,
          reasoning: `搜索到${result.total_results}条相关信息，其中高风险${result.overall_assessment.high_risks}条，中风险${result.overall_assessment.medium_risks}条，低风险${result.overall_assessment.low_risks}条。`
        }
      });
      
      hideLoadingState();
    } else {
      throw new Error(response.data.error || '搜索失败');
    }
  } catch (error) {
    console.error('Realtime search error:', error);
    showErrorState('搜索失败：' + error.message);
  }
}

// 搜索按钮点击事件
searchBtn.addEventListener('click', () => {
  const keyword = searchInput.value.trim();
  if (!keyword) {
    alert('请输入搜索关键词');
    return;
  }

  const filters = {
    riskLevel: riskLevelFilter.value,
    company: companyFilter.value,
    timeRange: parseInt(timeRangeFilter.value) || 30
  };

  // 调用实时搜索
  performRealtimeSearch(keyword, filters);
});
```

---

## 💰 成本估算

### GenSpark AI (gpt-4o-mini) 定价

- **输入Token**：约 $0.15 / 1M tokens
- **输出Token**：约 $0.60 / 1M tokens

### 单次搜索成本估算

```
输入：
- System Prompt: ~500 tokens
- User Prompt: ~200 tokens
- Web Search Results: ~2000 tokens (假设搜索返回15条结果)
总输入：~2700 tokens

输出：
- JSON Response: ~1500 tokens
总输出：~1500 tokens

单次成本：
- 输入成本：2700 * $0.15 / 1,000,000 = $0.000405
- 输出成本：1500 * $0.60 / 1,000,000 = $0.000900
- 总成本：约 $0.0013 (0.13美分)
```

### 月度成本估算

| 使用量 | 月成本 |
|--------|--------|
| 100次/天 | 约 $3.9/月 |
| 500次/天 | 约 $19.5/月 |
| 1000次/天 | 约 $39/月 |

**结论**：成本非常低，适合中小规模使用。

---

## 📊 预期效果

### 用户交互流程

1. **用户输入关键词**："停电" / "CPFL" / "巴基斯坦电网"
2. **点击搜索按钮**
3. **显示加载状态**："正在搜索互联网..."
4. **AI调用Web Search工具**：搜索最新新闻
5. **AI分析搜索结果**：识别风险、分级、生成建议
6. **展示搜索结果**：
   - 风险卡片列表（标题、公司、等级、时间、来源）
   - AI分析面板（总体评估、关键发现、应对建议）
7. **支持导出**：CSV导出搜索结果

### 优势

✅ **实时性**：搜索互联网最新信息，不依赖内部数据库  
✅ **智能化**：AI自动分析风险、分级、生成建议  
✅ **准确性**：基于真实新闻源，而非模拟数据  
✅ **可扩展**：支持多种筛选条件和高级搜索  
✅ **成本低**：单次搜索仅需 $0.001-0.002  

---

## 🚀 实施计划

### 第一阶段：核心功能（1-2天）
1. ✅ 创建 `realtimeSearchService.ts`
2. ✅ 实现 `/api/realtime-search` 路由
3. ✅ 前端集成：调用实时搜索API
4. ✅ 测试：验证搜索和分析功能

### 第二阶段：优化与完善（1天）
1. ✅ 添加缓存机制（避免重复搜索）
2. ✅ 错误处理和降级策略
3. ✅ 搜索结果存储到数据库（可选）
4. ✅ 性能优化和日志记录

### 第三阶段：部署与监控（0.5天）
1. ✅ 配置生产环境GENSPARK_TOKEN
2. ✅ 部署到Cloudflare Pages
3. ✅ 监控成本和使用量
4. ✅ 用户反馈收集

---

## ❓ 待确认问题

### 请确认以下问题：

1. **是否使用GenSpark AI的Web Search功能？**
   - ✅ 是（推荐）
   - ❌ 否，使用其他搜索API（如Google、Bing）

2. **搜索结果是否需要存储到数据库？**
   - ✅ 是（便于历史查询和统计）
   - ❌ 否（仅实时展示）

3. **是否需要搜索结果缓存？**
   - ✅ 是（相同关键词24小时内返回缓存结果，节省成本）
   - ❌ 否（每次都实时搜索）

4. **实施优先级**
   - ⚡ 立即开始实施
   - 📅 稍后实施（先完成其他任务）
   - 📖 仅查看方案（暂不实施）

---

## 📚 相关文档

- [GenSpark AI Documentation](https://docs.genspark.ai)
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [AI Integration Guide](./AI_INTEGRATION_GUIDE.md)
- [AI Complete Report](./AI_COMPLETE_REPORT.md)

---

**创建时间**：2026-01-14  
**作者**：AI Assistant  
**状态**：待确认
