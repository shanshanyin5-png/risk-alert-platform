# 国网风险预警平台优化方案 - Prompt

## 📋 当前问题分析

### 1. 数据源可用性问题
**现状**：31个数据源中大部分不可用
**原因分析**：
- 跨域限制（CORS）- 无法从浏览器直接访问
- 反爬虫机制 - IP封锁、User-Agent检测
- 网站结构变化 - XPath规则失效
- 需要JavaScript渲染 - 静态爬取无法获取内容
- 付费墙/登录墙 - 需要认证才能访问

### 2. 功能缺失
- 缺少关键词搜索功能（搜索特定公司/事件）
- 缺少批量导入数据源
- 导出功能不完善
- 数据源测试功能不准确

---

## 🎯 解决方案设计

### 方案一：替换为可用的RSS/API数据源

**优势**：
- 无CORS限制
- 稳定可靠
- 结构化数据
- 易于解析

**可用数据源推荐**（40个）：

#### 国际新闻（英文）
1. **Google News RSS** - https://news.google.com/rss/search?q={keyword}
2. **Reuters RSS** - https://www.reutersagency.com/feed/
3. **Bloomberg RSS** - https://www.bloomberg.com/feed/
4. **AP News RSS** - https://rssmix.com/
5. **BBC News RSS** - http://feeds.bbci.co.uk/news/rss.xml
6. **CNN RSS** - http://rss.cnn.com/rss/edition.rss
7. **Financial Times RSS** - https://www.ft.com/rss/
8. **The Guardian RSS** - https://www.theguardian.com/world/rss
9. **WSJ RSS** - https://feeds.a.dj.com/rss/
10. **NYTimes RSS** - https://rss.nytimes.com/services/xml/rss/nyt/World.xml

#### 中国新闻（中文）
11. **新华网RSS** - http://www.xinhuanet.com/world/news_world.xml
12. **人民网RSS** - http://www.people.com.cn/rss/world.xml
13. **中新网RSS** - http://www.chinanews.com/rss/scroll-news.xml
14. **环球网RSS** - https://world.huanqiu.com/feed
15. **央视网RSS** - http://news.cctv.com/xml/

#### 行业专业媒体
16. **Power Engineering** - https://www.power-eng.com/feed/
17. **Electric Light & Power** - https://www.elp.com/feed/
18. **Utility Dive** - https://www.utilitydive.com/feeds/news/
19. **Energy Central** - https://energycentral.com/rss.xml
20. **Renewable Energy World** - https://www.renewableenergyworld.com/feed/

#### 区域媒体（南美/亚洲）
21. **巴西 - Folha de S.Paulo** - https://feeds.folha.uol.com.br/
22. **巴西 - O Globo** - https://oglobo.globo.com/rss.xml
23. **智利 - La Tercera** - https://www.latercera.com/feed/
24. **菲律宾 - Manila Bulletin** - https://mb.com.ph/feed/
25. **巴基斯坦 - Dawn** - https://www.dawn.com/feeds/

#### 政府/官方渠道
26. **国家电网官网** - http://www.sgcc.com.cn/rss（如果有）
27. **国家能源局** - http://www.nea.gov.cn/rss
28. **商务部** - http://www.mofcom.gov.cn/rss
29. **世界银行** - https://www.worldbank.org/en/rss
30. **亚洲开发银行** - https://www.adb.org/news/rss

#### 搜索引擎RSS
31. **Google News - "State Grid"** - https://news.google.com/rss/search?q=State+Grid
32. **Google News - "CPFL Brazil"** - https://news.google.com/rss/search?q=CPFL+Brazil
33. **Google News - "NGCP Philippines"** - https://news.google.com/rss/search?q=NGCP+Philippines
34. **Google News - "CGE Chile"** - https://news.google.com/rss/search?q=CGE+Chile
35. **Bing News RSS** - 支持自定义关键词

#### 社交媒体/聚合
36. **Reddit Energy** - https://www.reddit.com/r/energy.rss
37. **Twitter Lists** - 通过RSS代理访问
38. **LinkedIn Company Pages** - 通过RSS代理

#### 监管机构
39. **SEC Filings** - https://www.sec.gov/rss/
40. **各国电力监管机构** - 根据地区配置

---

### 方案二：使用RSS聚合服务

**推荐服务**：
1. **RSSHub** - 自建RSS聚合服务（开源）
   - 支持几乎所有网站
   - 自定义规则
   - 部署在Cloudflare Workers

2. **RSS.app** - 将任何网站转换为RSS
3. **FetchRSS** - 商业RSS生成服务
4. **Feed43** - 自定义RSS生成

---

### 方案三：改进爬虫策略

**技术优化**：
1. **使用代理IP池** - 避免IP封锁
2. **随机User-Agent** - 模拟真实浏览器
3. **添加延迟** - 避免触发反爬虫
4. **Cookie管理** - 保持会话状态
5. **错误重试** - 自动重试失败请求

---

## 🚀 新增功能设计

### 1. 关键词搜索增强

**前端界面**：
```
[搜索框]
  └─ 支持：公司名、关键词、时间范围
  └─ 实时搜索建议
  └─ 高级筛选器

[搜索历史]
  └─ 保存常用搜索
  └─ 一键应用
```

**后端API**：
```typescript
GET /api/risks/search?q={keyword}&company={company}&level={level}&startDate={date}&endDate={date}
```

**数据库索引优化**：
```sql
CREATE INDEX idx_risks_search ON risks(company_name, title, risk_item);
CREATE FULLTEXT INDEX idx_risks_fulltext ON risks(title, risk_item, risk_reason);
```

---

### 2. 批量导入数据源

**导入格式（Excel/CSV）**：
```csv
名称,URL,分类,XPath规则,字段映射,启用状态
新华网,http://xinhuanet.com,新闻媒体,//article,"{...}",是
路透社,http://reuters.com,新闻媒体,//article,"{...}",是
```

**前端界面**：
```
[导入按钮]
  └─ 选择文件（Excel/CSV）
  └─ 预览数据
  └─ 验证配置
  └─ 批量导入

[模板下载]
  └─ 提供标准模板
  └─ 示例数据
```

**后端API**：
```typescript
POST /api/datasources/import
Body: FormData (file)
Response: { success, imported, failed, errors }
```

---

### 3. 完善导出功能

**导出类型**：
1. **风险信息导出** ✅ 已实现
2. **数据源导出** ✅ 已实现
3. **企业列表导出** ✅ 已实现
4. **调整历史导出** ✅ 已实现
5. **搜索结果导出** 🆕 新增
6. **自定义字段导出** 🆕 新增

**导出增强**：
```typescript
// 支持多种格式
- Excel (.xlsx) ✅
- CSV (.csv) 🆕
- JSON (.json) 🆕
- PDF报告 🆕

// 支持自定义字段选择
[✓] 公司名称
[✓] 风险标题
[✓] 风险等级
[ ] 详细原因
[✓] 发布时间
```

---

### 4. 数据源测试优化

**当前问题**：
- 只测试HTTP状态码
- 不验证内容是否可解析
- 不检测CORS问题

**改进方案**：
```typescript
// 完整测试流程
1. DNS解析测试
2. HTTP连通性测试
3. CORS检测
4. 内容获取测试
5. XPath规则验证
6. 反爬虫检测
7. 性能评估

// 返回详细报告
{
  status: "success" | "warning" | "error",
  tests: {
    dns: { passed: true, time: 50 },
    http: { passed: true, status: 200, time: 500 },
    cors: { passed: false, error: "CORS blocked" },
    content: { passed: true, size: 50000 },
    xpath: { passed: true, matched: 15 },
    performance: { score: 85, recommendation: "Good" }
  }
}
```

---

## 📊 实施优先级

### P0 - 立即实施（关键功能）
1. ✅ 替换为RSS数据源（Google News RSS为主）
2. ✅ 关键词搜索功能
3. ✅ 批量导入数据源

### P1 - 近期实施（重要功能）
4. ✅ 完善导出功能（CSV/JSON）
5. ✅ 数据源测试优化
6. ✅ 搜索结果导出

### P2 - 后续实施（增强功能）
7. 📊 PDF报告生成
8. 📊 自定义爬虫规则界面
9. 📊 数据源自动修复建议

---

## 🔧 技术实现方案

### RSS解析器
```typescript
// 使用fast-xml-parser解析RSS/Atom
import { XMLParser } from 'fast-xml-parser'

async function parseRSSFeed(url: string) {
  const response = await fetch(url)
  const xml = await response.text()
  const parser = new XMLParser()
  const result = parser.parse(xml)
  
  return result.rss.channel.item.map(item => ({
    title: item.title,
    description: item.description,
    link: item.link,
    pubDate: item.pubDate
  }))
}
```

### Google News RSS搜索
```typescript
// 为每个公司创建专属RSS源
const companies = [
  'State Grid',
  'CPFL Brazil',
  'NGCP Philippines',
  'CGE Chile'
]

const rssSources = companies.map(company => ({
  name: `Google News - ${company}`,
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(company)}&hl=en-US&gl=US&ceid=US:en`,
  type: 'rss'
}))
```

### 批量导入处理
```typescript
import * as XLSX from 'xlsx'

async function importDataSources(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer())
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet)
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  }
  
  for (const row of data) {
    try {
      await insertDataSource(row)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ row, error: error.message })
    }
  }
  
  return results
}
```

---

## 📝 数据源配置模板

### RSS数据源配置
```json
{
  "sources": [
    {
      "name": "Google News - 国家电网",
      "url": "https://news.google.com/rss/search?q=国家电网+OR+State+Grid",
      "type": "rss",
      "category": "搜索引擎",
      "enabled": true,
      "updateInterval": 3600
    },
    {
      "name": "Google News - CPFL",
      "url": "https://news.google.com/rss/search?q=CPFL+Brazil+energy",
      "type": "rss",
      "category": "搜索引擎",
      "enabled": true,
      "updateInterval": 3600
    }
  ]
}
```

### 传统网站配置（备用）
```json
{
  "sources": [
    {
      "name": "新华网",
      "url": "http://www.xinhuanet.com/world/news_world.xml",
      "type": "rss",
      "category": "新闻媒体",
      "enabled": true
    }
  ]
}
```

---

## 🎯 预期效果

### 数据源改进
- ✅ 可用数据源从3个增加到30+个
- ✅ 更新成功率从10%提升到80%+
- ✅ 新闻覆盖面扩大5倍

### 功能增强
- ✅ 搜索响应时间 < 1秒
- ✅ 批量导入支持1000+条数据源
- ✅ 导出支持多种格式

### 用户体验
- ✅ 一键更新成功率 > 80%
- ✅ 操作流畅度提升
- ✅ 错误提示更清晰

---

## 📋 实施计划

### 第一阶段（2小时）
1. 创建RSS解析器模块
2. 配置Google News RSS数据源
3. 测试数据源可用性

### 第二阶段（2小时）
4. 实现关键词搜索功能
5. 添加搜索历史保存
6. 优化搜索结果展示

### 第三阶段（2小时）
7. 实现批量导入功能
8. 创建导入模板
9. 添加数据验证

### 第四阶段（1小时）
10. 完善导出功能
11. 添加CSV/JSON导出
12. 测试所有功能

**总计：约7小时完成所有优化**

---

## ✅ 验收标准

1. ✅ 至少30个RSS数据源可用
2. ✅ 关键词搜索准确率 > 95%
3. ✅ 批量导入成功率 > 90%
4. ✅ 导出功能支持3种格式
5. ✅ 一键更新成功率 > 80%
6. ✅ 所有功能完整测试通过

---

现在开始实施吗？我将按照这个计划逐步实现所有功能。
