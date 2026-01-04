# 国网风险预警平台 - Vercel + Supabase 部署指南

## 📋 目录
- [前置准备](#前置准备)
- [第一步：创建 Supabase 数据库](#第一步创建-supabase-数据库)
- [第二步：配置 GitHub 仓库](#第二步配置-github-仓库)
- [第三步：部署到 Vercel](#第三步部署到-vercel)
- [第四步：配置环境变量](#第四步配置环境变量)
- [第五步：导入测试数据](#第五步导入测试数据)
- [验收测试](#验收测试)

---

## 前置准备

### 需要的账号（全部免费）

1. **GitHub 账号** - https://github.com/signup
2. **Supabase 账号** - https://supabase.com
3. **Vercel 账号** - https://vercel.com/signup

> 💡 建议使用 GitHub 账号一键登录 Supabase 和 Vercel

---

## 第一步：创建 Supabase 数据库

### 1.1 登录 Supabase

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录

### 1.2 创建新项目

1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `risk-alert-platform`
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择 `Southeast Asia (Singapore)` （最接近国内）
   - **Pricing Plan**: Free（免费版）
3. 点击 "Create new project"
4. 等待 2-3 分钟，数据库创建中...

### 1.3 创建数据库表

1. 项目创建完成后，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 粘贴到 SQL 编辑器
5. 点击右下角 "Run" 按钮
6. 看到 "Success. No rows returned" 表示成功

### 1.4 获取数据库连接信息

1. 点击左侧 "Settings" (齿轮图标)
2. 点击 "API"
3. 记录以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public key**: 一长串字符
   - **service_role key**: 另一长串字符（点击眼睛图标显示）

> ⚠️ **重要**: `service_role key` 不要泄露，只在服务端使用

---

## 第二步：配置 GitHub 仓库

### 2.1 在沙箱中配置 GitHub

1. 在左侧边栏找到 **"GitHub"** 标签
2. 点击 "Authorize GitHub"
3. 按照提示完成授权

### 2.2 推送代码到 GitHub

授权完成后，告诉 AI 助手：
```
已完成 GitHub 授权，请推送代码
```

AI 会自动执行：
```bash
git remote add origin https://github.com/YOUR-USERNAME/risk-alert-platform.git
git push -u origin main
```

---

## 第三步：部署到 Vercel

### 3.1 登录 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问 GitHub

### 3.2 导入项目

1. 点击 "Add New..." → "Project"
2. 找到 `risk-alert-platform` 仓库
3. 点击 "Import"

### 3.3 配置项目

在 "Configure Project" 页面：

1. **Framework Preset**: 选择 `Other`
2. **Build Command**: 
   ```
   npm run build
   ```
3. **Output Directory**: 
   ```
   dist
   ```
4. **Install Command**: 
   ```
   npm install
   ```

5. 点击 "Deploy"
6. 等待部署完成（约 2-3 分钟）

> ⚠️ **第一次部署会失败**，这是正常的，因为还没配置环境变量

---

## 第四步：配置环境变量

### 4.1 在 Vercel 中添加环境变量

1. 部署失败后，点击项目名称进入项目页面
2. 点击顶部 "Settings"
3. 点击左侧 "Environment Variables"
4. 添加以下变量：

| Name | Value |
|------|-------|
| `SUPABASE_URL` | 你的 Supabase Project URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 Supabase service_role key |

5. 每个变量都选择 **Production, Preview, Development** 全部勾选
6. 点击 "Save"

### 4.2 重新部署

1. 点击顶部 "Deployments"
2. 点击最新的失败部署
3. 点击右上角 "..." → "Redeploy"
4. 等待部署完成

### 4.3 获取访问地址

部署成功后：
1. 你会看到 "Congratulations!" 页面
2. 访问地址类似：`https://risk-alert-platform.vercel.app`
3. 点击 "Visit" 测试访问

---

## 第五步：导入测试数据

### 5.1 导入企业数据

在 Supabase SQL Editor 中执行：

```sql
-- 插入测试企业
INSERT INTO companies (name, credit_code, current_level, risk_count) VALUES
  ('巴基斯坦PMLTC公司', '91110000000000001X', '中风险', 33),
  ('巴西CPFL公司', '91110000000000002X', '低风险', 18),
  ('菲律宾NGCP公司', '91110000000000003X', '低风险', 17),
  ('智利CGE公司', '91110000000000004X', '中风险', 15),
  ('香港电灯公司', '91110000000000005X', '低风险', 5)
ON CONFLICT (name) DO NOTHING;
```

### 5.2 导入数据源

```sql
-- 插入数据源（示例）
INSERT INTO data_sources (name, url, category, enabled) VALUES
  ('新华网', 'http://www.xinhuanet.com', '新闻媒体', true),
  ('人民网', 'http://www.people.com.cn', '新闻媒体', true),
  ('国家电网官网', 'http://www.sgcc.com.cn', '公司官网', true)
ON CONFLICT DO NOTHING;
```

### 5.3 导入风险数据

```sql
-- 插入测试风险信息
INSERT INTO risks (company_name, title, risk_item, risk_level, risk_time, source) VALUES
  ('巴基斯坦PMLTC公司', '项目延期风险', 'Matiari-Lahore HVDC 项目出现技术故障', '高风险', '2025-12-30', 'Dawn News'),
  ('巴西CPFL公司', '财务审计', '巴西CPFL公司通过年度财务审计', '低风险', '2025-12-29', 'Brazil Times'),
  ('智利CGE公司', '极端天气应对', '智利CGE公司应对极端天气挑战', '中风险', '2025-12-28', 'Santiago Times')
ON CONFLICT DO NOTHING;
```

---

## 验收测试

### ✅ 功能检查清单

访问你的 Vercel 地址，检查以下功能：

- [ ] **监控大屏**
  - [ ] 能看到企业数量统计
  - [ ] 能看到风险等级分布图表
  - [ ] 能看到最近风险列表

- [ ] **风险列表**
  - [ ] 能看到风险信息列表
  - [ ] 能按公司名称筛选
  - [ ] 能按风险等级筛选
  - [ ] 能导出 Excel

- [ ] **数据源管理**
  - [ ] 能看到数据源列表
  - [ ] 能添加新数据源
  - [ ] 能编辑数据源
  - [ ] 能导出数据源配置

- [ ] **数据录入**
  - [ ] 能手动录入风险信息
  - [ ] 公司名称是文本输入框
  - [ ] 能选择风险等级

- [ ] **风险等级调整**
  - [ ] 能看到企业列表
  - [ ] 能调整企业风险等级
  - [ ] 能查看调整历史

---

## 🎉 完成！

如果所有测试通过，恭喜你成功部署了国网风险预警平台！

### 你获得了：

- ✅ **稳定的访问地址**: `https://your-project.vercel.app`
- ✅ **全球 CDN 加速**: 访问速度快
- ✅ **免费托管**: Vercel + Supabase 免费版
- ✅ **自动 HTTPS**: 安全访问
- ✅ **PostgreSQL 数据库**: 比 SQLite 更强大
- ✅ **24/7 在线**: 永久在线，不受沙箱限制

### 绑定自定义域名（可选）

1. 在 Vercel 项目设置中点击 "Domains"
2. 输入你的域名（需要你有域名）
3. 按照提示配置 DNS
4. 等待生效

---

## 📞 遇到问题？

### 常见问题

**Q: 部署成功但页面空白？**
- 检查浏览器控制台是否有错误
- 确认环境变量配置正确
- 在 Vercel 中查看部署日志

**Q: API 请求失败？**
- 检查 Supabase 项目是否激活
- 确认数据库表已创建
- 检查环境变量中的 Key 是否正确

**Q: 数据库连接失败？**
- 在 Supabase 项目设置中确认 API URL
- 检查 service_role key 是否正确复制
- 确认没有多余的空格或换行

**Q: 国内访问慢？**
- Vercel 在国内访问速度可能受影响
- 可以考虑绑定国内 CDN
- 或者使用 Cloudflare 加速

---

## 📚 相关文档

- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Hono 文档](https://hono.dev)

---

**部署时间**: 2025-12-31  
**作者**: AI Assistant  
**版本**: 1.0
