#!/bin/bash

# 国网风险预警平台 - 定时爬取脚本
# 功能：每小时自动爬取所有数据源

LOG_FILE="/home/user/webapp/logs/crawler.log"
API_URL="http://localhost:3000"

# 创建日志目录
mkdir -p /home/user/webapp/logs

# 记录开始时间
echo "========================================" >> $LOG_FILE
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始定时爬取" >> $LOG_FILE

# 调用一键更新API
response=$(curl -s -X POST "${API_URL}/api/crawl/all")

# 记录结果
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 爬取完成" >> $LOG_FILE
echo "响应: $response" >> $LOG_FILE
echo "" >> $LOG_FILE

# 保持日志文件大小（只保留最近1000行）
tail -n 1000 $LOG_FILE > ${LOG_FILE}.tmp && mv ${LOG_FILE}.tmp $LOG_FILE
