#!/bin/bash

# 数据同步脚本 - 将本地数据同步到生产环境
# 使用方法：
# 1. 确保已配置 Cloudflare API Token
# 2. 运行 ./sync_data_to_production.sh

echo "=== 开始同步数据到生产环境 ==="

# 1. 导出本地数据
echo "步骤1: 导出本地数据..."
npx wrangler d1 execute risk_alert_db --local --command="SELECT * FROM risks ORDER BY id" --json > local_risks_backup.json

# 2. 清空生产环境数据（可选，如果想完全重置）
echo "步骤2: 清空生产环境旧数据..."
npx wrangler d1 execute risk_alert_db --remote --command="DELETE FROM risks"

# 3. 创建导入SQL
echo "步骤3: 生成导入SQL..."
npx wrangler d1 execute risk_alert_db --local --command="SELECT 
  'INSERT INTO risks (id, company_name, title, risk_item, risk_level, risk_time, source, source_url, risk_reason, created_at) VALUES (' ||
  id || ', ''' || 
  REPLACE(company_name, '''', '''''') || ''', ''' || 
  REPLACE(title, '''', '''''') || ''', ''' || 
  REPLACE(COALESCE(risk_item, ''), '''', '''''') || ''', ''' || 
  risk_level || ''', ''' || 
  COALESCE(risk_time, '') || ''', ''' || 
  COALESCE(source, '') || ''', ''' || 
  COALESCE(source_url, '') || ''', ''' || 
  REPLACE(COALESCE(risk_reason, ''), '''', '''''') || ''', ''' || 
  created_at || ''');' as sql_statement
FROM risks 
ORDER BY id" --json > import_statements.json

echo "步骤4: 准备批量导入..."
# 将导出的JSON转换为SQL文件
cat local_risks_backup.json | jq -r '.[0].results[] | 
  "INSERT INTO risks (id, company_name, title, risk_item, risk_level, risk_time, source, source_url, risk_reason, created_at) VALUES (\(.id), '\''\(.company_name)'\'', '\''\(.title | gsub("'\''"; "'\'''\''"))'\'', '\''\(.risk_item // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.risk_level)'\'', '\''\(.risk_time // "")'\'', '\''\(.source // "")'\'', '\''\(.source_url // "")'\'', '\''\(.risk_reason // "" | gsub("'\''"; "'\'''\''"))'\'', '\''\(.created_at)'\'');"
' > import_risks.sql

echo "步骤5: 执行导入..."
npx wrangler d1 execute risk_alert_db --remote --file=import_risks.sql

# 4. 同步数据源配置
echo "步骤6: 同步数据源配置..."
npx wrangler d1 execute risk_alert_db --local --command="SELECT * FROM data_sources" --json > data_sources_backup.json

cat data_sources_backup.json | jq -r '.[0].results[] | 
  "INSERT OR REPLACE INTO data_sources (id, name, url, category, xpath_rules, field_mapping, interval, enabled, last_crawl_time, success_count, fail_count, created_at, enable_js, user_agent, timeout, status, updated_at, success_rate) VALUES (\(.id), '\''\(.name)'\'', '\''\(.url)'\'', '\''\(.category // "其他")'\'', '\''\(.xpath_rules // "")'\'', '\''\(.field_mapping // "")'\'', \(.interval // 3600), \(.enabled // 1), \(if .last_crawl_time then "'\''"+.last_crawl_time+"'\''" else "NULL" end), \(.success_count // 0), \(.fail_count // 0), '\''\(.created_at)'\'', \(.enable_js // 0), '\''\(.user_agent // "")'\'', \(.timeout // 30), '\''\(.status // "normal")'\'', \(if .updated_at then "'\''"+.updated_at+"'\''" else "NULL" end), \(.success_rate // 0));"
' > import_data_sources.sql

npx wrangler d1 execute risk_alert_db --remote --file=import_data_sources.sql

echo "=== 数据同步完成！ ==="
echo "本地风险记录数: $(jq '.[0].results | length' local_risks_backup.json)"
echo "请访问生产环境验证: https://risk-alert-platform.pages.dev/api/statistics"
