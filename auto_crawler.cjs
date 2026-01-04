// 国网风险预警平台 - 自动爬取定时任务
// 每小时自动爬取所有数据源

const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'auto_crawler.log');
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/crawl/all';

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 调用爬取API
function crawlAll() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      timeout: 300000 // 5分钟超时
    };

    log('========================================');
    log('开始自动爬取任务');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          log(`爬取完成: 成功=${result.data?.successCount || 0}, 失败=${result.data?.failedCount || 0}, 新增风险=${result.data?.totalNewRisks || 0}`);
          resolve(result);
        } catch (e) {
          log(`解析响应失败: ${e.message}`);
          log(`原始响应: ${data.substring(0, 200)}`);
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      log(`请求失败: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      log('请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 主函数
async function main() {
  try {
    await crawlAll();
    log('自动爬取任务执行成功');
  } catch (error) {
    log(`自动爬取任务执行失败: ${error.message}`);
  }
  
  // 保持日志文件大小（只保留最近2000行）
  try {
    const logContent = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = logContent.split('\n');
    if (lines.length > 2000) {
      const recentLines = lines.slice(-2000);
      fs.writeFileSync(LOG_FILE, recentLines.join('\n'));
      log('日志文件已清理，保留最近2000行');
    }
  } catch (e) {
    // 忽略日志清理错误
  }
}

// 执行
main();
