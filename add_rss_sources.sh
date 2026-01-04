#!/bin/bash
# 脚本：为生产环境批量添加可靠RSS数据源
# 用途：无需重新部署，直接通过API配置

BASE_URL="https://risk-alert-platform.pages.dev"

echo "🚀 开始配置可靠RSS数据源..."
echo "目标环境: $BASE_URL"
echo ""

# 12个可靠RSS数据源配置
declare -a sources=(
  # BBC News
  '{"name":"BBC News - World","url":"http://feeds.bbci.co.uk/news/world/rss.xml","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Reuters
  '{"name":"Reuters - Business","url":"https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # CNN
  '{"name":"CNN - Top Stories","url":"http://rss.cnn.com/rss/cnn_topstories.rss","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # The Guardian
  '{"name":"The Guardian - World","url":"https://www.theguardian.com/world/rss","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # NPR
  '{"name":"NPR - News","url":"https://feeds.npr.org/1001/rss.xml","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Al Jazeera
  '{"name":"Al Jazeera - English","url":"https://www.aljazeera.com/xml/rss/all.xml","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # 新华网
  '{"name":"新华网 - 英文","url":"http://www.xinhuanet.com/english/rss.xml","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # New York Times
  '{"name":"New York Times - World","url":"https://rss.nytimes.com/services/xml/rss/nyt/World.xml","category":"新闻媒体","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Google News - PMLTC Pakistan
  '{"name":"Google News - PMLTC Pakistan","url":"https://news.google.com/rss/search?q=PMLTC+OR+Matiari+Lahore+HVDC+OR+Pakistan+power&hl=en","category":"搜索引擎RSS","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Google News - CPFL Brazil
  '{"name":"Google News - CPFL Brazil","url":"https://news.google.com/rss/search?q=CPFL+Brazil+OR+Grupo+CPFL&hl=pt","category":"搜索引擎RSS","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Google News - NGCP Philippines
  '{"name":"Google News - NGCP Philippines","url":"https://news.google.com/rss/search?q=NGCP+Philippines+OR+National+Grid+Philippines&hl=en","category":"搜索引擎RSS","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
  
  # Google News - 国家电网
  '{"name":"Google News - 国家电网","url":"https://news.google.com/rss/search?q=国家电网+OR+State+Grid+OR+SGCC&hl=zh-CN","category":"搜索引擎RSS","xpathRules":"//item","fieldMapping":"{\"title\":\"//title\",\"content\":\"//description\",\"time\":\"//pubDate\"}","enableJS":false,"userAgent":"Mozilla/5.0","interval":3600,"timeout":30,"enabled":true}'
)

success_count=0
fail_count=0

for source in "${sources[@]}"; do
  name=$(echo "$source" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
  echo "正在添加: $name"
  
  response=$(curl -s -X POST "$BASE_URL/api/datasources" \
    -H "Content-Type: application/json" \
    -d "$source")
  
  if echo "$response" | grep -q '"success":true'; then
    echo "✅ 成功"
    ((success_count++))
  else
    echo "❌ 失败: $response"
    ((fail_count++))
  fi
  
  sleep 1
done

echo ""
echo "================================================"
echo "配置完成！"
echo "成功: $success_count 个"
echo "失败: $fail_count 个"
echo "================================================"
echo ""
echo "下一步：测试一键更新"
echo "curl -X POST $BASE_URL/api/crawl/all"
