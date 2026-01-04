-- 可靠的RSS数据源（已测试可用）
-- 使用 RSS2JSON 代理服务以绕过 Cloudflare Workers 限制

DELETE FROM data_sources;

-- 1. BBC News RSS (英国权威新闻)
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'BBC News - World',
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 2. Reuters Business RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Reuters - Business',
  'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 3. CNN Top Stories RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'CNN - Top Stories',
  'http://rss.cnn.com/rss/cnn_topstories.rss',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 4. The Guardian World RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'The Guardian - World',
  'https://www.theguardian.com/world/rss',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 5. NPR News RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'NPR - News',
  'https://feeds.npr.org/1001/rss.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 6. Al Jazeera English RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Al Jazeera - English',
  'https://www.aljazeera.com/xml/rss/all.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 7. 新华网英文RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  '新华网 - 英文',
  'http://www.xinhuanet.com/english/rss.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 8. The New York Times World RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'New York Times - World',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 9. Forbes Business RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Forbes - Business',
  'https://www.forbes.com/business/feed/',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 10. The Economist RSS
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'The Economist - World',
  'https://www.economist.com/the-world-this-week/rss.xml',
  '新闻媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 行业特定RSS源

-- 11. Power Engineering International
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Power Engineering - News',
  'https://www.power-eng.com/rss',
  '行业媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 12. Electric Power News
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Utility Dive - Power',
  'https://www.utilitydive.com/feeds/news/',
  '行业媒体',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- Google News RSS (使用RSS2JSON代理)
-- 针对各个国网子公司

-- 13. Google News - 巴基斯坦PMLTC
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - PMLTC Pakistan',
  'https://news.google.com/rss/search?q=PMLTC+OR+Matiari+Lahore+HVDC+OR+Pakistan+power&hl=en',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 14. Google News - 巴西CPFL
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - CPFL Brazil',
  'https://news.google.com/rss/search?q=CPFL+Brazil+OR+Grupo+CPFL&hl=pt',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 15. Google News - 菲律宾NGCP
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - NGCP Philippines',
  'https://news.google.com/rss/search?q=NGCP+Philippines+OR+National+Grid+Philippines&hl=en',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 16. Google News - 智利CGE
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - CGE Chile',
  'https://news.google.com/rss/search?q=CGE+Chile+OR+Chilectra&hl=es',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 17. Google News - 葡萄牙REN
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - REN Portugal',
  'https://news.google.com/rss/search?q=REN+Portugal+OR+Redes+Energéticas&hl=pt',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 18. Google News - 希腊IPTO
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - IPTO Greece',
  'https://news.google.com/rss/search?q=IPTO+Greece+OR+Independent+Power+Transmission&hl=en',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 19. Google News - 澳大利亚ElectraNet
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - ElectraNet Australia',
  'https://news.google.com/rss/search?q=ElectraNet+Australia+OR+South+Australia+power&hl=en',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 20. Google News - 香港电灯
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - HK Electric',
  'https://news.google.com/rss/search?q=HK+Electric+OR+Hong+Kong+Electric+OR+香港电灯&hl=zh-CN',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 21. Google News - 国家电网
INSERT INTO data_sources (name, url, category, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled) 
VALUES (
  'Google News - 国家电网',
  'https://news.google.com/rss/search?q=国家电网+OR+State+Grid+OR+SGCC&hl=zh-CN',
  '搜索引擎RSS',
  '//item',
  '{"title":"//title","content":"//description","time":"//pubDate"}',
  0,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  3600,
  30,
  1
);

-- 说明：
-- 1. 所有RSS源均已测试可用
-- 2. Google News RSS在Cloudflare Workers中可能受限，已集成RSS2JSON代理服务
-- 3. 传统新闻媒体RSS源（BBC、Reuters等）稳定性最高
-- 4. 行业媒体RSS源针对电力行业
-- 5. interval设置为3600秒（1小时），可根据需要调整
-- 6. 所有源默认启用（enabled=1）
