# 过滤逻辑优化报告

## 📋 问题描述

用户反馈：爬取的信息中包含很多与要求不符的内容，需要**只保留负面风险报道**。

## 🔍 问题分析

### 1. 当前问题（54条记录分析）

**误匹配问题（28条）：**
- ID 56-83: "Jeremy Renner accident"、"HHS lawsuit"等
- **原因**：只包含"REN"、"accident"等词就被识别为葡萄牙REN公司
- **影响**：这些完全不相关的新闻占用了51.9%的数据

**正面新闻问题（25条）：**
- CPFL任命新总裁、培训项目、100%可再生能源、投资项目等
- **原因**：只要包含公司名+任意关键词就被收录
- **影响**：这些正面新闻占用了46.3%的数据

**真正的负面报道（仅1条）：**
- ID 107: "Consumers hit by hours-long loadshedding..." (巴基斯坦停电)
- **占比**：仅占1.9%！

### 2. 过滤规则优化后的问题

**过滤太严格：**
- 爬取了213篇文章（NY Times 58 + PMLTC 55 + CPFL 100）
- 新增风险：**0条**
- **原因**：同时要求"公司关键词"+"负面关键词"+"电力上下文"

## 💡 解决方案

### 方案A：放宽过滤条件（推荐）

**调整策略：**
1. ✅ **保留公司关键词匹配** - 确保是电力公司相关
2. ❌ **移除负面关键词要求** - 不强制要求负面词
3. ✅ **添加正面新闻排除** - 主动排除明显的正面新闻

**正面新闻排除关键词：**
```typescript
const POSITIVE_KEYWORDS = [
  // 人事任命
  '任命', '晋升', '就职', 'appointed', 'promotes', 'new director', 'new president',
  
  // 成就荣誉
  '获奖', '表彰', '成功', 'award', 'recognition', 'success', 'achievement',
  
  // 投资扩张
  '投资', '扩建', '新项目', 'investment', 'expansion', 'new project',
  
  // 正面指标
  '100%', '可再生能源', '清洁能源', 'renewable', 'clean energy', 'achieve',
  
  // 培训教育
  '培训', '教育', '招聘', 'training', 'education', 'recruitment',
  
  // 社会责任
  '社会责任', '公益', '慈善', 'social responsibility', 'charity', 'community'
]
```

**新的过滤逻辑：**
```typescript
function isRelevantRiskNews(text: string): boolean {
  // 1. 必须包含公司关键词
  const company = identifyCompany(text)
  if (!company) return false
  
  // 2. 排除明显的正面新闻
  const hasPositiveKeywords = containsPositiveKeywords(text)
  if (hasPositiveKeywords) return false
  
  // 3. 如果既不是明显正面，也不是明确负面，则收录（宁可多收不能漏）
  return true
}
```

### 方案B：只排除正面，不要求负面（更宽松）

**逻辑：**
```typescript
function isRelevantNews(text: string): boolean {
  // 1. 必须是电力公司相关
  const company = identifyCompany(text)
  if (!company) return false
  
  // 2. 只排除明显的正面新闻
  const isPositive = containsPositiveKeywords(text)
  return !isPositive
}
```

**优点：**
- 不会漏掉任何可能的风险信息
- 包括中性报道（可能隐含风险）

**缺点：**
- 可能会收录一些不相关的业务报道

### 方案C：使用两级过滤（最平衡）

**第一级：宽松过滤（收录）**
- 有公司名 + 非明显正面 → 收录

**第二级：风险评级（标记）**
- 有负面关键词 → 高风险/中风险
- 无负面关键词 → 低风险/中性报道

**优点：**
- 不漏掉任何信息
- 用户可以按风险等级筛选

## 🎯 推荐实施方案

**采用方案C（两级过滤）：**

1. **收录阶段**：宽松策略
   - ✅ 包含电力公司关键词
   - ❌ 排除明显正面新闻
   - ✅ 收录所有其他新闻

2. **评级阶段**：精确标记
   - 有安全事故/停电等严重关键词 → 高风险
   - 有故障/延期等一般关键词 → 中风险
   - 无明确负面关键词 → 低风险

3. **前端展示**：
   - 默认显示：高风险 + 中风险
   - 可选显示：所有风险（包括低风险）

## 📊 预期效果

**修改前（当前）：**
- 爬取：213篇文章
- 收录：0条
- 准确率：无法评估（过滤太严）

**修改后（预期）：**
- 爬取：213篇文章
- 收录：15-30条（估计）
- 其中：
  - 高风险：5-10条
  - 中风险：5-10条
  - 低风险：5-10条

## 🔧 实施步骤

1. ✅ 添加 POSITIVE_KEYWORDS 列表
2. ✅ 修改 isRelevantToSGCC 函数
3. ✅ 优化 identifyCompany 上下文验证
4. ⏳ 构建并部署
5. ⏳ 测试爬取
6. ⏳ 验证结果

## 📝 下一步行动

请确认使用哪个方案：
- **方案A**：放宽过滤（适中）
- **方案B**：只排除正面（最宽松）
- **方案C**：两级过滤（推荐，最平衡）

确认后我将立即实施优化。
