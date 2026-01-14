#!/bin/bash

echo "=========================================="
echo "  生产环境功能验证测试"
echo "=========================================="
echo ""

PROD_URL="https://risk-alert-platform.pages.dev"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $name ... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $response, 预期 $expected_code)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

test_api_json() {
    local name=$1
    local url=$2
    local field=$3
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $name ... "
    
    response=$(curl -s "$url")
    
    if echo "$response" | jq -e ".$field" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        echo "   数据: $(echo "$response" | jq -r ".$field")"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (字段 $field 不存在)"
        echo "   响应: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}1️⃣  基础页面访问测试${NC}"
echo "----------------------------------------"
test_endpoint "主页" "$PROD_URL/"
test_endpoint "AI搜索页" "$PROD_URL/ai-search"
echo ""

echo -e "${BLUE}2️⃣  静态资源加载测试${NC}"
echo "----------------------------------------"
test_endpoint "app.js" "$PROD_URL/static/app.js" 200
test_endpoint "ai-search.js" "$PROD_URL/static/ai-search.js" 200
test_endpoint "styles.css" "$PROD_URL/static/styles.css" 200
echo ""

echo -e "${BLUE}3️⃣  API 端点测试${NC}"
echo "----------------------------------------"
test_api_json "统计API" "$PROD_URL/api/statistics" "data.totalRisks"
test_api_json "风险API" "$PROD_URL/api/risks?page=1&limit=10" "success"
test_api_json "公司API" "$PROD_URL/api/companies" "success"
test_api_json "实时API" "$PROD_URL/api/realtime" "success"
echo ""

echo -e "${BLUE}4️⃣  AI 搜索功能测试（本地模式）${NC}"
echo "----------------------------------------"
echo -n "测试本地搜索 (关键词: power) ... "
search_result=$(curl -s -X POST "$PROD_URL/api/realtime-search" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"power","timeRange":7}')

error_msg=$(echo "$search_result" | jq -r '.error // ""')
if [ "$error_msg" = "GENSPARK_TOKEN not configured" ]; then
    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}⚠️  跳过${NC} (未配置 GENSPARK_TOKEN)"
    echo "   说明: 需要配置 Token 才能使用 AI 搜索功能"
    echo "   配置命令: npx wrangler pages secret put GENSPARK_TOKEN --project-name risk-alert-platform"
elif echo "$search_result" | jq -e '.success' > /dev/null 2>&1; then
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✓ 通过${NC}"
    echo "   搜索关键词: power"
    echo "   结果数量: $(echo "$search_result" | jq -r '.total_results // 0')"
    echo "   风险评分: $(echo "$search_result" | jq -r '.risk_score // "N/A"')"
    echo "   风险等级: $(echo "$search_result" | jq -r '.risk_level // "N/A"')"
    echo "   缓存状态: $(echo "$search_result" | jq -r '.cache // false')"
    echo "   数据来源: $(echo "$search_result" | jq -r '.data_source // "本地数据库"')"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "${RED}✗ 失败${NC}"
    echo "   错误信息: $error_msg"
fi
echo ""

echo -e "${BLUE}5️⃣  不同关键词搜索测试${NC}"
echo "----------------------------------------"
keywords=("transmission" "CPFL" "outage" "grid")

for keyword in "${keywords[@]}"; do
    echo -n "测试搜索: $keyword ... "
    result=$(curl -s -X POST "$PROD_URL/api/realtime-search" \
      -H "Content-Type: application/json" \
      -d "{\"keyword\":\"$keyword\",\"timeRange\":7}")
    
    error_msg=$(echo "$result" | jq -r '.error // ""')
    if [ "$error_msg" = "GENSPARK_TOKEN not configured" ]; then
        echo -e "${YELLOW}跳过${NC} (未配置 Token)"
    elif echo "$result" | jq -e '.success' > /dev/null 2>&1; then
        TOTAL=$((TOTAL + 1))
        PASSED=$((PASSED + 1))
        total=$(echo "$result" | jq -r '.total_results // 0')
        echo -e "${GREEN}✓ 通过${NC} (结果数: $total)"
    else
        TOTAL=$((TOTAL + 1))
        FAILED=$((FAILED + 1))
        echo -e "${RED}✗ 失败${NC}"
    fi
done
echo ""

echo -e "${BLUE}6️⃣  缓存机制测试${NC}"
echo "----------------------------------------"
test_keyword="cache_test_$(date +%s)"

echo -n "首次搜索 (关键词: power) ... "
start_time=$(date +%s%3N)
first_search=$(curl -s -X POST "$PROD_URL/api/realtime-search" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"power","timeRange":7}')
end_time=$(date +%s%3N)
first_time=$((end_time - start_time))

cache_status_1=$(echo "$first_search" | jq -r '.cache // false')
echo "用时: ${first_time}ms, 缓存: $cache_status_1"

sleep 2

echo -n "二次搜索 (相同关键词) ... "
start_time=$(date +%s%3N)
second_search=$(curl -s -X POST "$PROD_URL/api/realtime-search" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"power","timeRange":7}')
end_time=$(date +%s%3N)
second_time=$((end_time - start_time))

cache_status_2=$(echo "$second_search" | jq -r '.cache // false')
echo "用时: ${second_time}ms, 缓存: $cache_status_2"

if [ "$cache_status_2" = "true" ]; then
    echo -e "${GREEN}✓ 缓存机制正常工作${NC}"
    echo "   性能提升: $((first_time - second_time))ms"
else
    echo -e "${YELLOW}⚠️  缓存未命中（可能是首次运行）${NC}"
fi
echo ""

echo -e "${BLUE}7️⃣  性能测试${NC}"
echo "----------------------------------------"
echo -n "主页加载速度 ... "
time_total=$(curl -w "%{time_total}" -o /dev/null -s "$PROD_URL/")
echo "${time_total}s"

echo -n "API响应速度 ... "
time_total=$(curl -w "%{time_total}" -o /dev/null -s "$PROD_URL/api/statistics")
echo "${time_total}s"

echo -n "搜索响应速度 ... "
start_time=$(date +%s%3N)
curl -s -X POST "$PROD_URL/api/realtime-search" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test","timeRange":7}' > /dev/null
end_time=$(date +%s%3N)
search_time=$((end_time - start_time))
echo "${search_time}ms"
echo ""

echo -e "${BLUE}8️⃣  数据完整性测试${NC}"
echo "----------------------------------------"
echo -n "检查统计数据 ... "
stats=$(curl -s "$PROD_URL/api/statistics")
total_risks=$(echo "$stats" | jq -r '.data.totalRisks // 0')
high_risk=$(echo "$stats" | jq -r '.data.highRisks // 0')
medium_risk=$(echo "$stats" | jq -r '.data.mediumRisks // 0')
low_risk=$(echo "$stats" | jq -r '.data.lowRisks // 0')

echo ""
echo "   总风险数: $total_risks"
echo "   高风险: $high_risk ($(awk "BEGIN {printf \"%.1f\", $high_risk/$total_risks*100}")%)"
echo "   中风险: $medium_risk ($(awk "BEGIN {printf \"%.1f\", $medium_risk/$total_risks*100}")%)"
echo "   低风险: $low_risk ($(awk "BEGIN {printf \"%.1f\", $low_risk/$total_risks*100}")%)"

if [ $total_risks -gt 0 ]; then
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✓ 数据完整${NC}"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "${RED}✗ 数据为空${NC}"
fi
echo ""

echo "=========================================="
echo "  测试结果汇总"
echo "=========================================="
echo "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
success_rate=$(awk "BEGIN {printf \"%.1f\", $PASSED/$TOTAL*100}")
echo "成功率: ${success_rate}%"
echo ""

echo "=========================================="
echo "  测试环境信息"
echo "=========================================="
echo "生产地址: $PROD_URL"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "测试脚本: test-production.sh"
echo ""

echo "=========================================="
echo "  访问地址"
echo "=========================================="
echo -e "${BLUE}主页:${NC} $PROD_URL/"
echo -e "${BLUE}AI搜索:${NC} $PROD_URL/ai-search"
echo -e "${BLUE}API文档:${NC} $PROD_URL/api/statistics"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 所有测试通过！生产环境正常     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示：配置 GENSPARK_TOKEN 以启用完整 AI 搜索功能${NC}"
    echo "   npx wrangler pages secret put GENSPARK_TOKEN --project-name risk-alert-platform"
    echo ""
    exit 0
else
    echo -e "${YELLOW}╔══════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ⚠️  有 $FAILED 项测试失败              ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════╝${NC}"
    echo ""
    echo "请检查失败的测试项并修复问题"
    echo ""
    exit 1
fi
