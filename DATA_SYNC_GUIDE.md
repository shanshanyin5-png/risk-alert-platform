# 数据同步指南 - 本地数据同步到生产环境

## 问题描述

**生产环境** (https://risk-alert-platform.pages.dev/) 和 **沙盒环境** (本地开发) 使用的是两个独立的数据库：

- **沙盒环境**：使用本地 SQLite 数据库 (`.wrangler/state/v3/d1`)
- **生产环境**：使用 Cloudflare D1 远程数据库

目前两个环境的数据不一致：

| 环境 | 总风险 | 高风险 | 中风险 | 低风险 |
|------|--------|--------|--------|--------|
| **沙盒（本地）** | 54条 | 10条 | 2条 | 42条 |
| **生产（远程）** | 13条 | 2条 | 6条 | 4条 |

---

## 解决方案

需要将本地数据同步到生产环境。

### 前置条件

在执行数据同步前，必须先配置 **Cloudflare API Token**：

1. 访问 **Deploy** 标签页
2. 按照说明创建 Cloudflare API Token
3. 输入并保存 API Token

---

## 方法1：使用自动化脚本（推荐）

### 步骤1：配置 Cloudflare API Token

```bash
# 确保 CLOUDFLARE_API_TOKEN 环境变量已设置
echo $CLOUDFLARE_API_TOKEN  # 应该显示你的token
```

### 步骤2：运行同步脚本

```bash
cd /home/user/webapp
./sync_data_to_production.sh
```

脚本会自动执行以下操作：
1. 导出本地所有风险记录
2. 清空生产环境旧数据
3. 生成导入SQL语句
4. 批量导入到生产环境
5. 同步数据源配置

---

## 方法2：手动执行（分步操作）

### 步骤1：导出本地数据

```bash
cd /home/user/webapp

# 导出风险记录
npx wrangler d1 execute risk_alert_db --local \
  --command="SELECT * FROM risks ORDER BY id" \
  --json > local_risks_export.json

# 生成SQL导入文件
cat local_risks_export.json | jq -r '.[0].results[] | 
"INSERT INTO risks (id, company_name, title, risk_item, risk_level, risk_time, source, source_url, risk_reason, created_at) VALUES (\(.id), '\''\(.company_name | gsub("'\''"; "'\'''\''"))'\'', '\''\(.title | gsub("'\''"; "'\'''\''"))'\'', '\''\(.risk_item // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.risk_level)'\'', '\''\(.risk_time // "")'\'', '\''\(.source // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.source_url // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.risk_reason // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.created_at)'\'');"
' > import_risks_to_production.sql

echo "✅ SQL导入文件已生成: import_risks_to_production.sql"
```

### 步骤2：清空生产环境数据（可选）

```bash
# 如果想完全重置生产数据，执行此步骤
npx wrangler d1 execute risk_alert_db --remote \
  --command="DELETE FROM risks"
```

### 步骤3：导入数据到生产环境

```bash
# 执行批量导入
npx wrangler d1 execute risk_alert_db --remote \
  --file=import_risks_to_production.sql
```

### 步骤4：验证数据同步

```bash
# 检查生产环境数据数量
npx wrangler d1 execute risk_alert_db --remote \
  --command="SELECT COUNT(*) as count FROM risks"

# 检查风险等级分布
npx wrangler d1 execute risk_alert_db --remote \
  --command="SELECT risk_level, COUNT(*) as count FROM risks GROUP BY risk_level"

# 或者访问API验证
curl https://risk-alert-platform.pages.dev/api/statistics
```

---

## 方法3：通过API增量更新（适用于少量数据）

如果只需要同步新增的风险记录，可以使用API：

```bash
# 1. 获取本地最新的风险记录
curl http://localhost:3000/api/risks?page=1&limit=10

# 2. 通过生产环境API手动录入
# POST https://risk-alert-platform.pages.dev/api/risks/manual
# Body: { 
#   "company_name": "公司名称",
#   "title": "风险标题",
#   "risk_level": "高风险",
#   ...
# }
```

---

## 验证同步结果

### 1. 通过API检查

```bash
# 生产环境统计
curl https://risk-alert-platform.pages.dev/api/statistics

# 本地环境统计（对比）
curl http://localhost:3000/api/statistics
```

### 2. 通过前端界面检查

- **生产环境**: https://risk-alert-platform.pages.dev/
- **沙盒环境**: https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai/

确保：
- ✅ 总风险数量一致
- ✅ 高/中/低风险分布一致
- ✅ 公司分布一致
- ✅ 最新风险记录显示正常

---

## 同步数据源配置

除了风险记录，还需要同步数据源配置：

```bash
# 导出数据源配置
npx wrangler d1 execute risk_alert_db --local \
  --command="SELECT * FROM data_sources" \
  --json > data_sources_backup.json

# 生成导入SQL
cat data_sources_backup.json | jq -r '.[0].results[] | 
"INSERT OR REPLACE INTO data_sources (id, name, url, category, xpath_rules, field_mapping, interval, enabled, last_crawl_time, success_count, fail_count, created_at, enable_js, user_agent, timeout, status, updated_at, success_rate) VALUES (\(.id), '\''\(.name)'\\'', '\''\(.url)'\\'', '\''\(.category // "其他")'\\'', '\''\(.xpath_rules // "")'\\'', '\''\(.field_mapping // "")'\\'', \(.interval // 3600), \(.enabled // 1), \(if .last_crawl_time then "'\''"+.last_crawl_time+"'\''" else "NULL" end), \(.success_count // 0), \(.fail_count // 0), '\''\(.created_at)'\\'', \(.enable_js // 0), '\''\(.user_agent // "")'\\'', \(.timeout // 30), '\''\(.status // "normal")'\\'', \(if .updated_at then "'\''"+.updated_at+"'\''" else "NULL" end), \(.success_rate // 0));"
' > import_data_sources.sql

# 导入到生产环境
npx wrangler d1 execute risk_alert_db --remote \
  --file=import_data_sources.sql
```

---

## 常见问题

### Q1: 提示 "CLOUDFLARE_API_TOKEN environment variable" 错误

**原因**: 未配置 Cloudflare API Token

**解决**:
1. 访问 Deploy 标签页配置 API Token
2. 或手动设置环境变量: `export CLOUDFLARE_API_TOKEN=your_token_here`

### Q2: 导入时提示 "UNIQUE constraint failed"

**原因**: ID冲突，生产环境已有相同ID的记录

**解决**:
1. 先清空生产数据: `npx wrangler d1 execute risk_alert_db --remote --command="DELETE FROM risks"`
2. 再执行导入

### Q3: 生产环境数据同步后仍然不一致

**原因**: 可能缓存问题

**解决**:
1. 清除浏览器缓存
2. 等待1-2分钟让Cloudflare边缘缓存更新
3. 强制刷新: `Ctrl+F5` (Windows) 或 `Cmd+Shift+R` (Mac)

---

## 后续维护

### 定期同步策略

**建议**: 每次本地开发做重大数据更新后，手动同步到生产环境

**自动化方案** (未来可实现):
- 使用 GitHub Actions 在代码推送时自动同步
- 设置定时任务 (cron) 定期同步
- 实现双向同步机制

### 数据一致性检查

创建一个检查脚本定期对比两个环境：

```bash
#!/bin/bash
# check_data_consistency.sh

LOCAL_COUNT=$(npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) as count FROM risks" --json | jq '.[0].results[0].count')

REMOTE_COUNT=$(npx wrangler d1 execute risk_alert_db --remote --command="SELECT COUNT(*) as count FROM risks" --json | jq '.[0].results[0].count')

if [ "$LOCAL_COUNT" != "$REMOTE_COUNT" ]; then
  echo "⚠️ 数据不一致！"
  echo "本地: $LOCAL_COUNT 条"
  echo "生产: $REMOTE_COUNT 条"
  echo "建议执行同步"
else
  echo "✅ 数据一致：$LOCAL_COUNT 条"
fi
```

---

## 文件清单

- ✅ `local_risks_export.json` - 本地风险记录导出
- ✅ `import_risks_to_production.sql` - 生产环境导入SQL (54条记录)
- ✅ `sync_data_to_production.sh` - 自动化同步脚本
- ✅ `DATA_SYNC_GUIDE.md` - 本指南文档

---

## 联系支持

如遇到同步问题，请检查：
- [x] Cloudflare API Token 是否正确配置
- [x] 本地数据库文件是否完整
- [x] 网络连接是否正常
- [x] Cloudflare D1 数据库是否正常运行

---

**最后更新**: 2026-01-13  
**版本**: v1.0  
**项目**: 国网风险预警平台
