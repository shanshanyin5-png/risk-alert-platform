#!/bin/bash

echo "=========================================="
echo "  部署项目关联功能到生产环境"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}步骤 1/4: 应用数据库迁移（添加项目字段）${NC}"
echo "----------------------------------------"
npx wrangler d1 migrations apply risk_alert_db --remote 2>&1 | grep -E "(Migration|executed|Error)"
echo ""

echo -e "${BLUE}步骤 2/4: 更新生产数据（添加项目信息）${NC}"
echo "----------------------------------------"
echo "正在更新生产数据库..."
npx wrangler d1 execute risk_alert_db --remote --file=./update_project_info.sql 2>&1 | grep -E "(Executing|executed|Error)"
echo ""

echo -e "${BLUE}步骤 3/4: 验证项目信息${NC}"
echo "----------------------------------------"
echo "检查已关联项目的风险数量..."
npx wrangler d1 execute risk_alert_db --remote --command="SELECT COUNT(*) as count FROM risks WHERE project_name IS NOT NULL" 2>/dev/null | grep -A 3 '"count"'
echo ""

echo "查看项目分布（Top 5）..."
npx wrangler d1 execute risk_alert_db --remote --command="SELECT project_name, COUNT(*) as count FROM risks WHERE project_name IS NOT NULL GROUP BY project_name ORDER BY count DESC LIMIT 5" 2>/dev/null | grep -A 20 '"results"'
echo ""

echo -e "${BLUE}步骤 4/4: 部署前端代码${NC}"
echo "----------------------------------------"
echo "构建项目..."
npm run build 2>&1 | tail -5

echo ""
echo "部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name risk-alert-platform 2>&1 | grep -E "(Uploading|Deployment|success|https://)"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 项目关联功能部署完成！${NC}"
echo "=========================================="
echo ""
echo "📊 功能说明："
echo "  - ✅ 每个风险事件现在关联具体项目"
echo "  - ✅ 显示项目名称、位置、类型、容量、投资额、状态"
echo "  - ✅ API 返回完整项目信息"
echo "  - ✅ 前端UI展示项目详情（蓝色卡片）"
echo ""
echo "🔗 验证地址："
echo "  - 主页: https://risk-alert-platform.pages.dev/"
echo "  - AI搜索: https://risk-alert-platform.pages.dev/ai-search"
echo ""
echo "💡 测试建议："
echo "  - 搜索 'Matiari' 查看HVDC项目"
echo "  - 搜索 'State Grid' 查看国网项目"
echo "  - 搜索 'NGCP' 查看菲律宾项目"
echo ""
