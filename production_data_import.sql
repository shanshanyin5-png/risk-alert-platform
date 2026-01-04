-- 国网风险预警平台 - 生产环境数据导入
-- 包含：企业信息、风险数据、数据源配置

-- 1. 插入企业数据
INSERT OR IGNORE INTO companies (name, credit_code, current_level, risk_count, last_adjust_time, adjusted_by, created_at) VALUES
  ('巴基斯坦PMLTC公司', '91110000000000001X', '中风险', 33, '2025-12-31 07:55:13', '测试用户', '2025-12-31 07:55:01'),
  ('巴西CPFL公司', '91110000000000002X', '低风险', 18, '2025-12-31 07:55:20', '系统管理员', '2025-12-31 07:55:01'),
  ('菲律宾NGCP公司', '91110000000000003X', '低风险', 17, '2025-12-31 07:55:20', '系统管理员', '2025-12-31 07:55:01'),
  ('智利CGE公司', '91110000000000004X', '中风险', 15, NULL, NULL, '2025-12-31 07:55:01'),
  ('香港电灯公司', '91110000000000005X', '低风险', 5, NULL, NULL, '2025-12-31 07:55:01'),
  ('南澳Electranet', '91110000000000006X', '低风险', 4, NULL, NULL, '2025-12-31 07:55:01'),
  ('国家电网巴西控股公司', '91110000000000007X', '低风险', 2, NULL, NULL, '2025-12-31 07:55:01'),
  ('希腊IPTO公司', '91110000000000008X', '低风险', 2, NULL, NULL, '2025-12-31 07:55:01'),
  ('澳大利亚澳洲资产公司', '91110000000000009X', '低风险', 2, NULL, NULL, '2025-12-31 07:55:01'),
  ('测试公司', '91110000000000010X', '低风险', 1, NULL, NULL, '2025-12-31 07:55:01'),
  ('葡萄牙REN公司', '91110000000000011X', '低风险', 1, NULL, NULL, '2025-12-31 07:55:01');

-- 2. 插入风险等级调整历史
INSERT OR IGNORE INTO risk_level_history (company_id, company_name, from_level, to_level, reason, adjusted_by, adjusted_at) VALUES
  ('巴基斯坦PMLTC公司', '巴基斯坦PMLTC公司', '高风险', '中风险', '项目进度正常，风险可控', '测试用户', '2025-12-31 07:55:13'),
  ('巴西CPFL公司', '巴西CPFL公司', '中风险', '低风险', '项目完成，风险已解除', '系统管理员', '2025-12-31 07:55:20'),
  ('菲律宾NGCP公司', '菲律宾NGCP公司', '中风险', '低风险', '项目完成，风险已解除', '系统管理员', '2025-12-31 07:55:20');

-- 3. 插入风险信息数据（示例）
INSERT OR IGNORE INTO risks (company_name, title, risk_item, risk_level, risk_time, source, source_url, risk_reason, created_at) VALUES
  ('巴基斯坦PMLTC公司', '人工录入测试风险', '测试风险事项', 'medium', '2025-12-31', '人工录入', NULL, '测试人工录入功能', '2025-12-31 07:10:24'),
  ('香港电灯公司', '香港电灯公司发布年度可持续发展报告', '香港电灯公司发布最新年度报告', '低风险', '2025-12-30', '新华网', NULL, '香港电灯公司发布最新年度报告', '2025-12-30 07:35:23'),
  ('智利CGE公司', '智利CGE公司应对极端天气挑战', '应对极端天气挑战', '低风险', '2025-12-30', 'Santiago Times', NULL, '智利CGE公司在应对近期极端天气事件时展现出良好的应急反应能力', '2025-12-30 07:35:23'),
  ('菲律宾NGCP公司', '菲律宾NGCP输电网升级项目', '输电网升级', '低风险', '2025-12-30', 'Manila Times', NULL, '菲律宾NGCP公司继续推进输电网升级项目', '2025-12-30 07:35:23'),
  ('巴基斯坦PMLTC公司', 'Matiari-Lahore HVDC 项目技术故障', 'Matiari-Lahore HVDC 项目技术故障', '高风险', '2025-12-30', 'Dawn News', NULL, 'HVDC项目出现技术问题需要紧急处理', '2025-12-30 03:28:49'),
  ('巴基斯坦PMLTC公司', '巴基斯坦电网稳定性问题', '电网稳定性受到挑战', '高风险', '2025-12-29', 'Pakistan Today', NULL, '近期多次出现电网不稳定情况', '2025-12-29 03:28:49'),
  ('巴西CPFL公司', '巴西CPFL公司完成年度审计', '顺利通过年度财务审计', '低风险', '2025-12-29', 'Brazil Times', NULL, '审计结果良好，财务状况健康', '2025-12-29 03:28:49');

-- 4. 插入数据源配置（保留31个数据源）
INSERT OR IGNORE INTO data_sources (name, url, category, xpath_rules, field_mapping, interval, enabled, success_count, fail_count, created_at) VALUES
  ('grupocpfl(公司官网)', 'https://grupocpfl.com.br', '公司官网', '//article | //div[contains(@class, "news")]', '{"title":"//h1 | //h2","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('cge(公司官网)', 'https://cge.cl', '公司官网', '//article | //div[contains(@class, "news")]', '{"title":"//h1 | //h2","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('pcij(NGO/研究机构)', 'https://pcij.org', 'NGO/研究', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('scmp(新闻媒体)', 'https://scmp.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('abc(新闻媒体)', 'https://abc.net.au', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('ngcp(公司官网)', 'https://ngcp.ph', '公司官网', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('新华网', 'http://www.xinhuanet.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('人民网', 'http://www.people.com.cn', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('中新网', 'http://www.chinanews.com.cn', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('央视网', 'http://www.cctv.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('环球时报', 'https://www.globaltimes.cn', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('Dawn(巴基斯坦)', 'https://www.dawn.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('Manila Times(菲律宾)', 'https://www.manilatimes.net', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('O Globo(巴西)', 'https://oglobo.globo.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('El Mercurio(智利)', 'https://www.emol.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('国家电网公司', 'http://www.sgcc.com.cn', '政府机构', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('国家能源局', 'http://www.nea.gov.cn', '政府机构', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('商务部', 'http://www.mofcom.gov.cn', '政府机构', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('中国能源研究会', 'http://www.cers.org.cn', 'NGO/研究', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('国际能源署', 'https://www.iea.org', 'NGO/研究', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('LinkedIn', 'https://www.linkedin.com', '社媒', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('路透社', 'https://www.reuters.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('彭博社', 'https://www.bloomberg.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('金融时报', 'https://www.ft.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('BBC', 'https://www.bbc.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('CNN', 'https://www.cnn.com', '新闻媒体', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('世界银行', 'https://www.worldbank.org', '其他', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('亚洲开发银行', 'https://www.adb.org', '其他', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('一带一路网', 'https://www.yidaiyilu.gov.cn', '其他', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('中国电力企业联合会', 'https://www.cec.org.cn', '其他', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP),
  ('全球能源互联网', 'https://www.geidco.org', '其他', '//article', '{"title":"//h1","content":"//p","time":"//time"}', 3600, 1, 0, 0, CURRENT_TIMESTAMP);
