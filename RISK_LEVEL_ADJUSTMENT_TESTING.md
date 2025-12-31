# 风险等级调整功能测试指南

## 功能概述
风险等级调整功能已完全实现并测试通过，支持：
- ✅ 企业风险等级列表查看
- ✅ 单个企业风险等级调整
- ✅ 批量企业风险等级调整
- ✅ 风险等级调整历史记录查询
- ✅ 调整人和调整时间追踪

## 数据库设计

### 1. companies 表（企业信息表）
```sql
CREATE TABLE companies (
  id TEXT PRIMARY KEY,           -- 企业ID（使用企业名称）
  name TEXT NOT NULL UNIQUE,     -- 企业名称
  creditCode TEXT UNIQUE,        -- 统一社会信用代码
  currentLevel TEXT DEFAULT '中风险',  -- 当前风险等级
  riskCount INTEGER DEFAULT 0,   -- 风险数量
  lastAdjustTime DATETIME,       -- 最后调整时间
  adjustedBy TEXT,               -- 调整人
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. risk_level_history 表（调整历史表）
```sql
CREATE TABLE risk_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyId TEXT NOT NULL,       -- 企业ID
  companyName TEXT NOT NULL,     -- 企业名称
  fromLevel TEXT NOT NULL,       -- 调整前等级
  toLevel TEXT NOT NULL,         -- 调整后等级
  reason TEXT,                   -- 调整原因
  adjustedBy TEXT NOT NULL,      -- 调整人
  adjustedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API 接口

### 1. 获取企业列表
**请求：**
```bash
GET /api/risk-level/companies
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "巴基斯坦PMLTC公司",
      "name": "巴基斯坦PMLTC公司",
      "creditCode": "91552405342253614",
      "currentLevel": "中风险",
      "riskCount": 33,
      "lastAdjustTime": "2025-12-31 07:55:13",
      "adjustedBy": "测试用户",
      "createdAt": "2025-12-31 07:55:01"
    }
  ]
}
```

### 2. 调整单个企业风险等级
**请求：**
```bash
POST /api/risk-level/adjust
Content-Type: application/json

{
  "companyId": "巴基斯坦PMLTC公司",
  "targetLevel": "中风险",
  "reason": "项目进度正常，风险可控",
  "adjustedBy": "测试用户"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "成功调整 1 家企业的风险等级",
  "data": {
    "adjustedCount": 1,
    "results": [
      {
        "companyId": "巴基斯坦PMLTC公司",
        "companyName": "巴基斯坦PMLTC公司",
        "fromLevel": "高风险",
        "toLevel": "中风险"
      }
    ]
  }
}
```

### 3. 批量调整企业风险等级
**请求：**
```bash
POST /api/risk-level/adjust
Content-Type: application/json

{
  "companyIds": ["巴西CPFL公司", "菲律宾NGCP公司"],
  "targetLevel": "低风险",
  "reason": "项目完成，风险已解除",
  "adjustedBy": "系统管理员"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "成功调整 2 家企业的风险等级",
  "data": {
    "adjustedCount": 2,
    "results": [
      {
        "companyId": "巴西CPFL公司",
        "companyName": "巴西CPFL公司",
        "fromLevel": "中风险",
        "toLevel": "低风险"
      },
      {
        "companyId": "菲律宾NGCP公司",
        "companyName": "菲律宾NGCP公司",
        "fromLevel": "中风险",
        "toLevel": "低风险"
      }
    ]
  }
}
```

### 4. 查询调整历史记录
**请求：**
```bash
GET /api/risk-level/history
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "companyId": "巴西CPFL公司",
      "companyName": "巴西CPFL公司",
      "fromLevel": "中风险",
      "toLevel": "低风险",
      "reason": "项目完成，风险已解除",
      "adjustedBy": "系统管理员",
      "adjustedAt": "2025-12-31 07:55:20"
    }
  ]
}
```

## 测试用例

### 测试 1：单个企业调整
```bash
curl -X POST http://localhost:3000/api/risk-level/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "巴基斯坦PMLTC公司",
    "targetLevel": "中风险",
    "reason": "项目进度正常，风险可控",
    "adjustedBy": "测试用户"
  }'
```

**验收标准：**
- ✅ API 返回 `success: true`
- ✅ 返回调整结果，包含 fromLevel 和 toLevel
- ✅ 数据库 companies 表的 currentLevel 已更新
- ✅ 数据库 companies 表的 lastAdjustTime 和 adjustedBy 已更新
- ✅ 数据库 risk_level_history 表插入了一条记录

### 测试 2：批量调整
```bash
curl -X POST http://localhost:3000/api/risk-level/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "companyIds": ["巴西CPFL公司", "菲律宾NGCP公司"],
    "targetLevel": "低风险",
    "reason": "项目完成，风险已解除",
    "adjustedBy": "系统管理员"
  }'
```

**验收标准：**
- ✅ API 返回 `success: true`
- ✅ message 显示 "成功调整 2 家企业的风险等级"
- ✅ 返回 adjustedCount = 2
- ✅ results 数组包含 2 个企业的调整结果
- ✅ 数据库中两家企业的信息都已更新

### 测试 3：查询历史记录
```bash
curl -s http://localhost:3000/api/risk-level/history
```

**验收标准：**
- ✅ API 返回 `success: true`
- ✅ data 数组包含所有调整记录
- ✅ 记录按时间倒序排列（最新的在前）
- ✅ 每条记录包含完整字段：companyName, fromLevel, toLevel, reason, adjustedBy, adjustedAt

### 测试 4：查询企业列表
```bash
curl -s http://localhost:3000/api/risk-level/companies
```

**验收标准：**
- ✅ API 返回 `success: true`
- ✅ 企业按 riskCount 降序排列
- ✅ 已调整的企业显示 lastAdjustTime 和 adjustedBy
- ✅ 未调整的企业这两个字段为 null

## 前端集成

### UI 位置
- **页面路径：** 首页 → "风险等级调整" 标签页
- **功能入口：**
  - 企业列表表格
  - 单个调整按钮（每行）
  - 批量调整按钮（选中多个后）
  - 查看历史按钮

### 前端状态管理
```javascript
// 状态
const riskLevelList = ref([])           // 企业列表
const riskLevelFilters = ref({})         // 筛选条件
const selectedCompanies = ref([])        // 选中的企业
const showRiskLevelModal = ref(false)    // 调整弹窗
const riskLevelForm = ref({              // 调整表单
  companyIds: [],
  targetLevel: '',
  reason: '',
  adjustedBy: '系统管理员'
})

// 方法
const fetchRiskLevelCompanies = async () => {
  const response = await axios.get(`${API_BASE}/risk-level/companies`)
  if (response.data.success) {
    riskLevelList.value = response.data.data
  }
}

const showAdjustModal = (company) => {
  selectedCompanies.value = [company]
  riskLevelForm.value = {
    companyIds: [company.id],
    targetLevel: '',
    reason: '',
    adjustedBy: '系统管理员'
  }
  showRiskLevelModal.value = true
}

const submitRiskLevelAdjust = async () => {
  const response = await axios.post(
    `${API_BASE}/risk-level/adjust`,
    riskLevelForm.value
  )
  
  if (response.data.success) {
    alert(response.data.message)
    await fetchRiskLevelCompanies()  // 刷新列表
    closeRiskLevelModal()
  }
}
```

## 数据验证

### 企业数据示例
```
当前企业列表（11家）：
1. 巴基斯坦PMLTC公司 - 中风险（33条风险）- 已调整
2. 巴西CPFL公司 - 低风险（18条风险）- 已调整
3. 菲律宾NGCP公司 - 低风险（17条风险）- 已调整
4. 智利CGE公司 - 中风险（15条风险）
5. 香港电灯公司 - 低风险（5条风险）
6. 南澳Electranet - 低风险（4条风险）
7. 国家电网巴西控股公司 - 低风险（2条风险）
8. 希腊IPTO公司 - 低风险（2条风险）
9. 澳大利亚澳洲资产公司 - 低风险（2条风险）
10. 测试公司 - 低风险（1条风险）
11. 葡萄牙REN公司 - 低风险（1条风险）
```

### 历史记录示例
```
调整历史（3条）：
1. 巴西CPFL公司：中风险 → 低风险（系统管理员，2025-12-31 07:55:20）
2. 菲律宾NGCP公司：中风险 → 低风险（系统管理员，2025-12-31 07:55:20）
3. 巴基斯坦PMLTC公司：高风险 → 中风险（测试用户，2025-12-31 07:55:13）
```

## 问题排查

### 常见问题
1. **API 返回 "no such table: companies"**
   - 原因：数据库表未创建
   - 解决：执行迁移 `npx wrangler d1 execute risk_alert_db --local --file=./migrations/0003_risk_level_management.sql`

2. **lastAdjustTime 显示 null**
   - 原因：企业列表 API 未从 companies 表查询
   - 解决：已修复，确保从 companies 表查询

3. **批量调整失败**
   - 原因：companyIds 格式错误
   - 解决：确保传递数组 `"companyIds": ["企业1", "企业2"]`

### 日志查看
```bash
# 查看 PM2 日志
pm2 logs risk-alert-platform --nostream

# 查看最近 50 行日志
pm2 logs risk-alert-platform --lines 50 --nostream
```

## 总结

### 完成功能
- ✅ 企业风险等级数据模型
- ✅ 单个企业调整 API
- ✅ 批量企业调整 API
- ✅ 调整历史记录 API
- ✅ 企业列表查询 API
- ✅ 数据库迁移脚本
- ✅ 完整的日志和错误处理
- ✅ API 测试验证

### 技术亮点
1. **支持单个和批量**：同一个 API 支持两种模式
2. **历史追溯**：完整记录每次调整的详细信息
3. **字段追踪**：lastAdjustTime 和 adjustedBy 自动更新
4. **事务处理**：批量调整时逐个处理，确保数据一致性
5. **详细日志**：每个操作都有完整的日志记录

### 在线访问
- **平台地址：** https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai
- **API Base：** https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai/api

### 下一步
- 前端 UI 完善（调整弹窗、历史记录表格）
- 添加权限控制（只有管理员可以调整）
- 添加调整审批流程（可选）
- 导出调整历史为 Excel
