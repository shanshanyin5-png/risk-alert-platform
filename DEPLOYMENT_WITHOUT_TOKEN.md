# 如何更新生产环境（无需API Token）

## 🎯 目标
将最新代码部署到 https://risk-alert-platform.pages.dev/

## 📋 当前状态

**GitHub代码：** ✅ 最新 (commit edab517)
- ✅ 移除所有付费API
- ✅ 修复数据库schema
- ✅ 集成RSS2JSON代理
- ✅ 12个可靠RSS数据源

**生产环境：** ❌ 旧代码
- 数据源全部失败
- 新API不可用
- 需要更新

---

## 方法1：Cloudflare Dashboard手动部署（推荐）

### 步骤1：登录Cloudflare Dashboard

访问：https://dash.cloudflare.com/

使用您的Cloudflare账号登录

### 步骤2：进入Pages项目

1. 点击左侧菜单 **Workers & Pages**
2. 找到 **risk-alert-platform** 项目
3. 点击进入项目

### 步骤3：触发新部署

**选项A：重新部署最新commit**
1. 点击 **View builds** 或 **Deployments** 标签页
2. 找到最新的成功部署
3. 点击右侧的 **···** (三个点)
4. 选择 **Retry deployment** 或 **Redeploy**

**选项B：从设置重新部署**
1. 点击 **Settings** 标签页
2. 找到 **Build configuration**
3. 点击 **Retry deployment** 按钮

**选项C：手动上传构建产物**
1. 在本地运行：
   ```bash
   cd /home/user/webapp
   npm run build
   # 产生 dist/ 目录
   ```
2. 在Cloudflare Dashboard中：
   - 点击 **Create deployment**
   - 选择 **Direct Upload**
   - 上传 `dist` 目录

### 步骤4：等待部署完成

- 部署通常需要1-3分钟
- 可以在Deployments页面查看进度
- 部署成功后会显示绿色✅

### 步骤5：验证部署

访问以下URL确认更新：

```bash
# 1. 检查数据源API
https://risk-alert-platform.pages.dev/api/datasources

# 2. 初始化RSS源
https://risk-alert-platform.pages.dev/api/datasources/init-reliable
# 使用POST方法

# 3. 测试一键更新
https://risk-alert-platform.pages.dev/api/crawl/all  
# 使用POST方法
```

---

## 方法2：通过GitHub触发自动部署

Cloudflare Pages通常与GitHub仓库自动关联。

### 检查自动部署设置

1. 登录Cloudflare Dashboard
2. 进入 **risk-alert-platform** 项目
3. 点击 **Settings** → **Builds & deployments**
4. 确认：
   - ✅ **GitHub repository** 已连接
   - ✅ **Production branch** 设置为 `main`
   - ✅ **Automatic deployments** 已启用

### 如果自动部署未启用

1. 在Settings中找到 **Source**
2. 点击 **Connect to Git**
3. 选择GitHub仓库：`shanshanyin5-png/risk-alert-platform`
4. 设置：
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`

### 手动触发GitHub部署

如果自动部署已启用但没有触发：

1. 在Cloudflare Dashboard中
2. 进入项目的 **Deployments** 页面
3. 点击 **Manage builds**
4. 点击 **Create deployment** 并选择分支

---

## 方法3：临时解决方案（如果无法部署）

如果暂时无法部署新代码，可以通过现有API手动配置：

### 1. 清空旧数据源
```bash
# 删除所有旧数据源（通过前端或API）
DELETE https://risk-alert-platform.pages.dev/api/datasources/{id}
```

### 2. 手动添加可靠RSS源

**BBC News:**
```bash
POST https://risk-alert-platform.pages.dev/api/datasources
{
  "name": "BBC News - World",
  "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
  "category": "新闻媒体",
  "xpathRules": "//item",
  "fieldMapping": "{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}",
  "enableJS": false,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "interval": 3600,
  "timeout": 30,
  "enabled": true
}
```

重复以上步骤添加其他RSS源（见 `reliable_rss_sources.sql`）

---

## 方法4：使用Wrangler CLI（需要API Token）

如果您愿意配置Cloudflare API Token：

### 步骤1：获取API Token

1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Edit Cloudflare Workers** 模板
4. 或自定义权限：
   - Account → Cloudflare Pages → Edit
5. 创建并复制Token

### 步骤2：配置环境变量

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

或在Deploy tab中配置（系统会自动处理）

### 步骤3：部署

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name=risk-alert-platform
```

---

## 📊 部署后验证清单

部署成功后，执行以下测试：

### 1. 测试API连接
```bash
curl https://risk-alert-platform.pages.dev/api/statistics
```
预期：返回统计数据

### 2. 检查数据源
```bash
curl https://risk-alert-platform.pages.dev/api/datasources
```
预期：返回数据源列表

### 3. 初始化RSS源
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
```
预期：`{"success": true, "count": 12}`

### 4. 测试一键更新
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all
```
预期：`{"success": 6+, "failed": <4, "totalRisks": 10+}`

### 5. 查看风险列表
```bash
curl https://risk-alert-platform.pages.dev/api/risks
```
预期：返回风险列表

---

## ⚠️ 常见问题

### Q1：为什么GitHub push后没有自动部署？
**A:** 检查Cloudflare Pages的自动部署设置是否启用

### Q2：部署失败怎么办？
**A:** 查看Cloudflare Dashboard中的部署日志，找到错误原因

### Q3：我没有Cloudflare API Token怎么办？
**A:** 使用方法1（Dashboard手动部署）或方法2（GitHub自动部署）

### Q4：数据库迁移怎么处理？
**A:** 生产环境D1数据库需要单独执行迁移，但可能需要API Token

### Q5：临时解决方案会丢失数据吗？
**A:** 不会，只是手动配置数据源，不影响现有风险数据

---

## 🎯 推荐方案

**最佳方案：** 方法1（Dashboard手动部署）
- ✅ 无需API Token
- ✅ 最简单直接
- ✅ 适合单次部署

**长期方案：** 方法2（GitHub自动部署）
- ✅ 无需API Token
- ✅ 自动化
- ✅ 每次push自动更新

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 部署日志截图
2. 错误信息
3. 当前Cloudflare Pages设置截图

---

**最后更新：** 2026-01-04  
**当前代码版本：** edab517  
**状态：** ✅ 代码已准备好，等待部署
