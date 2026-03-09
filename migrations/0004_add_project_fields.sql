-- 添加项目关联字段到risks表
-- Migration: 0004_add_project_fields.sql
-- Date: 2026-03-09
-- Description: 为每个风险事件添加关联项目信息

-- 添加项目相关字段
ALTER TABLE risks ADD COLUMN project_name TEXT;
ALTER TABLE risks ADD COLUMN project_location TEXT;
ALTER TABLE risks ADD COLUMN project_type TEXT;
ALTER TABLE risks ADD COLUMN project_capacity TEXT;
ALTER TABLE risks ADD COLUMN project_investment TEXT;
ALTER TABLE risks ADD COLUMN project_status TEXT;
ALTER TABLE risks ADD COLUMN project_start_date TEXT;
ALTER TABLE risks ADD COLUMN project_completion_date TEXT;

-- 创建项目索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_risks_project_name ON risks(project_name);
CREATE INDEX IF NOT EXISTS idx_risks_project_location ON risks(project_location);
CREATE INDEX IF NOT EXISTS idx_risks_project_type ON risks(project_type);

-- 字段说明:
-- project_name: 项目名称，例如 "Matiari-Lahore HVDC Transmission Line"
-- project_location: 项目位置，例如 "Pakistan" 或 "Brazil Northeast"  
-- project_type: 项目类型，例如 "Transmission", "Distribution", "Generation", "Smart Grid"
-- project_capacity: 项目容量，例如 "±660kV 4000MW" 或 "230kV 500km"
-- project_investment: 项目投资额，例如 "$2.2 billion" 或 "P12.3 billion"
-- project_status: 项目状态，例如 "Planning", "Construction", "Operational", "Maintenance"
-- project_start_date: 项目开始日期，例如 "2020-01-15"
-- project_completion_date: 项目完成日期，例如 "2026-12-31"
