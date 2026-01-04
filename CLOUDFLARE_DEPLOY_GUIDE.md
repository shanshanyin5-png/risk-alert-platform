# 🚀 Cloudflare Pages 快速部署指南

## 优势
- ✅ **最快速** - 5分钟完成
- ✅ **无需 GitHub** - 直接部署
- ✅ **保留数据** - 使用现有 D1 SQLite 数据库
- ✅ **全球 CDN** - 访问速度快
- ✅ **完全免费** - Cloudflare 免费版

---

## 📋 部署步骤

### 第一步：获取 Cloudflare API Token（3分钟）

#### 1.1 注册/登录 Cloudflare

1. 如果没有账号：访问 **https://dash.cloudflare.com/sign-up** 免费注册
2. 如果有账号：访问 **https://dash.cloudflare.com/login** 登录

#### 1.2 创建 API Token

1. 登录后，访问：**https://dash.cloudflare.com/profile/api-tokens**
2. 点击右上角蓝色按钮 **"Create Token"**
3. 找到 **"Edit Cloudflare Workers"** 模板
4. 点击右侧的 **"Use template"** 按钮
5. 在权限配置页面：
   - Account Resources: 默认选择您的账户
   - Zone Resources: 选择 "All zones" 或不修改
6. 点击底部 **"Continue to summary"**
7. 点击 **"Create Token"**
8. 📋 **复制 Token**（重要！只显示一次）

#### 1.3 配置 API Token

**在当前界面：**
1. 在左侧边栏找到 **"Deploy"** 标签
2. 点击进入部署配置
3. 找到 "Cloudflare API Token" 输入框
4. 粘贴您刚才复制的 Token
5. 点击 **"Save"** 或 **"保存"**

---

### 第二步：告诉我完成配置

配置好后，在聊天中输入：

```
已配置 Cloudflare API
```

我会自动执行以下操作：
1. ✅ 验证 API Token
2. ✅ 构建项目（npm run build）
3. ✅ 创建 Cloudflare Pages 项目
4. ✅ 创建/连接 D1 数据库
5. ✅ 部署应用
6. ✅ 给您一个永久访问地址

**预计时间：2-3分钟自动完成**

---

## 📸 图文说明

### 创建 API Token 界面

访问：https://dash.cloudflare.com/profile/api-tokens

您会看到：
- 左侧：已有的 Token 列表
- 右上角：蓝色 "Create Token" 按钮

点击 "Create Token" 后，找到：
- **Edit Cloudflare Workers** 模板
- 描述：Grants access to edit Cloudflare Workers

### Token 权限示例

使用 "Edit Cloudflare Workers" 模板会自动包含：
- Account - Cloudflare Pages: Edit
- Account - Workers Scripts: Edit
- Zone - Workers Routes: Edit

这些权限足够部署和管理应用。

---

## ❓ 常见问题

**Q: 我找不到 Deploy 标签？**
- 尝试刷新页面
- 或者直接告诉我 Token，我会手动配置

**Q: Token 创建后找不到了？**
- Token 只显示一次
- 如果丢失，删除旧 Token，重新创建一个

**Q: 需要信用卡吗？**
- 不需要！Cloudflare 免费版完全够用
- 10万次请求/天

**Q: 国内能访问吗？**
- 可以！Cloudflare 全球 CDN
- 访问速度很快

---

## 🎯 完成后您将获得

- ✅ 稳定的访问地址：`https://risk-alert-platform.pages.dev`
- ✅ 自动 HTTPS 证书
- ✅ 全球 CDN 加速
- ✅ 完整的数据库（包含现有数据）
- ✅ 24/7 在线
- ✅ 免费托管

---

## 📞 需要帮助？

如果遇到问题：
1. 确保 Token 已复制完整（没有多余空格）
2. 确保选择了正确的模板（Edit Cloudflare Workers）
3. 确保账户已验证（邮箱验证）
4. 告诉我具体错误信息，我会帮您解决

---

**准备好了吗？获取 Token 并配置好后，告诉我："已配置 Cloudflare API"** 🚀
