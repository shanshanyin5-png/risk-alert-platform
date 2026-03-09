#!/bin/bash

echo "=========================================="
echo "  导入最新数据到生产环境"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查SQL文件
if [ ! -f "new_sgcc_risks_data.sql" ]; then
    echo -e "${RED}错误: 找不到 new_sgcc_risks_data.sql 文件${NC}"
    exit 1
fi

echo -e "${BLUE}📊 步骤 1/4: 检查生产数据库当前状态${NC}"
echo "----------------------------------------"
echo "正在查询生产数据库..."
prod_count=$(npx wrangler d1 execute risk_alert_db --remote --command="SELECT COUNT(*) as count FROM risks" 2>/dev/null | grep -oP '"count":\s*\K\d+' | head -1)
echo "生产环境当前风险数: $prod_count"
echo ""

echo -e "${BLUE}💾 步骤 2/4: 导入数据到生产数据库${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}⚠️  警告: 即将向生产环境导入数据${NC}"
echo ""
read -p "确认继续吗？(输入 yes 继续): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}操作已取消${NC}"
    exit 0
fi

echo ""
echo "正在导入数据到生产环境..."
npx wrangler d1 execute risk_alert_db --remote --file=./new_sgcc_risks_data.sql 2>&1 | grep -E "(Executing|command executed|Error)"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据导入成功${NC}"
else
    echo -e "${RED}✗ 数据导入失败${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}🔍 步骤 3/4: 验证生产环境数据${NC}"
echo "----------------------------------------"
new_prod_count=$(npx wrangler d1 execute risk_alert_db --remote --command="SELECT COUNT(*) as count FROM risks" 2>/dev/null | grep -oP '"count":\s*\K\d+' | head -1)
added_count=$((new_prod_count - prod_count))
echo "导入前: $prod_count"
echo "导入后: $new_prod_count"
echo -e "${GREEN}新增: $added_count 条${NC}"
echo ""

# 查看最新数据
echo "最新导入的风险数据（Top 5）:"
npx wrangler d1 execute risk_alert_db --remote --command="SELECT company_name, title, risk_level, risk_time FROM risks ORDER BY created_at DESC LIMIT 5" 2>/dev/null | grep -A 30 '"results"'
echo ""

echo -e "${BLUE}📈 步骤 4/4: 生产环境统计${NC}"
echo "----------------------------------------"
echo "按风险等级统计："
npx wrangler d1 execute risk_alert_db --remote --command="SELECT risk_level, COUNT(*) as count FROM risks GROUP BY risk_level ORDER BY count DESC" 2>/dev/null | grep -A 20 '"results"'
echo ""

echo "按公司统计（Top 10）："
npx wrangler d1 execute risk_alert_db --remote --command="SELECT company_name, COUNT(*) as count FROM risks GROUP BY company_name ORDER BY count DESC LIMIT 10" 2>/dev/null | grep -A 30 '"results"'
echo ""

echo "=========================================="
echo -e "${GREEN}✅ 生产环境数据导入完成！${NC}"
echo "=========================================="
echo ""
echo "📊 导入摘要："
echo "  - 生产总数: $new_prod_count"
echo "  - 新增数量: $added_count"
echo ""
echo "🔗 访问生产环境："
echo "  - 主页: https://risk-alert-platform.pages.dev/"
echo "  - AI搜索: https://risk-alert-platform.pages.dev/ai-search"
echo ""
echo "🔍 验证新数据："
echo "  1. 访问主页查看统计数据更新"
echo "  2. 搜索关键词'国家电网'或'State Grid'"
echo "  3. 检查风险等级分布是否正确"
echo ""
echo -e "${YELLOW}💡 提示: 数据已导入，但生产环境页面可能需要几分钟缓存刷新${NC}"
echo ""
