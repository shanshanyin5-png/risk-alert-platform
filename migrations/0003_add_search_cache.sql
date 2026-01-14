-- 创建搜索缓存表
-- 用于存储实时搜索的结果，避免重复搜索相同关键词

CREATE TABLE IF NOT EXISTS search_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,              -- 缓存键 (keyword + filters hash)
  keyword TEXT NOT NULL,                        -- 搜索关键词
  filters_json TEXT,                            -- 筛选条件JSON
  result_json TEXT NOT NULL,                    -- 搜索结果JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_cache_keyword ON search_cache(keyword);
CREATE INDEX IF NOT EXISTS idx_search_cache_created_at ON search_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_cache_key ON search_cache(cache_key);

-- 注释
-- cache_key: 由keyword和filters组合生成的唯一键
-- keyword: 用户输入的搜索关键词
-- filters_json: 筛选条件（company, riskLevel, timeRange）的JSON字符串
-- result_json: 完整的搜索结果JSON（RealtimeSearchResponse）
-- created_at: 缓存创建时间，用于判断是否过期（24小时）
