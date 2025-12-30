// SSE 实时数据推送路由
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { Bindings } from '../types/bindings'

const realtime = new Hono<{ Bindings: Bindings }>()

/**
 * SSE 实时推送数据源状态
 * GET /api/realtime/data
 * 
 * 使用方式：
 * const eventSource = new EventSource('/api/realtime/data')
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data)
 *   console.log('实时数据:', data)
 * }
 */
realtime.get('/data', async (c) => {
  const { DB } = c.env

  return streamSSE(c, async (stream) => {
    let messageId = 0

    // 每 3 秒推送一次数据源状态
    const intervalId = setInterval(async () => {
      try {
        // 查询所有数据源
        const result = await DB.prepare(`
          SELECT id, name, type, value, unit, status, updated_at 
          FROM data_sources 
          ORDER BY id
        `).all()

        // 发送 SSE 消息
        await stream.writeSSE({
          id: String(messageId++),
          event: 'data-update',
          data: JSON.stringify({
            timestamp: Date.now(),
            sources: result.results
          })
        })
      } catch (error) {
        console.error('SSE 推送错误:', error)
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: String(error) })
        })
      }
    }, 3000)

    // 客户端断开连接时清理定时器
    c.req.raw.signal.addEventListener('abort', () => {
      clearInterval(intervalId)
    })
  })
})

/**
 * SSE 实时推送预警记录
 * GET /api/realtime/alerts
 */
realtime.get('/alerts', async (c) => {
  const { DB } = c.env

  return streamSSE(c, async (stream) => {
    let messageId = 0
    let lastAlertId = 0

    // 每 2 秒检查是否有新预警
    const intervalId = setInterval(async () => {
      try {
        // 查询最新的预警记录
        const result = await DB.prepare(`
          SELECT * FROM alert_records 
          WHERE id > ? 
          ORDER BY id ASC
          LIMIT 10
        `)
          .bind(lastAlertId)
          .all()

        if (result.results.length > 0) {
          // 更新最后一条预警 ID
          const maxId = Math.max(...result.results.map((r: any) => r.id))
          lastAlertId = maxId

          // 发送新预警
          await stream.writeSSE({
            id: String(messageId++),
            event: 'new-alert',
            data: JSON.stringify({
              timestamp: Date.now(),
              alerts: result.results
            })
          })
        } else {
          // 发送心跳包，保持连接
          await stream.writeSSE({
            id: String(messageId++),
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: Date.now() })
          })
        }
      } catch (error) {
        console.error('SSE 推送错误:', error)
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: String(error) })
        })
      }
    }, 2000)

    // 客户端断开连接时清理定时器
    c.req.raw.signal.addEventListener('abort', () => {
      clearInterval(intervalId)
    })
  })
})

/**
 * SSE 实时推送统计数据
 * GET /api/realtime/stats
 */
realtime.get('/stats', async (c) => {
  const { DB } = c.env

  return streamSSE(c, async (stream) => {
    let messageId = 0

    // 每 5 秒推送统计数据
    const intervalId = setInterval(async () => {
      try {
        const since = Math.floor(Date.now() / 1000) - 24 * 3600

        // 查询统计数据
        const [totalAlerts, warningCount, criticalCount, dataSourceCount] = await Promise.all([
          DB.prepare('SELECT COUNT(*) as count FROM alert_records WHERE created_at >= ?')
            .bind(since)
            .first<{ count: number }>(),
          DB.prepare('SELECT COUNT(*) as count FROM alert_records WHERE level = ? AND created_at >= ?')
            .bind('warning', since)
            .first<{ count: number }>(),
          DB.prepare('SELECT COUNT(*) as count FROM alert_records WHERE level = ? AND created_at >= ?')
            .bind('critical', since)
            .first<{ count: number }>(),
          DB.prepare('SELECT COUNT(*) as count FROM data_sources')
            .first<{ count: number }>()
        ])

        await stream.writeSSE({
          id: String(messageId++),
          event: 'stats-update',
          data: JSON.stringify({
            timestamp: Date.now(),
            stats: {
              totalAlerts: totalAlerts?.count || 0,
              warningAlerts: warningCount?.count || 0,
              criticalAlerts: criticalCount?.count || 0,
              dataSources: dataSourceCount?.count || 0
            }
          })
        })
      } catch (error) {
        console.error('SSE 推送错误:', error)
      }
    }, 5000)

    // 客户端断开连接时清理定时器
    c.req.raw.signal.addEventListener('abort', () => {
      clearInterval(intervalId)
    })
  })
})

export default realtime
