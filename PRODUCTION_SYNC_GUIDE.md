# 生产环境同步指南

## 问题说明

您登录后看不到更改的原因是：**本地环境和生产环境使用的是不同的数据库**。

### 环境对比

| 环境 | 数据库位置 | 数据源数量 | 状态 |
|------|-----------|----------|------|
| **本地沙盒** | `.wrangler/state/v3/d1/` | 12个 | ✅ 已修复 |
| **生产环境** | Cloudflare D1 (远程) | 32个 | ❌ 需要同步 |

### 本地环境（沙盒）
- 10个RSS新闻源（BBC, CNN, NYT, Google News等）
- 2个已禁用（Reuters、新华网英文）
- ✅ **修改已生效**：100%爬取成功

### 生产环境（您看到的）
- 32个数据源（公司官网、中文媒体、政府网站等）
- 24个从未爬取过
- ❌ **修改未生效**：仍受20个数量限制

## 解决方案

### 步骤1：配置Cloudflare API密钥

**在Deploy标签页完成以下操作**：
1. 进入 **Deploy** 标签
2. 按照指引创建 Cloudflare API Token
3. 保存API密钥

### 步骤2：重新部署代码

配置好API密钥后，运行以下命令：

```bash
# 1. 构建生产版本
cd /home/user/webapp && npm run build

# 2. 部署到Cloudflare Pages
npx wrangler pages deploy dist --project-name risk-alert-platform
```

### 步骤3：验证部署

部署成功后，检查生产环境：

```bash
# 触发一键爬取
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 查看数据源状态
curl https://risk-alert-platform.pages.dev/api/datasources | jq '.data[] | {id, name, lastCrawlTime}'
```

## 预期效果

部署后，生产环境将：
- ✅ 支持爬取最多20个数据源（之前只能10个）
- ✅ 更多数据源可以被爬取
- ✅ 数据源列表会显示更新的lastCrawlTime

## 当前代码改动

### 文件: `src/index.tsx` (第528行)

```typescript
// 修改前
const sourcesToCrawl = (sources.results || []).slice(0, 10)

// 修改后
const sourcesToCrawl = (sources.results || []).slice(0, 20)
```

### 其他优化
- 添加数据源-公司映射表
- 简化过滤逻辑（只要能识别公司就收录）
- 改进调试日志

## 技术说明

### 为什么本地和生产环境不同？

1. **本地开发**使用 `.wrangler/state/v3/d1/` 本地SQLite数据库
2. **生产环境**使用 Cloudflare D1 远程数据库
3. 两个数据库内容完全独立

### 如何同步数据？

**选项A：直接使用生产数据库**（推荐）
- 重新部署代码即可
- 保留现有32个数据源
- 自动应用新的限制（20个）

**选项B：迁移本地数据到生产**
- 需要手动导出/导入数据
- 会覆盖生产环境现有数据源
- 不推荐，除非要完全重置

## 常见问题

### Q: 为什么有些数据源从未爬取？

**原因**：
1. 代码限制只爬前10个（现已改为20个）
2. HTML网站爬取可能失败（需要正确的xpath规则）
3. 网站需要JavaScript渲染（`enableJS`设为0）

### Q: 如何优化爬取效果？

**建议**：
1. **优先使用RSS源**（更稳定）
2. **测试HTML xpath规则**
3. **调整超时时间**（某些网站较慢）
4. **启用JS渲染**（针对动态网站）

### Q: 需要清理生产数据库吗？

**不需要！** 当前方案是：
- ✅ 保留所有现有数据源
- ✅ 只需重新部署代码
- ✅ 提升爬取上限到20个

---

**下一步操作**：
1. 前往 Deploy 标签配置 Cloudflare API 密钥
2. 回到这里运行部署命令
3. 验证生产环境更新成功
