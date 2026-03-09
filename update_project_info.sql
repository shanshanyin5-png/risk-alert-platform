-- 更新现有风险数据，添加项目关联信息
-- 基于已知的国网海外项目

-- ====== 巴西CPFL项目 ======

-- 更新CPFL相关风险，添加巴西输电项目信息
UPDATE risks 
SET project_name = 'Brazil Northeast Transmission Network',
    project_location = 'Northeast Brazil',
    project_type = 'Transmission',
    project_capacity = '500kV transmission lines',
    project_investment = '$2.5 billion',
    project_status = 'Operational',
    project_start_date = '2016-01-01',
    project_completion_date = '2024-12-31'
WHERE company_name = '巴西CPFL公司' 
  AND (title LIKE '%Brazil%' OR title LIKE '%transmission%' OR title LIKE '%Northeast%');

-- 更新State Grid Brazil云开放日活动
UPDATE risks
SET project_name = 'China-Brazil-Chile Energy Cooperation',
    project_location = 'Multi-country',
    project_type = 'International Cooperation',
    project_status = 'Active'
WHERE title LIKE '%China-Brazil-Chile%';

-- ====== 菲律宾NGCP项目 ======

-- 更新NGCP P12.3 billion输电项目
UPDATE risks
SET project_name = 'NGCP Transmission Expansion Program',
    project_location = 'Philippines',
    project_type = 'Transmission',
    project_capacity = '230kV & 500kV transmission lines',
    project_investment = 'P12.3 billion ($220 million)',
    project_status = 'Construction',
    project_start_date = '2024-01-01',
    project_completion_date = '2026-12-31'
WHERE title LIKE '%P12.3 billion%' OR title LIKE '%P12.3-billion%';

-- 更新NGCP七个主要输电项目
UPDATE risks
SET project_name = 'NGCP Seven Major Transmission Projects 2026',
    project_location = 'Philippines (Nationwide)',
    project_type = 'Transmission',
    project_capacity = 'Multiple voltage levels',
    project_investment = 'TBD',
    project_status = 'Planning',
    project_start_date = '2026-01-01',
    project_completion_date = '2026-12-31'
WHERE title LIKE '%seven major transmission projects%';

-- 更新其他NGCP运营风险
UPDATE risks
SET project_name = 'NGCP National Grid Operations',
    project_location = 'Philippines',
    project_type = 'Grid Operations',
    project_status = 'Operational'
WHERE company_name = '菲律宾NGCP公司' 
  AND project_name IS NULL;

-- ====== 巴基斯坦PMLTC项目 ======

-- 更新Matiari-Lahore HVDC特高压直流输电线路
UPDATE risks
SET project_name = 'Matiari-Lahore HVDC Transmission Line',
    project_location = 'Pakistan (Matiari to Lahore)',
    project_type = 'HVDC Transmission',
    project_capacity = '±660kV 4000MW',
    project_investment = '$1.65 billion',
    project_status = 'Operational',
    project_start_date = '2016-12-01',
    project_completion_date = '2021-09-01'
WHERE title LIKE '%Matiari-Lahore%';

-- 更新巴基斯坦电力短缺相关风险
UPDATE risks
SET project_name = 'Pakistan Power Grid Infrastructure',
    project_location = 'Pakistan (Nationwide)',
    project_type = 'Grid Operations',
    project_status = 'Operational'
WHERE company_name = '巴基斯坦PMLTC公司'
  AND (title LIKE '%shortfall%' OR title LIKE '%loadshedding%' OR title LIKE '%electricity%')
  AND project_name IS NULL;

-- ====== 国家电网公司项目 ======

-- 更新国家电网4万亿元投资计划
UPDATE risks
SET project_name = 'State Grid 4 Trillion Yuan Grid Upgrade Plan (2026-2030)',
    project_location = 'China (Nationwide)',
    project_type = 'Grid Modernization',
    project_capacity = 'Ultra-High Voltage & Smart Grid',
    project_investment = '$574 billion (4 trillion yuan)',
    project_status = 'Planning',
    project_start_date = '2026-01-01',
    project_completion_date = '2030-12-31'
WHERE title LIKE '%$574 billion%' OR title LIKE '%4 trillion yuan%';

-- 更新第十五个五年计划
UPDATE risks
SET project_name = 'State Grid 15th Five-Year Plan Fixed Assets Investment',
    project_location = 'China (Nationwide)',
    project_type = 'Grid Infrastructure',
    project_capacity = 'UHV & Smart Grid',
    project_investment = '4 trillion yuan',
    project_status = 'Planning',
    project_start_date = '2026-01-01',
    project_completion_date = '2030-12-31'
WHERE title LIKE '%15th Five-Year Plan%' OR title LIKE '%固定资产%';

-- 更新国家电网多元化战略
UPDATE risks
SET project_name = 'State Grid Multi-faceted Growth Strategy',
    project_location = 'Global',
    project_type = 'Strategic Development',
    project_status = 'Active'
WHERE title LIKE '%multi-faceted growth strategy%';

-- 更新能源转型投资分析
UPDATE risks
SET project_name = 'China Energy Transition Investment Program',
    project_location = 'China',
    project_type = 'Renewable Energy Integration',
    project_status = 'Active'
WHERE title LIKE '%energy transition%';

-- ====== 中国南方电网公司项目 ======

-- 更新南方电网260亿美元年度投资
UPDATE risks
SET project_name = 'China Southern Power Grid 2026 Investment Plan',
    project_location = 'Southern China',
    project_type = 'Grid Infrastructure',
    project_investment = '$26 billion (180 billion yuan)',
    project_status = 'Active',
    project_start_date = '2026-01-01',
    project_completion_date = '2026-12-31'
WHERE title LIKE '%$26 billion%' OR title LIKE '%180 billion yuan%';

-- 更新世界能源理事会成员
UPDATE risks
SET project_name = 'World Energy Council Patron Membership',
    project_location = 'Global',
    project_type = 'International Membership',
    project_status = 'Active'
WHERE title LIKE '%World Energy Council%';

-- ====== 其他国际项目 ======

-- 更新澳大利亚项目
UPDATE risks
SET project_name = 'Australia Grid Assets Portfolio',
    project_location = 'Australia',
    project_type = 'Grid Operations',
    project_status = 'Operational'
WHERE company_name = '澳大利亚澳洲资产公司' AND project_name IS NULL;

-- 更新葡萄牙REN项目
UPDATE risks
SET project_name = 'Portugal REN Transmission Network',
    project_location = 'Portugal',
    project_type = 'Transmission',
    project_status = 'Operational'
WHERE company_name = '葡萄牙REN公司' AND project_name IS NULL;

-- 验证更新
-- 以下查询可以验证项目信息是否正确添加
-- SELECT company_name, project_name, project_location, project_type, COUNT(*) as count
-- FROM risks
-- WHERE project_name IS NOT NULL
-- GROUP BY company_name, project_name
-- ORDER BY company_name, count DESC;
