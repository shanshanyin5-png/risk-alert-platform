# Keep-Alive 配置指南

## 目的
确保网站长期存在，避免因长期无访问而被标记为不活跃。

---

## 方案1：UptimeRobot（推荐 - 最简单）

### 步骤
1. 访问 https://uptimerobot.com/ 并注册
2. 点击 "Add New Monitor"
3. 配置：
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Risk Alert Platform
   URL: https://risk-alert-platform.pages.dev/
   Monitoring Interval: 5 minutes
   Alert Contacts: 您的邮箱
   ```
4. 保存

### 优势
- ✅ 完全免费（50个监控）
- ✅ 每5分钟检查一次
- ✅ 自动邮件通知（宕机时）
- ✅ 提供状态页面

---

## 方案2：GitHub Actions（免费 - 推荐）

### 创建文件：`.github/workflows/keep-alive.yml`

```yaml
name: Keep Website Alive

on:
  schedule:
    # 每天 00:00 UTC 运行（北京时间 08:00）
    - cron: '0 0 * * *'
  workflow_dispatch:  # 允许手动触发

jobs:
  ping:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Ping production website
        run: |
          echo "Pinging production..."
          curl -f https://risk-alert-platform.pages.dev/ || exit 1
          
      - name: Check API health
        run: |
          echo "Checking API..."
          curl -f https://risk-alert-platform.pages.dev/api/statistics || exit 1
      
      - name: Success notification
        run: |
          echo "✅ Website is alive and healthy!"
          echo "Date: $(date)"
```

### 步骤
1. 在 GitHub 仓库创建上述文件
2. 提交到 main 分支
3. GitHub Actions 会自动每天运行

### 优势
- ✅ 完全免费
- ✅ 自动运行
- ✅ 可手动触发
- ✅ 记录执行历史

---

## 方案3：Cloudflare Workers Cron（进阶）

### 创建 Worker：`keep-alive-worker.js`

```javascript
export default {
  async scheduled(event, env, ctx) {
    try {
      // Ping 网站
      const response = await fetch('https://risk-alert-platform.pages.dev/api/statistics');
      
      if (response.ok) {
        console.log('✅ Website is alive');
      } else {
        console.error('⚠️ Website returned error:', response.status);
      }
    } catch (error) {
      console.error('❌ Error pinging website:', error);
    }
  },
};
```

### Cron 触发器配置
```toml
# wrangler.toml
name = "keep-alive"
main = "keep-alive-worker.js"

[triggers]
crons = ["0 */6 * * *"]  # 每6小时运行一次
```

### 步骤
1. 创建新的 Cloudflare Worker
2. 部署代码
3. 设置 Cron 触发器

### 优势
- ✅ Cloudflare 原生支持
- ✅ 延迟极低
- ✅ 免费额度充足（每天 100,000 次）

---

## 方案4：本地 Cron Job（需要服务器）

如果您有自己的服务器：

```bash
# 添加到 crontab
crontab -e

# 每天 08:00 ping 网站
0 8 * * * curl -s https://risk-alert-platform.pages.dev/ > /dev/null
```

---

## 推荐组合方案

**最佳配置**（多层保障）：
1. ✅ **UptimeRobot**（主监控）- 5分钟间隔
2. ✅ **GitHub Actions**（备用）- 每天一次
3. ✅ **手动访问**（最后保障）- 每月一次

这样可以确保：
- 网站每5分钟被访问一次（UptimeRobot）
- 每天至少被访问一次（GitHub Actions）
- 收到宕机通知（UptimeRobot 邮件）

---

## 数据备份自动化

### 每周自动备份（GitHub Actions）

创建 `.github/workflows/backup-database.yml`：

```yaml
name: Backup Database

on:
  schedule:
    - cron: '0 2 * * 0'  # 每周日 02:00 UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install wrangler
        run: npm install -g wrangler
      
      - name: Backup database
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          DATE=$(date +%Y%m%d)
          npx wrangler d1 execute risk_alert_db --remote \
            --command="SELECT * FROM risks" --json > backup_$DATE.json
      
      - name: Upload backup as artifact
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup_*.json
          retention-days: 90
```

**说明**：
- 每周日自动备份
- 保存90天
- 需要在 GitHub Secrets 中添加 `CLOUDFLARE_API_TOKEN`

---

## 监控仪表板

访问以下链接查看网站状态：

1. **Cloudflare Dashboard**  
   https://dash.cloudflare.com/

2. **Cloudflare Analytics**  
   Pages → risk-alert-platform → Analytics

3. **UptimeRobot Dashboard**（设置后）  
   https://uptimerobot.com/dashboard

4. **GitHub Actions**（设置后）  
   https://github.com/shanshanyin5-png/risk-alert-platform/actions

---

## 紧急恢复计划

如果网站出现问题：

### 1. 代码恢复
```bash
# 从 GitHub 克隆
git clone https://github.com/shanshanyin5-png/risk-alert-platform.git
cd risk-alert-platform

# 重新部署
npm run build
npx wrangler pages deploy dist
```

### 2. 数据恢复
```bash
# 从备份恢复
npx wrangler d1 execute risk_alert_db --remote \
  --file=backup_latest.sql
```

### 3. 联系支持
- Cloudflare Support: https://www.cloudflare.com/support/
- Cloudflare Community: https://community.cloudflare.com/

---

## 总结

| 方案 | 复杂度 | 成本 | 推荐度 |
|------|--------|------|--------|
| UptimeRobot | ⭐ 简单 | 免费 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| GitHub Actions | ⭐⭐ 中等 | 免费 | ⭐⭐⭐⭐ 推荐 |
| Cloudflare Workers | ⭐⭐⭐ 复杂 | 免费 | ⭐⭐⭐ 可选 |
| 自定义域名 | ⭐⭐ 中等 | $10-15/年 | ⭐⭐⭐⭐ 推荐 |

**最小配置**：UptimeRobot（5分钟设置）  
**推荐配置**：UptimeRobot + GitHub Actions（15分钟设置）  
**完整配置**：上述所有 + 自定义域名（30分钟设置）

---

**下一步**：建议立即设置 UptimeRobot 监控，只需要5分钟！
