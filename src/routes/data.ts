// 数据源 API 路由
import { Hono } from 'hono'
import type { Bindings, DataSource } from '../types/bindings'
import { RiskEngine } from '../services/riskEngine'
import { NotificationService } from '../services/notification'

const data = new Hono<{ Bindings: Bindings }>()

/**
 * 获取所有数据源
 * GET /api/data
 */
data.get('/', async (c) => {
  const { DB } = c.env
  
  try {
    const result = await DB.prepare('SELECT * FROM data_sources ORDER BY id DESC').all()
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取单个数据源
 * GET /api/data/:id
 */
data.get('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const result = await DB.prepare('SELECT * FROM data_sources WHERE id = ?')
      .bind(id)
      .first()
    
    if (!result) {
      return c.json({ success: false, error: '数据源不存在' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 创建数据源
 * POST /api/data
 */
data.post('/', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json<DataSource>()
    const now = Math.floor(Date.now() / 1000)
    
    const result = await DB.prepare(`
      INSERT INTO data_sources (name, type, value, unit, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(body.name, body.type, body.value, body.unit || '', 'normal', now, now)
      .run()
    
    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id, ...body } 
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 更新数据源值（触发风险检测）
 * PUT /api/data/:id
 */
data.put('/:id', async (c) => {
  const { DB } = c.env
  const id = parseInt(c.req.param('id'))
  
  try {
    const body = await c.req.json<{ value: number }>()
    const now = Math.floor(Date.now() / 1000)
    
    // 更新数据源值
    await DB.prepare('UPDATE data_sources SET value = ?, updated_at = ? WHERE id = ?')
      .bind(body.value, now, id)
      .run()
    
    // 触发风险检测
    const engine = new RiskEngine(DB)
    const alerts = await engine.checkDataSource(id)
    
    // 如果有预警，发送通知
    if (alerts.length > 0) {
      const notificationService = new NotificationService(DB)
      for (const alert of alerts) {
        // 默认同时发送邮件和钉钉通知
        await notificationService.sendAlert(alert, ['email', 'dingtalk'])
      }
    }
    
    return c.json({ 
      success: true, 
      message: '数据更新成功',
      alerts: alerts.length,
      data: alerts
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 批量更新数据源（模拟数据采集）
 * POST /api/data/batch-update
 */
data.post('/batch-update', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json<{ updates: Array<{ id: number; value: number }> }>()
    const engine = new RiskEngine(DB)
    const allAlerts: any[] = []
    const now = Math.floor(Date.now() / 1000)
    
    // 批量更新数据
    for (const update of body.updates) {
      await DB.prepare('UPDATE data_sources SET value = ?, updated_at = ? WHERE id = ?')
        .bind(update.value, now, update.id)
        .run()
      
      // 检测风险
      const alerts = await engine.checkDataSource(update.id)
      if (alerts.length > 0) {
        allAlerts.push(...alerts)
        
        // 发送通知
        const notificationService = new NotificationService(DB)
        for (const alert of alerts) {
          await notificationService.sendAlert(alert, ['email', 'dingtalk'])
        }
      }
    }
    
    return c.json({ 
      success: true, 
      message: `已更新 ${body.updates.length} 个数据源`,
      alerts: allAlerts.length,
      data: allAlerts
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 删除数据源
 * DELETE /api/data/:id
 */
data.delete('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    await DB.prepare('DELETE FROM data_sources WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: '删除成功' })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

export default data
