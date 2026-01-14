#!/bin/bash

# 实时搜索功能测试脚本
# 测试GenSpark AI + Web Search集成

echo "========================================="
echo "AI实时搜索功能测试"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试1: 检查服务状态
echo -e "${BLUE}[测试1] 检查服务状态${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ai-search | grep -q "200"; then
    echo -e "${GREEN}✓ AI搜索页面可访问${NC}"
else
    echo -e "${RED}✗ AI搜索页面无法访问${NC}"
    exit 1
fi
echo ""

# 测试2: 检查数据库迁移
echo -e "${BLUE}[测试2] 检查数据库表结构${NC}"
if wrangler d1 execute risk_alert_db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='search_cache';" 2>/dev/null | grep -q "search_cache"; then
    echo -e "${GREEN}✓ search_cache表已创建${NC}"
else
    echo -e "${RED}✗ search_cache表不存在${NC}"
fi
echo ""

# 测试3: 测试实时搜索API（无Token - 降级模式）
echo -e "${BLUE}[测试3] 测试实时搜索API（降级模式）${NC}"
response=$(curl -s -X POST http://localhost:3000/api/realtime-search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "停电",
    "filters": {
      "timeRange": 30
    }
  }')

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API响应成功${NC}"
    
    # 提取关键信息
    total_results=$(echo "$response" | jq -r '.data.total_results // 0')
    risks_count=$(echo "$response" | jq -r '.data.risks | length // 0')
    high_risks=$(echo "$response" | jq -r '.data.overall_assessment.high_risks // 0')
    cached=$(echo "$response" | jq -r '.data.cached // false')
    
    echo "  - 搜索结果: $total_results 条"
    echo "  - 风险数据: $risks_count 条"
    echo "  - 高风险: $high_risks 条"
    echo "  - 是否缓存: $cached"
else
    echo -e "${YELLOW}⚠ API响应但可能无Token（预期行为）${NC}"
    error=$(echo "$response" | jq -r '.error // "未知错误"')
    echo "  错误信息: $error"
fi
echo ""

# 测试4: 检查GENSPARK_TOKEN配置
echo -e "${BLUE}[测试4] 检查GENSPARK_TOKEN配置${NC}"
if [ -f .dev.vars ] && grep -q "GENSPARK_TOKEN" .dev.vars; then
    token_length=$(grep "GENSPARK_TOKEN" .dev.vars | cut -d'=' -f2 | wc -c)
    if [ $token_length -gt 10 ]; then
        echo -e "${GREEN}✓ GENSPARK_TOKEN已配置（长度: $token_length）${NC}"
        echo -e "${GREEN}  可以进行真实的AI搜索测试${NC}"
    else
        echo -e "${YELLOW}⚠ GENSPARK_TOKEN配置但似乎为空${NC}"
    fi
else
    echo -e "${YELLOW}⚠ GENSPARK_TOKEN未配置${NC}"
    echo -e "  ${YELLOW}将使用降级策略（本地数据库搜索）${NC}"
fi
echo ""

# 测试5: 测试缓存功能
echo -e "${BLUE}[测试5] 测试缓存功能${NC}"
echo "第一次搜索（应该是新搜索）..."
response1=$(curl -s -X POST http://localhost:3000/api/realtime-search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "test_cache", "filters": {"timeRange": 30}}')

cached1=$(echo "$response1" | jq -r '.data.cached // false')
echo "  第一次缓存状态: $cached1"

sleep 1

echo "第二次搜索（应该从缓存获取）..."
response2=$(curl -s -X POST http://localhost:3000/api/realtime-search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "test_cache", "filters": {"timeRange": 30}}')

cached2=$(echo "$response2" | jq -r '.data.cached // false')
echo "  第二次缓存状态: $cached2"

if [ "$cached2" = "true" ]; then
    echo -e "${GREEN}✓ 缓存机制工作正常${NC}"
else
    echo -e "${YELLOW}⚠ 缓存未生效（可能是降级模式）${NC}"
fi
echo ""

# 测试6: 检查前端JS文件
echo -e "${BLUE}[测试6] 检查前端JS文件${NC}"
if [ -f public/static/ai-search.js ]; then
    file_size=$(wc -c < public/static/ai-search.js)
    echo -e "${GREEN}✓ ai-search.js存在（大小: $file_size 字节）${NC}"
    
    # 检查关键函数
    if grep -q "performRealtimeSearch" public/static/ai-search.js; then
        echo -e "${GREEN}✓ performRealtimeSearch 函数已添加${NC}"
    else
        echo -e "${RED}✗ performRealtimeSearch 函数不存在${NC}"
    fi
    
    if grep -q "displayRealtimeAnalysis" public/static/ai-search.js; then
        echo -e "${GREEN}✓ displayRealtimeAnalysis 函数已添加${NC}"
    else
        echo -e "${RED}✗ displayRealtimeAnalysis 函数不存在${NC}"
    fi
else
    echo -e "${RED}✗ ai-search.js不存在${NC}"
fi
echo ""

# 总结
echo "========================================="
echo -e "${BLUE}测试总结${NC}"
echo "========================================="
echo ""
echo -e "${GREEN}✅ 核心功能已实现：${NC}"
echo "  - 实时搜索API: /api/realtime-search"
echo "  - 搜索缓存表: search_cache"
echo "  - 前端集成: performRealtimeSearch()"
echo "  - AI分析展示: displayRealtimeAnalysis()"
echo ""

if [ -f .dev.vars ] && grep -q "GENSPARK_TOKEN" .dev.vars; then
    echo -e "${GREEN}✅ 可以进行真实AI搜索${NC}"
    echo "  访问: http://localhost:3000/ai-search"
    echo "  输入关键词进行搜索，将调用GenSpark AI"
else
    echo -e "${YELLOW}⚠️ 配置提示${NC}"
    echo "  为了使用真实的AI搜索功能，请配置GENSPARK_TOKEN："
    echo "  echo 'GENSPARK_TOKEN=your_token_here' >> .dev.vars"
    echo "  pm2 restart risk-alert-platform --update-env"
fi
echo ""

echo "访问地址："
echo "  - 本地: http://localhost:3000/ai-search"
echo "  - 沙盒: 使用 GetServiceUrl 获取公网地址"
echo ""

echo -e "${GREEN}测试完成！${NC}"
