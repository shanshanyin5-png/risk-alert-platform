#!/bin/bash
# 快速部署脚本

echo "🚀 开始部署到 Cloudflare Pages..."

# 1. 构建
echo "📦 构建中..."
npm run build

# 2. 检查构建结果
if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功！"

# 3. 部署到生产环境
echo "☁️  部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name risk-alert-platform

# 4. 检查部署结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 访问地址："
    echo "   https://risk-alert-platform.pages.dev"
    echo ""
    echo "📊 查看数据源状态："
    echo "   curl https://risk-alert-platform.pages.dev/api/datasources"
    echo ""
    echo "🔄 触发一键爬取："
    echo "   curl -X POST https://risk-alert-platform.pages.dev/api/crawl/all"
else
    echo ""
    echo "❌ 部署失败！"
    echo "请检查："
    echo "1. Cloudflare API Token 是否配置正确"
    echo "2. 网络连接是否正常"
    echo "3. 查看上面的错误信息"
    exit 1
fi
