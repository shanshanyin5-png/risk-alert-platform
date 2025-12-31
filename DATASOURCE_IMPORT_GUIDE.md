# 信息源导入和人工录入使用指南

## 📋 目录
- [功能概述](#功能概述)
- [Excel信息源导入](#excel信息源导入)
- [人工录入风险信息](#人工录入风险信息)
- [API接口说明](#api接口说明)
- [数据库结构](#数据库结构)

---

## 🎯 功能概述

本次更新实现了两个核心功能：
1. **Excel信息源导入** - 从Excel文件批量导入监控网站源
2. **人工录入风险信息** - 支持手动输入和管理风险预警信息

---

## 📊 Excel信息源导入

### 导入流程

#### 1. 准备Excel文件
Excel文件格式要求：
- 第一行为表头，包含以下列：
  - `网站平台` 或 `网站名称`：网站域名或名称
  - `平台分类`（可选）：如"公司官网"、"新闻媒体"、"政府机构"等

示例：
```
网站平台          | 使用次数 | 平台分类
grupocpfl.com.br | 15       | 公司官网
cge.cl           | 5        | 公司官网
bloomberg.com    | 10       | 新闻媒体
```

#### 2. 执行导入脚本
```bash
# 在项目根目录执行
cd /home/user/webapp
node scripts/import-sources.cjs "/path/to/your/excel/file.xlsx"
```

#### 3. 导入结果
脚本会自动：
- 解析Excel文件
- 生成SQL文件：`migrations/import_news_sources.sql`
- 生成JSON文件：`data/news_sources.json`
- 打印信息源列表

#### 4. 应用到数据库
```bash
# 本地数据库
npx wrangler d1 execute risk_alert_db --local --file=migrations/import_news_sources.sql

# 生产数据库
npx wrangler d1 execute risk_alert_db --file=migrations/import_news_sources.sql
```

#### 5. 验证导入
```bash
# 查询数据源总数
npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) FROM news_sources"

# 查看前5条记录
npx wrangler d1 execute risk_alert_db --local --command="SELECT * FROM news_sources LIMIT 5"
```

### 已导入的信息源

本次从Excel导入了 **31个监控网站源**，包括：

| 类别 | 数量 | 示例 |
|------|------|------|
| 公司官网 | 3 | grupocpfl.com.br, cge.cl, ngcp.ph |
| 新闻媒体 | 15 | bloomberg.com, scmp.com, abc.net.au |
| 政府/监管机构 | 3 | botucatu.sp.gov.br, pjud.cl, sernac.cl |
| NGO/研究机构 | 3 | pcij.org, sinergiacut.org.br, pib.socioambiental.org |
| 社交媒体 | 1 | youtube.com |
| 其他 | 6 | in-cyprus.philenews.com, df.cl, powerphilippines.com |

### 数据源管理

在前端页面的 **数据源管理** 标签页中，您可以：
- 查看所有信息源列表
- 添加新的信息源
- 编辑现有信息源配置
- 删除不需要的信息源
- 测试信息源的连通性
- 导出信息源配置为Excel

---

## ✍️ 人工录入风险信息

### 功能入口
前端页面 → **人工录入** 标签页

### 录入表单

#### 必填字段
- **公司名称** - 从下拉列表选择监控的公司
- **风险标题** - 简短描述风险内容
- **风险等级** - 选择高/中/低风险

#### 可选字段
- **风险事项** - 详细描述风险内容
- **风险判定原因** - 说明为什么判定为风险
- **信息来源** - 默认为"人工录入"，可自定义
- **来源链接(URL)** - 如有原始新闻链接，可填写
- **备注** - 其他补充说明

### 操作步骤

1. **选择公司**
   - 从下拉列表选择要录入风险的公司
   - 支持10家监控企业

2. **填写风险信息**
   - 输入风险标题（必填）
   - 选择风险等级（必填）
   - 填写其他可选字段

3. **提交或重置**
   - 点击"提交"保存风险信息
   - 点击"重置"清空表单

4. **查看最近录入**
   - 页面下方显示最近录入的10条记录
   - 包含公司名称、标题、风险等级、来源、录入时间

### 使用场景

适用于以下情况：
1. 从线下渠道获得的风险信息
2. 需要补充自动采集未捕获的风险
3. 人工判断和标注的风险事件
4. 内部员工上报的风险线索

---

## 🔌 API接口说明

### 信息源管理API

#### 1. 获取信息源列表
```
GET /api/datasources
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "grupocpfl(公司官网)",
      "url": "https://grupocpfl.com.br",
      "xpathRules": "//article | //div[contains(@class, \"news\")]",
      "fieldMapping": "{\"title\":\"//h1 | //h2\",\"content\":\"//p\"}",
      "enableJS": 0,
      "userAgent": "Mozilla/5.0...",
      "interval": 3600,
      "timeout": 30,
      "enabled": 1,
      "status": "normal",
      "lastCrawlTime": null,
      "successRate": 0
    }
  ],
  "total": 31
}
```

#### 2. 新增信息源
```
POST /api/datasources
Content-Type: application/json

{
  "name": "新华网",
  "url": "https://www.xinhuanet.com",
  "xpathRules": "//div[@class='news-item']",
  "fieldMapping": "{\"title\":\"//h3\",\"content\":\"//p\"}",
  "enableJS": false,
  "userAgent": "Mozilla/5.0...",
  "interval": 3600,
  "timeout": 30,
  "enabled": true
}
```

#### 3. 更新信息源
```
PUT /api/datasources/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "url": "https://example.com",
  ...
}
```

#### 4. 删除信息源
```
DELETE /api/datasources/:id
```

### 人工录入API

#### 录入风险信息
```
POST /api/risks/manual
Content-Type: application/json

{
  "company_name": "巴基斯坦PMLTC公司",
  "title": "项目延期风险",
  "risk_item": "项目进度严重滞后",
  "risk_level": "high",
  "source": "人工录入",
  "source_url": "https://example.com/news",
  "risk_reason": "根据现场报告判断",
  "remark": "需要密切跟踪"
}
```

响应示例：
```json
{
  "success": true,
  "message": "风险信息录入成功",
  "data": {
    "id": 100,
    "company_name": "巴基斯坦PMLTC公司",
    "title": "项目延期风险",
    ...
  }
}
```

#### 查询人工录入记录
```
GET /api/risks?sourceType=manual&page=1&limit=10
```

---

## 💾 数据库结构

### news_sources 表
存储监控网站源配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 网站名称 |
| url | TEXT | 网站URL（唯一） |
| xpath_rules | TEXT | XPath选择器规则 |
| field_mapping | TEXT | 字段映射（JSON） |
| enable_js | INTEGER | 是否启用JS渲染（0/1） |
| user_agent | TEXT | User-Agent字符串 |
| interval | INTEGER | 爬取间隔（秒） |
| timeout | INTEGER | 超时时间（秒） |
| enabled | INTEGER | 是否启用（0/1） |
| status | TEXT | 状态（normal/error） |
| last_crawl_time | TEXT | 最后爬取时间 |
| success_rate | REAL | 成功率（0-100） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### risks 表更新
新增字段支持人工录入

| 字段 | 类型 | 说明 |
|------|------|------|
| source_type | TEXT | 来源类型（auto/manual） |
| source_url | TEXT | 原文链接 |

---

## 🎯 使用示例

### 示例1：导入新的信息源Excel

```bash
# 1. 准备Excel文件（格式参考上面的说明）
# 2. 执行导入
cd /home/user/webapp
node scripts/import-sources.cjs "/home/user/uploaded_files/新信息源.xlsx"

# 3. 应用到数据库
npx wrangler d1 execute risk_alert_db --local --file=migrations/import_news_sources.sql

# 4. 验证
curl http://localhost:3000/api/datasources | python3 -m json.tool
```

### 示例2：通过API添加信息源

```bash
curl -X POST http://localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "人民网",
    "url": "http://www.people.com.cn",
    "xpathRules": "//div[@class=\"news-list\"]",
    "fieldMapping": "{\"title\":\"//h3\",\"content\":\"//p\"}",
    "enableJS": false,
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "interval": 3600,
    "timeout": 30,
    "enabled": true
  }'
```

### 示例3：人工录入风险

```bash
curl -X POST http://localhost:3000/api/risks/manual \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "智利CGE公司",
    "title": "环保合规风险",
    "risk_item": "未按时提交环境影响评估报告",
    "risk_level": "medium",
    "source": "内部审计报告",
    "risk_reason": "根据合规检查发现",
    "remark": "已要求整改"
  }'
```

---

## 📈 数据统计

### 当前系统数据
- **总风险数**: 100条（94条自动采集 + 5条模拟 + 1条人工录入）
- **监控企业**: 10家
- **信息源**: 31个
- **功能标签页**: 5个
- **API接口**: 16个

### 信息源分类统计
- 公司官网: 3个
- 新闻媒体: 15个
- 政府机构: 3个
- NGO/研究机构: 3个
- 社交媒体: 1个
- 其他: 6个

---

## 🚀 下一步建议

1. **完善爬虫功能**
   - 实现基于XPath规则的实际爬取
   - 添加JS渲染支持（使用Puppeteer）
   - 处理反爬虫机制

2. **优化人工录入**
   - 添加附件上传功能
   - 支持批量导入
   - 添加审核流程

3. **增强数据源管理**
   - 自动检测信息源状态
   - 爬取任务调度
   - 爬取日志记录

4. **数据分析**
   - 信息源质量评估
   - 风险趋势分析
   - 预警准确率统计

---

## 📞 支持

如有问题或建议，请查看：
- README.md - 项目总体说明
- NEWS_MONITORING_GUIDE.md - 新闻监控系统指南
- FEATURE_UPGRADE_GUIDE.md - 功能升级指南
- USER_MANUAL.md - 用户操作手册

**在线访问**: https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai
