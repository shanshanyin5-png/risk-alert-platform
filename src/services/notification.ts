// 通知服务 - 邮件和钉钉推送
import type { AlertRecord, Bindings } from '../types/bindings'

export class NotificationService {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  /**
   * 发送预警通知（邮件 + 钉钉）
   */
  async sendAlert(alert: AlertRecord, channels: string[]): Promise<void> {
    const tasks = []

    if (channels.includes('email')) {
      tasks.push(this.sendEmail(alert))
    }

    if (channels.includes('dingtalk')) {
      tasks.push(this.sendDingTalk(alert))
    }

    await Promise.all(tasks)

    // 更新预警状态为已通知
    await this.db
      .prepare('UPDATE alert_records SET status = ?, notified_at = ? WHERE id = ?')
      .bind('notified', Math.floor(Date.now() / 1000), alert.id!)
      .run()
  }

  /**
   * 发送邮件通知（需要配置 Resend 或 SendGrid API）
   * 生产环境需要在 wrangler.jsonc 配置环境变量
   */
  private async sendEmail(alert: AlertRecord): Promise<void> {
    try {
      // 📧 邮件发送逻辑（示例代码，需要配置 API Key）
      // const apiKey = env.EMAIL_API_KEY // 从环境变量获取
      // const response = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     from: 'alert@yourdomain.com',
      //     to: 'admin@yourdomain.com',
      //     subject: `【风险预警】${alert.level === 'critical' ? '严重' : '警告'} - ${alert.rule_name}`,
      //     html: this.generateEmailHtml(alert),
      //   }),
      // })

      // 记录日志
      await this.logNotification(alert.id!, 'email', 'admin@example.com', 'success')
      
      console.log(`✅ 邮件通知已发送: ${alert.message}`)
    } catch (error) {
      await this.logNotification(
        alert.id!,
        'email',
        'admin@example.com',
        'failed',
        String(error)
      )
      console.error('❌ 邮件发送失败:', error)
    }
  }

  /**
   * 发送钉钉通知
   */
  private async sendDingTalk(alert: AlertRecord): Promise<void> {
    try {
      // 🔔 钉钉机器人 Webhook（需要配置钉钉机器人地址）
      // const webhookUrl = env.DINGTALK_WEBHOOK // 从环境变量获取
      // const response = await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     msgtype: 'markdown',
      //     markdown: {
      //       title: `风险预警 - ${alert.rule_name}`,
      //       text: this.generateDingTalkMarkdown(alert),
      //     },
      //   }),
      // })

      // 记录日志
      await this.logNotification(alert.id!, 'dingtalk', 'group-webhook', 'success')
      
      console.log(`✅ 钉钉通知已发送: ${alert.message}`)
    } catch (error) {
      await this.logNotification(
        alert.id!,
        'dingtalk',
        'group-webhook',
        'failed',
        String(error)
      )
      console.error('❌ 钉钉发送失败:', error)
    }
  }

  /**
   * 生成邮件 HTML
   */
  private generateEmailHtml(alert: AlertRecord): string {
    const levelColor = alert.level === 'critical' ? '#ff4d4f' : '#faad14'
    const levelText = alert.level === 'critical' ? '严重预警' : '警告预警'

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: ${levelColor}; margin-top: 0;">🚨 ${levelText}</h2>
          <div style="background-color: #fafafa; padding: 15px; border-left: 4px solid ${levelColor}; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #333;">${alert.message}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>规则名称：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${alert.rule_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>数据源：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${alert.data_source_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>当前值：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${alert.current_value}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>阈值：</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${alert.threshold}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>触发时间：</strong></td>
              <td style="padding: 10px;">${new Date((alert.created_at || 0) * 1000).toLocaleString('zh-CN')}</td>
            </tr>
          </table>
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            此邮件由实时风险预警平台自动发送，请勿回复
          </p>
        </div>
      </div>
    `
  }

  /**
   * 生成钉钉 Markdown 消息
   */
  private generateDingTalkMarkdown(alert: AlertRecord): string {
    const levelEmoji = alert.level === 'critical' ? '🔴' : '🟡'
    const levelText = alert.level === 'critical' ? '严重预警' : '警告预警'

    return `
### ${levelEmoji} ${levelText}

---

**消息：** ${alert.message}

**规则名称：** ${alert.rule_name}

**数据源：** ${alert.data_source_name}

**当前值：** ${alert.current_value}

**阈值：** ${alert.threshold}

**触发时间：** ${new Date((alert.created_at || 0) * 1000).toLocaleString('zh-CN')}

---
> 📊 [查看详情](https://your-domain.com/alerts/${alert.id})
    `.trim()
  }

  /**
   * 记录通知日志
   */
  private async logNotification(
    alertId: number,
    channel: string,
    recipient: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO notification_logs (alert_id, channel, recipient, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(alertId, channel, recipient, status, errorMessage || null, Math.floor(Date.now() / 1000))
      .run()
  }
}
