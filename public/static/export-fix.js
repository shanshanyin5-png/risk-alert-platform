/**
 * 简化版导出功能 - 确保可用
 */

console.log('🔧 加载简化版导出模块...');

// 简单的导出函数
window.simpleExportRiskList = async function() {
  try {
    console.log('开始简单导出...');
    alert('开始导出风险信息...');
    
    // 1. 获取数据
    const response = await axios.get('/api/risks', {
      params: { page: 1, limit: 10000 }
    });
    
    console.log('API响应:', response.data);
    
    if (!response.data.success) {
      throw new Error('获取数据失败');
    }
    
    // 修复：数据在 data.list 中
    const risks = response.data.data.list || response.data.data || [];
    
    if (!risks || risks.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    console.log('获取到数据:', risks.length, '条');
    
    // 2. 确认导出
    const confirmed = confirm(`是否导出所有数据？共 ${risks.length} 条`);
    if (!confirmed) return;
    
    // 3. 准备数据
    const wsData = [
      ['ID', '公司名称', '标题', '风险事项', '风险等级', '风险时间', '来源', '原文链接', '创建时间']
    ];
    
    risks.forEach(risk => {
      wsData.push([
        risk.id || '',
        risk.company_name || '',
        risk.title || '',
        (risk.risk_item || '').substring(0, 200),
        risk.risk_level === 'high' ? '高风险' : risk.risk_level === 'medium' ? '中风险' : '低风险',
        risk.risk_time || '',
        risk.source || '',
        risk.source_url || '',
        risk.created_at || ''
      ]);
    });
    
    console.log('准备导出数据:', wsData.length, '行');
    
    // 4. 创建Excel
    if (!window.XLSX) {
      alert('Excel库未加载，请刷新页面');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 20 }, // 公司名称
      { wch: 30 }, // 标题
      { wch: 50 }, // 风险事项
      { wch: 10 }, // 风险等级
      { wch: 20 }, // 风险时间
      { wch: 15 }, // 来源
      { wch: 30 }, // 原文链接
      { wch: 20 }  // 创建时间
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '风险信息');
    
    // 5. 下载文件
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `风险信息列表-${timestamp}.xlsx`;
    
    console.log('开始下载文件:', filename);
    XLSX.writeFile(wb, filename);
    
    alert(`✅ 成功导出 ${risks.length} 条风险信息`);
    console.log('导出完成！');
    
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败: ' + error.message);
  }
};

console.log('✅ 简化版导出模块加载完成');
console.log('使用方法: window.simpleExportRiskList()');
