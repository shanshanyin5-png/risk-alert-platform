// 基于规则的免费风险分析引擎
// 不依赖任何付费 API，完全本地化处理

// 国网及子公司关键词
const SGCC_KEYWORDS = [
  '国家电网', '国网', 'State Grid', 'SGCC',
  '国网国际', '国网巴西', 'State Grid Brazil',
  '巴基斯坦PMLTC', 'PMLTC', 'Matiari', 'Lahore', 'Pakistan',
  '巴西CPFL', 'CPFL', 'Grupo CPFL', 'Brazil',
  '菲律宾NGCP', 'NGCP', 'National Grid Corporation', 'Philippines',
  '智利CGE', 'CGE', 'Chilectra', 'Chile',
  '葡萄牙REN', 'REN', 'Redes Energéticas', 'Portugal',
  '希腊IPTO', 'IPTO', 'Independent Power', 'Greece',
  '澳大利亚', 'Australia', 'ElectraNet', 'Ausgrid',
  '香港电灯', 'HK Electric', 'Hongkong Electric', 'Hong Kong',
  '南澳', 'South Australia', 'Electranet'
]

// 公司名称映射
const COMPANY_MAP: { [key: string]: string } = {
  'PMLTC': '巴基斯坦PMLTC公司',
  'Pakistan': '巴基斯坦PMLTC公司',
  'Matiari': '巴基斯坦PMLTC公司',
  'Lahore': '巴基斯坦PMLTC公司',
  'CPFL': '巴西CPFL公司',
  'Brazil': '巴西CPFL公司',
  'NGCP': '菲律宾NGCP公司',
  'Philippines': '菲律宾NGCP公司',
  'CGE': '智利CGE公司',
  'Chilectra': '智利CGE公司',
  'Chile': '智利CGE公司',
  'REN': '葡萄牙REN公司',
  'Portugal': '葡萄牙REN公司',
  'IPTO': '希腊IPTO公司',
  'Greece': '希腊IPTO公司',
  'ElectraNet': '南澳Electranet',
  'Electranet': '南澳Electranet',
  'Ausgrid': '澳大利亚澳洲资产公司',
  'Australia': '澳大利亚澳洲资产公司',
  'HK Electric': '香港电灯公司',
  'Hongkong Electric': '香港电灯公司',
  'Hong Kong': '香港电灯公司',
  'State Grid': '国家电网巴西控股公司',
  '国家电网': '国家电网巴西控股公司',
  '国网': '国家电网巴西控股公司'
}

// 高风险关键词（严重事件）
const HIGH_RISK_KEYWORDS = [
  // 安全事故
  '事故', '爆炸', '火灾', '伤亡', '死亡', '严重',
  'accident', 'explosion', 'fire', 'death', 'fatality', 'casualties', 'serious',
  
  // 政治风险
  '政变', '制裁', '禁令', '国有化', '征收', '冲突',
  'coup', 'sanction', 'ban', 'nationalization', 'expropriation', 'conflict',
  
  // 重大损失
  '破产', '违约', '巨额', '重大损失', '资不抵债',
  'bankruptcy', 'default', 'massive', 'major loss', 'insolvent',
  
  // 法律问题
  '起诉', '刑事', '逮捕', '调查', '腐败',
  'prosecution', 'criminal', 'arrest', 'investigation', 'corruption'
]

// 中风险关键词（一般问题）
const MEDIUM_RISK_KEYWORDS = [
  // 运营问题
  '故障', '停电', '断电', '延误', '暂停',
  'failure', 'outage', 'blackout', 'delay', 'suspended',
  
  // 财务问题
  '亏损', '债务', '赤字', '资金紧张',
  'loss', 'debt', 'deficit', 'cash flow',
  
  // 争议纠纷
  '诉讼', '仲裁', '罚款', '纠纷', '抗议',
  'lawsuit', 'arbitration', 'fine', 'dispute', 'protest',
  
  // 质量问题
  '质量', '缺陷', '问题', '故障率',
  'quality', 'defect', 'issue', 'malfunction'
]

// 低风险关键词（正常/正面）
const LOW_RISK_KEYWORDS = [
  // 正面报道
  '成功', '完成', '顺利', '签约', '合作', '获奖',
  'success', 'complete', 'smooth', 'sign', 'cooperation', 'award',
  
  // 业务拓展
  '扩张', '投资', '新项目', '增长', '盈利',
  'expansion', 'investment', 'new project', 'growth', 'profit',
  
  // 技术创新
  '创新', '技术', '升级', '智能', '数字化',
  'innovation', 'technology', 'upgrade', 'smart', 'digital'
]

// 风险分析接口
export interface RiskAnalysis {
  isRelevant: boolean
  companyName: string
  riskLevel: '高风险' | '中风险' | '低风险'
  riskItem: string
  analysis: string
}

/**
 * 检查文本是否与国网相关
 */
function isRelevantToSGCC(text: string): boolean {
  const lowerText = text.toLowerCase()
  return SGCC_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

/**
 * 识别相关公司名称
 */
function identifyCompany(text: string): string {
  const lowerText = text.toLowerCase()
  
  // 按优先级匹配公司
  for (const [keyword, company] of Object.entries(COMPANY_MAP)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return company
    }
  }
  
  // 默认返回国家电网
  return '国家电网巴西控股公司'
}

/**
 * 评估风险等级
 */
function assessRiskLevel(text: string): '高风险' | '中风险' | '低风险' {
  const lowerText = text.toLowerCase()
  
  // 计算各等级关键词出现次数
  let highRiskCount = 0
  let mediumRiskCount = 0
  let lowRiskCount = 0
  
  HIGH_RISK_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      highRiskCount++
    }
  })
  
  MEDIUM_RISK_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      mediumRiskCount++
    }
  })
  
  LOW_RISK_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      lowRiskCount++
    }
  })
  
  // 判定规则
  if (highRiskCount >= 2) return '高风险'
  if (highRiskCount >= 1) return '高风险'
  if (mediumRiskCount >= 2) return '中风险'
  if (mediumRiskCount >= 1 && lowRiskCount === 0) return '中风险'
  if (lowRiskCount >= 1) return '低风险'
  
  // 默认中风险（保守策略）
  return '中风险'
}

/**
 * 提取风险事项
 */
function extractRiskItem(title: string, content: string): string {
  const text = title + ' ' + content
  const lowerText = text.toLowerCase()
  
  // 提取关键短语
  const phrases = []
  
  // 高风险事件
  if (lowerText.includes('事故') || lowerText.includes('accident')) {
    phrases.push('安全事故')
  }
  if (lowerText.includes('停电') || lowerText.includes('outage') || lowerText.includes('blackout')) {
    phrases.push('电力中断')
  }
  if (lowerText.includes('故障') || lowerText.includes('failure')) {
    phrases.push('设备故障')
  }
  if (lowerText.includes('诉讼') || lowerText.includes('lawsuit')) {
    phrases.push('法律诉讼')
  }
  if (lowerText.includes('亏损') || lowerText.includes('loss')) {
    phrases.push('财务亏损')
  }
  if (lowerText.includes('罚款') || lowerText.includes('fine')) {
    phrases.push('监管处罚')
  }
  if (lowerText.includes('延期') || lowerText.includes('delay')) {
    phrases.push('项目延期')
  }
  if (lowerText.includes('抗议') || lowerText.includes('protest')) {
    phrases.push('社会抗议')
  }
  
  // 如果有具体事项，返回
  if (phrases.length > 0) {
    return phrases.join('、')
  }
  
  // 否则从标题提取前30字
  return title.substring(0, 30) + (title.length > 30 ? '...' : '')
}

/**
 * 生成风险分析报告
 */
function generateAnalysis(
  title: string,
  content: string,
  riskLevel: string
): string {
  const summaries: { [key: string]: string } = {
    '高风险': '该事件涉及重大安全、财务或法律问题，可能对公司运营造成严重影响，需要高度关注和及时应对。',
    '中风险': '该事件涉及运营故障、财务波动或法律纠纷，可能对公司造成一定影响，建议持续跟踪。',
    '低风险': '该事件属于正常业务报道或正面新闻，对公司运营无明显不利影响，可作为信息参考。'
  }
  
  let analysis = summaries[riskLevel] || '该事件需要进一步分析评估。'
  
  // 添加内容摘要（前100字）
  if (content.length > 0) {
    const summary = content.substring(0, 100) + (content.length > 100 ? '...' : '')
    analysis += '\n\n内容摘要：' + summary
  }
  
  return analysis
}

/**
 * 分析新闻风险（主函数）
 */
export async function analyzeNewsRisk(
  title: string,
  content: string,
  time?: string
): Promise<RiskAnalysis> {
  // 合并标题和内容
  const fullText = title + ' ' + content
  
  // 1. 检查是否与国网相关
  const isRelevant = isRelevantToSGCC(fullText)
  
  if (!isRelevant) {
    return {
      isRelevant: false,
      companyName: '',
      riskLevel: '低风险',
      riskItem: '',
      analysis: '该新闻与国家电网及其子公司无关'
    }
  }
  
  // 2. 识别公司
  const companyName = identifyCompany(fullText)
  
  // 3. 评估风险等级
  const riskLevel = assessRiskLevel(fullText)
  
  // 4. 提取风险事项
  const riskItem = extractRiskItem(title, content)
  
  // 5. 生成分析报告
  const analysis = generateAnalysis(title, content, riskLevel)
  
  return {
    isRelevant: true,
    companyName,
    riskLevel,
    riskItem,
    analysis
  }
}

/**
 * 批量分析（用于一键更新）
 */
export async function batchAnalyze(
  newsItems: Array<{ title: string; content: string; time?: string }>
): Promise<RiskAnalysis[]> {
  const results: RiskAnalysis[] = []
  
  for (const item of newsItems) {
    const result = await analyzeNewsRisk(item.title, item.content, item.time)
    if (result.isRelevant) {
      results.push(result)
    }
  }
  
  return results
}
