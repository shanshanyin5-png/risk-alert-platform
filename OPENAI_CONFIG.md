# OpenAI API 配置说明

## 📋 概述

本平台使用 OpenAI GPT-4 模型进行新闻风险智能分析，需要配置 OpenAI API Key。

## 🔑 获取 API Key

### 步骤 1：注册 OpenAI 账号
访问：https://platform.openai.com/signup

### 步骤 2：创建 API Key
1. 登录后访问：https://platform.openai.com/api-keys
2. 点击 **"Create new secret key"**
3. 给 Key 起个名字（例如：`risk-alert-platform`）
4. 复制生成的 API Key（以 `sk-` 开头）
5. ⚠️ **重要**：API Key 只显示一次，请立即保存

### 步骤 3：充值账户
1. 访问：https://platform.openai.com/account/billing/overview
2. 添加支付方式并充值（建议至少 $5）
3. GPT-4 价格：
   - 输入：$0.03 / 1K tokens
   - 输出：$0.06 / 1K tokens
   - 单次风险分析约 0.005-0.01 美元

## 🌐 配置 API Key 到 Cloudflare

### 方法一：通过命令行（推荐）

```bash
# 在本地执行
npx wrangler pages secret put OPENAI_API_KEY --project-name=risk-alert-platform

# 输入你的 API Key：sk-xxxxxxxxx
```

### 方法二：通过 Cloudflare 控制台

1. 登录 Cloudflare Dashboard：https://dash.cloudflare.com
2. 进入 **Pages** 项目：`risk-alert-platform`
3. 点击 **Settings** → **Environment variables**
4. 添加变量：
   - Variable name: `OPENAI_API_KEY`
   - Value: `sk-xxxxxxxxx`（你的 API Key）
   - Environment: **Production** 和 **Preview** 都勾选
5. 点击 **Save**

### 方法三：通过 wrangler.jsonc 配置（开发环境）

在 `.dev.vars` 文件中添加（⚠️ 不要提交到 Git）：

```bash
OPENAI_API_KEY=sk-xxxxxxxxx
```

## 🧪 测试配置

配置完成后，重新部署：

```bash
npm run build
npx wrangler pages deploy dist --project-name=risk-alert-platform
```

访问平台，点击 **"一键更新"** 按钮测试爬取功能。

## 💰 费用估算

### 按使用量计费
- 每次爬取 1 个数据源：约 100-500 个新闻
- 每条新闻分析：约 1000 tokens
- 单次完整更新（31个数据源）：约 $0.5-2
- 每天更新 1 次，月费用：约 $15-60

### 节省费用技巧
1. **减少爬取频率**：不需要每小时更新，每天 1-2 次即可
2. **过滤无关新闻**：只分析标题包含关键词的新闻
3. **使用 GPT-3.5**：成本降低 90%（修改 `src/crawler.ts` 中的模型名）
4. **缓存结果**：相同新闻不重复分析

## 🔐 安全建议

1. ✅ **DO**：使用 Cloudflare Secrets 存储 API Key
2. ✅ **DO**：定期轮换 API Key
3. ✅ **DO**：设置用量限制和告警
4. ❌ **DON'T**：不要将 API Key 提交到 Git
5. ❌ **DON'T**：不要在前端代码中暴露 API Key
6. ❌ **DON'T**：不要与他人分享 API Key

## 📊 监控用量

访问 OpenAI 控制台查看用量：https://platform.openai.com/usage

## 🐛 常见问题

### Q1：API Key 配置后不生效？
**A**：需要重新部署项目才能生效：
```bash
npm run deploy
```

### Q2：报错 "Incorrect API Key"
**A**：检查 API Key 是否正确，确保以 `sk-` 开头

### Q3：报错 "Rate limit exceeded"
**A**：超出免费额度或请求频率限制，需要充值或降低频率

### Q4：爬取速度慢
**A**：GPT-4 速度较慢，可以改用 GPT-3.5-turbo：
```typescript
// src/crawler.ts 第 145 行
model: 'gpt-3.5-turbo'  // 原来是 gpt-4-turbo
```

### Q5：想使用其他 AI 模型？
**A**：可以替换为：
- **Claude**（Anthropic）：更智能，但需要单独申请
- **Gemini**（Google）：免费额度更高
- **国内模型**：通义千问、文心一言等

## 📚 相关文档

- OpenAI API 文档：https://platform.openai.com/docs
- Cloudflare Pages 环境变量：https://developers.cloudflare.com/pages/configuration/environment-variables/
- Wrangler 密钥管理：https://developers.cloudflare.com/workers/configuration/secrets/

## 🆘 需要帮助？

如果遇到问题，请查看：
1. OpenAI API 状态页：https://status.openai.com
2. Cloudflare 状态页：https://www.cloudflarestatus.com
3. 项目 GitHub Issues：https://github.com/shanshanyin5-png/risk-alert-platform/issues
