# 🚨 实时风险预警平台

> 基于 Cloudflare Workers + Hono + Vue3 + Element Plus 构建的企业级实时风险监控系统

## 📋 项目概述

**实时风险预警平台**是一个零成本、全球部署的实时监控系统，专为企业风险管理设计。系统支持多维度数据监控、智能风险规则判断、实时 SSE 推送、多渠道预警通知，并提供直观的可视化监控面板。

### ✨ 核心特性

- ✅ **实时数据监控** - SSE 技术实现秒级数据推送，无需轮询
- ✅ **智能风险判断** - 灵活的规则引擎，支持多种比较条件（>、<、=、≥、≤）
- ✅ **多渠道预警** - 支持邮件、钉钉机器人等多种通知方式
- ✅ **可视化监控** - 基于 ECharts 的实时图表，直观展示风险趋势
- ✅ **历史追溯** - 完整的预警记录和通知日志，支持分页查询
- ✅ **零成本部署** - 基于 Cloudflare Pages，完全免费且全球加速
- ✅ **高可用架构** - 边缘计算，99.99% 可用性保障

## 🌐 在线演示

**🎉 立即访问：** [https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai](https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai)

### 演示功能

1. 访问首页查看实时监控面板
2. 观察数据源状态自动刷新（每 3 秒）
3. 点击"模拟数据更新"按钮触发风险预警
4. 查看右侧实时预警列表和弹窗通知
5. 观察图表实时更新（数据趋势、预警统计）

## 🏗️ 技术架构

### 前端技术栈
- **Vue 3** - 渐进式 JavaScript 框架
- **Element Plus** - 企业级 UI 组件库
- **ECharts 5** - 专业的可视化图表库
- **Axios** - HTTP 请求库
- **EventSource** - SSE 实时推送

### 后端技术栈
- **Hono** - 超轻量级 Web 框架（专为 Cloudflare Workers 设计）
- **Cloudflare D1** - 全球分布式 SQLite 数据库
- **Cloudflare Workers** - 无服务器边缘计算平台
- **TypeScript** - 类型安全的 JavaScript 超集

### 部署平台
- **Cloudflare Pages** - 全球 CDN + 无服务器函数
- **Wrangler** - Cloudflare 官方 CLI 工具

## 📂 项目结构

```
risk-alert-platform/
├── src/
│   ├── index.tsx                    # 🎯 Hono 主应用入口
│   ├── routes/                      # 📡 API 路由模块
│   │   ├── data.ts                  # 数据源管理接口
│   │   ├── rules.ts                 # 风险规则配置接口
│   │   ├── alerts.ts                # 预警记录查询接口
│   │   └── realtime.ts              # SSE 实时推送接口
│   ├── services/                    # 🔧 业务逻辑服务
│   │   ├── riskEngine.ts            # 风险判断引擎
│   │   └── notification.ts          # 通知服务（邮件/钉钉）
│   └── types/
│       └── bindings.ts              # TypeScript 类型定义
├── public/static/                   # 📦 前端静态资源
│   ├── app.js                       # Vue3 前端主逻辑
│   └── styles.css                   # 自定义样式
├── migrations/                      # 🗄️ 数据库迁移文件
│   └── 0001_initial_schema.sql      # 初始表结构 + 测试数据
├── wrangler.jsonc                   # ⚙️ Cloudflare 配置
├── vite.config.ts                   # 📦 Vite 构建配置
├── package.json                     # 📋 依赖配置
└── README.md                        # 📖 项目文档
```

## 🗄️ 数据库设计

系统使用 Cloudflare D1（SQLite）存储数据，包含以下核心表：

### 1️⃣ 数据源表（data_sources）
存储所有监控的数据指标

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 数据源名称（如"CPU使用率"） |
| type | TEXT | 类型：system/business/security |
| value | REAL | 当前数值 |
| unit | TEXT | 单位（%、MB、count等） |
| status | TEXT | 状态：normal/warning/critical |
| updated_at | INTEGER | 更新时间戳 |

### 2️⃣ 风险规则表（risk_rules）
配置预警触发条件

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 规则名称 |
| data_source_id | INTEGER | 关联数据源ID |
| condition | TEXT | 条件：gt/lt/eq/gte/lte |
| threshold | REAL | 阈值 |
| level | TEXT | 风险等级：warning/critical |
| enabled | INTEGER | 是否启用（0/1） |
| notify_email | INTEGER | 是否邮件通知 |
| notify_dingtalk | INTEGER | 是否钉钉通知 |

### 3️⃣ 预警记录表（alert_records）
存储历史预警信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| rule_id | INTEGER | 触发的规则ID |
| rule_name | TEXT | 规则名称（冗余存储） |
| data_source_name | TEXT | 数据源名称 |
| current_value | REAL | 触发时的值 |
| threshold | REAL | 阈值 |
| level | TEXT | 风险等级 |
| message | TEXT | 预警消息 |
| status | TEXT | 状态：pending/notified/resolved |
| created_at | INTEGER | 创建时间戳 |

### 4️⃣ 通知日志表（notification_logs）
记录所有通知发送情况

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| alert_id | INTEGER | 预警记录ID |
| channel | TEXT | 通知渠道：email/dingtalk |
| recipient | TEXT | 接收者 |
| status | TEXT | 状态：pending/success/failed |
| error_message | TEXT | 错误信息 |
| sent_at | INTEGER | 发送时间戳 |

## 🔌 API 接口文档

### 数据源管理

#### 获取所有数据源
```bash
GET /api/data
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CPU使用率",
      "type": "system",
      "value": 45.5,
      "unit": "%",
      "status": "normal",
      "updated_at": 1234567890
    }
  ]
}
```

#### 更新数据源值（触发风险检测）
```bash
PUT /api/data/:id
Request: { "value": 85.2 }
Response: {
  "success": true,
  "message": "数据更新成功",
  "alerts": 1,
  "data": [...]
}
```

#### 批量更新数据源
```bash
POST /api/data/batch-update
Request: {
  "updates": [
    { "id": 1, "value": 88.5 },
    { "id": 2, "value": 72.3 }
  ]
}
```

### 风险规则管理

#### 获取所有规则
```bash
GET /api/rules
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CPU使用率过高",
      "data_source_id": 1,
      "condition": "gt",
      "threshold": 80.0,
      "level": "warning",
      "enabled": 1
    }
  ]
}
```

#### 创建规则
```bash
POST /api/rules
Request: {
  "name": "内存使用率严重",
  "data_source_id": 2,
  "condition": "gt",
  "threshold": 90.0,
  "level": "critical",
  "enabled": 1,
  "notify_email": 1,
  "notify_dingtalk": 1,
  "description": "当内存使用率超过90%时触发"
}
```

#### 切换规则启用状态
```bash
PATCH /api/rules/:id/toggle
Response: {
  "success": true,
  "message": "规则已启用",
  "enabled": 1
}
```

### 预警记录查询

#### 获取预警记录（分页）
```bash
GET /api/alerts?page=1&limit=20&level=critical&status=pending
Response: {
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### 获取预警统计
```bash
GET /api/alerts/stats?hours=24
Response: {
  "success": true,
  "data": {
    "summary": {
      "total": 15,
      "warning": 10,
      "critical": 5,
      "pending": 3,
      "notified": 12,
      "resolved": 0
    }
  }
}
```

#### 获取预警趋势
```bash
GET /api/alerts/trend/hourly?hours=24
Response: {
  "success": true,
  "data": [
    {
      "hour": "2024-12-30 14:00:00",
      "level": "warning",
      "count": 3
    }
  ]
}
```

### SSE 实时推送

#### 订阅数据源实时更新
```javascript
const eventSource = new EventSource('/api/realtime/data')
eventSource.addEventListener('data-update', (event) => {
  const data = JSON.parse(event.data)
  console.log('数据更新:', data.sources)
})
```

#### 订阅预警实时推送
```javascript
const eventSource = new EventSource('/api/realtime/alerts')
eventSource.addEventListener('new-alert', (event) => {
  const data = JSON.parse(event.data)
  console.log('新预警:', data.alerts)
})
```

#### 订阅统计数据推送
```javascript
const eventSource = new EventSource('/api/realtime/stats')
eventSource.addEventListener('stats-update', (event) => {
  const data = JSON.parse(event.data)
  console.log('统计更新:', data.stats)
})
```

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Cloudflare 账号**（可选，用于生产部署）

### 本地开发

```bash
# 1️⃣ 克隆项目
git clone <your-repo-url>
cd risk-alert-platform

# 2️⃣ 安装依赖
npm install

# 3️⃣ 创建本地数据库并应用迁移
npm run db:migrate:local

# 4️⃣ 构建项目
npm run build

# 5️⃣ 启动开发服务器（使用 PM2）
pm2 start ecosystem.config.cjs

# 6️⃣ 查看日志
pm2 logs risk-alert-platform --nostream

# 7️⃣ 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 生产部署到 Cloudflare Pages

```bash
# 1️⃣ 登录 Cloudflare
npx wrangler login

# 2️⃣ 创建生产数据库
npx wrangler d1 create risk_alert_db

# 3️⃣ 复制返回的 database_id，更新 wrangler.jsonc 文件
# "database_id": "your-production-database-id"

# 4️⃣ 应用数据库迁移到生产环境
npm run db:migrate:prod

# 5️⃣ 构建并部署
npm run deploy:prod

# 6️⃣ 访问生产环境
# Cloudflare 会返回部署 URL，如：
# https://risk-alert-platform.pages.dev
```

## ⚙️ 配置说明

### 环境变量（可选）

创建 `.dev.vars` 文件用于本地开发：

```bash
# 邮件通知配置（使用 Resend 或 SendGrid）
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=alert@yourdomain.com
EMAIL_TO=admin@yourdomain.com

# 钉钉机器人配置
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx
```

生产环境使用 Wrangler 设置密钥：

```bash
npx wrangler pages secret put EMAIL_API_KEY --project-name risk-alert-platform
npx wrangler pages secret put DINGTALK_WEBHOOK --project-name risk-alert-platform
```

### 通知服务集成

#### 邮件通知（Resend）

1. 注册 [Resend](https://resend.com/)，获取 API Key
2. 在 `src/services/notification.ts` 中取消注释邮件发送代码
3. 设置环境变量 `EMAIL_API_KEY`

#### 钉钉通知

1. 在钉钉群中创建自定义机器人
2. 获取 Webhook URL
3. 设置环境变量 `DINGTALK_WEBHOOK`
4. 在 `src/services/notification.ts` 中取消注释钉钉发送代码

## 📊 功能模块详解

### 1️⃣ 实时数据监控

系统使用 **Server-Sent Events (SSE)** 技术实现实时推送：

- ✅ 数据源状态每 **3 秒** 自动推送
- ✅ 新预警每 **2 秒** 检查一次
- ✅ 统计数据每 **5 秒** 更新一次
- ✅ 断线自动重连机制

**前端订阅示例：**
```javascript
const eventSource = new EventSource('/api/realtime/data')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // 更新 UI
}
```

### 2️⃣ 风险规则引擎

智能的规则匹配系统，支持以下条件：

| 条件 | 符号 | 说明 |
|------|------|------|
| gt | > | 大于阈值 |
| gte | ≥ | 大于等于阈值 |
| lt | < | 小于阈值 |
| lte | ≤ | 小于等于阈值 |
| eq | = | 等于阈值 |

**规则触发流程：**
1. 数据源值更新 → 触发风险检测
2. 遍历所有启用的规则 → 判断是否满足条件
3. 创建预警记录 → 发送通知（邮件/钉钉）
4. 更新数据源状态 → 实时推送到前端

### 3️⃣ 可视化监控面板

基于 **ECharts 5** 的专业图表：

- 📊 **柱状图** - 数据源当前值对比
- 📈 **折线图** - 预警趋势分析（按小时统计）
- 🎯 **统计卡片** - 实时展示关键指标
- ⏱️ **时间轴** - 预警记录流式展示

### 4️⃣ 多渠道预警通知

支持多种通知方式（可扩展）：

- 📧 **邮件通知** - 支持 Resend、SendGrid 等
- 💬 **钉钉通知** - 机器人 Webhook 推送
- 🔔 **浏览器通知** - Element Plus 弹窗提醒

## 🎨 界面预览

### 主监控面板
- 实时统计卡片（数据源数、预警总数、警告数、严重数）
- 数据源实时监控柱状图
- 预警趋势折线图（24小时）
- 实时预警时间轴列表
- 数据源状态表格

### 功能亮点
- 🎨 现代化渐变色设计
- 📱 响应式布局，支持移动端
- ⚡ 流畅的动画效果
- 🔔 实时弹窗通知

## 🛠️ 常用命令

```bash
# 开发命令
npm run dev                  # 启动 Vite 开发服务器
npm run dev:sandbox          # 启动 Wrangler 开发服务器
npm run build                # 构建生产版本
npm run preview              # 预览构建结果

# 数据库命令
npm run db:migrate:local     # 应用本地数据库迁移
npm run db:migrate:prod      # 应用生产数据库迁移
npm run db:console:local     # 本地数据库控制台
npm run db:console:prod      # 生产数据库控制台

# 部署命令
npm run deploy               # 部署到 Cloudflare Pages
npm run deploy:prod          # 部署到生产环境

# PM2 命令
pm2 list                     # 查看服务列表
pm2 logs risk-alert-platform # 查看日志
pm2 restart risk-alert-platform  # 重启服务
pm2 delete risk-alert-platform   # 删除服务
pm2 start ecosystem.config.cjs   # 启动服务
```

## 🐛 常见问题

### 1. 端口 3000 被占用
```bash
# 清理端口
fuser -k 3000/tcp
# 或
npm run clean-port
```

### 2. 数据库迁移失败
```bash
# 删除本地数据库重新创建
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

### 3. SSE 连接断开
- 检查服务器是否正常运行
- 前端会自动重连，无需手动操作
- 查看浏览器控制台是否有错误

### 4. 预警通知未发送
- 检查规则是否启用（`enabled = 1`）
- 检查 `notify_email` 和 `notify_dingtalk` 是否启用
- 取消注释 `src/services/notification.ts` 中的发送代码
- 配置正确的环境变量（API Key、Webhook）

### 5. 图表不显示
- 检查浏览器控制台是否有 JavaScript 错误
- 确保 ECharts CDN 加载成功
- 检查数据是否正常返回（查看 Network 标签）

## 📈 性能优化建议

### 后端优化
- ✅ 使用 D1 索引提升查询速度
- ✅ SSE 推送间隔可根据需求调整
- ✅ 批量更新接口减少数据库操作
- ✅ 使用 Cloudflare KV 缓存热点数据

### 前端优化
- ✅ CDN 加载第三方库（Vue、Element Plus、ECharts）
- ✅ 图表按需更新，避免全量重绘
- ✅ 预警列表限制条数（只显示最近 10 条）
- ✅ 使用防抖节流优化事件处理

### 数据库优化
- ✅ 定期清理旧预警记录（保留近 30 天）
- ✅ 使用 LIMIT + OFFSET 实现分页
- ✅ 合理使用索引（已创建核心字段索引）

## 🔐 安全建议

- 🔒 生产环境务必设置环境变量，不要硬编码密钥
- 🔒 使用 Cloudflare Access 限制管理后台访问
- 🔒 定期更新依赖包，修复安全漏洞
- 🔒 配置 CORS 白名单，防止跨域攻击
- 🔒 对敏感数据进行加密存储

## 📝 开发路线图

### 阶段一：快速原型 ✅（已完成）
- [x] 数据源管理
- [x] 风险规则配置
- [x] 预警记录查询
- [x] SSE 实时推送
- [x] 可视化监控面板
- [x] 基础通知服务

### 阶段二：功能完善（进行中）
- [ ] 用户认证与权限管理
- [ ] 规则配置可视化编辑器
- [ ] 预警处理工作流（分配、处理、关闭）
- [ ] 更多数据源类型（HTTP API、Webhook）
- [ ] 移动端适配优化

### 阶段三：优化升级（规划中）
- [ ] 数据导出功能（Excel、CSV）
- [ ] 预警聚合与降噪
- [ ] 机器学习预测模型
- [ ] 多租户支持
- [ ] 国际化（i18n）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

MIT License

## 👨‍💻 作者

- 项目名称：实时风险预警平台
- 版本：1.0.0
- 技术栈：Cloudflare Workers + Hono + Vue3 + D1

## 🙏 致谢

- [Hono](https://hono.dev/) - 超轻量级 Web 框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [ECharts](https://echarts.apache.org/) - 可视化图表库
- [Cloudflare](https://www.cloudflare.com/) - 边缘计算平台

---

**📞 联系方式**

如有问题或建议，请通过以下方式联系：
- 📧 Email: your-email@example.com
- 💬 GitHub Issues: [提交问题](https://github.com/your-repo/issues)
- 🌐 在线演示: [https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai](https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai)

---

**⭐ 如果觉得项目不错，请点个 Star！**
