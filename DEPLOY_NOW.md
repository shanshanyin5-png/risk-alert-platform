# 🚀 立即部署到 risk-alert-platform.pages.dev

## ✅ 代码已准备就绪

**当前状态**：
- ✅ 所有代码已完成
- ✅ 构建成功（dist/_worker.js 341.94 kB）
- ✅ 配置正确（wrangler.jsonc）
- ✅ 依赖无付费API
- ✅ 已推送到GitHub

**最后一次提交**：31c7634

---

## 📋 部署方案（自动部署）

### Cloudflare Pages会自动部署

由于您的项目已连接到GitHub，Cloudflare Pages应该会**自动检测到新提交并部署**。

---

## 🎯 您需要做的（3分钟）

### Step 1: 登录Cloudflare Dashboard
```
https://dash.cloudflare.com/
```

### Step 2: 检查部署状态

1. 左侧菜单点击：**Workers & Pages**
2. 点击项目：**risk-alert-platform**
3. 点击：**Deployments** 标签
4. 查看最新的部署记录

**如果看到正在构建**：
- 状态显示 "Building" 或 "Deploying"
- 等待2-5分钟完成
- 完成后显示绿色 ✅

**如果没有新部署**：
- 点击 **"Create deployment"** 按钮
- 选择 **Production** 环境
- 选择 **main** 分支
- 点击 **"Save and Deploy"**

---

## ✅ 部署完成后验证

### 1. 初始化数据库和数据源

部署成功后，**必须**先初始化：

```bash
# Step 1: 初始化12个RSS数据源
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable

# 应该返回：
# {"success":true,"message":"成功初始化 12/12 个可靠RSS数据源","data":{"count":12}}
```

```bash
# Step 2: 执行第一次爬取
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 应该返回：
# {"success":true,"message":"更新完成！成功: 6, 失败: 4, 新增风险: 10-50"}
```

### 2. 验证功能

```bash
# 查看统计数据
curl https://risk-alert-platform.pages.dev/api/statistics | jq

# 查看风险列表
curl "https://risk-alert-platform.pages.dev/api/risks?page=1&limit=5" | jq

# 查看数据源列表
curl https://risk-alert-platform.pages.dev/api/datasources | jq
```

### 3. 访问前端

浏览器打开：
```
https://risk-alert-platform.pages.dev/
```

应该看到：
- ✅ 风险列表（有数据）
- ✅ 统计图表
- ✅ "一键更新"按钮可用
- ✅ 搜索和筛选功能

---

## 🤖 配置自动爬取（可选，5分钟）

如果希望实现每小时自动爬取，需要配置GitHub Actions：

### Step 1: 在GitHub创建工作流文件

1. 访问：https://github.com/shanshanyin5-png/risk-alert-platform
2. 点击 **"Add file"** → **"Create new file"**
3. 文件名输入：`.github/workflows/auto-crawl.yml`
4. 粘贴以下内容：

```yaml
name: 自动爬取风险数据

on:
  schedule:
    - cron: '0 * * * *'  # 每小时执行
  workflow_dispatch:  # 允许手动触发

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: 触发爬取
        run: |
          echo "🚀 开始爬取任务 $(date)"
          response=$(curl -s -w "\n%{http_code}" -X POST \
            https://risk-alert-platform.pages.dev/api/crawl/all)
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | sed '$d')
          
          echo "状态码: $http_code"
          echo "响应: $body"
          
          if [ "$http_code" = "200" ]; then
            echo "✅ 成功"
          else
            echo "❌ 失败"
            exit 1
          fi
```

5. 点击 **"Commit new file"**

### Step 2: 启用GitHub Actions

1. 访问：https://github.com/shanshanyin5-png/risk-alert-platform/actions
2. 如有提示，点击 **"I understand my workflows, go ahead and enable them"**
3. 点击 **"自动爬取风险数据"**
4. 点击 **"Run workflow"** 测试

---

## 📊 预期结果

### 部署成功后

| 指标 | 预期值 |
|------|--------|
| 访问URL | https://risk-alert-platform.pages.dev/ |
| RSS数据源 | 12个 |
| 初始风险数 | 0条（需要执行爬取） |
| 爬取后风险数 | 10-50条 |
| 成功率 | 60-80% |
| 响应时间 | < 100ms |
| 成本 | $0/月 |

### GitHub Actions配置后

| 指标 | 预期值 |
|------|--------|
| 执行频率 | 每小时1次 |
| 每小时新增 | 5-20条 |
| 日志位置 | GitHub Actions |
| 成本 | $0/月（免费额度充足） |

---

## ⚠️ 常见问题

### Q1: 部署后看到的还是旧数据？

**原因**：数据库未初始化

**解决**：
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```

### Q2: API返回500错误？

**原因**：D1数据库未初始化或表结构不存在

**解决**：
1. 在Cloudflare Dashboard查看D1数据库
2. 确认database_id正确
3. 或在生产环境执行迁移（如果支持）

### Q3: 自动爬取不工作？

**原因**：未配置GitHub Actions

**解决**：按照上面步骤创建 `.github/workflows/auto-crawl.yml`

### Q4: 如何查看部署日志？

**位置**：
- Cloudflare Dashboard
- Workers & Pages → risk-alert-platform
- Deployments → 点击具体部署 → View details

---

## 🎯 完整检查清单

部署完成后，请确认：

- [ ] 访问 https://risk-alert-platform.pages.dev/ 页面正常
- [ ] 执行初始化RSS源命令成功
- [ ] 执行第一次爬取命令成功
- [ ] 查看统计API返回数据
- [ ] 查看风险列表有记录
- [ ] 前端"一键更新"按钮可用
- [ ] （可选）GitHub Actions工作流已创建
- [ ] （可选）手动触发Actions测试成功

---

## 📞 需要帮助？

如果遇到问题：

1. 查看Cloudflare部署日志
2. 检查API响应和错误信息
3. 确认database_id正确
4. 确认所有初始化步骤已执行

---

## 🎉 成功标志

当您看到以下内容时，说明部署成功：

✅ https://risk-alert-platform.pages.dev/ 可以访问  
✅ 统计API返回有效数据  
✅ 风险列表显示记录  
✅ "一键更新"按钮工作正常  
✅ （可选）GitHub Actions每小时自动执行  

**恭喜！您的风险预警平台已成功上线！** 🎊

---

**立即行动**：
1. 登录 Cloudflare Dashboard
2. 检查部署状态
3. 执行初始化命令
4. 开始使用！

**永久地址**：https://risk-alert-platform.pages.dev/  
**成本**：$0/月  
**维护**：完全自动化（配置GitHub Actions后）
