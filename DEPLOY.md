# 🚀 快速部署指南

## 方案一：本地开发（推荐新手）

### 步骤 1：安装 Node.js
下载并安装 Node.js（版本 >= 18）：https://nodejs.org/

### 步骤 2：下载项目代码
```bash
# 如果有 Git
git clone <your-repo-url>
cd risk-alert-platform

# 或直接下载 ZIP 解压
```

### 步骤 3：安装依赖
```bash
npm install
```

### 步骤 4：初始化数据库
```bash
# 创建本地数据库并导入测试数据
npm run db:migrate:local
```

### 步骤 5：构建项目
```bash
npm run build
```

### 步骤 6：启动服务

#### 方式 A：使用 PM2（推荐）
```bash
# 安装 PM2（如果没有）
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.cjs

# 查看服务状态
pm2 list

# 查看日志
pm2 logs risk-alert-platform

# 停止服务
pm2 delete risk-alert-platform
```

#### 方式 B：直接启动
```bash
npx wrangler pages dev dist --d1=risk_alert_db --local --ip 0.0.0.0 --port 3000
```

### 步骤 7：访问应用
打开浏览器访问：http://localhost:3000

---

## 方案二：部署到 Cloudflare Pages（生产环境）

### 前置要求
- 注册 Cloudflare 账号：https://dash.cloudflare.com/sign-up
- 完成域名验证（可选）

### 步骤 1：安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 步骤 2：登录 Cloudflare
```bash
npx wrangler login
```
浏览器会自动打开，点击"授权"按钮

### 步骤 3：创建生产数据库
```bash
npx wrangler d1 create risk_alert_db
```

复制返回的 `database_id`（类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 步骤 4：更新配置文件
打开 `wrangler.jsonc`，找到这一行：
```json
"database_id": "placeholder-will-be-updated-after-creation"
```

替换为你的 `database_id`：
```json
"database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 步骤 5：应用数据库迁移
```bash
npm run db:migrate:prod
```

### 步骤 6：构建并部署
```bash
npm run deploy:prod
```

### 步骤 7：访问生产环境
部署成功后，Cloudflare 会返回访问 URL，如：
```
https://risk-alert-platform.pages.dev
```

---

## 方案三：配置通知服务（可选）

### 邮件通知（使用 Resend）

#### 步骤 1：注册 Resend
访问 https://resend.com/ 注册账号

#### 步骤 2：获取 API Key
在控制台创建 API Key

#### 步骤 3：设置环境变量

**本地开发：**
创建 `.dev.vars` 文件：
```bash
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=alert@yourdomain.com
EMAIL_TO=admin@yourdomain.com
```

**生产环境：**
```bash
npx wrangler pages secret put EMAIL_API_KEY --project-name risk-alert-platform
npx wrangler pages secret put EMAIL_FROM --project-name risk-alert-platform
npx wrangler pages secret put EMAIL_TO --project-name risk-alert-platform
```

#### 步骤 4：启用邮件发送
编辑 `src/services/notification.ts`，取消注释邮件发送代码（第 28-43 行）

### 钉钉通知

#### 步骤 1：创建钉钉机器人
1. 打开钉钉群聊
2. 点击"群设置" → "智能群助手" → "添加机器人" → "自定义"
3. 复制 Webhook URL（如：`https://oapi.dingtalk.com/robot/send?access_token=xxx`）

#### 步骤 2：设置环境变量

**本地开发：**
在 `.dev.vars` 文件添加：
```bash
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx
```

**生产环境：**
```bash
npx wrangler pages secret put DINGTALK_WEBHOOK --project-name risk-alert-platform
```

#### 步骤 3：启用钉钉发送
编辑 `src/services/notification.ts`，取消注释钉钉发送代码（第 63-78 行）

---

## 常见问题排查

### ❌ 端口被占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
fuser -k 3000/tcp
# 或
lsof -ti:3000 | xargs kill -9
```

### ❌ 依赖安装失败
```bash
# 清理缓存重装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### ❌ 数据库迁移失败
```bash
# 删除本地数据库重新创建
rm -rf .wrangler
npm run db:migrate:local
```

### ❌ 构建失败
```bash
# 检查 Node.js 版本（需要 >= 18）
node -v

# 更新依赖到最新版本
npm update
npm run build
```

### ❌ Wrangler 登录失败
```bash
# 手动登录
npx wrangler login

# 或使用 API Token
# 在 Cloudflare 控制台生成 API Token
# 设置环境变量
export CLOUDFLARE_API_TOKEN=your_token
```

---

## 性能优化建议

### 本地开发
- 使用 SSD 硬盘提升数据库读写速度
- 关闭不必要的后台程序释放内存
- 使用最新版本的 Node.js 和 npm

### 生产环境
- 配置自定义域名提升访问速度
- 启用 Cloudflare CDN 缓存静态资源
- 定期清理旧数据（超过 30 天的预警记录）
- 使用 Cloudflare Analytics 监控性能

---

## 下一步

✅ 访问监控面板查看实时数据  
✅ 点击"模拟数据更新"测试预警功能  
✅ 配置邮件/钉钉通知接收预警消息  
✅ 查看 API 文档了解接口调用方式  
✅ 阅读完整文档学习系统架构

---

**🎉 恭喜！您已成功部署实时风险预警平台！**
