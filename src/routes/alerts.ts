// 预警记录 API 路由
import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'
import { RiskEngine } from '../services/riskEngine'

const alerts = new Hono<{ Bindings: Bindings }>()

/**
 * 获取预警记录（支持分页和筛选）
 * GET /api/alerts?page=1&limit=20&level=critical&status=pending
 */
alerts.get('/', async (c) => {
  const { DB } = c.env
  
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const level = c.req.query('level')
    const status = c.req.query('status')
    const offset = (page - 1) * limit
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1'
    const bindings: any[] = []
    
    if (level) {
      whereClause += ' AND level = ?'
      bindings.push(level)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      bindings.push(status)
    }
    
    // 查询总数
    const countResult = await DB.prepare(`SELECT COUNT(*) as total FROM alert_records ${whereClause}`)
      .bind(...bindings)
      .first<{ total: number }>()
    
    // 查询数据
    bindings.push(limit, offset)
    const result = await DB.prepare(`
      SELECT * FROM alert_records 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
      .bind(...bindings)
      .all()
    
    return c.json({
      success: true,
      data: result.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取预警统计
 * GET /api/alerts/stats?hours=24
 */
alerts.get('/stats', async (c) => {
  const { DB } = c.env
  
  try {
    const hours = parseInt(c.req.query('hours') || '24')
    const engine = new RiskEngine(DB)
    
    const stats = await engine.getAlertStats(hours)
    
    // 计算汇总统计
    const summary = {
      total: 0,
      warning: 0,
      critical: 0,
      pending: 0,
      notified: 0,
      resolved: 0
    }
    
    stats.forEach((stat: any) => {
      summary.total += stat.count
      if (stat.level === 'warning') summary.warning += stat.count
      if (stat.level === 'critical') summary.critical += stat.count
      if (stat.status === 'pending') summary.pending += stat.count
      if (stat.status === 'notified') summary.notified += stat.count
      if (stat.status === 'resolved') summary.resolved += stat.count
    })
    
    return c.json({
      success: true,
      data: {
        summary,
        details: stats
      }
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取最近预警（用于实时展示）
 * GET /api/alerts/recent?limit=10
 */
alerts.get('/recent', async (c) => {
  const { DB } = c.env
  
  try {
    const limit = parseInt(c.req.query('limit') || '10')
    
    const result = await DB.prepare(`
      SELECT * FROM alert_records 
      ORDER BY created_at DESC 
      LIMIT ?
    `)
      .bind(limit)
      .all()
    
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取单条预警详情
 * GET /api/alerts/:id
 */
alerts.get('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const alert = await DB.prepare('SELECT * FROM alert_records WHERE id = ?')
      .bind(id)
      .first()
    
    if (!alert) {
      return c.json({ success: false, error: '预警记录不存在' }, 404)
    }
    
    // 获取通知日志
    const logs = await DB.prepare('SELECT * FROM notification_logs WHERE alert_id = ?')
      .bind(id)
      .all()
    
    return c.json({ 
      success: true, 
      data: {
        ...alert,
        notification_logs: logs.results
      }
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 标记预警为已解决
 * PATCH /api/alerts/:id/resolve
 */
alerts.patch('/:id/resolve', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const now = Math.floor(Date.now() / 1000)
    
    await DB.prepare('UPDATE alert_records SET status = ?, resolved_at = ? WHERE id = ?')
      .bind('resolved', now, id)
      .run()
    
    return c.json({ success: true, message: '预警已标记为已解决' })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取预警趋势（按小时统计）
 * GET /api/alerts/trend?hours=24
 */
alerts.get('/trend/hourly', async (c) => {
  const { DB } = c.env
  
  try {
    const hours = parseInt(c.req.query('hours') || '24')
    const since = Math.floor(Date.now() / 1000) - hours * 3600
    
    const result = await DB.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', datetime(created_at, 'unixepoch')) as hour,
        level,
        COUNT(*) as count
      FROM alert_records 
      WHERE created_at >= ?
      GROUP BY hour, level
      ORDER BY hour ASC
    `)
      .bind(since)
      .all()
    
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

export default alerts
