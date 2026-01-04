-- 国网风险预警平台 - Supabase PostgreSQL Schema
-- 从 SQLite 迁移到 PostgreSQL

-- 1. 企业表
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  credit_code TEXT,
  current_level TEXT DEFAULT '低风险',
  risk_count INTEGER DEFAULT 0,
  last_adjust_time TIMESTAMP,
  adjusted_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 风险信息表
CREATE TABLE IF NOT EXISTS risks (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  risk_item TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_time TEXT,
  source TEXT,
  source_url TEXT,
  risk_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 数据源表
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT '其他',
  xpath_rules TEXT,
  field_mapping TEXT,
  interval INTEGER DEFAULT 3600,
  enabled BOOLEAN DEFAULT true,
  last_crawl_time TIMESTAMP,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 风险等级调整历史表
CREATE TABLE IF NOT EXISTS risk_level_history (
  id SERIAL PRIMARY KEY,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  from_level TEXT NOT NULL,
  to_level TEXT NOT NULL,
  reason TEXT,
  adjusted_by TEXT NOT NULL,
  adjusted_at TIMESTAMP DEFAULT NOW()
);

-- 5. 预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  time_window INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 预警记录表
CREATE TABLE IF NOT EXISTS alert_records (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  rule_id INTEGER,
  risk_count INTEGER NOT NULL,
  alert_level TEXT NOT NULL,
  alert_time TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  handled_by TEXT,
  handled_at TIMESTAMP,
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
);

-- 7. 通知日志表
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER,
  channel TEXT NOT NULL,
  recipients TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'success',
  FOREIGN KEY (alert_id) REFERENCES alert_records(id)
);

-- 8. 风险规则表
CREATE TABLE IF NOT EXISTS risk_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  keywords TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提高查询性能
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
INSERT INTO alert_rules (rule_name, risk_level, threshold, time_window, enabled) VALUES
  ('高风险企业监控', '高风险', 3, 7, true),
  ('中风险企业监控', '中风险', 5, 7, true),
  ('低风险企业监控', '低风险', 10, 30, true)
ON CONFLICT DO NOTHING;

-- 插入默认风险规则
INSERT INTO risk_rules (rule_name, keywords, risk_level, enabled) VALUES
  ('重大安全事故', '安全事故,人员伤亡,爆炸,火灾', '高风险', true),
  ('财务问题', '资金链,债务,违约,亏损', '高风险', true),
  ('法律纠纷', '诉讼,仲裁,合规,违规', '中风险', true),
  ('运营问题', '停工,延期,质量问题', '中风险', true),
  ('政策变化', '政策调整,监管,审批', '低风险', true)
ON CONFLICT DO NOTHING;
