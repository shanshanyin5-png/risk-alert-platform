
-- 创建信息源表
CREATE TABLE IF NOT EXISTS news_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  xpath_rules TEXT,
  field_mapping TEXT,
  enable_js INTEGER DEFAULT 0,
  user_agent TEXT,
  interval INTEGER DEFAULT 3600,
  timeout INTEGER DEFAULT 30,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'normal',
  last_crawl_time TEXT,
  success_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 1. grupocpfl(公司官网)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('grupocpfl(公司官网)', 'https://grupocpfl.com.br', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 2. cge(公司官网)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('cge(公司官网)', 'https://cge.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 3. pcij(NGO/研究机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('pcij(NGO/研究机构)', 'https://pcij.org', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 4. scmp(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('scmp(新闻媒体)', 'https://scmp.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 5. abc(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('abc(新闻媒体)', 'https://abc.net.au', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 6. ngcp(公司官网)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('ngcp(公司官网)', 'https://ngcp.ph', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 7. jemena(公司官网)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('jemena(公司官网)', 'https://jemena.com.au', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 8. diarioconstitucional(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('diarioconstitucional(新闻媒体)', 'https://diarioconstitucional.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 9. in-cyprus(其他)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('in-cyprus(其他)', 'https://in-cyprus.philenews.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 10. botucatu(政府/监管机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('botucatu(政府/监管机构)', 'https://botucatu.sp.gov.br', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 11. sinergiacut(NGO/研究机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('sinergiacut(NGO/研究机构)', 'https://sinergiacut.org.br', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 12. eldesconcierto(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('eldesconcierto(新闻媒体)', 'https://eldesconcierto.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 13. tvosanvicente(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('tvosanvicente(新闻媒体)', 'https://tvosanvicente.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 14. cnnchile(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('cnnchile(新闻媒体)', 'https://cnnchile.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 15. youtube(社交媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('youtube(社交媒体)', 'https://youtube.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 16. pjud(政府/监管机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('pjud(政府/监管机构)', 'https://pjud.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 17. df(其他)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('df(其他)', 'https://df.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 18. miragenews(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('miragenews(新闻媒体)', 'https://miragenews.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 19. dawn(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('dawn(新闻媒体)', 'https://dawn.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 20. pib(NGO/研究机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('pib(NGO/研究机构)', 'https://pib.socioambiental.org', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 21. digitalpakistan(其他)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('digitalpakistan(其他)', 'https://digitalpakistan.pk', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 22. bloomberg(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('bloomberg(新闻媒体)', 'https://bloomberg.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 23. emol(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('emol(新闻媒体)', 'https://emol.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 24. voachinese(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('voachinese(新闻媒体)', 'https://voachinese.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 25. sernac(政府/监管机构)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('sernac(政府/监管机构)', 'https://sernac.cl', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 26. cnnbrasil(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('cnnbrasil(新闻媒体)', 'https://cnnbrasil.com.br', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 27. pv-magazine-australia(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('pv-magazine-australia(新闻媒体)', 'https://pv-magazine-australia.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 28. powerphilippines(其他)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('powerphilippines(其他)', 'https://powerphilippines.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 29. journalnews(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('journalnews(新闻媒体)', 'https://journalnews.com.ph', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 30. abs-cbn(新闻媒体)
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('abs-cbn(新闻媒体)', 'https://abs-cbn.com', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);


-- 31. profit
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES ('profit', 'https://profit.pakistantoday.com.pk/', '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]', '{"title":"//h1 | //h2 | //h3","content":"//p | //div[@class=\"content\"]","time":"//time | //span[@class=\"date\"]"}', 0, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 3600, 30, 1, 'normal', NULL, 0);
