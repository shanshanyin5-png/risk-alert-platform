// Cloudflare D1 Database类型定义
export interface Bindings {
  DB: D1Database;
  GENSPARK_TOKEN?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

// 风险信息数据结构
export interface Risk {
  id: number;
  company_name: string;
  title: string;
  risk_item: string;
  risk_time: string;
  source: string;
  risk_level: string;
  risk_level_review: string;
  risk_value_confirm: string;
  risk_reason: string;
  remark: string;
  created_at: string;
}

// 预警规则数据结构
export interface AlertRule {
  id: number;
  rule_name: string;
  company_filter: string;  // JSON array
  risk_level_filter: string;  // JSON array
  keyword_filter: string;
  enabled: number;
  notify_email: number;
  notify_dingtalk: number;
  created_at: string;
  updated_at: string;
}

// 预警历史记录结构
export interface AlertHistory {
  id: number;
  rule_id: number;
  risk_id: number;
  alert_type: string;
  alert_status: string;
  alert_message: string;
  created_at: string;
}

// API响应统一结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 统计数据结构
export interface StatisticsData {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  todayRisks: number;
  companyDistribution: Array<{ company: string; count: number }>;
  riskTrend: Array<{ date: string; count: number }>;
}
