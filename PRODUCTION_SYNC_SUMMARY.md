# 生产环境数据同步问题 - 解决方案总结

## 📋 问题描述

**用户反馈**: "https://risk-alert-platform.pages.dev/ 网站和沙盒的内容不一样"

### 问题分析

生产环境 (Cloudflare Pages) 和沙盒环境 (本地开发) 使用的是两个独立的数据库，导致数据不一致。

**数据对比**:

| 指标 | 沙盒环境 (本地) | 生产环境 (远程) | 差异 |
|------|----------------|----------------|------|
| **总风险** | 54条 | 13条 | ❌ -41条 |
| **高风险** | 10条 | 2条 | ❌ -8条 |
| **中风险** | 2条 | 6条 | ❌ +4条 |
| **低风险** | 42条 | 4条 | ❌ -38条 |

**公司分布对比**:

| 沙盒环境 | 生产环境 |
|---------|---------|
| 巴西CPFL公司: 20条 | NGCP公司: 7条 |
| 巴基斯坦PMLTC公司: 18条 | PMLTC公司: 3条 |
| 澳大利亚资产公司: 8条 | CPFL公司: 1条 |
| 葡萄牙REN公司: 7条 | CGE公司: 1条 |
| 菲律宾NGCP公司: 1条 | 香港电灯公司: 1条 |

---

## 🔍 根本原因

### 1. 数据库架构

```
沙盒环境:
├── 本地 SQLite 数据库
└── 路径: .wrangler/state/v3/d1/

生产环境:
├── Cloudflare D1 远程数据库
└── 位置: Cloudflare 全球边缘网络
```

### 2. 数据流向

```
开发流程:
1. 本地开发 → 爬取数据 → 本地数据库 ✅
2. 推送代码到 GitHub ✅
3. 部署到 Cloudflare Pages ✅
4. ❌ 数据未同步 → 生产环境数据过期
```

**问题**: 代码部署了，但数据没有同步！

---

## ✅ 解决方案

### 已提供的工具

1. **📄 DATA_SYNC_GUIDE.md**
   - 完整的数据同步指南
   - 包含3种同步方法
   - 详细的步骤说明和故障排除

2. **📜 import_risks_to_production.sql**
   - 包含54条风险记录的SQL导入文件
   - 可直接导入到生产数据库
   - 文件大小: ~150行

3. **🔧 sync_data_to_production.sh**
   - 自动化同步脚本
   - 一键完成所有同步步骤
   - 包含验证和错误处理

---

## 🚀 执行步骤

### 前置条件 ⚠️

**必须先配置 Cloudflare API Token！**

1. 访问 **Deploy 标签页**
2. 创建 Cloudflare API Token
3. 保存 API Token

### 方法1: 自动化脚本 (推荐)

```bash
cd /home/user/webapp
./sync_data_to_production.sh
```

### 方法2: 手动执行

```bash
# 1. 确保已有 import_risks_to_production.sql
cd /home/user/webapp
ls -lh import_risks_to_production.sql  # 应该看到文件

# 2. 执行导入
npx wrangler d1 execute risk_alert_db --remote \
  --file=import_risks_to_production.sql

# 3. 验证
npx wrangler d1 execute risk_alert_db --remote \
  --command="SELECT COUNT(*) as count FROM risks"
```

---

## 📊 预期结果

同步完成后，两个环境应该完全一致：

### 统计数据

| 指标 | 同步后数值 |
|------|----------|
| 总风险 | 54条 |
| 高风险 | 10条 (18.5%) |
| 中风险 | 2条 (3.7%) |
| 低风险 | 42条 (77.8%) |

### 公司分布

| 公司 | 风险数 |
|------|--------|
| 巴西CPFL公司 | 20条 |
| 巴基斯坦PMLTC公司 | 18条 |
| 澳大利亚澳洲资产公司 | 8条 |
| 葡萄牙REN公司 | 7条 |
| 菲律宾NGCP公司 | 1条 |

---

## 🔄 验证同步成功

### 1. API验证

```bash
# 生产环境
curl https://risk-alert-platform.pages.dev/api/statistics | jq

# 应该返回：
{
  "totalRisks": 54,
  "highRisks": 10,
  "mediumRisks": 2,
  "lowRisks": 42
}
```

### 2. 前端验证

访问以下URL对比：

- **生产**: https://risk-alert-platform.pages.dev/
- **沙盒**: https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai/

确认：
- ✅ 首页统计数据一致
- ✅ 风险列表内容一致
- ✅ 公司分布图表一致
- ✅ 风险趋势图一致

---

## 🛠️ 故障排除

### 问题1: "CLOUDFLARE_API_TOKEN environment variable" 错误

**解决**:
```bash
# 检查是否已配置
echo $CLOUDFLARE_API_TOKEN

# 如果为空，访问 Deploy 标签页配置
```

### 问题2: "UNIQUE constraint failed" 错误

**解决**:
```bash
# 先清空生产数据
npx wrangler d1 execute risk_alert_db --remote \
  --command="DELETE FROM risks"

# 再重新导入
npx wrangler d1 execute risk_alert_db --remote \
  --file=import_risks_to_production.sql
```

### 问题3: 同步后数据仍不一致

**解决**:
1. 清除浏览器缓存
2. 等待1-2分钟 (Cloudflare CDN缓存更新)
3. 强制刷新页面: `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)

---

## 📝 后续建议

### 1. 数据一致性维护

**建议策略**:
- 每次重大数据更新后手动同步
- 每周定期对比两个环境数据
- 考虑实现自动同步机制

### 2. 自动化改进 (未来)

```yaml
# .github/workflows/sync-database.yml
name: Sync Database to Production

on:
  workflow_dispatch:  # 手动触发
  schedule:
    - cron: '0 0 * * 0'  # 每周日午夜

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Sync Database
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          npm install -g wrangler
          ./sync_data_to_production.sh
```

### 3. 监控和告警

创建定时检查脚本：

```bash
# check_data_consistency.sh
#!/bin/bash

LOCAL=$(curl -s http://localhost:3000/api/statistics | jq '.totalRisks')
REMOTE=$(curl -s https://risk-alert-platform.pages.dev/api/statistics | jq '.totalRisks')

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "⚠️ 数据不一致！本地: $LOCAL, 生产: $REMOTE"
  # 发送邮件或Slack通知
else
  echo "✅ 数据一致：$LOCAL 条记录"
fi
```

---

## 📁 相关文件

| 文件 | 说明 | 路径 |
|------|------|------|
| 📄 数据同步指南 | 完整操作文档 | `DATA_SYNC_GUIDE.md` |
| 📜 SQL导入文件 | 54条风险记录 | `import_risks_to_production.sql` |
| 🔧 自动化脚本 | 一键同步工具 | `sync_data_to_production.sh` |
| 📊 本报告 | 问题总结 | `PRODUCTION_SYNC_SUMMARY.md` |

---

## 🔗 快速链接

- **生产环境**: https://risk-alert-platform.pages.dev/
- **沙盒环境**: https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai/
- **GitHub仓库**: https://github.com/shanshanyin5-png/risk-alert-platform
- **提交记录**: https://github.com/shanshanyin5-png/risk-alert-platform/commit/57f8692

---

## ✅ 总结

### 问题
- ❌ 生产环境数据过期 (13条 vs 54条)
- ❌ 风险等级分布错误
- ❌ 公司分布不完整

### 解决方案
- ✅ 创建数据导出SQL (54条记录)
- ✅ 提供自动化同步脚本
- ✅ 编写完整同步指南
- ✅ 添加验证和故障排除步骤

### 后续行动
1. **立即**: 配置 Cloudflare API Token
2. **立即**: 执行数据同步脚本
3. **5分钟后**: 验证生产环境数据
4. **长期**: 建立定期同步机制

---

**最后更新**: 2026-01-13  
**版本**: v1.0  
**状态**: ⏳ 等待用户配置 API Token 并执行同步
