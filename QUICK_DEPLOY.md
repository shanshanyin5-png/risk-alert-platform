# 🚀 快速部署指南

## 三步部署到 Vercel + Supabase

### 第一步：创建 Supabase 数据库（5分钟）

1. 访问 https://supabase.com，用 GitHub 登录
2. 创建新项目 `risk-alert-platform`
3. 在 SQL Editor 中执行 `supabase-schema.sql`
4. 记录 API 密钥（Settings → API）

### 第二步：推送代码到 GitHub（需要授权）

**重要**：请先在左侧边栏的 **GitHub 标签** 完成授权！

授权后告诉我："已完成 GitHub 授权"，我会自动推送代码。

### 第三步：部署到 Vercel（5分钟）

1. 访问 https://vercel.com，用 GitHub 登录
2. Import `risk-alert-platform` 项目
3. 配置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 部署！

---

## 详细说明

请查看 `VERCEL_DEPLOYMENT_GUIDE.md` 获取完整的图文教程。

---

## 你需要的账号

- GitHub: https://github.com/signup
- Supabase: https://supabase.com
- Vercel: https://vercel.com/signup

全部免费！用 GitHub 账号可以一键登录。

---

## 遇到问题？

1. 确保已完成 GitHub 授权
2. 确保 Supabase 数据库创建成功
3. 确保 Vercel 环境变量配置正确
4. 查看详细文档：`VERCEL_DEPLOYMENT_GUIDE.md`
