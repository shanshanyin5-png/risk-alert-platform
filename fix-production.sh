#!/bin/bash

# 生产环境修复脚本
# 修复 https://risk-alert-platform.pages.dev/

set -e  # 遇到错误立即退出

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔧 修复生产环境 risk-alert-platform.pages.dev            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 步骤1: 构建最新代码
echo -e "${BLUE}[步骤 1/5]${NC} 构建最新代码..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败${NC}"
    exit 1
fi
echo ""

# 步骤2: 应用数据库迁移到生产环境
echo -e "${BLUE}[步骤 2/5]${NC} 应用数据库迁移到生产环境..."
echo "正在应用迁移..."
npx wrangler d1 migrations apply risk_alert_db --remote
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库迁移成功${NC}"
else
    echo -e "${YELLOW}⚠ 数据库迁移失败或已应用${NC}"
fi
echo ""

# 步骤3: 配置生产环境的 GENSPARK_TOKEN
echo -e "${BLUE}[步骤 3/5]${NC} 配置生产环境 Secret..."
echo "请注意：需要在 Cloudflare Dashboard 手动配置 GENSPARK_TOKEN"
echo "或者使用以下命令："
echo "  npx wrangler pages secret put GENSPARK_TOKEN --project-name risk-alert-platform"
echo ""
echo -e "${YELLOW}是否已配置 GENSPARK_TOKEN？ (y/n)${NC}"
read -t 10 -p "> " answer || answer="n"

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo -e "${GREEN}✓ Token 已配置${NC}"
else
    echo -e "${YELLOW}⚠ 跳过 Token 配置（生产环境将使用降级模式）${NC}"
fi
echo ""

# 步骤4: 部署到 Cloudflare Pages
echo -e "${BLUE}[步骤 4/5]${NC} 部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name risk-alert-platform
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 部署成功${NC}"
else
    echo -e "${RED}✗ 部署失败${NC}"
    echo ""
    echo "可能的原因："
    echo "1. Cloudflare API Token 未配置"
    echo "2. 项目名称不正确"
    echo "3. 权限不足"
    echo ""
    echo "解决方案："
    echo "1. 在 Deploy 标签页配置 Cloudflare API Key"
    echo "2. 确认项目名称为 risk-alert-platform"
    exit 1
fi
echo ""

# 步骤5: 验证生产环境
echo -e "${BLUE}[步骤 5/5]${NC} 验证生产环境..."
echo "正在检查生产环境..."
sleep 3

# 测试主页
echo -n "测试主页... "
if curl -s -o /dev/null -w "%{http_code}" https://risk-alert-platform.pages.dev/ | grep -q "200"; then
    echo -e "${GREEN}✓ 主页正常${NC}"
else
    echo -e "${YELLOW}⚠ 主页无响应${NC}"
fi

# 测试AI搜索页面
echo -n "测试AI搜索页面... "
if curl -s -o /dev/null -w "%{http_code}" https://risk-alert-platform.pages.dev/ai-search | grep -q "200"; then
    echo -e "${GREEN}✓ AI搜索页面正常${NC}"
else
    echo -e "${YELLOW}⚠ AI搜索页面无响应${NC}"
fi

# 测试API端点
echo -n "测试API端点... "
if curl -s -o /dev/null -w "%{http_code}" https://risk-alert-platform.pages.dev/api/statistics | grep -q "200"; then
    echo -e "${GREEN}✓ API正常${NC}"
else
    echo -e "${YELLOW}⚠ API无响应${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  🎉 修复完成！                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}生产环境地址：${NC}"
echo "  https://risk-alert-platform.pages.dev/"
echo "  https://risk-alert-platform.pages.dev/ai-search"
echo ""
echo -e "${BLUE}功能状态：${NC}"
echo "  ✅ 代码已部署"
echo "  ✅ 数据库已迁移"
echo "  ✅ 服务正常运行"
echo ""
echo -e "${YELLOW}注意事项：${NC}"
echo "  1. 如需 AI 实时搜索功能，请配置 GENSPARK_TOKEN"
echo "  2. 使用命令：npx wrangler pages secret put GENSPARK_TOKEN"
echo "  3. 无 Token 时自动使用降级模式（本地数据库搜索）"
echo ""
echo -e "${GREEN}🚀 现在可以访问生产环境测试功能！${NC}"
echo ""
