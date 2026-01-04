-- 风险信息表 - 添加数据源字段
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,                 -- 公司名称
  title TEXT NOT NULL,                        -- 标题
  risk_item TEXT,                             -- 风险事项
  risk_time TEXT,                             -- 风险时间
  source TEXT,                                -- 来源链接
  source_type TEXT DEFAULT 'manual',          -- 数据源类型：manual(手动导入)/crawler(爬虫采集)
  source_platform TEXT,                       -- 来源平台：人民网、新华网、BBC等
  source_region TEXT,                         -- 来源地区：domestic(境内)/overseas(境外)
  risk_level TEXT,                            -- 风险等级
  risk_level_review TEXT,                     -- 风险等级复核
  risk_value_confirm TEXT,                    -- 风险价值确认
  risk_reason TEXT,                           -- 风险判定原因
  remark TEXT,                                -- 备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_risks_company ON risks(company_name);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_risks_time ON risks(risk_time);
CREATE INDEX IF NOT EXISTS idx_risks_created ON risks(created_at);
CREATE INDEX IF NOT EXISTS idx_risks_source_type ON risks(source_type);
CREATE INDEX IF NOT EXISTS idx_risks_source_region ON risks(source_region);

-- 预警规则配置表
CREATE TABLE IF NOT EXISTS alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,                    -- 规则名称
  company_filter TEXT,                        -- 公司筛选（JSON数组）
  risk_level_filter TEXT,                     -- 风险等级筛选（JSON数组）
  keyword_filter TEXT,                        -- 关键词筛选
  enabled INTEGER DEFAULT 1,                  -- 是否启用（0=禁用，1=启用）
  notify_email INTEGER DEFAULT 0,             -- 是否邮件通知
  notify_dingtalk INTEGER DEFAULT 0,          -- 是否钉钉通知
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预警历史记录表
CREATE TABLE IF NOT EXISTS alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER,                            -- 规则ID
  risk_id INTEGER,                            -- 风险ID
  alert_type TEXT,                            -- 预警类型（email/dingtalk）
  alert_status TEXT,                          -- 发送状态（success/failed）
  alert_message TEXT,                         -- 发送消息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id),
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- 创建预警历史索引
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_risk ON alert_history(risk_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created ON alert_history(created_at);

-- 数据源配置表（新增）
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,                  -- 数据源名称
  source_url TEXT NOT NULL,                   -- 数据源URL
  source_type TEXT NOT NULL,                  -- 类型：domestic/overseas
  crawler_enabled INTEGER DEFAULT 1,          -- 是否启用爬虫
  crawler_interval INTEGER DEFAULT 3600,      -- 爬取间隔（秒）
  last_crawled_at DATETIME,                   -- 最后爬取时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始数据源配置
INSERT OR IGNORE INTO data_sources (source_name, source_url, source_type) VALUES 
  ('人民网', 'http://www.people.com.cn', 'domestic'),
  ('新华网', 'http://www.xinhuanet.com', 'domestic'),
  ('央视网', 'http://www.cctv.com', 'domestic'),
  ('中国新闻网', 'http://www.chinanews.com', 'domestic'),
  ('BBC中文网', 'https://www.bbc.com/zhongwen/simp', 'overseas'),
  ('路透社', 'https://www.reuters.com', 'overseas'),
  ('美联社', 'https://apnews.com', 'overseas'),
  ('CNN', 'https://www.cnn.com', 'overseas');
