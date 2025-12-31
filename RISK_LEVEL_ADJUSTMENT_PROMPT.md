# 风险等级调整功能开发需求文档（Prompt）

## 📋 项目背景

为国网风险预警平台开发**风险等级调整**功能模块，允许管理员对监控企业的风险等级进行人工审核和调整，并记录调整历史，支持单个企业调整和批量调整操作。

---

## 🎯 核心功能需求

### 1. 企业风险等级管理页面

#### 1.1 页面入口
- **位置**: 顶部导航栏独立标签页"风险等级调整"
- **图标**: `<i class="fas fa-sliders-h"></i>`
- **访问路径**: 首页 → 风险等级调整

#### 1.2 页面布局
- **标题区域**: 显示"风险等级手动调整"
- **操作按钮区**: 
  - 导出企业列表（Excel）
  - 导出调整历史（Excel）
  - 批量调整按钮（选中企业后显示）
- **筛选区域**:
  - 企业名称搜索框
  - 风险等级筛选（全部/高风险/中风险/低风险/无风险）
  - 区域筛选（可选）
- **列表区域**: 企业信息表格

#### 1.3 企业列表展示

**表格列**:
| 列名 | 类型 | 说明 |
|------|------|------|
| 选择框 | Checkbox | 用于批量选择 |
| 企业名称 | 文本 | 必填，主键 |
| 统一社会信用代码 | 文本 | 18位数字，系统自动生成或手动输入 |
| 当前风险等级 | 徽章 | 高风险(红)/中风险(橙)/低风险(黄)/无风险(绿) |
| 风险数量 | 数字 | 该企业关联的风险信息条数 |
| 最后调整时间 | 日期时间 | 格式：YYYY-MM-DD HH:mm:ss |
| 调整人 | 文本 | 最后一次调整的操作人员 |
| 操作 | 按钮组 | "调整等级"按钮 |

**数据来源**:
- 从已有监控企业列表获取（10家企业）
- 自动统计每家企业的风险数量
- 初始风险等级根据风险数量自动判定

---

### 2. 单个企业风险等级调整

#### 2.1 触发方式
- 点击列表中某企业的"调整等级"按钮
- 弹出调整表单模态框

#### 2.2 调整表单

**表单字段**:

```html
<form>
  <!-- 企业信息（只读） -->
  <div>企业名称: {企业名称}</div>
  <div>信用代码: {统一社会信用代码}</div>
  <div>当前等级: {当前风险等级}</div>
  
  <!-- 调整信息（可编辑） -->
  <select name="targetLevel" required>
    <option value="high">高风险</option>
    <option value="medium">中风险</option>
    <option value="low">低风险</option>
    <option value="none">无风险</option>
  </select>
  
  <textarea name="reason" required placeholder="请输入调整原因（必填）"></textarea>
  
  <input type="file" name="attachment" accept=".pdf,.doc,.docx,.jpg,.png" multiple />
  
  <button type="submit">确认调整</button>
  <button type="button">取消</button>
</form>
```

**验证规则**:
- 目标风险等级：必填
- 调整原因：必填，最少10个字符
- 附件：可选，支持PDF、Word、图片格式

#### 2.3 提交处理
- 前端验证通过后提交到后端API
- 后端记录调整历史
- 更新企业风险等级
- 返回成功提示
- 自动刷新企业列表

---

### 3. 批量调整风险等级

#### 3.1 触发方式
- 勾选多个企业（复选框）
- 点击"批量调整"按钮
- 弹出批量调整表单

#### 3.2 批量调整表单

```html
<form>
  <div>已选择 {N} 家企业</div>
  <ul>
    <li>企业A</li>
    <li>企业B</li>
    ...
  </ul>
  
  <select name="targetLevel" required>
    <option value="high">高风险</option>
    <option value="medium">中风险</option>
    <option value="low">低风险</option>
    <option value="none">无风险</option>
  </select>
  
  <textarea name="reason" required placeholder="请输入统一的调整原因（必填）"></textarea>
  
  <button type="submit">确认批量调整</button>
  <button type="button">取消</button>
</form>
```

**特点**:
- 统一的目标风险等级
- 统一的调整原因
- 一次性调整多家企业
- 显示即将调整的企业列表供确认

---

### 4. 调整历史记录

#### 4.1 历史记录查询
- 独立的历史记录页面或折叠面板
- 支持按企业名称、调整人、时间范围筛选
- 分页展示

#### 4.2 历史记录展示

**表格列**:
| 列名 | 说明 |
|------|------|
| 调整时间 | 操作时间戳 |
| 企业名称 | 被调整的企业 |
| 调整前等级 | 原风险等级 |
| 调整后等级 | 新风险等级 |
| 调整原因 | 操作说明 |
| 调整人 | 操作人员姓名 |
| 附件 | 查看/下载按钮（如有） |

#### 4.3 历史记录导出
- 支持导出为Excel文件
- 文件名格式：`风险等级调整历史-YYYYMMDD-HHmmss.xlsx`
- 包含所有历史记录或筛选后的记录

---

## 🗄️ 数据库设计

### 表1：企业信息表（companies）

```sql
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  credit_code TEXT UNIQUE,  -- 统一社会信用代码
  current_risk_level TEXT DEFAULT 'none',  -- 当前风险等级: high/medium/low/none
  region TEXT,  -- 所属区域
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 从已有监控企业列表初始化数据
INSERT INTO companies (name, credit_code, current_risk_level) VALUES
  ('南澳Electranet', '9107439261558177679', 'high'),
  ('国家电网巴西控股公司', '919643496110393449', 'high'),
  ('巴基斯坦PMLTC公司', '913414452908264063', 'high'),
  ('巴西CPFL公司', '91234567890123456X', 'high'),
  ('希腊IPTO公司', '91234567890123457X', 'medium'),
  ('智利CGE公司', '91234567890123458X', 'high'),
  ('澳大利亚澳洲资产公司', '91234567890123459X', 'medium'),
  ('菲律宾NGCP公司', '91234567890123460X', 'high'),
  ('葡萄牙REN公司', '91234567890123461X', 'low'),
  ('香港电灯公司', '91234567890123462X', 'medium');
```

### 表2：风险等级调整历史表（risk_level_history）

```sql
CREATE TABLE IF NOT EXISTS risk_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  from_level TEXT NOT NULL,  -- 调整前等级
  to_level TEXT NOT NULL,    -- 调整后等级
  reason TEXT NOT NULL,      -- 调整原因
  adjusted_by TEXT,          -- 调整人（用户名或姓名）
  attachment_urls TEXT,      -- 附件URL列表（JSON格式）
  adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_company_id ON risk_level_history(company_id);
CREATE INDEX IF NOT EXISTS idx_adjusted_at ON risk_level_history(adjusted_at);
```

---

## 🔌 API接口设计

### 1. 获取企业列表

**请求**:
```http
GET /api/risk-level/companies
Query参数:
  - keyword: 企业名称关键词（可选）
  - level: 风险等级筛选（可选）
  - page: 页码（可选，默认1）
  - limit: 每页条数（可选，默认20）
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "巴基斯坦PMLTC公司",
      "creditCode": "913414452908264063",
      "currentLevel": "high",
      "riskCount": 32,
      "lastAdjustTime": "2025-12-30 10:30:00",
      "adjustedBy": "张三",
      "region": "国际"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

### 2. 单个企业风险等级调整

**请求**:
```http
POST /api/risk-level/adjust
Content-Type: application/json

{
  "companyId": 1,
  "targetLevel": "medium",
  "reason": "经过评估，风险已降低",
  "adjustedBy": "张三",
  "attachments": []  // 可选
}
```

**响应**:
```json
{
  "success": true,
  "message": "风险等级调整成功",
  "data": {
    "id": 123,
    "companyName": "巴基斯坦PMLTC公司",
    "fromLevel": "high",
    "toLevel": "medium",
    "adjustedAt": "2025-12-31 15:30:00"
  }
}
```

### 3. 批量调整风险等级

**请求**:
```http
POST /api/risk-level/batch-adjust
Content-Type: application/json

{
  "companyIds": [1, 2, 3],
  "targetLevel": "low",
  "reason": "年度评估后统一降级",
  "adjustedBy": "李四"
}
```

**响应**:
```json
{
  "success": true,
  "message": "批量调整成功",
  "data": {
    "total": 3,
    "succeeded": 3,
    "failed": 0,
    "details": [
      { "companyId": 1, "companyName": "企业A", "status": "success" },
      { "companyId": 2, "companyName": "企业B", "status": "success" },
      { "companyId": 3, "companyName": "企业C", "status": "success" }
    ]
  }
}
```

### 4. 获取调整历史

**请求**:
```http
GET /api/risk-level/history
Query参数:
  - companyId: 企业ID（可选）
  - startDate: 开始日期（可选）
  - endDate: 结束日期（可选）
  - page: 页码（可选）
  - limit: 每页条数（可选）
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "companyName": "巴基斯坦PMLTC公司",
      "fromLevel": "high",
      "toLevel": "medium",
      "reason": "经过评估，风险已降低",
      "adjustedBy": "张三",
      "adjustedAt": "2025-12-31 15:30:00",
      "attachments": []
    }
  ],
  "total": 50,
  "page": 1
}
```

---

## 🎨 前端实现要点

### 1. Vue 3 Composition API

**状态管理**:
```javascript
const riskLevelList = ref([]);  // 企业列表
const selectedCompanies = ref([]);  // 选中的企业
const showAdjustModal = ref(false);  // 显示调整弹窗
const adjustForm = reactive({
  companyId: null,
  targetLevel: '',
  reason: '',
  adjustedBy: ''
});
```

**方法**:
```javascript
// 获取企业列表
const fetchCompanies = async () => {
  const response = await axios.get('/api/risk-level/companies');
  riskLevelList.value = response.data.data;
};

// 显示单个调整弹窗
const showAdjustDialog = (company) => {
  adjustForm.companyId = company.id;
  showAdjustModal.value = true;
};

// 提交调整
const submitAdjust = async () => {
  await axios.post('/api/risk-level/adjust', adjustForm);
  alert('调整成功');
  await fetchCompanies();  // 刷新列表
  showAdjustModal.value = false;
};

// 批量调整
const batchAdjust = async () => {
  const companyIds = selectedCompanies.value.map(c => c.id);
  await axios.post('/api/risk-level/batch-adjust', {
    companyIds,
    targetLevel: batchForm.targetLevel,
    reason: batchForm.reason
  });
  alert('批量调整成功');
  await fetchCompanies();
};
```

### 2. UI组件库选择

**推荐使用**:
- TailwindCSS（已集成）
- FontAwesome图标（已集成）
- 自定义模态框组件

**风险等级徽章样式**:
```css
.risk-badge-high { background: #FEE2E2; color: #991B1B; }
.risk-badge-medium { background: #FED7AA; color: #9A3412; }
.risk-badge-low { background: #FEF3C7; color: #92400E; }
.risk-badge-none { background: #D1FAE5; color: #065F46; }
```

---

## 📝 技术实现细节

### 1. 后端实现（Hono + Cloudflare D1）

**示例代码**:
```typescript
// 获取企业列表
app.get('/api/risk-level/companies', async (c) => {
  const { env } = c;
  const { keyword, level } = c.req.query();
  
  let sql = `
    SELECT 
      c.id,
      c.name,
      c.credit_code as creditCode,
      c.current_risk_level as currentLevel,
      COUNT(r.id) as riskCount,
      h.adjusted_at as lastAdjustTime,
      h.adjusted_by as adjustedBy
    FROM companies c
    LEFT JOIN risks r ON c.name = r.company_name
    LEFT JOIN (
      SELECT company_id, adjusted_at, adjusted_by
      FROM risk_level_history
      WHERE id IN (
        SELECT MAX(id) FROM risk_level_history GROUP BY company_id
      )
    ) h ON c.id = h.company_id
  `;
  
  const conditions = [];
  if (keyword) conditions.push(`c.name LIKE '%${keyword}%'`);
  if (level) conditions.push(`c.current_risk_level = '${level}'`);
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' GROUP BY c.id ORDER BY riskCount DESC';
  
  const result = await env.DB.prepare(sql).all();
  
  return c.json({
    success: true,
    data: result.results
  });
});

// 调整风险等级
app.post('/api/risk-level/adjust', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  // 获取当前等级
  const company = await env.DB.prepare(
    'SELECT current_risk_level FROM companies WHERE id = ?'
  ).bind(body.companyId).first();
  
  // 更新等级
  await env.DB.prepare(
    'UPDATE companies SET current_risk_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(body.targetLevel, body.companyId).run();
  
  // 记录历史
  await env.DB.prepare(`
    INSERT INTO risk_level_history (company_id, company_name, from_level, to_level, reason, adjusted_by)
    SELECT id, name, ?, ?, ?, ? FROM companies WHERE id = ?
  `).bind(
    company.current_risk_level,
    body.targetLevel,
    body.reason,
    body.adjustedBy,
    body.companyId
  ).run();
  
  return c.json({
    success: true,
    message: '风险等级调整成功'
  });
});
```

### 2. 前端实现（Vue 3）

**企业列表组件**:
```vue
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">风险等级手动调整</h2>
      <div class="space-x-2">
        <button @click="exportCompanies" class="btn-secondary">
          <i class="fas fa-download mr-2"></i>导出企业列表
        </button>
        <button v-if="selectedCompanies.length > 0" @click="showBatchAdjust" class="btn-primary">
          <i class="fas fa-edit mr-2"></i>批量调整 ({{ selectedCompanies.length }})
        </button>
      </div>
    </div>
    
    <!-- 筛选区 -->
    <div class="flex space-x-4">
      <input v-model="filters.keyword" placeholder="搜索企业名称" class="input" />
      <select v-model="filters.level" class="select">
        <option value="">全部等级</option>
        <option value="high">高风险</option>
        <option value="medium">中风险</option>
        <option value="low">低风险</option>
        <option value="none">无风险</option>
      </select>
      <button @click="searchCompanies" class="btn-primary">搜索</button>
    </div>
    
    <!-- 企业列表表格 -->
    <table class="w-full">
      <thead>
        <tr>
          <th><input type="checkbox" @change="toggleAll" /></th>
          <th>企业名称</th>
          <th>信用代码</th>
          <th>当前风险等级</th>
          <th>风险数量</th>
          <th>最后调整时间</th>
          <th>调整人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companies" :key="company.id">
          <td><input type="checkbox" v-model="selectedCompanies" :value="company" /></td>
          <td>{{ company.name }}</td>
          <td>{{ company.creditCode }}</td>
          <td>
            <span :class="getRiskBadgeClass(company.currentLevel)">
              {{ getRiskLevelText(company.currentLevel) }}
            </span>
          </td>
          <td>{{ company.riskCount }}</td>
          <td>{{ formatDate(company.lastAdjustTime) }}</td>
          <td>{{ company.adjustedBy || '-' }}</td>
          <td>
            <button @click="showAdjustModal(company)" class="text-blue-600 hover:underline">
              调整等级
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## ✅ 验收标准

### 功能验收
- [ ] 企业列表正常显示10家企业
- [ ] 可以查看每家企业的风险等级和风险数量
- [ ] 单个企业风险等级调整功能正常
- [ ] 批量调整功能正常
- [ ] 调整后企业列表自动刷新
- [ ] 调整历史正确记录
- [ ] 调整历史可以查询和导出
- [ ] Excel导出功能正常

### 数据验收
- [ ] 企业信息完整（名称、信用代码、等级）
- [ ] 风险数量统计准确
- [ ] 调整历史记录完整
- [ ] 调整前后等级记录正确

### UI/UX验收
- [ ] 界面美观，符合整体风格
- [ ] 操作流程顺畅
- [ ] 表单验证提示清晰
- [ ] 成功/失败提示友好
- [ ] 响应式布局适配

---

## 🚀 开发流程

### 阶段1：数据库准备
1. 创建companies表和risk_level_history表
2. 初始化10家企业数据
3. 创建必要的索引

### 阶段2：后端API开发
1. 实现企业列表查询API
2. 实现单个调整API
3. 实现批量调整API
4. 实现历史记录查询API

### 阶段3：前端页面开发
1. 创建企业列表页面
2. 实现筛选和搜索功能
3. 开发调整表单模态框
4. 实现批量选择和批量调整
5. 开发历史记录页面

### 阶段4：测试和优化
1. 单元测试
2. 集成测试
3. UI/UX优化
4. 性能优化

---

## 📚 参考资料

**技术栈**:
- 后端: Hono + Cloudflare Workers + D1 Database
- 前端: Vue 3 + TailwindCSS + Axios
- 部署: Cloudflare Pages

**相关文档**:
- Hono文档: https://hono.dev/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Vue 3文档: https://vuejs.org/

**现有功能参考**:
- 数据源管理页面（类似的CRUD操作）
- 风险信息编辑功能（类似的模态框）
- Excel导出功能（可复用）

---

## 🎯 预期成果

完成后应实现：
1. ✅ 完整的企业风险等级管理功能
2. ✅ 单个和批量调整能力
3. ✅ 完整的调整历史追踪
4. ✅ 友好的用户界面
5. ✅ Excel导出功能
6. ✅ 完整的文档

**交付物**:
- 前端代码（Vue组件）
- 后端代码（API接口）
- 数据库迁移脚本
- 使用文档
- 测试报告

---

## 💡 额外建议

### 可选增强功能
1. **审核流程**: 调整需要上级审批
2. **通知机制**: 调整后发送邮件通知
3. **数据统计**: 调整趋势分析图表
4. **权限控制**: 不同角色有不同的操作权限
5. **调整模板**: 预设常用的调整原因

### 性能优化
1. 企业列表分页加载
2. 历史记录按需加载
3. 批量操作异步处理
4. 缓存企业列表数据

### 用户体验
1. 调整前二次确认
2. 操作进度提示
3. 撤销功能（短时间内）
4. 快捷键支持

---

## 📞 技术支持

如有问题，请参考以下文档：
- README.md
- USER_MANUAL.md
- FEATURE_UPGRADE_GUIDE.md

**在线演示**: https://3000-i6owb9pva7rgt0fl8drog-5c13a017.sandbox.novita.ai

---

## ✨ 总结

本功能模块是风险预警平台的核心功能之一，通过人工审核和调整，可以更准确地评估企业风险等级，为决策提供可靠依据。

**开发重点**:
- 数据准确性
- 操作便捷性
- 历史可追溯
- 用户体验友好

按照本文档开发，可以实现一个完整、易用、可靠的风险等级调整功能模块。
