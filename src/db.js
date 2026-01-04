// 数据库适配层 - 支持 D1 (SQLite) 和 Supabase (PostgreSQL)
import { createClient } from '@supabase/supabase-js'

// 检查是否在 Cloudflare Workers 环境
const isCloudflareWorkers = typeof caches !== 'undefined'

// Supabase 客户端（仅在非 Workers 环境下初始化）
let supabase = null
if (!isCloudflareWorkers && typeof process !== 'undefined') {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
}

// 数据库抽象类
export class Database {
  constructor(db) {
    this.db = db // D1 数据库对象
    this.isD1 = !!db
    this.client = this.isD1 ? null : supabase
  }

  // 执行查询
  async query(sql, params = []) {
    if (this.isD1) {
      // D1 (SQLite)
      const stmt = this.db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).all()
      }
      return await stmt.all()
    } else {
      // Supabase (PostgreSQL)
      // 将 SQLite 语法转换为 PostgreSQL
      return await this._executeSupabase(sql, params)
    }
  }

  // 执行单条记录查询
  async queryOne(sql, params = []) {
    if (this.isD1) {
      const stmt = this.db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).first()
      }
      return await stmt.first()
    } else {
      const result = await this._executeSupabase(sql, params)
      return result.data && result.data.length > 0 ? result.data[0] : null
    }
  }

  // 执行写入操作
  async execute(sql, params = []) {
    if (this.isD1) {
      const stmt = this.db.prepare(sql)
      if (params.length > 0) {
        return await stmt.bind(...params).run()
      }
      return await stmt.run()
    } else {
      return await this._executeSupabase(sql, params)
    }
  }

  // Supabase 执行方法
  async _executeSupabase(sql, params) {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Please check environment variables.')
    }

    // 解析 SQL 并使用 Supabase SDK
    const sqlLower = sql.toLowerCase().trim()
    
    try {
      // SELECT 查询
      if (sqlLower.startsWith('select')) {
        return await this._handleSelect(sql, params)
      }
      // INSERT 查询
      else if (sqlLower.startsWith('insert')) {
        return await this._handleInsert(sql, params)
      }
      // UPDATE 查询
      else if (sqlLower.startsWith('update')) {
        return await this._handleUpdate(sql, params)
      }
      // DELETE 查询
      else if (sqlLower.startsWith('delete')) {
        return await this._handleDelete(sql, params)
      }
      else {
        throw new Error(`Unsupported SQL operation: ${sql}`)
      }
    } catch (error) {
      console.error('Supabase query error:', error)
      throw error
    }
  }

  // 处理 SELECT 查询
  async _handleSelect(sql, params) {
    // 简单的表名提取
    const tableMatch = sql.match(/from\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('Could not extract table name from SQL')
    }
    const tableName = tableMatch[1]

    let query = this.client.from(tableName).select('*')

    // 处理 WHERE 条件
    if (sql.includes('WHERE') || sql.includes('where')) {
      // 简单处理，实际项目中需要更复杂的 SQL 解析
      // 这里假设使用占位符 ?，并按顺序替换
    }

    // 处理 ORDER BY
    if (sql.includes('ORDER BY') || sql.includes('order by')) {
      const orderMatch = sql.match(/order\s+by\s+(\w+)\s*(asc|desc)?/i)
      if (orderMatch) {
        const column = orderMatch[1]
        const direction = orderMatch[2] || 'asc'
        query = query.order(column, { ascending: direction.toLowerCase() === 'asc' })
      }
    }

    // 处理 LIMIT
    if (sql.includes('LIMIT') || sql.includes('limit')) {
      const limitMatch = sql.match(/limit\s+(\d+)/i)
      if (limitMatch) {
        query = query.limit(parseInt(limitMatch[1]))
      }
    }

    const { data, error } = await query
    if (error) throw error

    return { results: data, success: true }
  }

  // 处理 INSERT 查询
  async _handleInsert(sql, params) {
    const tableMatch = sql.match(/insert\s+into\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('Could not extract table name from SQL')
    }
    const tableName = tableMatch[1]

    // 提取列名
    const columnsMatch = sql.match(/\(([^)]+)\)/i)
    if (!columnsMatch) {
      throw new Error('Could not extract columns from SQL')
    }
    const columns = columnsMatch[1].split(',').map(c => c.trim())

    // 构建插入对象
    const insertData = {}
    columns.forEach((col, index) => {
      insertData[col] = params[index]
    })

    const { data, error } = await this.client
      .from(tableName)
      .insert(insertData)
      .select()

    if (error) throw error

    return { 
      results: data, 
      success: true,
      meta: { last_row_id: data && data.length > 0 ? data[0].id : null }
    }
  }

  // 处理 UPDATE 查询
  async _handleUpdate(sql, params) {
    const tableMatch = sql.match(/update\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('Could not extract table name from SQL')
    }
    const tableName = tableMatch[1]

    // 提取 SET 子句
    const setMatch = sql.match(/set\s+(.+?)\s+where/i)
    if (!setMatch) {
      throw new Error('Could not extract SET clause from SQL')
    }

    // 构建更新对象
    const updateData = {}
    const setPairs = setMatch[1].split(',')
    let paramIndex = 0
    setPairs.forEach(pair => {
      const [key] = pair.split('=').map(s => s.trim())
      updateData[key] = params[paramIndex++]
    })

    // 提取 WHERE 条件
    const whereMatch = sql.match(/where\s+(.+)$/i)
    let query = this.client.from(tableName).update(updateData)

    if (whereMatch) {
      // 简单处理 WHERE 条件
      const condition = whereMatch[1].trim()
      const condMatch = condition.match(/(\w+)\s*=\s*\?/)
      if (condMatch) {
        const column = condMatch[1]
        const value = params[paramIndex]
        query = query.eq(column, value)
      }
    }

    const { data, error } = await query.select()
    if (error) throw error

    return { results: data, success: true }
  }

  // 处理 DELETE 查询
  async _handleDelete(sql, params) {
    const tableMatch = sql.match(/delete\s+from\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('Could not extract table name from SQL')
    }
    const tableName = tableMatch[1]

    let query = this.client.from(tableName).delete()

    // 提取 WHERE 条件
    const whereMatch = sql.match(/where\s+(.+)$/i)
    if (whereMatch) {
      const condition = whereMatch[1].trim()
      const condMatch = condition.match(/(\w+)\s*=\s*\?/)
      if (condMatch) {
        const column = condMatch[1]
        const value = params[0]
        query = query.eq(column, value)
      }
    }

    const { data, error } = await query
    if (error) throw error

    return { results: data, success: true }
  }
}

// 创建数据库实例的辅助函数
export function createDatabase(env) {
  // 优先使用 D1
  if (env && env.DB) {
    return new Database(env.DB)
  }
  // 否则使用 Supabase
  return new Database(null)
}
