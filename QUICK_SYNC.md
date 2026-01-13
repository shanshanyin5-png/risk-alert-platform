# 🚀 快速同步 - 一页速查

## ⚠️ 问题
生产环境数据过期：**13条** vs 本地 **54条**

## ✅ 解决方案（3步）

### 1️⃣ 配置 API Token
访问 **Deploy 标签页** → 配置 Cloudflare API Token

### 2️⃣ 执行同步
```bash
cd /home/user/webapp
./sync_data_to_production.sh
```

### 3️⃣ 验证结果
```bash
# 检查生产环境
curl https://risk-alert-platform.pages.dev/api/statistics | jq

# 应该看到：totalRisks: 54
```

## 📋 手动方法
```bash
# 如果脚本执行失败，使用手动方法：
npx wrangler d1 execute risk_alert_db --remote \
  --file=import_risks_to_production.sql
```

## 🔗 快速链接
- 📄 [完整指南](./DATA_SYNC_GUIDE.md)
- 📊 [问题总结](./PRODUCTION_SYNC_SUMMARY.md)
- 🌐 [生产环境](https://risk-alert-platform.pages.dev/)
- 💻 [GitHub](https://github.com/shanshanyin5-png/risk-alert-platform)

## ❓ 常见错误
| 错误 | 解决方案 |
|------|---------|
| API Token 未配置 | 访问 Deploy 标签页配置 |
| UNIQUE constraint | 先删除旧数据：`DELETE FROM risks` |
| 数据仍不一致 | 清除浏览器缓存，等待2分钟 |

---
**需要帮助？** 查看 [DATA_SYNC_GUIDE.md](./DATA_SYNC_GUIDE.md)
