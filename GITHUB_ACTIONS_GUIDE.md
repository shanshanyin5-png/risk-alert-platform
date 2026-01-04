# 🤖 GitHub Actions 自动爬取方案

## ✅ 完全免费的定时自动爬取

使用GitHub Actions实现**完全免费**的每小时自动爬取，适用于Cloudflare Pages生产环境。

---

## 🎯 方案优势

| 特性 | GitHub Actions | Cloudflare Cron | PM2 Cron |
|------|----------------|-----------------|----------|
| **成本** | ✅ 免费 | ❌ $5/月 | ✅ 免费 |
| **适用环境** | ✅ Cloudflare Pages | ✅ Cloudflare Pages | ❌ 仅本地 |
| **永久URL** | ✅ 是 | ✅ 是 | ❌ 否 |
| **配置难度** | ⭐⭐☆☆☆ 简单 | ⭐⭐⭐☆☆ 中等 | ⭐☆☆☆☆ 很简单 |
| **执行频率** | 每小时 | 任意 | 任意 |
| **日志查看** | ✅ GitHub | ✅ Cloudflare | ✅ 本地 |

**推荐**：✅ GitHub Actions（免费 + 永久URL）

---

## 📋 配置步骤

### 已完成 ✅

我已经创建了配置文件：
```
.github/workflows/auto-crawl.yml
```

### 您需要做的

**1. 推送到GitHub**（启用Actions）

```bash
cd /home/user/webapp
git add .github/workflows/auto-crawl.yml
git commit -m "添加GitHub Actions自动爬取"
git push origin main
```

**2. 启用GitHub Actions**

1. 访问：https://github.com/shanshanyin5-png/risk-alert-platform
2. 点击 **Actions** 标签
3. 如果看到提示，点击 **"I understand my workflows, go ahead and enable them"**
4. 应该看到 **"自动爬取风险数据"** 工作流

**3. 测试运行**

1. 在 Actions 页面
2. 点击左侧 **"自动爬取风险数据"**
3. 点击右上角 **"Run workflow"** 按钮
4. 点击 **"Run workflow"** 确认
5. 等待几秒，刷新页面
6. 点击新创建的运行查看日志

---

## ⏰ 执行计划

### 当前配置

```yaml
schedule:
  - cron: '0 * * * *'  # 每小时的第0分钟（UTC时间）
```

### UTC时间说明

**重要**：GitHub Actions使用UTC时间（比北京时间晚8小时）

| UTC时间 | 北京时间 | 说明 |
|---------|----------|------|
| 00:00 | 08:00 | 早上8点 |
| 01:00 | 09:00 | 早上9点 |
| 02:00 | 10:00 | 早上10点 |
| ... | ... | ... |
| 16:00 | 00:00 | 午夜12点 |

当前配置：**每小时执行一次**

---

## 🔧 自定义执行频率

编辑 `.github/workflows/auto-crawl.yml`：

### 每30分钟
```yaml
schedule:
  - cron: '*/30 * * * *'
```

### 每15分钟
```yaml
schedule:
  - cron: '*/15 * * * *'
```

### 每天固定时间
```yaml
schedule:
  # 每天北京时间早上8点（UTC 00:00）
  - cron: '0 0 * * *'
  
  # 每天北京时间早上8点和晚上8点
  - cron: '0 0,12 * * *'
```

### 工作日执行
```yaml
schedule:
  # 周一到周五，每小时
  - cron: '0 * * * 1-5'
```

### 多个时间段
```yaml
schedule:
  # 工作时间（北京时间9-18点，UTC 1-10点）
  - cron: '0 1-10 * * *'
  
  # 每30分钟（仅工作时间）
  - cron: '*/30 1-10 * * *'
```

---

## 📊 查看执行日志

### 在GitHub查看

1. 访问：https://github.com/shanshanyin5-png/risk-alert-platform/actions
2. 点击 **"自动爬取风险数据"**
3. 查看最近的运行记录
4. 点击任意运行查看详细日志

### 日志示例

```
🚀 开始自动爬取任务...
时间: Sat Jan 4 06:00:00 UTC 2026
HTTP状态码: 200
响应内容: {"success":true,"data":{"successCount":6,"failedCount":4,"totalNewRisks":12}}
✅ 爬取任务执行成功
📊 任务完成时间: Sat Jan 4 06:00:15 UTC 2026
🔗 查看结果: https://risk-alert-platform.pages.dev/
```

---

## ✅ 验证自动爬取

### 方法1：查看GitHub Actions日志

1. 等待到下一个整点
2. 访问：https://github.com/shanshanyin5-png/risk-alert-platform/actions
3. 应该看到新的运行记录

### 方法2：查看生产环境数据

```bash
# 记录当前风险数
curl https://risk-alert-platform.pages.dev/api/statistics | jq '.data.totalRisks'

# 等待1小时后再次检查
curl https://risk-alert-platform.pages.dev/api/statistics | jq '.data.totalRisks'

# 应该有新增
```

### 方法3：手动触发测试

1. GitHub Actions 页面
2. 点击 **"自动爬取风险数据"**
3. 点击 **"Run workflow"**
4. 立即执行，无需等待

---

## 🔔 配置通知（可选）

### 邮件通知

GitHub会自动发送失败通知到您的注册邮箱。

### Slack/Discord通知

在工作流中添加通知步骤：

```yaml
- name: 发送通知
  if: failure()
  run: |
    curl -X POST YOUR_WEBHOOK_URL \
      -H 'Content-Type: application/json' \
      -d '{"text":"⚠️ 爬取任务失败"}'
```

---

## ⚙️ 高级配置

### 添加重试机制

```yaml
- name: 触发数据爬取（带重试）
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: |
      curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```

### 并发限制

```yaml
concurrency:
  group: auto-crawl
  cancel-in-progress: true  # 取消进行中的任务
```

### 条件执行

```yaml
# 仅在工作日执行
- name: 检查是否工作日
  id: check-weekday
  run: |
    day=$(date +%u)
    if [ $day -le 5 ]; then
      echo "is_weekday=true" >> $GITHUB_OUTPUT
    fi

- name: 触发爬取
  if: steps.check-weekday.outputs.is_weekday == 'true'
  run: |
    curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```

---

## 🐛 故障排查

### 问题1：Actions未执行

**原因**：
- GitHub Actions未启用
- 仓库设置禁用了Actions

**解决**：
1. Settings → Actions → General
2. 选择 "Allow all actions and reusable workflows"
3. 保存

### 问题2：定时任务不触发

**原因**：
- cron表达式错误
- 时区理解错误（UTC vs 北京时间）

**解决**：
- 使用 https://crontab.guru/ 验证cron表达式
- 记住UTC = 北京时间 - 8小时
- 手动触发测试 "Run workflow"

### 问题3：API调用失败

**原因**：
- Cloudflare Pages未部署
- API端点错误
- 网络问题

**解决**：
```bash
# 手动测试API
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 检查返回结果
```

### 问题4：执行时间不准确

**注意**：
- GitHub Actions有5-10分钟的延迟
- 不是精确到秒
- 负载高时可能延迟更久

**解决**：
- 这是正常现象
- 如果需要精确时间，使用外部cron服务

---

## 📊 资源限制

### GitHub Actions免费额度

| 账户类型 | 每月分钟数 | 并发任务 |
|----------|------------|----------|
| 免费账户 | 2,000分钟 | 20 |
| Pro | 3,000分钟 | 40 |

### 本项目消耗

- 单次执行：~30秒
- 每小时1次：24次/天
- 每天消耗：12分钟
- 每月消耗：**360分钟**

**远低于2,000分钟限额** ✅

---

## 🎯 最佳实践

### 1. 合理设置频率

```
推荐：每小时1次（当前配置）
可接受：每30分钟
不推荐：每5分钟（浪费资源）
```

### 2. 避免高峰时段

```yaml
# 避免在GitHub Actions高峰时段（UTC 0-2点）
schedule:
  - cron: '0 3-23 * * *'  # UTC 3-23点
```

### 3. 监控执行状态

定期检查：
- GitHub Actions运行历史
- 成功/失败率
- 执行时间趋势

---

## 📝 完整配置文件

当前配置位置：
```
/home/user/webapp/.github/workflows/auto-crawl.yml
```

已包含：
- ✅ 每小时执行
- ✅ 手动触发支持
- ✅ 错误处理
- ✅ 日志记录

---

## 🚀 立即启用

### Step 1: 推送到GitHub
```bash
cd /home/user/webapp
git add .
git commit -m "添加GitHub Actions自动爬取"
git push origin main
```

### Step 2: 访问GitHub启用
```
https://github.com/shanshanyin5-png/risk-alert-platform/actions
```

### Step 3: 手动测试
点击 "Run workflow" 立即测试

### Step 4: 等待下一个整点
系统会自动开始每小时执行

---

## 🎉 完成状态

配置完成后，您将拥有：

- ✅ 永久访问地址：https://risk-alert-platform.pages.dev/
- ✅ 每小时自动爬取
- ✅ 完全免费（$0/月）
- ✅ 完整日志记录
- ✅ 手动触发支持
- ✅ 失败自动通知

**完美的免费自动化方案！** 🎊

---

**现在立即推送代码到GitHub，启用Actions！** 🚀
