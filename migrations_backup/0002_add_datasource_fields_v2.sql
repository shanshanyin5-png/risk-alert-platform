-- 添加新字段到risks表
ALTER TABLE risks ADD COLUMN source_type TEXT DEFAULT 'manual';
ALTER TABLE risks ADD COLUMN source_platform TEXT;
ALTER TABLE risks ADD COLUMN source_region TEXT;
ALTER TABLE risks ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 更新现有数据，将手动导入的数据标记为manual
UPDATE risks SET source_type = 'manual', source_region = 'domestic' WHERE source_type IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_risks_source_type ON risks(source_type);
CREATE INDEX IF NOT EXISTS idx_risks_source_region ON risks(source_region);

-- 创建数据源配置表
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  crawler_enabled INTEGER DEFAULT 1,
  crawler_interval INTEGER DEFAULT 3600,
  last_crawled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始数据源配置
INSERT OR IGNORE INTO data_sources (id, source_name, source_url, source_type) VALUES 
  (1, '人民网', 'http://www.people.com.cn', 'domestic'),
  (2, '新华网', 'http://www.xinhuanet.com', 'domestic'),
  (3, '央视网', 'http://www.cctv.com', 'domestic'),
  (4, '中国新闻网', 'http://www.chinanews.com', 'domestic'),
  (5, 'BBC中文网', 'https://www.bbc.com/zhongwen/simp', 'overseas'),
  (6, '路透社', 'https://www.reuters.com', 'overseas'),
  (7, '美联社', 'https://apnews.com', 'overseas'),
  (8, 'CNN', 'https://www.cnn.com', 'overseas');
