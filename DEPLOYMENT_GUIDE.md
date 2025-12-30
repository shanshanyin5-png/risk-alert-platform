# 实时风险预警平台 - 完整部署指南

## 📋 目录
1. [快速开始](#快速开始)
2. [详细安装步骤](#详细安装步骤)
3. [功能使用说明](#功能使用说明)
4. [邮件和钉钉配置](#邮件和钉钉配置)
5. [常见问题解决](#常见问题解决)
6. [进阶功能开发](#进阶功能开发)

---

## 🚀 快速开始（5分钟运行）

### 前提条件
- 已安装 Node.js 18+ 和 npm

### 一键启动
```bash
# 1. 进入项目目录
cd /home/user/webapp

# 2. 安装依赖（如果还没安装）
npm install

# 3. 构建项目
npm run build

# 4. 启动服务
pm2 start ecosystem.config.cjs

# 5. 测试访问
curl http://localhost:3000/api/statistics
```

**访问地址：** http://localhost:3000

---

## 📦 详细安装步骤

### 步骤1：环境准备
```bash
# 检查 Node.js 版本
node --version  # 应该 >= v18.0.0

# 检查 npm 版本
npm --version   # 应该 >= 9.0.0
```

### 步骤2：安装项目依赖
```bash
cd /home/user/webapp

# 安装所有依赖包（大约需要1-2分钟）
npm install

# 依赖包列表：
# - hono: Web框架
# - @cloudflare/workers-types: TypeScript类型
# - @hono/vite-cloudflare-pages: Vite插件
# - vite: 构建工具
# - wrangler: Cloudflare开发工具
```

### 步骤3：数据库初始化

**数据已自动导入！**您的Excel数据（94条风险记录）已经导入到本地数据库。

验证数据：
```bash
# 查看风险总数
npx wrangler d1 execute risk_alert_db --local --command="SELECT COUNT(*) FROM risks"

# 查看前3条数据
npx wrangler d1 execute risk_alert_db --local --command="SELECT id, company_name, title FROM risks LIMIT 3"
```

### 步骤4：构建应用
```bash
npm run build

# 构建成功后会生成 dist/ 目录
# dist/_worker.js - 编译后的后端代码
# dist/ - 前端静态资源
```

### 步骤5：启动服务

**方式1：使用PM2（推荐，后台运行）**
```bash
# 启动服务
pm2 start ecosystem.config.cjs

# 查看服务状态
pm2 list

# 查看日志
pm2 logs risk-alert-platform --nostream

# 重启服务
pm2 restart risk-alert-platform

# 停止服务
pm2 stop risk-alert-platform
```

**方式2：直接运行（前台运行）**
```bash
npm run dev:sandbox
```

### 步骤6：访问应用
打开浏览器访问：http://localhost:3000

---

## 🎯 功能使用说明

### 1. 监控大屏页面

#### 统计卡片区域
- **总风险数**：显示所有风险总数（94条）
- **高风险**：红色标记，显示高风险数量（94条）
- **中风险**：橙色标记，显示中风险数量（0条）
- **低风险**：黄色标记，显示低风险数量（0条）
- **今日新增**：绿色标记，显示今日新增风险（0条，测试数据为历史数据）

#### ECharts可视化图表
1. **风险等级分布饼图**
   - 直观显示高/中/低风险占比
   - 鼠标悬停查看具体数量和百分比

2. **公司分布柱状图**
   - 展示风险数量Top 10公司
   - X轴为公司名称，Y轴为风险数量
   - 柱子上方显示具体数字

3. **风险趋势折线图**
   - 显示最近7天风险数量变化
   - 折线图+面积图组合
   - 每个节点显示具体数值

#### 实时风险流
- 每5秒自动刷新最新数据
- 显示最新10条风险信息
- 包含：公司名称、标题、风险等级、时间
- 右上角显示连接状态：🟢实时连接 / 🔴连接断开

### 2. 风险列表页面

#### 筛选功能
1. **公司筛选**
   - 下拉框选择公司
   - 显示每个公司的风险数量
   - 例如："巴基斯坦PMLTC公司 (31)"

2. **风险等级筛选**
   - 全部等级 / 高风险 / 中风险 / 低风险
   - 点击立即筛选

3. **关键词搜索**
   - 输入关键词搜索标题或风险事项
   - 支持中文/英文搜索
   - 按Enter或点击搜索按钮

#### 风险卡片信息
每条风险显示：
- 风险等级标签（带颜色）
- 公司名称
- 风险时间
- 标题（完整显示）
- 风险事项（前200字预览）
- 来源链接（前50字）
- 创建时间

#### 分页导航
- 默认每页20条
- 显示当前页/总页数/总记录数
- 上一页/下一页按钮

#### 查看详情
- 点击任意风险卡片打开详情弹窗
- 详情包含所有字段信息
- 风险判定原因完整展示
- 来源链接可点击跳转

### 3. 数据刷新机制

**自动轮询（当前实现）**
- 监控大屏的实时风险流每5秒自动刷新
- 无需手动刷新页面
- 连接状态实时显示

**如何调整刷新频率：**
编辑 `/home/user/webapp/public/static/app.js` 第70行：
```javascript
// 每5秒轮询一次（可改为3秒、10秒等）
pollingInterval = setInterval(fetchRealtimeData, 5000);
```

---

## 📧 邮件和钉钉配置

### 1. 邮件预警配置（使用 Resend）

#### 步骤1：注册Resend账号
1. 访问 https://resend.com
2. 注册免费账号（每月100封免费额度）
3. 获取API密钥

#### 步骤2：安装依赖
```bash
cd /home/user/webapp
npm install resend
```

#### 步骤3：配置环境变量
创建 `.dev.vars` 文件：
```bash
# /home/user/webapp/.dev.vars
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=alert@yourdomain.com
EMAIL_TO=admin@example.com
```

#### 步骤4：实现邮件发送
编辑 `/home/user/webapp/src/index.tsx`，在 `/api/notify` 路由中添加：

```typescript
import { Resend } from 'resend';

app.post('/api/notify', async (c) => {
  const { type, riskId, message } = await c.req.json();
  const { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } = c.env;

  if (type === 'email' && RESEND_API_KEY) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM || 'Risk Alert <alert@yourdomain.com>',
        to: [EMAIL_TO || 'admin@example.com'],
        subject: `🚨 高风险预警 - 风险ID #${riskId}`,
        html: `
          <h2>风险预警通知</h2>
          <p><strong>风险ID：</strong>${riskId}</p>
          <p><strong>预警内容：</strong></p>
          <p>${message}</p>
          <p><strong>发送时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            本邮件由实时风险预警平台自动发送，请勿直接回复。
          </p>
        `
      });

      if (error) throw error;
      
      return c.json({ success: true, message: '邮件发送成功' });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  return c.json({ success: false, error: '邮件配置缺失' }, 400);
});
```

#### 步骤5：测试邮件发送
```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "riskId": 1,
    "message": "检测到智利CGE公司高风险预警：监管处罚金额超58亿美元"
  }'
```

### 2. 钉钉预警配置

#### 步骤1：创建钉钉机器人
1. 打开钉钉群聊
2. 点击群设置 → 智能群助手 → 添加机器人 → 自定义
3. 设置名称："风险预警机器人"
4. 安全设置选择"加签"，复制密钥
5. 复制Webhook地址

#### 步骤2：配置环境变量
在 `.dev.vars` 文件中添加：
```bash
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxxxx
DINGTALK_SECRET=SECxxxxxxxxxxxxx
```

#### 步骤3：实现钉钉发送
编辑 `/home/user/webapp/src/index.tsx`：

```typescript
// 钉钉签名算法
function generateDingTalkSign(secret: string, timestamp: number): string {
  const crypto = require('crypto');
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  return encodeURIComponent(hmac.digest('base64'));
}

app.post('/api/notify', async (c) => {
  const { type, riskId, message } = await c.req.json();
  const { DINGTALK_WEBHOOK, DINGTALK_SECRET } = c.env;

  if (type === 'dingtalk' && DINGTALK_WEBHOOK) {
    try {
      const timestamp = Date.now();
      const sign = generateDingTalkSign(DINGTALK_SECRET, timestamp);
      const url = `${DINGTALK_WEBHOOK}&timestamp=${timestamp}&sign=${sign}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            title: '🚨 风险预警',
            text: `## 🚨 高风险预警通知\n\n` +
                  `**风险ID：** ${riskId}\n\n` +
                  `**预警内容：**\n\n${message}\n\n` +
                  `**发送时间：** ${new Date().toLocaleString('zh-CN')}\n\n` +
                  `---\n\n` +
                  `> 实时风险预警平台`
          }
        })
      });

      const result = await response.json();
      
      if (result.errcode !== 0) {
        throw new Error(result.errmsg);
      }

      return c.json({ success: true, message: '钉钉推送成功' });
    } catch (error) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  return c.json({ success: false, error: '钉钉配置缺失' }, 400);
});
```

#### 步骤4：测试钉钉推送
```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "dingtalk",
    "riskId": 1,
    "message": "检测到智利CGE公司高风险预警：监管处罚金额超58亿美元"
  }'
```

---

## 🐛 常见问题解决

### Q1: 端口3000被占用
```bash
# 方法1：使用npm脚本
npm run clean-port

# 方法2：手动清理
fuser -k 3000/tcp 2>/dev/null || true

# 方法3：查找并杀死进程
lsof -ti:3000 | xargs kill -9
```

### Q2: PM2服务无法启动
```bash
# 查看错误日志
pm2 logs risk-alert-platform --lines 50

# 删除旧进程
pm2 delete risk-alert-platform

# 重新启动
pm2 start ecosystem.config.cjs
```

### Q3: 数据库查询失败
```bash
# 检查数据库文件是否存在
ls -la .wrangler/state/v3/d1/

# 重新初始化数据库
rm -rf .wrangler/state/v3/d1
npx wrangler d1 execute risk_alert_db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute risk_alert_db --local --file=./seed.sql
```

### Q4: 前端页面空白
```bash
# 检查构建是否成功
ls -la dist/

# 重新构建
npm run build

# 检查浏览器控制台错误
# 按F12打开开发者工具查看Console
```

### Q5: ECharts图表不显示
- 检查网络：确保CDN资源加载成功
- 检查数据：在浏览器Console中查看API返回数据
- 检查容器：确保图表容器DOM已渲染

### Q6: 实时数据不更新
```bash
# 检查轮询是否正常
# 打开浏览器Console，查看是否有5秒一次的API请求
# Network标签 → 筛选 /api/realtime

# 手动测试API
curl http://localhost:3000/api/realtime
```

---

## 🚀 进阶功能开发

### 1. 添加用户登录认证

使用 Cloudflare Access 或实现简单的Token认证：

```typescript
// 中间件：检查Authorization头
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization');
  
  if (!token || token !== 'Bearer your-secret-token') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});
```

### 2. 添加数据导出功能

导出Excel：
```bash
npm install exceljs
```

```typescript
app.get('/api/export/excel', async (c) => {
  const { DB } = c.env;
  const ExcelJS = require('exceljs');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('风险数据');
  
  // 设置列
  worksheet.columns = [
    { header: '公司名称', key: 'company_name', width: 20 },
    { header: '标题', key: 'title', width: 40 },
    { header: '风险等级', key: 'risk_level', width: 15 },
    // ... 更多列
  ];
  
  // 查询数据
  const result = await DB.prepare('SELECT * FROM risks').all();
  worksheet.addRows(result.results);
  
  // 生成文件
  const buffer = await workbook.xlsx.writeBuffer();
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=risks.xlsx'
    }
  });
});
```

### 3. 接入更多数据源

通过API定时抓取：
```typescript
// 定时任务（使用 Cloudflare Cron Triggers）
export default {
  async scheduled(event, env, ctx) {
    // 每小时执行一次
    const response = await fetch('https://api.example.com/risks');
    const data = await response.json();
    
    // 插入数据库
    for (const item of data) {
      await env.DB.prepare(`
        INSERT INTO risks (...) VALUES (...)
      `).bind(...).run();
    }
  }
}
```

### 4. 增加风险评分算法

```typescript
function calculateRiskScore(risk: Risk): number {
  let score = 0;
  
  // 根据风险等级加分
  if (risk.risk_level === '高风险') score += 80;
  else if (risk.risk_level === '中风险') score += 50;
  else score += 20;
  
  // 根据关键词加分
  const keywords = ['罚款', '停电', '监管', '违规'];
  keywords.forEach(keyword => {
    if (risk.risk_item.includes(keyword)) score += 10;
  });
  
  // 根据金额加分（提取金额数字）
  const amounts = risk.risk_item.match(/\d+(\.\d+)?亿/g);
  if (amounts) score += amounts.length * 5;
  
  return Math.min(score, 100);  // 最高100分
}
```

---

## 📞 技术支持

### 日志查看
```bash
# PM2日志
pm2 logs risk-alert-platform --nostream

# Wrangler日志
tail -f ~/.config/.wrangler/logs/wrangler-*.log
```

### 性能监控
```bash
# 查看进程状态
pm2 monit

# 查看系统资源
htop
```

### 数据库管理
```bash
# 进入数据库CLI
npx wrangler d1 execute risk_alert_db --local

# 查询示例
SELECT company_name, COUNT(*) FROM risks GROUP BY company_name;
SELECT * FROM risks WHERE risk_level = '高风险' LIMIT 10;
```

---

**文档版本：** v1.0.0  
**最后更新：** 2025-12-30  
**维护者：** AI Assistant
