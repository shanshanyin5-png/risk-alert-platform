module.exports = {
  apps: [
    {
      name: 'risk-alert-platform',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=risk_alert_db --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'auto-crawler',
      script: './auto_crawler.cjs',
      cron_restart: '0 * * * *', // 每小时的0分执行一次
      autorestart: false,
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
