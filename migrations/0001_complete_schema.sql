-- 国网风险预警平台 - 完整数据库架构
-- 创建时间: 2026-01-04

-- 1. 企业表
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  credit_code TEXT,
  current_level TEXT DEFAULT '低风险',
  risk_count INTEGER DEFAULT 0,
  last_adjust_time DATETIME,
  adjusted_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 风险信息表
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  risk_item TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_time TEXT,
  source TEXT,
  source_url TEXT,
  risk_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 数据源表
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT '其他',
  xpath_rules TEXT,
  field_mapping TEXT,
  interval INTEGER DEFAULT 3600,
  enabled INTEGER DEFAULT 1,
  last_crawl_time DATETIME,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 风险等级调整历史表
CREATE TABLE IF NOT EXISTS risk_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  reason TEXT,
  adjusted_by TEXT NOT NULL,
  adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  time_window INTEGER NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 预警记录表
CREATE TABLE IF NOT EXISTS alert_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  rule_id INTEGER,
  risk_count INTEGER NOT NULL,
  alert_level TEXT NOT NULL,
  alert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  handled_by TEXT,
  handled_at DATETIME,
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
);

-- 7. 通知日志表
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER,
  channel TEXT NOT NULL,
  recipients TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'success',
  FOREIGN KEY (alert_id) REFERENCES alert_records(id)
);

-- 8. 风险规则表
CREATE TABLE IF NOT EXISTS risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,
  keywords TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_level ON companies(current_level);
CREATE INDEX IF NOT EXISTS idx_risks_company ON risks(company_name);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_risks_time ON risks(created_at);
CREATE INDEX IF NOT EXISTS idx_data_sources_enabled ON data_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_records_status ON alert_records(status);
CREATE INDEX IF NOT EXISTS idx_risk_level_history_company ON risk_level_history(company_id);
CREATE INDEX IF NOT EXISTS idx_risk_level_history_time ON risk_level_history(adjusted_at);

-- 插入默认预警规则
INSERT OR IGNORE INTO alert_rules (rule_name, risk_level, threshold, time_window, enabled) VALUES
  ('高风险企业监控', '高风险', 3, 7, 1),
  ('中风险企业监控', '中风险', 5, 7, 1),
  ('低风险企业监控', '低风险', 10, 30, 1);

-- 插入默认风险规则
INSERT OR IGNORE INTO risk_rules (rule_name, keywords, risk_level, enabled) VALUES
  ('重大安全事故', '安全事故,人员伤亡,爆炸,火灾', '高风险', 1),
  ('财务问题', '资金链,债务,违约,亏损', '高风险', 1),
  ('法律纠纷', '诉讼,仲裁,合规,违规', '中风险', 1),
  ('运营问题', '停工,延期,质量问题', '中风险', 1),
  ('政策变化', '政策调整,监管,审批', '低风险', 1);
