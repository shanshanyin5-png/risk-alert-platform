-- 添加数据源表缺失的字段
-- 迁移时间: 2026-01-04

ALTER TABLE data_sources ADD COLUMN enable_js INTEGER DEFAULT 0;
ALTER TABLE data_sources ADD COLUMN user_agent TEXT DEFAULT 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
ALTER TABLE data_sources ADD COLUMN timeout INTEGER DEFAULT 30;
ALTER TABLE data_sources ADD COLUMN status TEXT DEFAULT 'normal';
ALTER TABLE data_sources ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE data_sources ADD COLUMN success_rate REAL DEFAULT 0.0;
