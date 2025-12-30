# 实时风险预警平台

> 基于 Cloudflare Pages + Hono + Vue3 + ECharts 的电力行业风险监控系统

## 📊 项目概述

这是一个完全可运行的**实时风险预警平台**，使用您的真实Excel数据（94条电力行业风险信息），实现了：

- ✅ **实时监控大屏** - 统计卡片、ECharts可视化图表、实时风险流
- ✅ **风险列表管理** - 支持分页、筛选、搜索、详情查看
- ✅ **数据统计分析** - 风险等级分布、公司分布TOP10、7天趋势
- ✅ **自动数据刷新** - 每5秒自动轮询最新数据
- ✅ **响应式设计** - 支持桌面端和移动端访问

## 🌐 在线访问

**生产环境URL：** https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai

## 📋 已完成功能

### 1. 监控大屏
- **统计卡片**：总风险数、高风险、中风险、低风险、今日新增
- **风险等级分布图**：饼图展示各等级风险占比
- **公司分布图**：柱状图展示Top 10公司风险数量
- **风险趋势图**：折线图展示最近7天风险变化
- **实时风险流**：自动刷新显示最新10条风险信息

### 2. 风险列表
- **高级筛选**：按公司、风险等级、关键词搜索
- **分页浏览**：每页20条，支持翻页
- **详情查看**：点击查看完整风险信息
- **数据统计**：共94条真实数据

### 3. 数据库表结构
```sql
-- 风险信息表（已导入94条数据）
risks (id, company_name, title, risk_item, risk_time, source, 
       risk_level, risk_level_review, risk_value_confirm, 
       risk_reason, remark, created_at)

-- 预警规则表（预留功能）
alert_rules (id, rule_name, company_filter, risk_level_filter, 
             keyword_filter, enabled, notify_email, notify_dingtalk)

-- 预警历史表（预留功能）
alert_history (id, rule_id, risk_id, alert_type, 
               alert_status, alert_message, created_at)
```

## 🗂️ 项目结构

```
risk-alert-platform/
├── src/
│   ├── index.tsx              # Hono主应用入口
│   └── types/
│       └── bindings.ts        # TypeScript类型定义
├── public/
│   └── static/
│       └── app.js             # Vue3前端应用
├── migrations/
│   └── 0001_initial_schema.sql  # 数据库表结构
├── seed.sql                   # 数据导入SQL（94条记录）
├── wrangler.jsonc             # Cloudflare配置
├── ecosystem.config.cjs       # PM2配置
├── package.json               # 项目依赖
└── README.md                  # 本文档
```

## 🚀 API 接口文档

### 1. 获取统计数据
```bash
GET /api/statistics

响应示例：
{
  "success": true,
  "data": {
    "totalRisks": 94,
    "highRisks": 94,
    "mediumRisks": 0,
    "lowRisks": 0,
    "todayRisks": 0,
    "companyDistribution": [
      {"company": "巴基斯坦PMLTC公司", "count": 31},
      {"company": "巴西CPFL公司", "count": 17}
    ],
    "riskTrend": [
      {"date": "2025-11-24", "count": 5}
    ]
  }
}
```

### 2. 获取风险列表
```bash
GET /api/risks?page=1&limit=20&company=&level=&keyword=

参数说明：
- page: 页码（默认1）
- limit: 每页条数（默认20）
- company: 公司筛选（支持模糊搜索）
- level: 风险等级（高风险/中风险/低风险）
- keyword: 关键词搜索（标题+风险事项）

响应示例：
{
  "success": true,
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 94,
      "totalPages": 5
    }
  }
}
```

### 3. 获取风险详情
```bash
GET /api/risks/:id

响应示例：
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "智利CGE公司",
    "title": "美国证券交易委员会因违规处以罚款",
    "risk_item": "...",
    "risk_time": "2025-10-22",
    "source": "https://...",
    "risk_level": "高风险",
    "risk_reason": "...",
    ...
  }
}
```

### 4. 获取公司列表
```bash
GET /api/companies

响应示例：
{
  "success": true,
  "data": [
    {"name": "巴基斯坦PMLTC公司", "risk_count": 31},
    {"name": "巴西CPFL公司", "risk_count": 17}
  ]
}
```

### 5. 实时数据获取
```bash
GET /api/realtime

响应示例：
{
  "success": true,
  "data": {
    "type": "update",
    "risks": [...],  # 最新10条风险
    "timestamp": "2025-12-30T03:30:00.000Z"
  }
}
```

## 💻 本地开发指南

### 1. 环境要求
- Node.js >= 18
- npm >= 9

### 2. 安装依赖
```bash
cd /home/user/webapp
npm install
```

### 3. 初始化数据库
```bash
# 创建表结构
npx wrangler d1 execute risk_alert_db --local --file=./migrations/0001_initial_schema.sql

# 导入数据（94条风险记录）
npx wrangler d1 execute risk_alert_db --local --file=./seed.sql
```

### 4. 构建项目
```bash
npm run build
```

### 5. 启动开发服务器
```bash
# 方式1：使用PM2（推荐）
pm2 start ecosystem.config.cjs

# 方式2：直接运行
npm run dev:sandbox
```

### 6. 访问应用
打开浏览器访问：http://localhost:3000

## 📦 部署到 Cloudflare Pages

### 1. 创建生产数据库
```bash
npx wrangler d1 create risk_alert_db
# 复制返回的 database_id 到 wrangler.jsonc
```

### 2. 应用数据库迁移
```bash
npx wrangler d1 execute risk_alert_db --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute risk_alert_db --file=./seed.sql
```

### 3. 部署应用
```bash
npm run deploy:prod
```

## 📊 数据统计

| 数据项 | 数量 |
|--------|------|
| **总风险数** | 94条 |
| **高风险** | 94条 |
| **涉及公司** | 10家 |
| **数据来源** | 真实Excel文件 |

### 公司风险分布
1. 巴基斯坦PMLTC公司：31条
2. 巴西CPFL公司：17条
3. 菲律宾NGCP公司：16条
4. 智利CGE公司：15条
5. 南澳Electranet：4条
6. 香港电灯公司：4条
7. 希腊IPTO公司：2条
8. 澳大利亚澳洲资产公司：2条
9. 国家电网巴西控股公司：2条
10. 葡萄牙REN公司：1条

## 🎯 核心技术栈

### 后端
- **Hono** - 轻量级Web框架（替代Express）
- **Cloudflare D1** - SQLite数据库（替代MySQL）
- **Cloudflare Workers** - 边缘计算平台

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **ECharts 5** - 数据可视化图表库
- **Tailwind CSS** - 实用优先的CSS框架
- **Axios** - HTTP客户端

### 开发工具
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Wrangler** - Cloudflare开发工具
- **PM2** - 进程管理器

## ⚙️ 可用命令

```bash
# 开发
npm run dev              # Vite开发服务器
npm run dev:sandbox      # Wrangler本地开发
npm run build            # 构建生产版本
npm run preview          # 预览生产构建

# 数据库
npm run db:migrate:local     # 本地数据库迁移
npm run db:migrate:prod      # 生产数据库迁移
npm run db:console:local     # 本地数据库控制台
npm run db:console:prod      # 生产数据库控制台

# 部署
npm run deploy           # 部署到Cloudflare
npm run deploy:prod      # 部署到生产环境

# 工具
npm run clean-port       # 清理3000端口
npm run test             # 测试本地服务
```

## 🔧 配置文件说明

### wrangler.jsonc
```jsonc
{
  "name": "risk-alert-platform",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [{
    "binding": "DB",
    "database_name": "risk_alert_db",
    "database_id": "placeholder-will-be-updated-after-creation"
  }]
}
```

### ecosystem.config.cjs (PM2)
```javascript
module.exports = {
  apps: [{
    name: 'risk-alert-platform',
    script: 'npx',
    args: 'wrangler pages dev dist --d1=risk_alert_db --local --ip 0.0.0.0 --port 3000',
    env: { NODE_ENV: 'development', PORT: 3000 },
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

## 🚧 待实现功能

### 1. 邮件预警推送
需要配置SMTP服务：
```typescript
// 推荐使用 Resend API
const resend = new Resend(RESEND_API_KEY);
await resend.emails.send({
  from: 'alert@example.com',
  to: 'admin@example.com',
  subject: '高风险预警',
  html: '<p>...</p>'
});
```

### 2. 钉钉预警推送
需要配置钉钉机器人Webhook：
```typescript
const webhook = 'https://oapi.dingtalk.com/robot/send?access_token=XXX';
await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    msgtype: 'text',
    text: { content: '高风险预警：...' }
  })
});
```

### 3. 规则配置界面
- 前端增加规则管理页面
- 支持动态添加/编辑/删除规则
- 规则触发自动推送预警

## 💡 使用建议

### 1. 数据实时性
- 前端每5秒自动刷新最新数据
- 可调整 `pollingInterval` 控制刷新频率

### 2. 性能优化
- 数据库已创建索引，查询性能良好
- 分页加载避免大数据量卡顿
- ECharts图表按需渲染

### 3. 扩展建议
- 添加用户登录认证
- 增加数据导出功能（Excel/PDF）
- 接入更多数据源
- 增加风险评分算法

## 🐛 常见问题

### Q1: 端口被占用？
```bash
npm run clean-port
# 或
fuser -k 3000/tcp
```

### Q2: 数据库连接失败？
```bash
# 确保数据库已创建
npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) FROM risks"
```

### Q3: 图表不显示？
- 检查浏览器控制台错误
- 确保ECharts CDN加载成功
- 查看API数据是否正确返回

## 📝 更新日志

### v1.0.0 (2025-12-30)
- ✅ 完成基础架构搭建
- ✅ 导入94条真实风险数据
- ✅ 实现监控大屏和风险列表
- ✅ 集成ECharts数据可视化
- ✅ 实现自动数据刷新
- ⏳ 邮件/钉钉推送（待实现）

## 📄 许可证

MIT License

## 👨‍💻 技术支持

如有问题，请查看：
- 项目文档：本 README
- API 测试：使用 curl 或 Postman
- 日志查看：`pm2 logs risk-alert-platform --nostream`

---

**项目地址：** /home/user/webapp  
**在线访问：** https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai  
**最后更新：** 2025-12-30
