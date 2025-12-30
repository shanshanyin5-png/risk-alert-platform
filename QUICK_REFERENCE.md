# 🚀 快速参考手册

## 📍 项目信息

| 项目名称 | 实时风险预警平台 |
|---------|----------------|
| 技术栈 | Hono + Vue3 + Cloudflare D1 + ECharts |
| 数据量 | 94条真实风险数据 |
| 在线访问 | https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai |
| 本地访问 | http://localhost:3000 |
| 项目目录 | /home/user/webapp |

---

## ⚡ 常用命令速查

### 服务管理
```bash
# 启动服务
cd /home/user/webapp && npm run build && pm2 start ecosystem.config.cjs

# 查看状态
pm2 list

# 重启服务
pm2 restart risk-alert-platform

# 查看日志
pm2 logs risk-alert-platform --nostream

# 停止服务
pm2 stop risk-alert-platform
```

### 数据库操作
```bash
# 查看数据总数
npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) FROM risks"

# 查看公司分布
npx wrangler d1 execute risk_alert_db --local --command="SELECT company_name, COUNT(*) FROM risks GROUP BY company_name"

# 重置数据库
rm -rf .wrangler/state/v3/d1
npx wrangler d1 execute risk_alert_db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute risk_alert_db --local --file=./seed.sql
```

### API测试
```bash
# 统计数据
curl http://localhost:3000/api/statistics | python3 -m json.tool

# 风险列表
curl http://localhost:3000/api/risks?page=1&limit=10

# 风险详情
curl http://localhost:3000/api/risks/1

# 公司列表
curl http://localhost:3000/api/companies

# 实时数据
curl http://localhost:3000/api/realtime
```

---

## 📊 数据概览

### 风险统计
- **总风险数：** 94条
- **高风险：** 94条
- **中风险：** 0条
- **低风险：** 0条

### 公司分布 Top 5
1. 巴基斯坦PMLTC公司：31条
2. 巴西CPFL公司：17条
3. 菲律宾NGCP公司：16条
4. 智利CGE公司：15条
5. 南澳Electranet：4条

---

## 🔧 故障排查

| 问题 | 解决方案 |
|-----|---------|
| 端口被占用 | `npm run clean-port` |
| PM2启动失败 | `pm2 delete all && pm2 start ecosystem.config.cjs` |
| 数据库连接失败 | 重新初始化数据库（见上方命令） |
| 前端页面空白 | `npm run build` 重新构建 |
| 图表不显示 | 检查浏览器Console和Network |

---

## 📁 关键文件位置

| 文件 | 路径 | 说明 |
|-----|------|-----|
| 后端入口 | `/home/user/webapp/src/index.tsx` | Hono应用主文件 |
| 前端应用 | `/home/user/webapp/public/static/app.js` | Vue3应用 |
| 数据库表结构 | `/home/user/webapp/migrations/0001_initial_schema.sql` | SQL表定义 |
| 数据导入 | `/home/user/webapp/seed.sql` | 94条风险数据 |
| PM2配置 | `/home/user/webapp/ecosystem.config.cjs` | 进程管理配置 |
| Cloudflare配置 | `/home/user/webapp/wrangler.jsonc` | 部署配置 |

---

## 🌐 API端点清单

| 方法 | 路径 | 功能 | 参数 |
|-----|------|-----|------|
| GET | `/api/statistics` | 获取统计数据 | 无 |
| GET | `/api/risks` | 获取风险列表 | page, limit, company, level, keyword |
| GET | `/api/risks/:id` | 获取风险详情 | id（路径参数） |
| GET | `/api/companies` | 获取公司列表 | 无 |
| GET | `/api/realtime` | 获取实时数据 | 无 |
| POST | `/api/notify` | 发送预警通知 | type, riskId, message |

---

## 💡 开发建议

### 前端修改
编辑文件：`/home/user/webapp/public/static/app.js`
```bash
# 修改后需要重新构建
npm run build
pm2 restart risk-alert-platform
```

### 后端修改
编辑文件：`/home/user/webapp/src/index.tsx`
```bash
# 修改后需要重新构建
npm run build
pm2 restart risk-alert-platform
```

### 数据库修改
编辑文件：`/home/user/webapp/migrations/0001_initial_schema.sql`
```bash
# 需要重新应用迁移
npx wrangler d1 execute risk_alert_db --local --file=./migrations/0001_initial_schema.sql
```

---

## 📞 快速链接

- **在线访问：** https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai
- **README文档：** /home/user/webapp/README.md
- **部署指南：** /home/user/webapp/DEPLOYMENT_GUIDE.md
- **本手册：** /home/user/webapp/QUICK_REFERENCE.md

---

**创建时间：** 2025-12-30  
**项目状态：** ✅ 已完成并运行  
**维护者：** AI Assistant
