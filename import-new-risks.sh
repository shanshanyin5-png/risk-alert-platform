#!/bin/bash

echo "=========================================="
echo "  导入最新国网风险数据"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查SQL文件是否存在
if [ ! -f "new_sgcc_risks_data.sql" ]; then
    echo -e "${RED}错误: 找不到 new_sgcc_risks_data.sql 文件${NC}"
    exit 1
fi

echo -e "${BLUE}📊 步骤 1/5: 检查当前数据库状态${NC}"
echo "----------------------------------------"
current_count=$(npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) as count FROM risks" 2>/dev/null | grep -A 2 '"count"' | grep -oP '\d+' | head -1)
echo "当前风险数据数量: $current_count"
echo ""

echo -e "${BLUE}📁 步骤 2/5: 读取新数据SQL文件${NC}"
echo "----------------------------------------"
file_size=$(wc -c < new_sgcc_risks_data.sql)
line_count=$(wc -l < new_sgcc_risks_data.sql)
insert_count=$(grep -c "^INSERT INTO risks" new_sgcc_risks_data.sql)
echo "文件大小: $file_size 字节"
echo "文件行数: $line_count 行"
echo "新增记录数: $insert_count 条"
echo ""

echo -e "${BLUE}💾 步骤 3/5: 导入数据到本地数据库${NC}"
echo "----------------------------------------"
echo "正在导入数据..."
npx wrangler d1 execute risk_alert_db --local --file=./new_sgcc_risks_data.sql 2>&1 | grep -E "(Executing|command executed|Error)"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据导入成功${NC}"
else
    echo -e "${RED}✗ 数据导入失败${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}🔍 步骤 4/5: 验证导入结果${NC}"
echo "----------------------------------------"
new_count=$(npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) as count FROM risks" 2>/dev/null | grep -A 2 '"count"' | grep -oP '\d+' | head -1)
added_count=$((new_count - current_count))
echo "导入前数量: $current_count"
echo "导入后数量: $new_count"
echo -e "${GREEN}新增数量: $added_count${NC}"
echo ""

# 查看最新导入的数据
echo "最新导入的数据样本："
npx wrangler d1 execute risk_alert_db --local --command="SELECT company_name, title, risk_level, risk_time FROM risks ORDER BY created_at DESC LIMIT 5" 2>/dev/null | grep -A 30 '"results"'
echo ""

echo -e "${BLUE}📈 步骤 5/5: 统计分析${NC}"
echo "----------------------------------------"
echo "按风险等级统计："
npx wrangler d1 execute risk_alert_db --local --command="SELECT risk_level, COUNT(*) as count FROM risks GROUP BY risk_level ORDER BY count DESC" 2>/dev/null | grep -A 20 '"results"'
echo ""

echo "按公司统计（Top 10）："
npx wrangler d1 execute risk_alert_db --local --command="SELECT company_name, COUNT(*) as count FROM risks GROUP BY company_name ORDER BY count DESC LIMIT 10" 2>/dev/null | grep -A 30 '"results"'
echo ""

echo "=========================================="
echo -e "${GREEN}✅ 数据导入完成！${NC}"
echo "=========================================="
echo ""
echo "📊 导入摘要："
echo "  - 总风险数: $new_count"
echo "  - 新增数量: $added_count"
echo "  - 预期新增: $insert_count"
echo ""
echo "🔗 验证方式："
echo "  - 本地: http://localhost:3000/"
echo "  - 本地AI搜索: http://localhost:3000/ai-search"
echo "  - 生产: https://risk-alert-platform.pages.dev/"
echo ""
echo "⚡ 下一步："
echo "  1. 在本地验证新数据显示"
echo "  2. 测试AI搜索功能"
echo "  3. 导入到生产环境（运行 import-to-production.sh）"
echo ""
