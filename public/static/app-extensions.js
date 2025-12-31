/**
 * 国网风险预警平台 - 功能扩展
 * 包含：爬取网站源配置、风险等级调整、Excel导出
 */

// ========== Excel导出通用函数 ==========
window.exportToExcel = function(data, headers, filename) {
  if (!window.XLSX) {
    alert('Excel导出库未加载，请刷新页面重试');
    return;
  }
  
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }
  
  // 构建数据数组（二维数组格式）
  const wsData = [headers]; // 第一行是表头
  
  data.forEach(row => {
    const rowData = [];
    // 根据headers顺序提取数据
    headers.forEach(header => {
      let value = row[header] || '';
      
      // 处理特殊值
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      rowData.push(value);
    });
    wsData.push(rowData);
  });
  
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // 设置列宽
  const colWidths = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // 下载文件
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fullFilename = `${filename}-${timestamp}.xlsx`;
  XLSX.writeFile(wb, fullFilename);
  
  console.log('✅ 导出成功:', fullFilename);
};

// ========== 导出当前筛选的风险列表 ==========
window.exportRiskList = async function(filters, pagination) {
  try {
    console.log('开始导出风险列表...', filters);
    
    // 获取所有数据（不分页）
    const response = await axios.get('/api/risks', {
      params: {
        ...filters,
        page: 1,
        limit: pagination.total || 10000  // 获取所有数据
      }
    });
    
    if (!response.data.success) {
      throw new Error('获取数据失败');
    }
    
    const risks = response.data.data;
    
    if (!risks || risks.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    // 确认导出
    const confirmed = confirm(`是否导出当前筛选条件下的所有数据？共 ${risks.length} 条`);
    if (!confirmed) return;
    
    // 定义表头（用于Excel第一行）
    const headers = ['ID', '公司名称', '标题', '风险事项', '风险等级', '风险时间', '来源', '原文链接', '创建时间'];
    
    // 转换数据为Excel格式
    const exportData = risks.map(risk => ({
      'ID': risk.id,
      '公司名称': risk.company_name,
      '标题': risk.title,
      '风险事项': (risk.risk_item || '').substring(0, 200),
      '风险等级': risk.risk_level === 'high' ? '高风险' : risk.risk_level === 'medium' ? '中风险' : '低风险',
      '风险时间': risk.risk_time || '',
      '来源': risk.source || '',
      '原文链接': risk.source_url || '',
      '创建时间': risk.created_at || ''
    }));
    
    console.log('导出数据:', exportData.length, '条');
    
    // 导出
    exportToExcel(exportData, headers, '风险信息列表');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

// ========== 导出公司列表 ==========
window.exportCompanyList = async function() {
  try {
    const response = await axios.get('/api/risk-level/companies');
    
    if (!response.data.success) {
      throw new Error('获取数据失败');
    }
    
    const companies = response.data.data;
    
    if (!companies || companies.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出企业信息？共 ${companies.length} 条`);
    if (!confirmed) return;
    
    const headers = ['企业名称', '统一社会信用代码', '当前风险等级', '风险数量', '最后调整时间', '调整人'];
    
    const exportData = companies.map(c => ({
      '企业名称': c.name,
      '统一社会信用代码': c.creditCode,
      '当前风险等级': c.currentLevel,
      '风险数量': c.riskCount,
      '最后调整时间': c.lastAdjustTime || '未调整',
      '调整人': c.adjustedBy || '-'
    }));
    
    exportToExcel(exportData, headers, '企业信息列表');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

// ========== 导出爬取网站源列表 ==========
window.exportDataSourceList = async function() {
  try {
    const response = await axios.get('/api/datasources');
    
    if (!response.data.success) {
      throw new Error('获取数据失败');
    }
    
    const datasources = response.data.data;
    
    if (!datasources || datasources.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出数据源配置？共 ${datasources.length} 条`);
    if (!confirmed) return;
    
    const headers = ['网站名称', '爬取地址', 'XPath规则', '状态', '爬取间隔(秒)', '成功率(%)', '最近爬取时间'];
    
    const exportData = datasources.map(ds => ({
      '网站名称': ds.name,
      '爬取地址': ds.url,
      'XPath规则': ds.xpathRules || ds.xpath_rules || '',
      '状态': ds.status === 'normal' ? '正常' : ds.status === 'error' ? '异常' : '停用',
      '爬取间隔(秒)': ds.interval,
      '成功率(%)': ds.successRate || ds.success_rate || 0,
      '最近爬取时间': ds.lastCrawlTime || ds.last_crawl_time || '未爬取'
    }));
    
    exportToExcel(exportData, headers, '爬取网站源配置');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

// ========== 导出风险等级调整历史 ==========
window.exportRiskLevelHistory = async function() {
  try {
    const response = await axios.get('/api/risk-level/history');
    
    if (!response.data.success) {
      throw new Error('获取数据失败');
    }
    
    const history = response.data.data;
    
    if (!history || history.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出风险等级调整历史？共 ${history.length} 条`);
    if (!confirmed) return;
    
    const headers = ['企业名称', '调整前等级', '调整后等级', '调整原因', '调整人', '调整时间'];
    
    const exportData = history.map(h => ({
      '企业名称': h.companyName,
      '调整前等级': h.fromLevel,
      '调整后等级': h.toLevel,
      '调整原因': h.reason,
      '调整人': h.adjustedBy,
      '调整时间': h.adjustedAt
    }));
    
    exportToExcel(exportData, headers, '风险等级调整历史');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

console.log('✅ 功能扩展模块加载完成');
