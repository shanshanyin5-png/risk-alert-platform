// 风险规则 API 路由
import { Hono } from 'hono'
import type { Bindings, RiskRule } from '../types/bindings'

const rules = new Hono<{ Bindings: Bindings }>()

/**
 * 获取所有规则
 * GET /api/rules
 */
rules.get('/', async (c) => {
  const { DB } = c.env
  
  try {
    const result = await DB.prepare(`
      SELECT r.*, d.name as data_source_name
      FROM risk_rules r
      LEFT JOIN data_sources d ON r.data_source_id = d.id
      ORDER BY r.id DESC
    `).all()
    
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 获取单个规则
 * GET /api/rules/:id
 */
rules.get('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const result = await DB.prepare('SELECT * FROM risk_rules WHERE id = ?')
      .bind(id)
      .first()
    
    if (!result) {
      return c.json({ success: false, error: '规则不存在' }, 404)
    }
    
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 创建规则
 * POST /api/rules
 */
rules.post('/', async (c) => {
  const { DB } = c.env
  
  try {
    const body = await c.req.json<RiskRule>()
    const now = Math.floor(Date.now() / 1000)
    
    const result = await DB.prepare(`
      INSERT INTO risk_rules 
      (name, data_source_id, condition, threshold, level, enabled, notify_email, notify_dingtalk, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        body.name,
        body.data_source_id,
        body.condition,
        body.threshold,
        body.level,
        body.enabled ?? 1,
        body.notify_email ?? 1,
        body.notify_dingtalk ?? 1,
        body.description || '',
        now,
        now
      )
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
 * 更新规则
 * PUT /api/rules/:id
 */
rules.put('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json<RiskRule>()
    const now = Math.floor(Date.now() / 1000)
    
    await DB.prepare(`
      UPDATE risk_rules 
      SET name = ?, data_source_id = ?, condition = ?, threshold = ?, level = ?, 
          enabled = ?, notify_email = ?, notify_dingtalk = ?, description = ?, updated_at = ?
      WHERE id = ?
    `)
      .bind(
        body.name,
        body.data_source_id,
        body.condition,
        body.threshold,
        body.level,
        body.enabled ?? 1,
        body.notify_email ?? 1,
        body.notify_dingtalk ?? 1,
        body.description || '',
        now,
        id
      )
      .run()
    
    return c.json({ success: true, message: '规则更新成功' })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 切换规则启用状态
 * PATCH /api/rules/:id/toggle
 */
rules.patch('/:id/toggle', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    const rule = await DB.prepare('SELECT enabled FROM risk_rules WHERE id = ?')
      .bind(id)
      .first<{ enabled: number }>()
    
    if (!rule) {
      return c.json({ success: false, error: '规则不存在' }, 404)
    }
    
    const newStatus = rule.enabled === 1 ? 0 : 1
    await DB.prepare('UPDATE risk_rules SET enabled = ?, updated_at = ? WHERE id = ?')
      .bind(newStatus, Math.floor(Date.now() / 1000), id)
      .run()
    
    return c.json({ 
      success: true, 
      message: newStatus === 1 ? '规则已启用' : '规则已禁用',
      enabled: newStatus
    })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

/**
 * 删除规则
 * DELETE /api/rules/:id
 */
rules.delete('/:id', async (c) => {
  const { DB } = c.env
  const id = c.req.param('id')
  
  try {
    await DB.prepare('DELETE FROM risk_rules WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: '删除成功' })
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500)
  }
})

export default rules
