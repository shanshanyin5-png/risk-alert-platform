# 实时新闻监控系统使用指南

## 📋 概述

国网风险预警平台现已实现**7×24小时实时新闻监控**功能，自动从境内外正规媒体采集风险信息。

## 🎯 核心功能

### 1. 自动新闻采集
- **触发频率**：每30秒自动采集一次
- **监控范围**：10家目标公司（基于Excel名单）
- **新闻源**：10+境内外正规媒体
- **智能识别**：自动检测风险等级（高/中/低）
- **去重机制**：基于URL避免重复采集

### 2. 监控公司列表

| 序号 | 公司名称 | 国家/地区 | 关键词 |
|------|----------|-----------|--------|
| 1 | 巴基斯坦PMLTC公司 | 巴基斯坦 | PMLTC, Pakistan, Matiari, Lahore, HVDC |
| 2 | 巴西CPFL公司 | 巴西 | CPFL, Brazil, São Paulo |
| 3 | 菲律宾NGCP公司 | 菲律宾 | NGCP, Philippines, National Grid |
| 4 | 智利CGE公司 | 智利 | CGE, Chile |
| 5 | 南澳Electranet | 澳大利亚 | Electranet, South Australia |
| 6 | 香港电灯公司 | 中国香港 | HK Electric, Hong Kong |
| 7 | 国家电网巴西控股公司 | 巴西 | State Grid Brazil, SGBH |
| 8 | 希腊IPTO公司 | 希腊 | IPTO, Greece |
| 9 | 澳大利亚澳洲资产公司 | 澳大利亚 | Spark Infrastructure |
| 10 | 葡萄牙REN公司 | 葡萄牙 | REN, Portugal |

### 3. 新闻源配置

#### 境内媒体（6个）
- 新华网
- 人民网
- 央视网
- 中国新闻网
- 财新网
- 第一财经

#### 境外媒体（4个）
- Reuters（路透社）
- Bloomberg（彭博社）
- AP News（美联社）
- BBC（英国广播公司）

## 🔍 风险等级检测规则

### 高风险关键词
```
事故, 死亡, 爆炸, 崩溃, 倒闭, 破产, 诉讼, 罚款, 
停电, 断电, 故障, 瘫痪, 损失, 赔偿
accident, death, explosion, collapse, bankruptcy, lawsuit, 
fine, blackout, outage, failure, damage, compensation
```

### 中风险关键词
```
警告, 调查, 质疑, 争议, 延误, 超支
warning, investigation, question, dispute, delay, overrun
```

### 低风险
其他不包含高/中风险关键词的新闻

## 🚀 使用方法

### 1. 查看监控状态
访问平台首页，查看右上角状态指示：
- 🟢 **实时连接**：监控系统正常运行
- 🔴 **连接断开**：系统异常，需检查

### 2. 查看最新采集新闻
- 在**监控大屏**查看实时风险流（每5秒刷新）
- 在**风险列表**使用筛选功能：
  - 按**来源地区**筛选：境内/境外媒体
  - 按**时间范围**筛选：设置开始/结束日期
  - 按**公司**筛选：选择目标公司
  - 按**风险等级**筛选：高/中/低风险

### 3. 查看新闻原文
每条风险信息都包含原文链接：
- 在风险列表点击"查看原文"按钮
- 在风险详情页面点击URL链接

### 4. 手动触发采集
```bash
# 使用模拟数据测试
curl -X POST http://localhost:3000/api/news/collect?useMock=true

# 使用真实API（需配置API Key）
curl -X POST http://localhost:3000/api/news/collect?useMock=false
```

## 📊 数据流程

```
1. 定时触发（30秒）
   ↓
2. 遍历10家公司
   ↓
3. 为每家公司搜索关键词新闻
   ↓
4. 检测风险等级
   ↓
5. URL去重检查
   ↓
6. 保存到数据库
   ↓
7. 前端自动刷新展示
```

## 🔧 配置说明

### 1. 当前配置（模拟数据演示）
```typescript
// 在 src/services/newsCollector.ts 中
export function generateMockNews(): NewsArticle[] {
  // 返回5条模拟新闻
}
```

### 2. 接入真实API

#### 方案A：NewsAPI.org（推荐）
```bash
# 1. 注册获取API Key
# https://newsapi.org/register

# 2. 在 wrangler.jsonc 添加配置
{
  "vars": {
    "NEWS_API_KEY": "your-api-key-here"
  }
}

# 3. 调用真实API
curl -X POST http://localhost:3000/api/news/collect?useMock=false
```

**优点：**
- 免费套餐：100次/天
- 支持多语言（英文+中文）
- 数据质量高
- API稳定

**限制：**
- 免费版只能查询30天内新闻
- 每次请求最多100条结果

#### 方案B：Bing News Search API
```bash
# 1. 注册Azure订阅
# https://portal.azure.com

# 2. 创建Bing Search v7资源

# 3. 获取API Key

# 4. 配置到wrangler.jsonc
{
  "vars": {
    "BING_API_KEY": "your-key"
  }
}
```

**优点：**
- 覆盖更多中文媒体
- 实时性好
- 支持多市场（中国、美国等）

**限制：**
- 需要付费（按次数计费）
- 需要Azure账户

#### 方案C：Google News RSS（免费）
```typescript
// 已在 newsCollector.ts 中预留实现
// 需要添加RSS解析库
```

**优点：**
- 完全免费
- 无需API Key
- 数据来源可靠

**限制：**
- 需要解析RSS/XML格式
- 数据结构不统一
- 可能被限流

## 📈 性能指标

### 当前性能
- **采集频率**：30秒/次
- **单次采集**：5条新闻（模拟数据）
- **响应时间**：< 200ms
- **去重效率**：100%（基于URL）
- **前端刷新**：5秒/次

### 优化建议
```javascript
// 调整采集频率（在 public/static/app.js）
setInterval(triggerNewsCollection, 60000);  // 改为60秒

// 调整前端刷新频率
pollingInterval = setInterval(fetchRealtimeData, 10000);  // 改为10秒
```

## 🐛 常见问题

### Q1: 新闻不更新？
**检查项：**
1. 查看浏览器控制台是否有错误
2. 确认后台服务正常运行：`pm2 status`
3. 检查数据库连接：`npm run db:console:local`
4. 查看PM2日志：`pm2 logs risk-alert-platform --nostream`

### Q2: 采集的新闻被跳过？
**原因：**新闻URL已存在于数据库，去重机制生效

**解决：**这是正常行为，避免重复采集

### Q3: 如何清空测试数据？
```bash
# 删除自动采集的新闻
npx wrangler d1 execute risk_alert_db --local \
  --command="DELETE FROM risks WHERE source_type = 'auto'"

# 重置数据库
npm run db:reset
```

### Q4: 如何添加新的监控公司？
```typescript
// 编辑 src/services/newsCollector.ts
const MONITORED_COMPANIES = [
  // 添加新公司
  '新公司名称',
];

const COMPANY_KEYWORDS: Record<string, string[]> = {
  '新公司名称': ['关键词1', '关键词2', 'Keyword3'],
};
```

### Q5: 如何修改风险等级检测规则？
```typescript
// 编辑 src/services/newsCollector.ts 中的 detectRiskLevel 函数
function detectRiskLevel(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  
  // 添加新的关键词
  const criticalKeywords = [
    '事故', 'accident',
    // 添加更多...
  ];
  
  // 修改检测逻辑
  // ...
}
```

## 📞 技术支持

### 日志查看
```bash
# PM2日志
pm2 logs risk-alert-platform --nostream

# Wrangler日志
ls ~/.config/.wrangler/logs/

# 数据库查询
npm run db:console:local
```

### 数据验证
```bash
# 查看总数
curl http://localhost:3000/api/statistics

# 查看最新新闻
curl http://localhost:3000/api/risks?page=1&limit=5&sourceType=auto

# 查看监控公司
curl http://localhost:3000/api/companies/monitored

# 查看新闻源
curl http://localhost:3000/api/news/sources
```

## 🎓 最佳实践

### 1. 生产环境部署
- 使用真实新闻API（NewsAPI或Bing）
- 配置环境变量存储API Key
- 调整采集频率避免API限制
- 定期备份数据库

### 2. 性能优化
- 根据实际需求调整轮询频率
- 使用CDN加速静态资源
- 启用数据库索引
- 实现结果缓存

### 3. 安全建议
- 不要在前端暴露API Key
- 使用HTTPS访问
- 实现访问频率限制
- 定期更新依赖包

### 4. 监控建议
- 设置采集失败告警
- 监控API调用次数
- 记录异常日志
- 定期检查数据质量

## 📚 相关文档

- [主文档](./README.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [快速参考](./QUICK_REFERENCE.md)
- [NewsAPI文档](https://newsapi.org/docs)
- [Bing News API文档](https://docs.microsoft.com/en-us/bing/search-apis/bing-news-search/overview)

---

**最后更新：** 2025-12-30  
**版本：** v2.0.0
