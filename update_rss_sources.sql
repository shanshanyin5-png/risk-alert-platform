-- 清空旧的数据源并导入新的RSS数据源

-- 清空现有数据源（保留表结构）
DELETE FROM data_sources;

-- 重置自增ID
DELETE FROM sqlite_sequence WHERE name='data_sources';

-- 导入新的RSS数据源

-- Google News RSS - 公司专属源（中英文各9个公司 = 18个）
INSERT INTO data_sources (name, url, category, xpath_rules, enabled, status) VALUES
('Google News - 国家电网 (中文)', 'https://news.google.com/rss/search?q=国家电网+OR+State+Grid+OR+SGCC&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 国家电网 (英文)', 'https://news.google.com/rss/search?q=国家电网+OR+State+Grid+OR+SGCC&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 巴基斯坦PMLTC (中文)', 'https://news.google.com/rss/search?q=PMLTC+OR+Matiari+Lahore+HVDC+OR+Pakistan+power&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 巴基斯坦PMLTC (英文)', 'https://news.google.com/rss/search?q=PMLTC+OR+Matiari+Lahore+HVDC+OR+Pakistan+power&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 巴西CPFL (中文)', 'https://news.google.com/rss/search?q=CPFL+Brazil+OR+Grupo+CPFL&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 巴西CPFL (英文)', 'https://news.google.com/rss/search?q=CPFL+Brazil+OR+Grupo+CPFL&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 菲律宾NGCP (中文)', 'https://news.google.com/rss/search?q=NGCP+Philippines+OR+National+Grid+Philippines&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 菲律宾NGCP (英文)', 'https://news.google.com/rss/search?q=NGCP+Philippines+OR+National+Grid+Philippines&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 智利CGE (中文)', 'https://news.google.com/rss/search?q=CGE+Chile+OR+Chilectra&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 智利CGE (英文)', 'https://news.google.com/rss/search?q=CGE+Chile+OR+Chilectra&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 葡萄牙REN (中文)', 'https://news.google.com/rss/search?q=REN+Portugal+OR+Redes+Energéticas&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 葡萄牙REN (英文)', 'https://news.google.com/rss/search?q=REN+Portugal+OR+Redes+Energéticas&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 希腊IPTO (中文)', 'https://news.google.com/rss/search?q=IPTO+Greece+OR+Independent+Power+Transmission&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 希腊IPTO (英文)', 'https://news.google.com/rss/search?q=IPTO+Greece+OR+Independent+Power+Transmission&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 澳大利亚ElectraNet (中文)', 'https://news.google.com/rss/search?q=ElectraNet+Australia+OR+South+Australia+power&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 澳大利亚ElectraNet (英文)', 'https://news.google.com/rss/search?q=ElectraNet+Australia+OR+South+Australia+power&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),

('Google News - 香港电灯 (中文)', 'https://news.google.com/rss/search?q=HK+Electric+OR+Hong+Kong+Electric+OR+香港电灯&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 香港电灯 (英文)', 'https://news.google.com/rss/search?q=HK+Electric+OR+Hong+Kong+Electric+OR+香港电灯&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal');

-- 通用新闻RSS源（10个）
INSERT INTO data_sources (name, url, category, xpath_rules, enabled, status) VALUES
('Google News - 能源行业 (中文)', 'https://news.google.com/rss/search?q=能源+电力+电网&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('Google News - Energy Sector (英文)', 'https://news.google.com/rss/search?q=energy+power+grid+electricity&hl=en-US&gl=US&ceid=US:en', '搜索引擎RSS', '', 1, 'normal'),
('Google News - 海外投资', 'https://news.google.com/rss/search?q=中国+海外+投资+能源&hl=zh-CN&gl=CN&ceid=CN:zh-CN', '搜索引擎RSS', '', 1, 'normal'),
('BBC News World', 'http://feeds.bbci.co.uk/news/world/rss.xml', '新闻媒体', '', 1, 'normal'),
('BBC News Business', 'http://feeds.bbci.co.uk/news/business/rss.xml', '新闻媒体', '', 1, 'normal'),
('CNN World RSS', 'http://rss.cnn.com/rss/edition_world.rss', '新闻媒体', '', 1, 'normal'),
('CNN Business RSS', 'http://rss.cnn.com/rss/money_latest.rss', '新闻媒体', '', 1, 'normal'),
('新华网能源频道', 'http://www.xinhuanet.com/power/news_power.xml', '新闻媒体', '', 1, 'normal'),
('人民网能源频道', 'http://energy.people.com.cn/rss/energy.xml', '新闻媒体', '', 1, 'normal'),
('中新网国际', 'http://www.chinanews.com/rss/scroll-news.xml', '新闻媒体', '', 1, 'normal');

-- 行业专业媒体RSS（5个）
INSERT INTO data_sources (name, url, category, xpath_rules, enabled, status) VALUES
('Power Engineering', 'https://www.power-eng.com/feed/', '行业媒体', '', 1, 'normal'),
('Utility Dive', 'https://www.utilitydive.com/feeds/news/', '行业媒体', '', 1, 'normal'),
('Energy Central', 'https://energycentral.com/rss.xml', '行业媒体', '', 1, 'normal'),
('Renewable Energy World', 'https://www.renewableenergyworld.com/feed/', '行业媒体', '', 1, 'normal'),
('Electric Light & Power', 'https://www.elp.com/feed/', '行业媒体', '', 1, 'normal');

-- 区域新闻RSS（5个）
INSERT INTO data_sources (name, url, category, xpath_rules, enabled, status) VALUES
('Latin America News', 'https://news.google.com/rss/search?q=Latin+America+energy+power&hl=en-US&gl=US&ceid=US:en', '区域媒体', '', 1, 'normal'),
('Asia Pacific Energy', 'https://news.google.com/rss/search?q=Asia+Pacific+energy+power+grid&hl=en-US&gl=US&ceid=US:en', '区域媒体', '', 1, 'normal'),
('South America Power', 'https://news.google.com/rss/search?q=South+America+electricity+utilities&hl=en-US&gl=US&ceid=US:en', '区域媒体', '', 1, 'normal'),
('Southeast Asia Energy', 'https://news.google.com/rss/search?q=Southeast+Asia+power+transmission&hl=en-US&gl=US&ceid=US:en', '区域媒体', '', 1, 'normal'),
('Middle East Power', 'https://news.google.com/rss/search?q=Middle+East+energy+infrastructure&hl=en-US&gl=US&ceid=US:en', '区域媒体', '', 1, 'normal');

-- 总计：18个公司专属 + 10个通用新闻 + 5个行业媒体 + 5个区域媒体 = 38个RSS源
