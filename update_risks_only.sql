ALTER TABLE risks ADD COLUMN source_platform TEXT;
ALTER TABLE risks ADD COLUMN source_region TEXT;
UPDATE risks SET source_type = 'manual', source_region = 'domestic' WHERE source_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_risks_source_type ON risks(source_type);
CREATE INDEX IF NOT EXISTS idx_risks_source_region ON risks(source_region);
