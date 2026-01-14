# AI搜索功能 - 大模型接入方案与Prompt设计

## 需求分析

### 用户需求
用户输入关键词（如"停电"、"事故"、"巴西CPFL"），系统通过**大模型**搜索和分析相关风险信息，在页面上展示结果。

### 核心差异
- **当前实现**：搜索内部数据库（158条已有数据）
- **新需求**：接入大模型，实时搜索和分析外部信息

## 技术方案

### 方案选择

#### 方案A：大模型 + 搜索工具（推荐）
**流程**：
1. 用户输入关键词
2. 调用大模型，使用搜索工具（Function Calling）
3. 大模型自动调用搜索API获取实时信息
4. 大模型分析并返回结构化结果
5. 前端展示分析结果

**优势**：
- ✅ 实时获取最新信息
- ✅ AI自动分析和总结
- ✅ 支持多轮对话
- ✅ 结果质量高

**适用模型**：
- GenSpark AI (支持工具调用)
- OpenAI GPT-4 (支持Function Calling)
- Claude 3.5 (支持工具使用)

#### 方案B：搜索API + 大模型分析
**流程**：
1. 用户输入关键词
2. 后端调用搜索API（Google/Bing）获取搜索结果
3. 将搜索结果传递给大模型
4. 大模型分析并生成风险报告
5. 前端展示

**优势**：
- ✅ 实现简单
- ✅ 成本可控
- ✅ 可使用任意大模型

#### 方案C：大模型直接搜索（限制较多）
**流程**：
1. 用户输入关键词
2. 构造详细的prompt，要求大模型"搜索"相关信息
3. 大模型基于训练数据回答
4. 前端展示

**限制**：
- ❌ 无法获取最新信息（知识截止日期限制）
- ❌ 可能产生幻觉
- ⚠️ 不适合实时风险监控

## Prompt设计

### 方案A：带搜索工具的Prompt

#### System Prompt
```
你是一个专业的国网海外电力项目风险分析助手。你的任务是：
1. 根据用户提供的关键词，使用搜索工具查找相关新闻和信息
2. 分析搜索结果，识别潜在的风险事项
3. 按照风险等级（高/中/低）分类
4. 提供专业的风险评估和应对建议

重点关注领域：
- 海外电力项目：巴西CPFL、巴基斯坦PMLTC、菲律宾NGCP等
- 风险类型：停电、事故、延期、财务风险、法律风险、政策变化等
- 地理范围：全球，重点关注项目所在国家

输出要求：
- 使用中文回答
- 提供结构化的风险评估
- 每条风险包含：标题、来源、时间、风险等级、风险描述、影响分析、应对建议
```

#### User Prompt Template
```
请搜索并分析关于"{关键词}"的风险信息。

搜索范围：
- 时间范围：{时间范围，如"最近30天"}
- 地理范围：{地理范围，如"全球"或"巴西"}
- 风险类型：{风险类型，如"停电、事故"或"全部"}

请按以下JSON格式返回分析结果：
{
  "search_summary": "搜索概要（找到多少条信息，覆盖哪些方面）",
  "risks": [
    {
      "title": "风险标题",
      "source": "信息来源",
      "source_url": "原文链接",
      "publish_time": "发布时间",
      "risk_level": "高风险|中风险|低风险",
      "risk_type": "风险类型（停电/事故/延期等）",
      "company": "涉及公司",
      "location": "地点",
      "description": "风险描述（100-200字）",
      "impact_analysis": "影响分析（潜在影响和严重程度）",
      "recommendation": "应对建议"
    }
  ],
  "overall_assessment": {
    "total_risks": "总风险数量",
    "high_risks": "高风险数量",
    "medium_risks": "中风险数量",
    "low_risks": "低风险数量",
    "key_findings": ["关键发现1", "关键发现2", "关键发现3"],
    "trend_analysis": "趋势分析",
    "priority_actions": ["优先行动1", "优先行动2", "优先行动3"]
  }
}
```

#### 工具定义（Function Calling）
```json
{
  "name": "web_search",
  "description": "搜索互联网上的新闻和信息",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "搜索关键词，例如：'巴西CPFL停电事故'"
      },
      "time_range": {
        "type": "string",
        "enum": ["day", "week", "month", "year"],
        "description": "时间范围"
      },
      "language": {
        "type": "string",
        "enum": ["zh", "en", "pt", "all"],
        "description": "语言筛选"
      },
      "num_results": {
        "type": "integer",
        "description": "返回结果数量，默认10",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

### 方案B：搜索API + 分析的Prompt

#### System Prompt
```
你是一个专业的国网海外电力项目风险分析专家。

你的任务是分析用户提供的搜索结果，识别和评估潜在风险。

分析框架：
1. 风险识别：从搜索结果中识别风险事项
2. 风险分类：按类型分类（停电、事故、延期、财务、法律、政策等）
3. 风险评级：评估风险等级（高/中/低）
4. 影响分析：分析对项目的潜在影响
5. 应对建议：提供专业的风险应对建议

评级标准：
- 高风险：严重事故、大规模停电、重大财务损失、法律诉讼、项目停工
- 中风险：局部故障、小规模影响、潜在法律风险、进度延误
- 低风险：一般性报道、维护公告、正常运营信息

输出语言：中文
```

#### User Prompt Template
```
用户搜索关键词："{关键词}"

以下是搜索结果（共{数量}条）：

{搜索结果列表，每条包含：
- 标题
- 摘要
- 来源
- 发布时间
- URL
}

请分析这些搜索结果，按以下格式返回：

```json
{
  "search_analysis": {
    "keyword": "{关键词}",
    "total_results": 0,
    "analysis_date": "2026-01-14"
  },
  "risks": [
    {
      "id": 1,
      "title": "风险标题",
      "original_title": "原始标题",
      "source": "信息来源",
      "source_url": "原文链接",
      "publish_time": "发布时间",
      "risk_level": "高风险|中风险|低风险",
      "risk_type": "风险类型",
      "company": "涉及公司（如适用）",
      "location": "地点",
      "summary": "风险摘要（150-300字）",
      "risk_factors": [
        "风险因素1",
        "风险因素2"
      ],
      "impact_assessment": {
        "severity": "严重程度（高/中/低）",
        "scope": "影响范围",
        "duration": "持续时间",
        "financial_impact": "财务影响预估"
      },
      "recommendations": [
        "建议1",
        "建议2"
      ],
      "related_projects": [
        "相关项目（如有）"
      ]
    }
  ],
  "summary": {
    "total_risks": 0,
    "high_risk_count": 0,
    "medium_risk_count": 0,
    "low_risk_count": 0,
    "key_insights": [
      "关键洞察1",
      "关键洞察2",
      "关键洞察3"
    ],
    "geographic_distribution": {
      "巴西": 0,
      "巴基斯坦": 0,
      "菲律宾": 0,
      "其他": 0
    },
    "risk_type_distribution": {
      "停电": 0,
      "事故": 0,
      "延期": 0,
      "财务": 0,
      "法律": 0,
      "政策": 0,
      "其他": 0
    },
    "trend_analysis": "趋势分析描述",
    "urgent_actions": [
      "紧急行动1",
      "紧急行动2"
    ],
    "monitoring_recommendations": [
      "持续监控建议1",
      "持续监控建议2"
    ]
  },
  "metadata": {
    "analysis_timestamp": "2026-01-14T10:00:00Z",
    "analyst": "AI风险分析系统",
    "confidence_score": 0.85
  }
}
```

分析要点：
1. 准确识别风险事项，避免误判
2. 合理评估风险等级，不要过度保守或乐观
3. 提供可操作的建议
4. 关注时效性，优先标注最新的风险
5. 识别跨项目的系统性风险
```

### 方案C：大模型知识库搜索的Prompt（不推荐）

#### System Prompt
```
你是一个专业的国网海外电力项目风险分析助手。

虽然你无法实时访问互联网，但你可以基于训练数据中的知识，提供关于电力项目风险的专业分析。

注意事项：
1. 明确说明信息可能不是最新的
2. 建议用户验证重要信息
3. 提供通用的风险分析框架
4. 给出基于历史案例的建议

知识范围：
- 全球电力项目常见风险类型
- 不同国家的电力市场特点
- 风险管理最佳实践
- 国网海外项目经验
```

#### User Prompt
```
关键词："{关键词}"

请基于你的知识，分析与该关键词相关的电力项目风险：

1. 常见风险类型
2. 历史案例参考
3. 风险评估方法
4. 应对策略建议

重要提示：
- 你的知识截止日期是{知识截止日期}
- 无法提供最新的实时信息
- 建议用户通过其他渠道验证

请提供专业的风险分析框架和建议。
```

## API实现方案

### 方案A API设计

#### 端点：POST /api/ai-search
```typescript
interface AISearchRequest {
  keyword: string;           // 搜索关键词
  time_range?: string;       // 时间范围：day|week|month|year
  language?: string;         // 语言：zh|en|pt|all
  risk_types?: string[];     // 风险类型筛选
  companies?: string[];      // 公司筛选
  use_tools?: boolean;       // 是否使用搜索工具（默认true）
}

interface AISearchResponse {
  success: boolean;
  data: {
    search_summary: string;
    risks: Risk[];
    overall_assessment: OverallAssessment;
    metadata: {
      search_time: number;    // 搜索耗时（毫秒）
      sources_checked: number; // 检查的信息源数量
      model_used: string;     // 使用的模型
    }
  };
  error?: string;
}
```

### 方案B API设计

#### 端点1：POST /api/search
```typescript
// 先调用搜索API
interface SearchRequest {
  keyword: string;
  num_results?: number;
  time_range?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
  };
}
```

#### 端点2：POST /api/analyze-search-results
```typescript
// 然后分析搜索结果
interface AnalyzeRequest {
  keyword: string;
  search_results: SearchResult[];
}

interface AnalyzeResponse {
  success: boolean;
  data: {
    risks: Risk[];
    summary: Summary;
  };
}
```

## 推荐实现方案

### 推荐：方案A（大模型 + 搜索工具）

**理由**：
1. ✅ 一步到位，用户体验最好
2. ✅ AI自动判断是否需要搜索
3. ✅ 支持多轮对话和深度分析
4. ✅ 结果质量高且可靠

**实现步骤**：
1. 集成GenSpark AI的工具调用功能
2. 配置搜索工具（使用GenSpark内置或外部搜索API）
3. 设计详细的System Prompt
4. 实现结果解析和展示

**成本估算**：
- 单次搜索+分析：约$0.01-0.05
- 每日100次：约$1-5
- 每月3000次：约$30-150

## 下一步行动

1. **确认方案**：选择方案A、B或C
2. **选择搜索源**：
   - GenSpark内置搜索
   - Google Custom Search API
   - Bing Search API
   - SerpAPI
3. **配置API密钥**：获取必要的API密钥
4. **实现后端**：开发搜索和分析API
5. **更新前端**：修改AI搜索页面调用新API
6. **测试验证**：确保功能正常工作

## 技术栈建议

### 后端
- GenSpark AI SDK (或 OpenAI SDK)
- 搜索API客户端
- TypeScript + Hono

### 前端
- 保持现有UI
- 更新API调用逻辑
- 添加加载状态提示

---

**文档版本**：1.0  
**创建日期**：2026-01-14  
**作者**：AI Assistant  
**状态**：待确认方案
