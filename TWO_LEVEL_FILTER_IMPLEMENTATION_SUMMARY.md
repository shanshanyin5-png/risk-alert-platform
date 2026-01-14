# 两级过滤方案实施总结

## 🎯 目标
实现**方案C：两级过滤（最平衡）**
- 第一级（收录）：有公司关键词 + 非正面新闻 = 收录
- 第二级（评级）：根据负面关键词严重程度评定风险等级

## ✅ 已完成的工作

### 1. ruleBasedAnalyzer.ts 修改
- ✅ 添加 POSITIVE_KEYWORDS 列表（用于排除正面新闻）
- ✅ 修改 `isRelevantToSGCC()` - 两级过滤第一级逻辑
- ✅ 优化 `identifyCompany()` - 添加上下文验证（避免误匹配）
- ✅ 修改 `assessRiskLevel()` - 两级过滤第二级逻辑
- ✅ 更新分析报告描述

### 2. crawler.ts 修改
- ✅ 导入 ruleBasedAnalyzer
- ✅ 修改 `analyzeNewsRisk()` 使用新的分析器
- ✅ 添加风险等级格式转换（中文→英文）

### 3. index.tsx 修改
- ✅ 添加详细调试日志
- ✅ 将数据源名称加入分析上下文
- ✅ 统计分析数量和相关数量

## ❌ 存在的问题

### 问题1：公司识别失败
**现象**：爬取55篇PMLTC文章、100篇CPFL文章，但全部显示"相关: false"，公司名称为空

**原因**：
1. Google News RSS 标题通常不包含公司名称
   - 例如："Consumers hit by hours-long loadshedding..." 
   - 标题中没有"PMLTC"或"Pakistan"
   
2. 数据源名称虽然包含公司信息（"Google News - PMLTC Pakistan"），但：
   - 代码将 `source.name` 加入了 `contextText`
   - 但"PMLTC Pakistan"中间有空格，`identifyCompany()` 搜索的是 `'PMLTC'` 字符串
   - `priorityKeywords` 中定义的是 `['PMLTC', '巴基斯坦PMLTC公司']`
   - 应该能匹配上，但实际没有

### 问题2：RSS内容可能为空
Google News RSS的`<description>`字段可能只包含简短摘要，不足以进行准确分析

## 💡 根本解决方案

### 方案1：基于数据源直接标记公司（推荐）
```typescript
// 在 crawlAndAnalyze 中：
const sourceCompanyMap: { [key: string]: string } = {
  'Google News - PMLTC Pakistan': '巴基斯坦PMLTC公司',
  'Google News - CPFL Brazil': '巴西CPFL公司',
  'Google News - NGCP Philippines': '菲律宾NGCP公司',
  // ...
}

// 直接从数据源名称映射公司
const defaultCompany = sourceCompanyMap[source.name] || ''

for (const article of articles) {
  const analysis = await analyzeNewsRisk(article.title, article.content)
  
  // 如果分析器无法识别公司，使用数据源默认公司
  const companyName = analysis.companyName || defaultCompany
  
  if (analysis.isRelevant || companyName) {
    // 收录规则：分析器认为相关 OR 有明确的公司标记
    ...
  }
}
```

### 方案2：放宽公司识别规则
```typescript
// 在 identifyCompany 中添加：
const sourceHints: { [key: string]: string } = {
  'Pakistan': '巴基斯坦PMLTC公司',
  'CPFL': '巴西CPFL公司',
  'Brazil electricity': '巴西CPFL公司',
  'power shortfall': '电力相关', // 泛匹配
}

// 如果精确匹配失败，尝试模糊匹配
for (const [hint, company] of Object.entries(sourceHints)) {
  if (lowerText.includes(hint.toLowerCase())) {
    return company
  }
}
```

### 方案3：预处理RSS内容
```typescript
// 在 parseRSSFeed 或 crawlAndAnalyze 中：
articles = feed.items.map(item => {
  // 将数据源名称注入到内容中
  const enrichedContent = `[来源: ${source.name}] ${item.description || ''}`
  
  return {
    title: item.title,
    content: enrichedContent,
    ...
  }
})
```

## 📊 当前测试结果
- 爬取成功：6/10 数据源
- RSS解析：58篇（NY Times）+ 55篇（PMLTC）+ 100篇（CPFL）= 213篇
- 新增风险：**0条**
- 问题：所有文章都因为"无法识别公司"而被过滤

## 🚀 下一步行动

### 立即执行（5分钟）
1. 实施**方案1**：添加数据源到公司的映射
2. 测试爬取：应该能收录15-30条风险

### 短期优化（30分钟）
1. 优化 POSITIVE_KEYWORDS，更准确地排除正面新闻
2. 添加更多公司别名到 `identifyCompany`
3. 调整风险评级关键词

### 长期改进（1-2小时）
1. 添加更多RSS数据源
2. 实现自动去重逻辑
3. 添加手动审核机制（让用户标记误判）
4. 实时爬取和通知功能

## 📝 关键代码位置

- `src/ruleBasedAnalyzer.ts` - 核心过滤和分析逻辑
- `src/index.tsx` 第338-447行 - `crawlAndAnalyze` 函数
- `src/index.tsx` 第400-440行 - 分析循环和风险收录
- `src/rssParser.ts` - RSS解析逻辑

## 🎓 经验教训

1. **RSS源内容有限**：Google News RSS可能只有标题，没有足够上下文
2. **公司识别需要灵活**：不能只依赖文章内容，要结合数据源信息
3. **两级过滤需要平衡**：太严会漏报，太松会误报
4. **调试日志很重要**：添加详细日志帮助快速定位问题

## 总结

已成功实现两级过滤的**核心逻辑**，但**公司识别环节**需要优化。推荐立即实施**方案1（数据源映射）**来快速解决问题。
