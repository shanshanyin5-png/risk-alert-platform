#!/bin/bash

# AI智能分析功能测试脚本

echo "========================================"
echo "   AI智能分析功能测试"
echo "========================================"
echo ""

# 配置
API_URL="http://localhost:3000"
PROJECT_NAME="risk-alert-platform"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试1：检查服务状态
echo "1️⃣  检查服务状态..."
if curl -s -f "$API_URL/api/statistics" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 服务正常运行"
else
    echo -e "${RED}✗${NC} 服务未运行"
    exit 1
fi
echo ""

# 测试2：测试AI分析API（无Token降级）
echo "2️⃣  测试AI分析API（降级模式）..."
RESPONSE=$(curl -s -X POST "$API_URL/api/ai-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "停电",
    "filters": {
      "riskLevel": "",
      "company": "",
      "timeRange": 30
    }
  }')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API调用成功"
    echo "   分析结果："
    echo "$RESPONSE" | jq -r '.data.summary' | sed 's/^/   /'
    RISK_SCORE=$(echo "$RESPONSE" | jq -r '.data.riskAssessment.score')
    RISK_LEVEL=$(echo "$RESPONSE" | jq -r '.data.riskAssessment.level')
    echo -e "   风险评分: ${YELLOW}${RISK_SCORE}/100${NC}"
    echo -e "   风险等级: ${YELLOW}${RISK_LEVEL}${NC}"
else
    echo -e "${RED}✗${NC} API调用失败"
    echo "$RESPONSE" | jq '.'
fi
echo ""

# 测试3：检查环境变量配置
echo "3️⃣  检查环境变量配置..."
if [ -f ".dev.vars" ]; then
    if grep -q "GENSPARK_TOKEN=" .dev.vars 2>/dev/null; then
        echo -e "${GREEN}✓${NC} .dev.vars配置文件存在"
        echo "   配置内容："
        grep "GENSPARK_TOKEN=" .dev.vars | sed 's/GENSPARK_TOKEN=.*/GENSPARK_TOKEN=***hidden***/g' | sed 's/^/   /'
    else
        echo -e "${YELLOW}⚠${NC}  .dev.vars存在但未配置GENSPARK_TOKEN"
    fi
else
    echo -e "${YELLOW}⚠${NC}  .dev.vars文件不存在"
    echo "   创建.dev.vars文件并配置GENSPARK_TOKEN以启用真实AI分析"
fi
echo ""

# 测试4：测试AI搜索页面
echo "4️⃣  测试AI搜索页面..."
if curl -s -f "$API_URL/ai-search" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} AI搜索页面可访问"
    echo "   访问地址: $API_URL/ai-search"
else
    echo -e "${RED}✗${NC} AI搜索页面不可访问"
fi
echo ""

# 测试5：查询风险数据统计
echo "5️⃣  查询风险数据统计..."
STATS=$(curl -s "$API_URL/api/statistics")
if echo "$STATS" | jq -e '.success' > /dev/null 2>&1; then
    TOTAL=$(echo "$STATS" | jq -r '.data.totalRisks')
    HIGH=$(echo "$STATS" | jq -r '.data.highRisks')
    MEDIUM=$(echo "$STATS" | jq -r '.data.mediumRisks')
    LOW=$(echo "$STATS" | jq -r '.data.lowRisks')
    
    echo -e "${GREEN}✓${NC} 数据统计获取成功"
    echo "   总风险数: $TOTAL"
    echo "   高风险: $HIGH"
    echo "   中风险: $MEDIUM"
    echo "   低风险: $LOW"
else
    echo -e "${RED}✗${NC} 数据统计获取失败"
fi
echo ""

# 总结
echo "========================================"
echo "   测试完成"
echo "========================================"
echo ""
echo "📝 快速启动AI功能："
echo ""
echo "1. 配置Token（可选，用于真实AI分析）："
echo "   echo 'GENSPARK_TOKEN=your_token_here' >> .dev.vars"
echo ""
echo "2. 重启服务："
echo "   npm run build && pm2 restart $PROJECT_NAME"
echo ""
echo "3. 访问AI搜索："
echo "   浏览器打开: $API_URL/ai-search"
echo ""
echo "4. 测试API："
echo '   curl -X POST '$API_URL'/api/ai-analysis \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"keyword":"停电","filters":{}}'"'"
echo ""
echo "📚 更多信息请查看: AI_INTEGRATION_GUIDE.md"
echo ""
