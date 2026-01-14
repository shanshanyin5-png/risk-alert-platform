// 基于规则的免费风险分析引擎
// 不依赖任何付费 API，完全本地化处理

// 国网及子公司关键词（高优先级 - 精确匹配）
const SGCC_SPECIFIC_KEYWORDS = [
  '国家电网', '国网', 'State Grid', 'SGCC',
  '国网国际', '国网巴西', 'State Grid Brazil',
  '巴基斯坦PMLTC', 'PMLTC', 'Matiari Lahore', 'HVDC Pakistan',
  '巴西CPFL', 'CPFL Energia', 'Grupo CPFL',
  '菲律宾NGCP', 'NGCP Philippines',
  '智利CGE', 'CGE Chile', 'Chilectra',
  '葡萄牙REN', 'REN Portugal', 'Redes Energéticas',
  '希腊IPTO', 'IPTO Greece',
  'ElectraNet', 'Ausgrid',
  'HK Electric', 'Hongkong Electric'
]

// 正面新闻关键词（用于排除）
const POSITIVE_KEYWORDS = [
  // 人事任命
  '任命', '晋升', '就职', '新任', '上任',
  'appointed', 'appoints', 'promotes', 'new director', 'new president', 'new CEO', 'assumes',
  
  // 成就荣誉
  '获奖', '表彰', '荣誉', '奖项', '认可',
  'award', 'awards', 'recognition', 'honor', 'prize', 'wins',
  
  // 投资扩张
  '投资', '扩建', '建设', '启动',
  'investment', 'invests', 'expansion', 'expands', 'construction', 'builds',
  
  // 正面成果
  '100%', '达成', '实现', '完成',
  'achieve', 'achieves', 'reached', 'complete', 'success', 'successful',
  
  // 可再生能源（正面）
  '可再生能源', '清洁能源', '绿色能源', '太阳能', '风能',
  'renewable energy', 'renewable', 'clean energy', 'green energy', 'solar', 'wind power',
  
  // 培训教育
  '培训', '教育', '招聘', '学校', '课程',
  'training', 'education', 'recruitment', 'school', 'course', 'program',
  
  // 社会责任
  '社会责任', '公益', '慈善', '帮助', '支持',
  'social responsibility', 'charity', 'charitable', 'community', 'helps', 'supports',
  
  // 合作协议
  '合作', '签约', '协议', '伙伴',
  'cooperation', 'partnership', 'agreement', 'signs', 'contract',
  
  // 技术创新
  '创新', '数字化', '智能', '升级',
  'innovation', 'digital', 'smart', 'upgrade', 'modernization'
]

// 负面/风险关键词（用于评级）
const NEGATIVE_KEYWORDS = [
  // 安全事故
  '事故', '爆炸', '火灾', '伤亡', '死亡', '受伤',
  'accident', 'explosion', 'fire', 'death', 'fatality', 'casualties', 'injured',
  
  // 运营问题
  '故障', '停电', '断电', '中断', '暂停', '关闭', '限电', '缺电',
  'failure', 'outage', 'blackout', 'disruption', 'suspended', 'shutdown', 'loadshedding', 'power cut', 'power crisis', 'power shortage', 'shortfall',
  
  // 财务问题
  '亏损', '债务', '破产', '违约', '赤字', '损失', '资金紧张', '现金流',
  'loss', 'debt', 'bankruptcy', 'default', 'deficit', 'financial trouble', 'cash crunch',
  
  // 法律问题
  '诉讼', '起诉', '罚款', '调查', '腐败', '违规', '审查', '监管',
  'lawsuit', 'prosecution', 'fine', 'penalty', 'investigation', 'corruption', 'violation', 'regulatory action',
  
  // 社会问题
  '抗议', '罢工', '冲突', '争议', '投诉', '批评', '不满', '示威',
  'protest', 'strike', 'conflict', 'dispute', 'complaint', 'criticism', 'dissatisfaction', 'demonstration',
  
  // 项目问题
  '延期', '取消', '搁置', '推迟', '超支', '拖延', '暂停',
  'delay', 'delayed', 'cancelled', 'suspended', 'postponed', 'overbudget', 'behind schedule',
  
  // 政治风险
  '制裁', '禁令', '国有化', '征收', '政变', '动荡',
  'sanction', 'ban', 'nationalization', 'expropriation', 'coup', 'unrest',
  
  // 质量/性能问题
  '缺陷', '问题', '失败', '瘫痪', '故障率高', '不稳定',
  'defect', 'problem', 'issue', 'failed', 'collapsed', 'unreliable', 'unstable',
  
  // 供电问题（巴基斯坦常见）
  'load-shedding', 'power outage', 'electricity shortage', 'supply disruption'
]

// 公司名称映射（优先级从高到低）
const COMPANY_MAP: { [key: string]: string } = {
  // 优先级1: 完整公司名
  'CPFL Energia': '巴西CPFL公司',
  'Grupo CPFL': '巴西CPFL公司',
  'CPFL': '巴西CPFL公司',
  
  'PMLTC': '巴基斯坦PMLTC公司',
  'Matiari': '巴基斯坦PMLTC公司',
  
  'NGCP Philippines': '菲律宾NGCP公司',
  'NGCP': '菲律宾NGCP公司',
  
  'CGE Chile': '智利CGE公司',
  'Chilectra': '智利CGE公司',
  'CGE': '智利CGE公司',
  
  'REN Portugal': '葡萄牙REN公司',
  'Redes Energéticas': '葡萄牙REN公司',
  'REN': '葡萄牙REN公司',
  
  'IPTO Greece': '希腊IPTO公司',
  'IPTO': '希腊IPTO公司',
  
  'ElectraNet': '澳大利亚南澳Electranet',
  'Ausgrid': '澳大利亚澳洲资产公司',
  
  'HK Electric': '香港电灯公司',
  'Hongkong Electric': '香港电灯公司',
  
  'State Grid Brazil': '国家电网巴西控股公司',
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
  '成功', '完成', '顺利', '签约', '合作', '获奖', '责任', '社会',
  'success', 'complete', 'smooth', 'sign', 'cooperation', 'award', 'responsibility', 'social',
  
  // 业务拓展
  '扩张', '投资', '新项目', '增长', '盈利', '可再生能源', '100%', '清洁能源',
  'expansion', 'investment', 'new project', 'growth', 'profit', 'renewable', 'clean energy', 'achieve',
  
  // 技术创新
  '创新', '技术', '升级', '智能', '数字化', '项目', '培训', '招聘',
  'innovation', 'technology', 'upgrade', 'smart', 'digital', 'project', 'training', 'recruitment'
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
 * 检查文本是否包含负面关键词
 */
function containsNegativeKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return NEGATIVE_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

/**
 * 检查文本是否包含正面关键词
 */
function containsPositiveKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return POSITIVE_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

/**
 * 检查是否应该收录（简化版：只要能识别公司就收录）
 */
function isRelevantToSGCC(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  // 只要能识别公司就收录，不做任何过滤
  const company = identifyCompany(text)
  return !!company // 有公司就收录
}

/**
 * 识别相关公司名称（带上下文验证）
 */
function identifyCompany(text: string): string {
  const lowerText = text.toLowerCase()
  
  // 特殊检查：REN 必须有电力/能源上下文
  if (lowerText.includes('ren') && !lowerText.includes('portugal') && 
      !lowerText.includes('energia') && !lowerText.includes('electric') &&
      !lowerText.includes('power') && !lowerText.includes('grid')) {
    // 如果 REN 出现但没有电力相关词汇，不匹配（避免 Jeremy Renner 这类误匹配）
    // 继续检查其他公司
  } else if (lowerText.includes('ren portugal') || lowerText.includes('redes energéticas')) {
    return '葡萄牙REN公司'
  }
  
  // 按优先级匹配其他公司（优先长关键词）
  const priorityKeywords = [
    ['CPFL Energia', '巴西CPFL公司'],
    ['Grupo CPFL', '巴西CPFL公司'],
    ['CPFL', '巴西CPFL公司'],
    
    ['PMLTC', '巴基斯坦PMLTC公司'],
    ['Matiari', '巴基斯坦PMLTC公司'],
    
    ['NGCP Philippines', '菲律宾NGCP公司'],
    ['NGCP', '菲律宾NGCP公司'],
    
    ['CGE Chile', '智利CGE公司'],
    ['Chilectra', '智利CGE公司'],
    
    ['IPTO Greece', '希腊IPTO公司'],
    ['IPTO', '希腊IPTO公司'],
    
    ['ElectraNet', '澳大利亚南澳Electranet'],
    ['Ausgrid', '澳大利亚澳洲资产公司'],
    
    ['HK Electric', '香港电灯公司'],
    ['Hongkong Electric', '香港电灯公司'],
    
    ['State Grid Brazil', '国家电网巴西控股公司'],
    ['State Grid', '国家电网巴西控股公司'],
    ['国家电网', '国家电网巴西控股公司'],
    ['国网', '国家电网巴西控股公司']
  ] as const
  
  for (const [keyword, company] of priorityKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return company
    }
  }
  
  // 如果只有 CGE 但没有 Chile 上下文，可能是误匹配
  if (lowerText.includes('cge') && !lowerText.includes('chile') && 
      !lowerText.includes('chilectra') && !lowerText.includes('electric')) {
    // 不返回，继续检查
  }
  
  // 默认返回空（表示无法确定）
  return ''
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
  
  // 判定规则（优先级：高 > 中 > 低）
  if (highRiskCount >= 1) return '高风险'
  if (mediumRiskCount >= 1) return '中风险'
  if (lowRiskCount >= 1) return '低风险'
  
  // 无明确关键词时，默认为低风险（正常业务报道）
  return '低风险'
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
    '低风险': '该事件为中性报道或潜在风险，无明确负面关键词，建议人工审核以确定是否需要关注。'
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
      analysis: '该新闻不符合收录条件：无法识别电力公司或属于正面新闻'
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
