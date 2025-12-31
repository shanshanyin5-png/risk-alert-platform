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
  
  // 转换数据格式
  const wsData = [headers];
  data.forEach(row => {
    const rowData = headers.map(header => {
      const key = header.key || header;
      let value = row[key];
      
      // 处理特殊值
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
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
};

// ========== 导出当前筛选的风险列表 ==========
window.exportRiskList = async function(filters, pagination) {
  try {
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
    
    const risks = response.data.data.list;
    
    if (risks.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    // 确认导出
    const confirmed = confirm(`是否导出当前筛选条件下的所有数据？共 ${risks.length} 条`);
    if (!confirmed) return;
    
    // 定义导出列
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'company_name', label: '公司名称' },
      { key: 'title', label: '标题' },
      { key: 'risk_item', label: '风险事项' },
      { key: 'risk_level', label: '风险等级' },
      { key: 'risk_time', label: '风险时间' },
      { key: 'source', label: '来源' },
      { key: 'source_url', label: '原文链接' },
      { key: 'created_at', label: '创建时间' }
    ];
    
    // 转换数据
    const exportData = risks.map(risk => ({
      id: risk.id,
      company_name: risk.company_name,
      title: risk.title,
      risk_item: (risk.risk_item || '').substring(0, 200),  // 限制长度
      risk_level: risk.risk_level,
      risk_time: risk.risk_time,
      source: risk.source,
      source_url: risk.source_url || '',
      created_at: risk.created_at
    }));
    
    // 导出
    const headerLabels = headers.map(h => h.label);
    const dataRows = exportData.map(row => 
      headers.map(h => row[h.key])
    );
    
    exportToExcel(exportData, headerLabels, '风险信息列表');
    
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
    
    if (companies.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出企业信息？共 ${companies.length} 条`);
    if (!confirmed) return;
    
    const headers = ['企业名称', '统一社会信用代码', '当前风险等级', '风险数量', '最后调整时间', '调整人'];
    
    const exportData = companies.map(c => ({
      name: c.name,
      creditCode: c.creditCode,
      currentLevel: c.currentLevel,
      riskCount: c.riskCount,
      lastAdjustTime: c.lastAdjustTime || '未调整',
      adjustedBy: c.adjustedBy || '-'
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
    
    if (datasources.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出数据源配置？共 ${datasources.length} 条`);
    if (!confirmed) return;
    
    const headers = ['网站名称', '爬取地址', 'XPath规则', '状态', '爬取间隔(秒)', '成功率(%)', '最近爬取时间'];
    
    const exportData = datasources.map(ds => ({
      name: ds.name,
      url: ds.url,
      xpathRules: ds.xpathRules,
      status: ds.status === 'normal' ? '正常' : ds.status === 'error' ? '异常' : '停用',
      interval: ds.interval,
      successRate: ds.successRate,
      lastCrawlTime: ds.lastCrawlTime
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
    
    if (history.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const confirmed = confirm(`是否导出风险等级调整历史？共 ${history.length} 条`);
    if (!confirmed) return;
    
    const headers = ['企业名称', '调整前等级', '调整后等级', '调整原因', '调整人', '调整时间'];
    
    const exportData = history.map(h => ({
      companyName: h.companyName,
      fromLevel: h.fromLevel,
      toLevel: h.toLevel,
      reason: h.reason,
      adjustedBy: h.adjustedBy,
      adjustedAt: h.adjustedAt
    }));
    
    exportToExcel(exportData, headers, '风险等级调整历史');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

console.log('✅ 功能扩展模块加载完成');
