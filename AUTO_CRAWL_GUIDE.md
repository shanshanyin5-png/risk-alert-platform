# ⏰ 实时自动爬取配置指南

## 🎯 功能说明

实现**每小时自动爬取**所有数据源，无需手动点击"一键更新"按钮。

---

## 📋 方案架构

### 核心组件

1. **PM2 Cron** - 定时任务调度器
2. **auto_crawler.js** - 自动爬取脚本
3. **ecosystem.config.cjs** - PM2配置文件

### 执行流程

```
PM2 Cron (每小时)
    ↓
执行 auto_crawler.js
    ↓
调用 POST /api/crawl/all
    ↓
自动爬取所有数据源
    ↓
记录日志到 logs/auto_crawler.log
```

---

## 🚀 启动步骤

### 1. 安装PM2（如果还没有）

PM2已预装在沙盒中，无需安装。

### 2. 启动定时任务

```bash
cd /home/user/webapp

# 停止所有现有进程
pm2 delete all

# 启动完整服务（包含定时任务）
pm2 start ecosystem.config.cjs

# 查看运行状态
pm2 list
```

### 3. 验证定时任务

```bash
# 查看PM2进程列表
pm2 list

# 应该看到两个进程：
# - risk-alert-platform (主服务)
# - auto-crawler (定时任务)
```

---

## 📊 定时配置

### 当前配置

```javascript
cron_restart: '0 * * * *'  // 每小时的第0分钟执行
```

### 其他可选配置

```javascript
// 每30分钟执行
cron_restart: '*/30 * * * *'

// 每15分钟执行
cron_restart: '*/15 * * * *'

// 每天凌晨2点执行
cron_restart: '0 2 * * *'

// 每天早上8点和晚上8点执行
cron_restart: '0 8,20 * * *'

// 每周一早上9点执行
cron_restart: '0 9 * * 1'
```

### 修改执行频率

编辑 `ecosystem.config.cjs` 文件：

```bash
cd /home/user/webapp
vim ecosystem.config.cjs

# 修改 cron_restart 字段
# 然后重启PM2
pm2 restart all
```

---

## 📝 查看日志

### 查看定时任务日志

```bash
# 实时查看（会阻塞）
pm2 logs auto-crawler

# 查看最近日志（不阻塞）
pm2 logs auto-crawler --nostream --lines 50

# 查看详细爬取日志
cat /home/user/webapp/logs/auto_crawler.log

# 实时监控爬取日志
tail -f /home/user/webapp/logs/auto_crawler.log
```

### 日志示例

```
[2026-01-04 06:00:00] ========================================
[2026-01-04 06:00:00] 开始自动爬取任务
[2026-01-04 06:00:15] 爬取完成: 成功=6, 失败=4, 新增风险=12
[2026-01-04 06:00:15] 自动爬取任务执行成功
```

---

## 🔧 手动测试

### 测试单次执行

```bash
cd /home/user/webapp

# 手动执行一次爬取
node auto_crawler.js

# 查看输出和日志
cat logs/auto_crawler.log
```

### 验证API可访问

```bash
# 测试API是否正常
curl -X POST http://localhost:3000/api/crawl/all
```

---

## ⚙️ 高级配置

### 增加执行频率

如果需要更频繁的更新（例如每15分钟）：

```bash
cd /home/user/webapp

# 编辑配置文件
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'risk-alert-platform',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=risk_alert_db --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'auto-crawler',
      script: 'node',
      args: 'auto_crawler.js',
      cron_restart: '*/15 * * * *', // 每15分钟执行
      autorestart: false,
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
EOF

# 重启PM2
pm2 restart all
```

### 禁用自动爬取

如果需要暂时禁用：

```bash
# 只停止定时任务
pm2 stop auto-crawler

# 恢复定时任务
pm2 start auto-crawler
```

---

## 📈 监控和统计

### 查看执行统计

```bash
# PM2进程信息
pm2 info auto-crawler

# 查看重启次数（每次cron触发会重启一次）
pm2 list | grep auto-crawler
```

### 查看爬取结果

```bash
# 查看最新风险数据
curl -s "http://localhost:3000/api/statistics" | python3 -m json.tool

# 查看今日新增风险
curl -s "http://localhost:3000/api/risks?page=1&limit=10" | python3 -m json.tool | head -50
```

---

## 🐛 故障排查

### 问题1：定时任务没有执行

**检查步骤**：
```bash
# 1. 确认PM2进程运行
pm2 list

# 2. 查看错误日志
pm2 logs auto-crawler --err

# 3. 手动测试脚本
node /home/user/webapp/auto_crawler.js
```

**常见原因**：
- PM2 cron功能未启用
- API服务未运行
- 脚本路径错误

### 问题2：爬取失败

**检查步骤**：
```bash
# 1. 查看爬取日志
cat /home/user/webapp/logs/auto_crawler.log

# 2. 手动调用API
curl -X POST http://localhost:3000/api/crawl/all

# 3. 检查数据源状态
curl http://localhost:3000/api/datasources
```

**常见原因**：
- 网络问题
- RSS源不可用
- API超时

### 问题3：日志文件过大

**解决方案**：
```bash
# 清理日志（脚本会自动保留最近2000行）
rm /home/user/webapp/logs/auto_crawler.log

# 或手动截断
tail -n 1000 /home/user/webapp/logs/auto_crawler.log > /tmp/temp.log
mv /tmp/temp.log /home/user/webapp/logs/auto_crawler.log
```

---

## 💡 最佳实践

### 1. 合理设置执行频率

- **每小时**（推荐）：`0 * * * *`
  - 数据及时性：高
  - 服务器负载：低
  - 适用场景：正常监控

- **每30分钟**：`*/30 * * * *`
  - 数据及时性：很高
  - 服务器负载：中
  - 适用场景：重点监控期

- **每15分钟**：`*/15 * * * *`
  - 数据及时性：极高
  - 服务器负载：高
  - 适用场景：紧急事件响应

### 2. 监控日志大小

定期检查日志文件：
```bash
# 查看日志文件大小
ls -lh /home/user/webapp/logs/

# 如果超过10MB，考虑清理
```

### 3. 设置告警

可以扩展脚本添加失败告警：

```javascript
// 在 auto_crawler.js 中添加
if (result.data.failedCount > 5) {
  // 发送邮件/Webhook通知
  log('⚠️ 警告：爬取失败数过多！');
}
```

---

## 📊 性能指标

### 预期表现

| 指标 | 数值 |
|------|------|
| 单次执行时间 | 5-15秒 |
| CPU占用 | < 5% |
| 内存占用 | < 50MB |
| 成功率 | 60-80% |
| 每小时新增风险 | 5-20条 |

### 实际监控

```bash
# 查看实时资源占用
pm2 monit

# 查看历史统计
pm2 info auto-crawler
```

---

## 🎯 完整启动命令

```bash
# 一键启动完整服务（主服务 + 定时任务）
cd /home/user/webapp
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
pm2 list

# 查看日志
pm2 logs --nostream
```

---

## 📋 验证清单

启动后请检查：

- [ ] `pm2 list` 显示两个进程都在运行
- [ ] 等待1小时后检查 `logs/auto_crawler.log` 有新日志
- [ ] 查看风险列表有新增数据
- [ ] 手动执行 `node auto_crawler.js` 测试成功

---

## 🔮 未来优化

可以考虑的改进：

1. **智能调度**：根据数据源活跃度动态调整频率
2. **失败重试**：失败的数据源自动重试
3. **告警通知**：通过邮件/Webhook发送异常告警
4. **优先级队列**：高风险公司优先爬取
5. **增量更新**：只爬取有更新的数据源

---

**当前状态**：✅ 配置完成，等待启动  
**执行频率**：每小时1次（可调整）  
**日志位置**：`/home/user/webapp/logs/auto_crawler.log`  
**最后更新**：2026-01-04
