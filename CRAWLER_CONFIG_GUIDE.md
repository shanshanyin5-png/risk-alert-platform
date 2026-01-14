# 数据源爬取配置说明

## 🎯 配置总览

系统已完全移除数据源数量限制，支持**无限数量**的数据源！

### 当前配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **数据源数量限制** | ❌ 无限制 | 可添加任意数量的数据源 |
| **每源文章数量** | ✅ 50篇 | 可配置，防止超时 |
| **超时保护** | ✅ 启用 | 单个源30秒超时 |

## 📊 配置详情

### 1. 数据源数量（无限制）

```typescript
// src/index.tsx 第528行
const sourcesToCrawl = sources.results || []  // 处理所有启用的数据源
```

**特点**：
- ✅ 不限制数据源总数
- ✅ 按顺序依次爬取
- ✅ 自动跳过失败的源
- ✅ 支持手动添加任意数量源

### 2. 每个数据源文章数量（可配置）

```typescript
// src/index.tsx 第14-15行
const MAX_ARTICLES_PER_SOURCE = 50  // 可修改
```

**推荐值**：
- **20-50篇**：平衡性能和完整性（推荐）
- **0**：无限制（可能超时）
- **100+**：适合重要源（注意超时）

**修改方法**：
```typescript
// 修改 src/index.tsx 第15行
const MAX_ARTICLES_PER_SOURCE = 100  // 改为你需要的数量
```

### 3. 超时配置

每个数据源有30秒超时保护：

```typescript
// 数据源配置中的 timeout 字段
{
  "timeout": 30  // 单位：秒
}
```

## 🚀 使用场景

### 场景1：添加大量数据源

**示例**：添加50个Google News源监控不同关键词

```bash
# 无需修改代码，直接添加即可
curl -X POST http://localhost:3000/api/datasources -d '{
  "name": "Google News - 新关键词",
  "url": "https://news.google.com/rss/search?q=关键词",
  "enabled": 1
}'
```

### 场景2：监控高频更新源

**示例**：某个RSS每小时更新100篇文章

```typescript
// 提高单源文章数量
const MAX_ARTICLES_PER_SOURCE = 100
```

### 场景3：快速测试

**示例**：快速扫描所有源，每个只看10篇

```typescript
// 降低单源文章数量
const MAX_ARTICLES_PER_SOURCE = 10
```

## ⚙️ 性能优化建议

### 推荐配置

| 数据源总数 | 每源文章数 | 预计耗时 | 推荐场景 |
|-----------|-----------|---------|---------|
| 10-20个   | 50篇      | 1-2分钟 | 中小规模监控 |
| 20-50个   | 30篇      | 2-5分钟 | 大规模监控 |
| 50+个     | 20篇      | 5-10分钟 | 超大规模监控 |

### 优化建议

1. **RSS源优先**
   - RSS解析速度快
   - 结构稳定
   - 错误率低

2. **合理设置间隔**
   ```json
   {
     "interval": 3600  // 1小时爬取一次
   }
   ```

3. **禁用低质量源**
   - 定期检查成功率
   - 禁用长期失败的源

4. **分批爬取**（自动）
   - 系统自动按源顺序爬取
   - 失败不影响其他源

## 🔧 配置修改步骤

### 修改每源文章数量

1. 打开 `src/index.tsx`
2. 找到第15行：
   ```typescript
   const MAX_ARTICLES_PER_SOURCE = 50
   ```
3. 修改数字
4. 重新构建和部署：
   ```bash
   npm run build
   pm2 restart risk-alert-platform
   ```

### 添加新数据源

**方法1：通过API**
```bash
curl -X POST http://localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新数据源",
    "url": "https://example.com/rss",
    "xpathRules": "//item",
    "fieldMapping": "{\"title\":\"//title\",\"content\":\"//description\"}",
    "enabled": 1
  }'
```

**方法2：通过Web界面**
1. 登录管理后台
2. 进入"数据源管理"
3. 点击"添加数据源"
4. 填写表单并保存

## 📈 监控和调试

### 查看爬取日志

```bash
pm2 logs risk-alert-platform --nostream --lines 100
```

### 查看数据源状态

```bash
curl http://localhost:3000/api/datasources | jq '.data[] | {id, name, lastCrawlTime, successRate}'
```

### 手动触发爬取

```bash
# 爬取所有启用的源
curl -X POST http://localhost:3000/api/crawl/all

# 查看结果
curl http://localhost:3000/api/statistics
```

## 🎛️ 高级配置

### 动态调整（未来）

可以考虑从数据库读取配置：

```typescript
// 从环境变量读取
const MAX_ARTICLES_PER_SOURCE = parseInt(
  env.MAX_ARTICLES_PER_SOURCE || '50'
)
```

### 按源类型配置

```typescript
const articlesToProcess = source.category === 'RSS'
  ? articles.slice(0, 50)   // RSS源处理50篇
  : articles.slice(0, 20)   // HTML源处理20篇
```

## ❓ 常见问题

### Q: 我添加了100个数据源，会超时吗？

**不会！** 系统会按顺序爬取所有源，每个源独立处理：
- ✅ 单个源失败不影响其他源
- ✅ 自动跳过失败源
- ✅ 记录每个源的成功率

### Q: 如何提高爬取速度？

**建议**：
1. 降低 `MAX_ARTICLES_PER_SOURCE`
2. 只启用重要的数据源
3. 优先使用RSS源（比HTML快）

### Q: 可以并行爬取吗？

**当前是串行**，因为：
- ✅ 避免触发反爬虫
- ✅ 降低服务器压力
- ✅ 更容易调试

未来可以考虑并行爬取（需要限制并发数）。

## 📝 更新日志

### 2026-01-14
- ✅ 移除数据源总数限制
- ✅ 添加可配置的单源文章数量限制（默认50篇）
- ✅ 优化日志输出
- ✅ 完善错误处理

---

**配置文件位置**：`src/index.tsx`
**配置常量位置**：第14-15行
**当前版本**：无限制 + 50篇/源
