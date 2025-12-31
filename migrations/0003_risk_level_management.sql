-- 创建企业表
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  creditCode TEXT UNIQUE,
  currentLevel TEXT DEFAULT '中风险',
  riskCount INTEGER DEFAULT 0,
  lastAdjustTime DATETIME,
  adjustedBy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建风险等级调整历史表
CREATE TABLE IF NOT EXISTS risk_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyId TEXT NOT NULL,
  companyName TEXT NOT NULL,
  fromLevel TEXT NOT NULL,
  toLevel TEXT NOT NULL,
  reason TEXT,
  adjustedBy TEXT NOT NULL,
  adjustedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_level ON companies(currentLevel);
CREATE INDEX IF NOT EXISTS idx_history_company ON risk_level_history(companyId);
CREATE INDEX IF NOT EXISTS idx_history_time ON risk_level_history(adjustedAt DESC);

-- 初始化企业数据（从现有风险数据中提取）
INSERT OR IGNORE INTO companies (id, name, creditCode, currentLevel, riskCount)
SELECT 
  company_name as id,
  company_name as name,
  CAST(ABS(RANDOM() % 10000000000000000 + 9100000000000000) AS TEXT) as creditCode,
  CASE 
    WHEN COUNT(*) >= 20 THEN '高风险'
    WHEN COUNT(*) >= 10 THEN '中风险'
    ELSE '低风险'
  END as currentLevel,
  COUNT(*) as riskCount
FROM risks
GROUP BY company_name;
