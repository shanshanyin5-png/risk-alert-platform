import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface NewsSource {
  id?: number;
  name: string;
  url: string;
  xpathRules?: string;
  fieldMapping?: string;
  enableJS?: boolean;
  userAgent?: string;
  interval?: number;
  timeout?: number;
  enabled?: boolean;
  status?: string;
  lastCrawlTime?: string;
  successRate?: number;
}

/**
 * 读取 Excel 文件并解析信息源
 */
function parseExcel(filePath: string): NewsSource[] {
  try {
    // 读取 Excel 文件
    const workbook = XLSX.readFile(filePath);
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为 JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 打印原始数据以便调试
    console.log('📊 Excel 数据预览：');
    data.slice(0, 5).forEach((row, idx) => {
      console.log(`行 ${idx}:`, row);
    });
    
    // 找到表头行（假设在第一行或包含"网站名称"的行）
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some(cell => 
        String(cell).includes('网站') || 
        String(cell).includes('名称') ||
        String(cell).includes('URL') ||
        String(cell).includes('url')
      )) {
        headerRowIndex = i;
        break;
      }
    }
    
    console.log(`\n✅ 找到表头行: 第 ${headerRowIndex + 1} 行`);
    console.log('表头:', data[headerRowIndex]);
    
    // 解析表头，找到关键列的索引
    const headers = data[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
    console.log('\n📋 解析的表头:', headers);
    
    // 灵活匹配列名
    const nameColIndex = headers.findIndex((h: string) => 
      h.includes('网站') || h.includes('名称') || h.includes('媒体') || h.includes('来源')
    );
    const urlColIndex = headers.findIndex((h: string) => 
      h.includes('url') || h.includes('网址') || h.includes('链接') || h.includes('地址')
    );
    
    console.log(`\n🔍 列索引映射:`);
    console.log(`  名称列: ${nameColIndex} (${headers[nameColIndex]})`);
    console.log(`  URL列: ${urlColIndex} (${headers[urlColIndex]})`);
    
    if (nameColIndex === -1 || urlColIndex === -1) {
      console.error('❌ 未找到必需的列（网站名称或URL）');
      console.error('可用的列:', headers);
      return [];
    }
    
    // 解析数据行
    const sources: NewsSource[] = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      const name = String(row[nameColIndex] || '').trim();
      const url = String(row[urlColIndex] || '').trim();
      
      // 跳过空行
      if (!name || !url) continue;
      
      // 验证 URL 格式
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn(`⚠️  跳过无效URL: ${name} - ${url}`);
        continue;
      }
      
      sources.push({
        name,
        url,
        xpathRules: '//article | //div[contains(@class, "news")] | //div[contains(@class, "content")]',
        fieldMapping: JSON.stringify({
          title: '//h1 | //h2 | //h3',
          content: '//p | //div[@class="content"]',
          time: '//time | //span[@class="date"]'
        }),
        enableJS: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        interval: 3600, // 1小时
        timeout: 30,
        enabled: true,
        status: 'normal',
        successRate: 0
      });
    }
    
    console.log(`\n✅ 成功解析 ${sources.length} 个信息源`);
    return sources;
    
  } catch (error) {
    console.error('❌ 解析 Excel 失败:', error);
    throw error;
  }
}

/**
 * 生成 SQL 插入语句
 */
function generateSQL(sources: NewsSource[]): string {
  const sqlStatements: string[] = [];
  
  // 创建表（如果不存在）
  sqlStatements.push(`
-- 创建信息源表
CREATE TABLE IF NOT EXISTS news_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  xpath_rules TEXT,
  field_mapping TEXT,
  enable_js INTEGER DEFAULT 0,
  user_agent TEXT,
  interval INTEGER DEFAULT 3600,
  timeout INTEGER DEFAULT 30,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'normal',
  last_crawl_time TEXT,
  success_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
  
  // 生成插入语句
  sources.forEach((source, index) => {
    const values = [
      `'${source.name.replace(/'/g, "''")}'`,
      `'${source.url.replace(/'/g, "''")}'`,
      `'${source.xpathRules?.replace(/'/g, "''")}'`,
      `'${source.fieldMapping?.replace(/'/g, "''")}'`,
      source.enableJS ? 1 : 0,
      `'${source.userAgent?.replace(/'/g, "''")}'`,
      source.interval,
      source.timeout,
      source.enabled ? 1 : 0,
      `'${source.status}'`,
      'NULL',
      source.successRate || 0
    ].join(', ');
    
    sqlStatements.push(`
-- ${index + 1}. ${source.name}
INSERT OR REPLACE INTO news_sources (name, url, xpath_rules, field_mapping, enable_js, user_agent, interval, timeout, enabled, status, last_crawl_time, success_rate)
VALUES (${values});
`);
  });
  
  return sqlStatements.join('\n');
}

/**
 * 生成 JSON 文件
 */
function generateJSON(sources: NewsSource[]): string {
  return JSON.stringify(sources, null, 2);
}

// 主函数
async function main() {
  const excelPath = process.argv[2] || '/home/user/uploaded_files/信息源(3).xlsx';
  
  console.log('🚀 开始导入信息源...');
  console.log(`📁 Excel 文件: ${excelPath}\n`);
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ 文件不存在: ${excelPath}`);
    process.exit(1);
  }
  
  try {
    // 解析 Excel
    const sources = parseExcel(excelPath);
    
    if (sources.length === 0) {
      console.error('❌ 未找到有效的信息源');
      process.exit(1);
    }
    
    // 打印信息源列表
    console.log('\n📋 解析的信息源列表:');
    console.log('━'.repeat(80));
    sources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   URL: ${source.url}`);
      console.log(`   爬取间隔: ${source.interval}秒 | 超时: ${source.timeout}秒`);
      console.log('');
    });
    console.log('━'.repeat(80));
    
    // 生成 SQL 文件
    const sqlContent = generateSQL(sources);
    const sqlPath = path.join(process.cwd(), 'migrations', 'import_news_sources.sql');
    fs.mkdirSync(path.dirname(sqlPath), { recursive: true });
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
    console.log(`✅ SQL 文件已生成: ${sqlPath}`);
    
    // 生成 JSON 文件
    const jsonContent = generateJSON(sources);
    const jsonPath = path.join(process.cwd(), 'data', 'news_sources.json');
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
    console.log(`✅ JSON 文件已生成: ${jsonPath}`);
    
    console.log(`\n🎉 导入完成！共处理 ${sources.length} 个信息源`);
    console.log('\n📝 下一步操作:');
    console.log('1. 执行 SQL: npx wrangler d1 execute risk_alert_db --local --file=migrations/import_news_sources.sql');
    console.log('2. 查看数据: npx wrangler d1 execute risk_alert_db --local --command="SELECT * FROM news_sources"');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

main();
