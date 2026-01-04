# 数据源修复测试和部署指南

## 🚀 快速开始（5分钟完成）

### 步骤1：配置Cloudflare API Token（仅首次）

1. 访问 Deploy tab 配置Cloudflare API Token
2. 或使用以下命令测试现有token：

```bash
npx wrangler whoami
```

### 步骤2：构建项目

```bash
cd /home/user/webapp
npm run build
```

### 步骤3：部署到Cloudflare Pages

```bash
# 确保已配置CLOUDFLARE_API_TOKEN
npx wrangler pages deploy dist --project-name=risk-alert-platform
```

### 步骤4：初始化RSS数据源

访问生产环境，调用初始化API：

```bash
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
```

预期输出：
```json
{
  "success": true,
  "message": "成功初始化 12/12 个可靠RSS数据源",
  "data": { "count": 12 }
}
```

### 步骤5：测试一键更新

访问平台并点击"一键更新"按钮：
```
https://risk-alert-platform.pages.dev
```

预期：
- ✅ 显示进度条
- ✅ 2-5分钟内完成
- ✅ 发现10-50条新风险
- ✅ 成功率>80%

## 📋 完整测试清单

### ✅ API测试

#### 1. 获取数据源列表
```bash
curl https://risk-alert-platform.pages.dev/api/datasources

# 预期：返回12个RSS源
```

#### 2. 初始化可靠源
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable

# 预期：成功消息，count=12
```

#### 3. 测试单个源爬取
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"sourceId": 1}'

# 预期：返回新增风险数量
```

#### 4. 测试一键更新全部
```bash
curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all

# 预期：返回进度和统计
```

#### 5. 获取风险列表
```bash
curl "https://risk-alert-platform.pages.dev/api/risks?page=1&limit=20"

# 预期：返回风险列表
```

#### 6. 关键词搜索
```bash
curl "https://risk-alert-platform.pages.dev/api/risks?keyword=国家电网"

# 预期：返回相关风险
```

### ✅ 前端功能测试

1. **监控大屏**
   - [ ] 访问首页
   - [ ] 查看统计卡片
   - [ ] 查看图表
   - [ ] 查看实时风险流

2. **一键更新**
   - [ ] 点击"一键更新"按钮
   - [ ] 查看进度条
   - [ ] 查看完成摘要
   - [ ] 确认新增风险

3. **数据源管理**
   - [ ] 查看数据源列表
   - [ ] 添加数据源
   - [ ] 编辑数据源
   - [ ] 删除数据源
   - [ ] 测试连接

4. **风险列表**
   - [ ] 分页查看
   - [ ] 关键词搜索
   - [ ] 日期筛选
   - [ ] 公司筛选
   - [ ] 查看详情

5. **数据导出**
   - [ ] 导出风险列表
   - [ ] 导出数据源
   - [ ] 导出企业列表
   - [ ] 导出历史记录

## 🔧 本地开发测试

### 本地环境设置

```bash
cd /home/user/webapp

# 清理旧端口
fuser -k 3000/tcp 2>/dev/null || true

# 构建项目
npm run build

# 启动PM2
pm2 start ecosystem.config.cjs

# 测试本地API
curl http://localhost:3000/api/statistics
```

### 本地数据库初始化

```bash
# 初始化RSS数据源
curl -X POST http://localhost:3000/api/datasources/init-reliable

# 测试爬取
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"sourceId": 1}'
```

## 📊 性能指标

### 预期性能

- **响应时间**：<200ms（API）
- **爬取速度**：10-15秒/源
- **总耗时**：2-5分钟（12源）
- **成功率**：85-95%
- **新增风险**：10-50条/次
- **准确率**：85-90%
- **误报率**：<5%

### 监控指标

```bash
# 查看PM2日志
pm2 logs --nostream

# 查看数据源状态
curl https://risk-alert-platform.pages.dev/api/datasources

# 查看统计数据
curl https://risk-alert-platform.pages.dev/api/statistics
```

## 🐛 故障排查

### 问题1：部署失败
```bash
# 检查API Token
npx wrangler whoami

# 重新部署
npm run build
npx wrangler pages deploy dist --project-name=risk-alert-platform
```

### 问题2：数据源失败
```bash
# 检查RSS2JSON是否可用
curl "https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/world/rss.xml"

# 重新初始化数据源
curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
```

### 问题3：爬取无结果
```bash
# 检查单个源
curl -X POST https://risk-alert-platform.pages.dev/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"sourceId": 1}'

# 查看数据源详情
curl https://risk-alert-platform.pages.dev/api/datasources
```

### 问题4：前端页面错误
```bash
# 检查static文件
curl -I https://risk-alert-platform.pages.dev/static/app.js

# 查看控制台错误（浏览器）
# 打开浏览器开发者工具 → Console
```

## ✅ 最终验收清单

### 部署验收
- [ ] 构建成功（无错误）
- [ ] 部署成功（获得URL）
- [ ] API全部可访问
- [ ] 前端页面正常加载

### 功能验收
- [ ] 数据源初始化成功（12个）
- [ ] 单个源爬取成功
- [ ] 一键更新全部成功
- [ ] 风险列表有数据
- [ ] 搜索功能正常
- [ ] 导出功能正常

### 性能验收
- [ ] API响应时间<200ms
- [ ] 爬取速度合理（10-15秒/源）
- [ ] 总耗时2-5分钟
- [ ] 成功率>80%
- [ ] 发现新风险10+条

## 📝 验收报告模板

```
# 国网风险预警平台验收报告

## 部署信息
- 部署时间：2026-01-04
- 部署环境：Cloudflare Pages
- 项目URL：https://risk-alert-platform.pages.dev
- 版本号：v3.0.0

## 测试结果

### API测试
- ✅ /api/statistics
- ✅ /api/datasources
- ✅ /api/crawl
- ✅ /api/crawl/all
- ✅ /api/risks

### 功能测试
- ✅ 数据源初始化
- ✅ 一键更新
- ✅ 风险列表
- ✅ 搜索功能
- ✅ 导出功能

### 性能测试
- API响应时间：[实际值]ms
- 爬取速度：[实际值]秒/源
- 总耗时：[实际值]分钟
- 成功率：[实际值]%
- 新增风险：[实际值]条

### 数据统计
- 数据源数量：[实际值]个
- 风险记录：[实际值]条
- 企业数量：[实际值]家

## 结论
- [ ] ✅ 通过验收
- [ ] ❌ 需要修复

## 备注
[其他说明]
```

## 🎯 下一步

完成测试后：

1. **生产部署**
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=risk-alert-platform
   ```

2. **初始化数据**
   ```bash
   curl -X POST https://risk-alert-platform.pages.dev/api/datasources/init-reliable
   ```

3. **验收测试**
   - 访问平台
   - 点击一键更新
   - 查看新增风险

4. **文档交付**
   - DATASOURCE_FIX_GUIDE.md
   - FREE_SOLUTION.md
   - USER_GUIDE.md
   - README.md

---

**最后更新：** 2026-01-04  
**状态：** ✅ 准备就绪，等待部署
