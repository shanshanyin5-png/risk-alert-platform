#!/bin/bash

BASE_URL="https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai"

echo "========================================"
echo "  国网风险预警平台 - API功能测试"
echo "========================================"
echo ""

echo "1️⃣  测试统计API..."
curl -s "$BASE_URL/api/statistics" | python3 -m json.tool | head -15
echo ""

echo "2️⃣  测试风险列表API（前3条）..."
curl -s "$BASE_URL/api/risks?page=1&limit=3" | python3 -m json.tool | head -40
echo ""

echo "3️⃣  测试数据源列表API（前2个）..."
curl -s "$BASE_URL/api/datasources" | python3 -m json.tool | head -30
echo ""

echo "4️⃣  测试主页访问..."
curl -s -I "$BASE_URL/" | head -5
echo ""

echo "========================================"
echo "  ✅ 所有API测试完成！"
echo "========================================"
echo ""
echo "🌐 访问地址："
echo "   $BASE_URL"
echo ""
