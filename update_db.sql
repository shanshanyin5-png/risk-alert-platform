ALTER TABLE risks ADD COLUMN source_platform TEXT;
ALTER TABLE risks ADD COLUMN source_region TEXT;
UPDATE risks SET source_type = 'manual', source_region = 'domestic' WHERE source_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_risks_source_type ON risks(source_type);
CREATE INDEX IF NOT EXISTS idx_risks_source_region ON risks(source_region);

CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  last_crawled DATETIME
);

INSERT OR IGNORE INTO data_sources (id, name, url, type) VALUES 
  (1, '人民网', 'http://www.people.com.cn', 'domestic'),
  (2, '新华网', 'http://www.xinhuanet.com', 'domestic'),
  (3, '央视网', 'http://www.cctv.com', 'domestic'),
  (4, '中国新闻网', 'http://www.chinanews.com', 'domestic'),
  (5, 'BBC中文网', 'https://www.bbc.com/zhongwen/simp', 'overseas'),
  (6, '路透社', 'https://www.reuters.com', 'overseas'),
  (7, '美联社', 'https://apnews.com', 'overseas'),
  (8, 'CNN', 'https://www.cnn.com', 'overseas');
