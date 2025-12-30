# 🛡️ 避坑指南 - 新手必读

## 🚨 关键技术限制

### Cloudflare Workers 环境限制

#### ❌ 不支持的功能
1. **文件系统操作**
   - ❌ 不能使用 `fs` 模块
   - ❌ 不能读写本地文件
   - ✅ 使用 D1 数据库或 KV 存储

2. **Node.js 内置模块**
   - ❌ `child_process`、`cluster`、`net`、`os` 等
   - ✅ 使用 Web 标准 API（Fetch、Crypto）

3. **长连接服务**
   - ❌ WebSocket 服务器（Socket.IO）
   - ✅ 使用 SSE（Server-Sent Events）

4. **数据库服务器**
   - ❌ 不能运行 MySQL、Redis 等服务器
   - ✅ 使用 Cloudflare D1 或第三方 API

5. **CPU 时间限制**
   - ❌ 免费版：10ms CPU 时间/请求
   - ❌ 付费版：30ms CPU 时间/请求
   - ✅ 避免复杂计算，使用异步处理

---

## 💻 开发环境常见问题

### 问题 1：端口冲突

**现象：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因：**
端口 3000 被其他程序占用

**解决方案：**
```bash
# 方案 A：杀掉占用端口的进程
fuser -k 3000/tcp 2>/dev/null || true

# 方案 B：使用其他端口
npx wrangler pages dev dist --port 3001

# 方案 C：使用 PM2 自动管理
pm2 start ecosystem.config.cjs
```

---

### 问题 2：依赖安装慢或失败

**现象：**
```
npm ERR! network timeout
```

**原因：**
网络问题或 npm 源速度慢

**解决方案：**
```bash
# 使用淘宝镜像（中国大陆用户）
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install

# 恢复官方源
npm config set registry https://registry.npmjs.org
```

---

### 问题 3：数据库文件不存在

**现象：**
```
Error: D1_ERROR: no such table: data_sources
```

**原因：**
没有执行数据库迁移

**解决方案：**
```bash
# 删除旧数据库
rm -rf .wrangler/state/v3/d1

# 重新应用迁移
npm run db:migrate:local

# 检查表是否创建成功
npm run db:console:local -- --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

### 问题 4：PM2 启动失败

**现象：**
```
[PM2] Spawning PM2 daemon failed
```

**原因：**
PM2 未安装或配置错误

**解决方案：**
```bash
# 全局安装 PM2
npm install -g pm2

# 清理 PM2 进程
pm2 kill
pm2 delete all

# 重新启动
pm2 start ecosystem.config.cjs
```

---

## 🌐 部署相关问题

### 问题 5：Wrangler 登录失败

**现象：**
```
Error: Failed to authenticate
```

**原因：**
浏览器被拦截或网络问题

**解决方案：**
```bash
# 方案 A：手动获取 API Token
# 1. 访问 https://dash.cloudflare.com/profile/api-tokens
# 2. 创建 Token（选择 Edit Cloudflare Workers 模板）
# 3. 设置环境变量
export CLOUDFLARE_API_TOKEN=your_token

# 方案 B：使用全局 API Key（不推荐）
export CLOUDFLARE_EMAIL=your_email
export CLOUDFLARE_API_KEY=your_global_api_key
```

---

### 问题 6：部署后 404 错误

**现象：**
访问 `https://your-app.pages.dev` 返回 404

**原因：**
路由配置错误或构建失败

**解决方案：**
```bash
# 检查构建输出
npm run build
ls -la dist/

# 确保 dist/ 目录包含以下文件：
# - _worker.js（必须）
# - _routes.json（可选）
# - public/ 目录中的静态文件

# 重新部署
npm run deploy:prod
```

---

### 问题 7：数据库迁移失败（生产环境）

**现象：**
```
Error: D1_ERROR: Migration failed
```

**原因：**
`database_id` 配置错误或权限不足

**解决方案：**
```bash
# 1. 检查 wrangler.jsonc 中的 database_id 是否正确
# 2. 确认数据库已创建
npx wrangler d1 list

# 3. 手动应用迁移
npx wrangler d1 migrations apply risk_alert_db --remote

# 4. 查看迁移状态
npx wrangler d1 migrations list risk_alert_db
```

---

## 🔧 功能相关问题

### 问题 8：SSE 连接频繁断开

**现象：**
浏览器控制台显示 SSE 连接不断重连

**原因：**
- Cloudflare Workers 有 CPU 时间限制
- 网络不稳定

**解决方案：**
```javascript
// 前端添加自动重连逻辑（已在 app.js 中实现）
sseDataSource.onerror = () => {
  console.warn('SSE 连接断开，5秒后重连...')
  setTimeout(() => {
    sseDataSource.close()
    connectSSE() // 重新连接
  }, 5000)
}

// 后端优化：减少推送频率
// 在 src/routes/realtime.ts 中调整 setInterval 间隔
```

---

### 问题 9：预警通知未发送

**现象：**
规则触发但没有收到邮件或钉钉消息

**原因：**
- 通知代码被注释
- 环境变量未配置
- API Key 无效

**解决方案：**
```bash
# 1. 检查 src/services/notification.ts 中的代码是否取消注释

# 2. 检查环境变量
cat .dev.vars  # 本地开发
npx wrangler pages secret list --project-name risk-alert-platform  # 生产环境

# 3. 测试 API Key 是否有效
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"

# 4. 查看通知日志
# 在数据库中查询 notification_logs 表
npm run db:console:local -- --command="SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 10;"
```

---

### 问题 10：图表不显示或显示错误

**现象：**
监控面板图表区域空白或报错

**原因：**
- ECharts 加载失败
- 数据格式错误
- DOM 元素未准备好

**解决方案：**
```javascript
// 1. 检查 ECharts CDN 是否加载成功
console.log(typeof echarts) // 应该输出 "object"

// 2. 确保在 onMounted 中初始化图表
onMounted(() => {
  initCharts() // 必须在 DOM 挂载后执行
})

// 3. 检查数据格式
console.log('数据源:', dataSources.value)
console.log('图表数据:', dataSources.value.map(s => s.value))

// 4. 手动刷新图表
if (dataChartInstance) {
  dataChartInstance.resize()
}
```

---

## 📊 性能优化建议

### 避免内存泄漏

**问题：**
长时间运行后浏览器卡顿

**解决方案：**
```javascript
// 组件卸载时清理资源（已在 app.js 中实现）
onUnmounted(() => {
  // 关闭 SSE 连接
  if (sseDataSource) sseDataSource.close()
  if (sseAlerts) sseAlerts.close()
  
  // 销毁图表实例
  if (dataChartInstance) dataChartInstance.dispose()
  if (trendChartInstance) trendChartInstance.dispose()
})
```

---

### 数据库查询优化

**问题：**
查询速度慢

**解决方案：**
```sql
-- 1. 确保索引已创建（已在迁移文件中定义）
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_alert_records_created ON alert_records(created_at);

-- 2. 使用 LIMIT 限制返回结果
SELECT * FROM alert_records ORDER BY created_at DESC LIMIT 100;

-- 3. 避免 SELECT *，只查询需要的字段
SELECT id, name, value, status FROM data_sources;

-- 4. 定期清理旧数据
DELETE FROM alert_records WHERE created_at < strftime('%s', 'now', '-30 days');
```

---

## 🔐 安全注意事项

### 不要泄露敏感信息

**❌ 错误示例：**
```javascript
// 硬编码 API Key（永远不要这样做！）
const apiKey = 're_abc123xyz456'
```

**✅ 正确做法：**
```javascript
// 从环境变量读取
const apiKey = env.EMAIL_API_KEY
```

---

### 不要提交敏感文件到 Git

**确保 `.gitignore` 包含：**
```
.env
.dev.vars
*.log
.wrangler/
node_modules/
```

**检查方法：**
```bash
git status  # 确保敏感文件不在待提交列表
```

---

## 🆘 获取帮助

### 遇到问题时的排查步骤

1. **查看日志**
   ```bash
   # PM2 日志
   pm2 logs risk-alert-platform --nostream
   
   # Wrangler 日志
   npx wrangler pages deployment tail
   ```

2. **检查数据库**
   ```bash
   # 本地数据库
   npm run db:console:local -- --command="SELECT * FROM data_sources;"
   ```

3. **测试 API**
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/data
   ```

4. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页的网络请求

5. **搜索文档**
   - README.md - 完整功能说明
   - DEPLOY.md - 部署步骤
   - TROUBLESHOOTING.md - 本文档

6. **提交 Issue**
   - GitHub Issues: [项目地址]/issues
   - 提供详细的错误信息和复现步骤

---

**💡 提示：90% 的问题都能通过查看日志和控制台输出解决！**
