// Hono 主应用入口
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings } from './types/bindings'

// 导入路由
import data from './routes/data'
import rules from './routes/rules'
import alerts from './routes/alerts'
import realtime from './routes/realtime'

const app = new Hono<{ Bindings: Bindings }>()

// 中间件
app.use('*', logger())
app.use('/api/*', cors())

// 静态文件服务
app.use('/static/*', serveStatic({ root: './public' }))

// API 路由
app.route('/api/data', data)
app.route('/api/rules', rules)
app.route('/api/alerts', alerts)
app.route('/api/realtime', realtime)

// 健康检查
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  })
})

// 首页
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>实时风险预警平台</title>
    <link href="https://unpkg.com/element-plus@2.4.4/dist/index.css" rel="stylesheet">
    <script src="https://unpkg.com/vue@3.3.11/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus@2.4.4/dist/index.full.min.js"></script>
    <script src="https://unpkg.com/axios@1.6.2/dist/axios.min.js"></script>
    <script src="https://unpkg.com/echarts@5.4.3/dist/echarts.min.js"></script>
    <link href="/static/styles.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f7fa; }
        #app { min-height: 100vh; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #909399;
            font-size: 14px;
        }
        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        .panel {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .panel-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #303133;
        }
        .chart-container {
            height: 300px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #909399;
        }
        @media (max-width: 768px) {
            .content-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>🚨 实时风险预警平台</h1>
            <p>Real-time Risk Alert Platform - Powered by Cloudflare Workers</p>
        </div>
        
        <div class="container">
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">📊 监控数据源</div>
                    <div class="stat-value" style="color: #409eff;">{{ stats.dataSources }}</div>
                    <el-progress :percentage="100" :show-text="false" color="#409eff"></el-progress>
                </div>
                <div class="stat-card">
                    <div class="stat-label">⚠️ 今日预警总数</div>
                    <div class="stat-value" style="color: #e6a23c;">{{ stats.totalAlerts }}</div>
                    <el-progress :percentage="70" :show-text="false" color="#e6a23c"></el-progress>
                </div>
                <div class="stat-card">
                    <div class="stat-label">🟡 警告级别</div>
                    <div class="stat-value" style="color: #e6a23c;">{{ stats.warningAlerts }}</div>
                    <el-progress :percentage="40" :show-text="false" color="#e6a23c"></el-progress>
                </div>
                <div class="stat-card">
                    <div class="stat-label">🔴 严重级别</div>
                    <div class="stat-value" style="color: #f56c6c;">{{ stats.criticalAlerts }}</div>
                    <el-progress :percentage="30" :show-text="false" color="#f56c6c"></el-progress>
                </div>
            </div>

            <!-- 主要内容区 -->
            <div class="content-grid">
                <!-- 左侧：图表 -->
                <div>
                    <div class="panel">
                        <div class="panel-title">📈 数据源实时监控</div>
                        <div class="chart-container" ref="dataChart"></div>
                    </div>
                    
                    <div class="panel" style="margin-top: 20px;">
                        <div class="panel-title">📊 预警趋势分析</div>
                        <div class="chart-container" ref="trendChart"></div>
                    </div>
                </div>

                <!-- 右侧：实时预警列表 -->
                <div>
                    <div class="panel">
                        <div class="panel-title">
                            🔔 实时预警
                            <el-badge :value="recentAlerts.length" style="float: right; margin-top: 5px;"></el-badge>
                        </div>
                        
                        <el-timeline v-if="recentAlerts.length > 0">
                            <el-timeline-item
                                v-for="alert in recentAlerts"
                                :key="alert.id"
                                :timestamp="formatTime(alert.created_at)"
                                :color="alert.level === 'critical' ? '#f56c6c' : '#e6a23c'"
                            >
                                <el-tag 
                                    :type="alert.level === 'critical' ? 'danger' : 'warning'" 
                                    size="small"
                                    style="margin-right: 8px;"
                                >
                                    {{ alert.level === 'critical' ? '严重' : '警告' }}
                                </el-tag>
                                <div style="margin-top: 5px; font-size: 13px;">
                                    {{ alert.message }}
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                        
                        <div v-else class="loading">
                            暂无预警记录
                        </div>
                    </div>

                    <!-- 数据源列表 -->
                    <div class="panel" style="margin-top: 20px;">
                        <div class="panel-title">💾 数据源状态</div>
                        <el-table :data="dataSources" size="small" style="width: 100%">
                            <el-table-column prop="name" label="名称" width="120" />
                            <el-table-column prop="value" label="当前值" width="80">
                                <template #default="scope">
                                    {{ scope.row.value }}{{ scope.row.unit }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="status" label="状态" width="80">
                                <template #default="scope">
                                    <el-tag 
                                        :type="scope.row.status === 'critical' ? 'danger' : scope.row.status === 'warning' ? 'warning' : 'success'" 
                                        size="small"
                                    >
                                        {{ scope.row.status === 'critical' ? '严重' : scope.row.status === 'warning' ? '警告' : '正常' }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </div>

            <!-- 底部链接 -->
            <div style="margin-top: 30px; text-align: center; color: #909399;">
                <el-space :size="20">
                    <el-link href="/api/health" target="_blank" type="primary">API 健康检查</el-link>
                    <el-link href="https://github.com" target="_blank" type="info">GitHub 仓库</el-link>
                    <el-link @click="testDataUpdate" type="success">模拟数据更新</el-link>
                </el-space>
            </div>
        </div>
    </div>

    <script src="/static/app.js"></script>
</body>
</html>
  `)
})

export default app
