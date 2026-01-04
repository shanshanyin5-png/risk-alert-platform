-- 风险信息表
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,                 -- 公司名称
  title TEXT NOT NULL,                        -- 标题
  risk_item TEXT,                             -- 风险事项
  risk_time TEXT,                             -- 风险时间
  source TEXT,                                -- 来源
  risk_level TEXT,                            -- 风险等级
  risk_level_review TEXT,                     -- 风险等级复核
  risk_value_confirm TEXT,                    -- 风险价值确认
  risk_reason TEXT,                           -- 风险判定原因
  remark TEXT,                                -- 备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_risks_company ON risks(company_name);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_risks_time ON risks(risk_time);
CREATE INDEX IF NOT EXISTS idx_risks_created ON risks(created_at);

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
