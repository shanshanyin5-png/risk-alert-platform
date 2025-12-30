// 风险判断引擎 - 核心业务逻辑
import type { DataSource, RiskRule, AlertRecord, Bindings } from '../types/bindings'

export class RiskEngine {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  /**
   * 检查单个数据源是否触发风险规则
   */
  async checkDataSource(dataSourceId: number): Promise<AlertRecord[]> {
    // 获取数据源信息
    const dataSource = await this.db
      .prepare('SELECT * FROM data_sources WHERE id = ?')
      .bind(dataSourceId)
      .first<DataSource>()

    if (!dataSource) {
      return []
    }

    // 获取该数据源的所有启用规则
    const rules = await this.db
      .prepare('SELECT * FROM risk_rules WHERE data_source_id = ? AND enabled = 1')
      .bind(dataSourceId)
      .all<RiskRule>()

    const alerts: AlertRecord[] = []

    // 检查每条规则
    for (const rule of rules.results) {
      if (this.evaluateRule(dataSource.value, rule)) {
        // 触发预警，创建预警记录
        const alert = await this.createAlert(dataSource, rule)
        alerts.push(alert)
      }
    }

    // 更新数据源状态
    if (alerts.length > 0) {
      const highestLevel = alerts.some(a => a.level === 'critical') ? 'critical' : 'warning'
      await this.updateDataSourceStatus(dataSourceId, highestLevel)
    } else {
      await this.updateDataSourceStatus(dataSourceId, 'normal')
    }

    return alerts
  }

  /**
   * 检查所有数据源
   */
  async checkAllDataSources(): Promise<AlertRecord[]> {
    const dataSources = await this.db
      .prepare('SELECT id FROM data_sources')
      .all<{ id: number }>()

    const allAlerts: AlertRecord[] = []

    for (const ds of dataSources.results) {
      const alerts = await this.checkDataSource(ds.id)
      allAlerts.push(...alerts)
    }

    return allAlerts
  }

  /**
   * 评估规则是否触发
   */
  private evaluateRule(value: number, rule: RiskRule): boolean {
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold
      case 'gte':
        return value >= rule.threshold
      case 'lt':
        return value < rule.threshold
      case 'lte':
        return value <= rule.threshold
      case 'eq':
        return value === rule.threshold
      default:
        return false
    }
  }

  /**
   * 创建预警记录
   */
  private async createAlert(dataSource: DataSource, rule: RiskRule): Promise<AlertRecord> {
    const message = this.generateAlertMessage(dataSource, rule)
    const now = Math.floor(Date.now() / 1000)

    const result = await this.db
      .prepare(`
        INSERT INTO alert_records 
        (rule_id, rule_name, data_source_name, current_value, threshold, level, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `)
      .bind(
        rule.id!,
        rule.name,
        dataSource.name,
        dataSource.value,
        rule.threshold,
        rule.level,
        message,
        now
      )
      .run()

    return {
      id: result.meta.last_row_id as number,
      rule_id: rule.id!,
      rule_name: rule.name,
      data_source_name: dataSource.name,
      current_value: dataSource.value,
      threshold: rule.threshold,
      level: rule.level,
      message,
      status: 'pending',
      created_at: now
    }
  }

  /**
   * 生成预警消息
   */
  private generateAlertMessage(dataSource: DataSource, rule: RiskRule): string {
    const conditionText = {
      gt: '超过',
      gte: '达到或超过',
      lt: '低于',
      lte: '低于或等于',
      eq: '等于'
    }[rule.condition]

    return `【${rule.level === 'critical' ? '严重' : '警告'}】${dataSource.name} 当前值 ${dataSource.value}${dataSource.unit || ''} ${conditionText} 阈值 ${rule.threshold}${dataSource.unit || ''}`
  }

  /**
   * 更新数据源状态
   */
  private async updateDataSourceStatus(
    dataSourceId: number,
    status: 'normal' | 'warning' | 'critical'
  ): Promise<void> {
    await this.db
      .prepare('UPDATE data_sources SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, Math.floor(Date.now() / 1000), dataSourceId)
      .run()
  }

  /**
   * 获取最近的预警统计
   */
  async getAlertStats(hours: number = 24): Promise<any> {
    const since = Math.floor(Date.now() / 1000) - hours * 3600

    const stats = await this.db
      .prepare(`
        SELECT 
          level,
          COUNT(*) as count,
          status
        FROM alert_records 
        WHERE created_at >= ?
        GROUP BY level, status
      `)
      .bind(since)
      .all()

    return stats.results
  }
}
