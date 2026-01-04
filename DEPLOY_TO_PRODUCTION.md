# 🚀 部署到 risk-alert-platform.pages.dev

## 📍 目标地址
```
https://risk-alert-platform.pages.dev/
```
这是您的**永久访问地址**，不会过期。

---

## ⚠️ 当前问题

### 生产环境状态
- ❌ 运行旧代码（只有13条风险数据）
- ❌ 缺少新功能（自动爬取、12个RSS源）
- ❌ 未修复数据源问题

### 本地环境状态
- ✅ 最新代码（54条风险数据）
- ✅ 所有功能完整（自动爬取、免费方案）
- ✅ 已修复所有问题

**需要：将本地最新代码部署到生产环境**

---

## 🎯 部署方案（3选1）

### 方案1：通过Cloudflare Dashboard（最简单）⭐

#### Step 1: 登录Cloudflare
访问：https://dash.cloudflare.com/

#### Step 2: 找到项目
1. 左侧菜单点击 **Workers & Pages**
2. 找到并点击 **risk-alert-platform**

#### Step 3: 检查GitHub连接
1. 点击 **Settings** 标签
2. 找到 **Builds & deployments** 部分
3. 确认：
   - **Source**: 应该显示连接到GitHub
   - **Repository**: `shanshanyin5-png/risk-alert-platform`
   - **Production branch**: `main`

#### Step 4: 触发部署
有3种方法：

**方法A - 自动部署（推荐）**
- 如果GitHub已连接，应该会自动检测到新提交
- 等待5-15分钟
- 在 **Deployments** 标签查看进度

**方法B - 手动触发**
- 在 **Deployments** 标签
- 点击 **Create deployment** 按钮
- 选择 **Production** 环境
- 选择 **main** 分支
- 点击 **Save and Deploy**

**方法C - Retry部署**
- 在 **Deployments** 标签
- 找到最近的部署记录
- 点击右侧的 **...** 按钮
- 选择 **Retry deployment**

#### Step 5: 等待完成
- 部署需要 **2-5分钟**
- 在 **Deployments** 标签实时查看进度
- 显示绿色 ✅ = 成功

#### Step 6: 验证
```bash
# 检查统计数据（应该有54条风险）
curl https://risk-alert-platform.pages.dev/api/statistics

# 检查数据源（应该有12个）
curl https://risk-alert-platform.pages.dev/api/datasources

# 访问主页
# 浏览器打开: https://risk-alert-platform.pages.dev/
```

---

### 方案2：通过GitHub强制触发

如果Cloudflare没有自动部署，可以通过GitHub触发：

#### Step 1: 创建空提交
```bash
cd /home/user/webapp
git commit --allow-empty -m "触发Cloudflare Pages部署"
git push origin main
```

#### Step 2: 等待自动部署
- Cloudflare Pages会检测到新提交
- 自动开始构建和部署
- 等待5-15分钟

#### Step 3: 检查部署状态
在Cloudflare Dashboard查看 **Deployments** 标签

---

### 方案3：如果有wrangler CLI

如果您能使用wrangler命令行工具：

```bash
cd /home/user/webapp

# 登录（只需一次，会打开浏览器）
npx wrangler login

# 构建
npm run build

# 部署
npx wrangler pages deploy dist --project-name risk-alert-platform
```

---

## 📋 部署后验证清单

部署成功后，请验证以下内容：

### 1. 基础功能
```bash
# 检查主页
curl -I https://risk-alert-platform.pages.dev/

# 检查统计API
curl https://risk-alert-platform.pages.dev/api/statistics

# 应该返回：totalRisks: 54+（不是13）
```

### 2. 新功能API
```bash
# 初始化RSS数据源（新功能）
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable

# 应该返回：成功初始化 12/12 个可靠RSS数据源

# 测试一键更新（新功能）
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 应该返回：成功爬取多个数据源
```

### 3. 数据源检查
```bash
# 查看数据源列表
curl https://risk-alert-platform.pages.dev/api/datasources

# 应该返回：12个RSS数据源（不是2个）
```

### 4. 前端界面
访问主页：https://risk-alert-platform.pages.dev/

- [ ] 页面正常加载
- [ ] 风险列表显示54+条数据（不是13条）
- [ ] 点击"一键更新"按钮正常工作
- [ ] 搜索和筛选功能正常

---

## ⚠️ 常见问题

### Q1: 找不到"Create deployment"按钮
**位置**：
- Cloudflare Dashboard
- Workers & Pages
- risk-alert-platform
- **Deployments** 标签
- 右上角的按钮

如果还是找不到，尝试：
- Settings → Builds & deployments → 确认 Automatic deployments 已启用
- 或等待自动部署（最多15分钟）

### Q2: 部署失败
**查看日志**：
1. Deployments 标签
2. 点击失败的部署记录
3. 查看构建日志

**常见原因**：
- 构建命令错误
- 依赖安装失败
- D1数据库配置问题

**解决方法**：
- 检查 `wrangler.jsonc` 配置
- 确认 D1 数据库已创建
- 查看具体错误信息

### Q3: 部署成功但数据还是旧的
**可能原因**：
- CDN缓存未更新
- 浏览器缓存

**解决方法**：
```bash
# 1. 清除浏览器缓存
Ctrl + Shift + R (强制刷新)

# 2. 等待1-5分钟让CDN更新

# 3. 使用curl测试（绕过缓存）
curl -H "Cache-Control: no-cache" https://risk-alert-platform.pages.dev/api/statistics
```

### Q4: D1数据库未初始化
部署成功后，数据库可能是空的，需要初始化：

```bash
# 1. 初始化RSS数据源
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable

# 2. 执行一次爬取
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 3. 查看结果
curl https://risk-alert-platform.pages.dev/api/risks?page=1&limit=10
```

---

## 🔧 关于自动爬取

### ⚠️ 重要说明
**Cloudflare Pages上无法使用PM2 Cron！**

Cloudflare Pages是**无服务器（Serverless）**环境：
- ✅ 可以运行API（按请求执行）
- ❌ 不能运行后台进程
- ❌ 不能使用PM2
- ❌ 不能使用定时任务

### 替代方案

#### 方案A：Cloudflare Workers Cron（推荐）

编辑 `wrangler.jsonc`：
```jsonc
{
  "name": "risk-alert-platform",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  
  // 添加定时触发器
  "triggers": {
    "crons": ["0 * * * *"]  // 每小时执行
  }
}
```

然后在代码中添加处理函数：
```typescript
// src/index.tsx
export default {
  async scheduled(event, env, ctx) {
    // 定时执行爬取
    console.log('Cron triggered at:', new Date());
    // 调用爬取逻辑
  }
}
```

**但是**：Cloudflare Workers Cron **需要付费计划**（$5/月起）

#### 方案B：外部定时触发器（免费）

使用免费的定时服务调用API：

**cron-job.org（免费）**
1. 注册：https://cron-job.org/
2. 创建新任务
3. URL: `https://risk-alert-platform.pages.dev/api/crawl/all`
4. 方法: POST
5. 频率: 每小时

**EasyCron（免费）**
1. 注册：https://www.easycron.com/
2. 添加Cron任务
3. URL: `https://risk-alert-platform.pages.dev/api/crawl/all`
4. 执行频率: 每小时

**GitHub Actions（免费）**
创建 `.github/workflows/auto-crawl.yml`：
```yaml
name: Auto Crawl
on:
  schedule:
    - cron: '0 * * * *'  # 每小时
  workflow_dispatch:

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger crawl
        run: |
          curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```

#### 方案C：手动触发

在前端添加"一键更新"按钮（已实现），用户手动点击更新。

---

## 📊 最终架构对比

### 本地沙盒环境
```
✅ 主服务（Hono + D1）
✅ PM2守护进程
✅ PM2 Cron定时任务
✅ 完整日志
✅ 每小时自动爬取
❌ 临时访问URL
```

### Cloudflare Pages（永久地址）
```
✅ 主服务（Hono + D1）
✅ 永久访问URL
✅ 全球CDN加速
✅ HTTPS安全
✅ 高可用性
❌ 无法运行后台进程
❌ 无法使用PM2 Cron
⚠️ 需要外部定时触发器
```

---

## 💡 推荐方案

### 短期方案（立即可用）
1. **部署到Cloudflare Pages**（获得永久URL）
2. **使用前端"一键更新"按钮**（手动触发）
3. **或使用cron-job.org**（免费定时触发）

### 长期方案（最佳）
1. **Cloudflare Pages**（主服务 + 永久URL）
2. **Cloudflare Workers Cron**（$5/月，自动定时）
3. **或GitHub Actions**（完全免费，自动定时）

---

## 🎯 立即行动

### 第1步：部署到生产环境
```
登录 Cloudflare Dashboard
→ Workers & Pages
→ risk-alert-platform
→ Deployments
→ Create deployment 或等待自动部署
```

### 第2步：验证部署
```bash
curl https://risk-alert-platform.pages.dev/api/statistics
# 应该返回：totalRisks: 54+
```

### 第3步：初始化数据
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```

### 第4步：设置自动更新（可选）
- 使用 cron-job.org 设置每小时触发
- 或暂时使用手动"一键更新"

---

**现在请访问Cloudflare Dashboard开始部署！** 🚀

**部署完成后告诉我结果，我会帮您验证和设置自动更新！**
