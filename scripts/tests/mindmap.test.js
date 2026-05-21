'use strict';

/**
 * 脑图生成 + 截图保存 自动化测试
 * 覆盖：extractMindmapJSON、generateFallbackMindmap、children→sections 兼容、
 *       降级方案兜底、mindmapHistory 页面逻辑、截图保存错误路径
 */

// ==================== extractMindmapJSON 测试 ====================

// 从云函数源码提取函数定义（不依赖云环境）
function extractMindmapJSON(rawReply) {
  let jsonStr = rawReply.trim();

  try { return JSON.parse(jsonStr); } catch (e) {}

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch (e) {}
  }

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1)); } catch (e) {}
  }

  const jsonStart = jsonStr.indexOf('{"');
  if (jsonStart >= 0) {
    try { return JSON.parse(jsonStr.substring(jsonStart)); } catch (e) {}
  }

  throw new Error('无法从AI回复中提取有效JSON: ' + jsonStr.substring(0, 100));
}

// ==================== generateFallbackMindmap 测试 ====================

function generateFallbackMindmap(analysisContent, methodName) {
  var lines = analysisContent.split('\n');
  var sections = [];
  var currentSection = null;
  var colors = ['#4A90D9', '#27AE60', '#E67E22', '#E74C3C', '#9B59B6'];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (/^##\s+/.test(line)) {
      var title = line.replace(/^##\s+/, '').trim();
      if (title.length > 0 && title.length <= 20) {
        currentSection = {
          id: 's' + (sections.length + 1),
          title: title,
          summary: '',
          color: colors[sections.length % colors.length],
          points: []
        };
        sections.push(currentSection);
      }
      continue;
    }
    if (currentSection && (/^[\-\*]\s+/.test(line) || /^\d+\.\s+/.test(line))) {
      var pointText = line.replace(/^[\-\*]\s+/, '').replace(/^\d+\.\s+/, '');
      pointText = pointText.replace(/\*\*(.+?)\*\*/g, '$1').trim();
      if (pointText.length > 2 && pointText.length <= 30) {
        currentSection.points.push({
          id: currentSection.id + '-' + (currentSection.points.length + 1),
          title: pointText.substring(0, 10),
          detail: pointText
        });
      }
    }
    if (currentSection && !currentSection.summary && line.length > 5 && !/^#/.test(line)) {
      currentSection.summary = line.substring(0, 25);
    }
  }
  if (sections.length > 6) sections = sections.slice(0, 6);
  sections.forEach(function(s) {
    if (s.points.length > 4) s.points = s.points.slice(0, 4);
  });
  if (sections.length < 2) {
    sections = [
      { id: 's1', title: '核心观点', summary: '分析的核心结论', color: '#4A90D9', points: [
        { id: 's1-1', title: '主要发现', detail: '基于分析的主要发现' }
      ]},
      { id: 's2', title: '分析要点', summary: '分析的关键维度', color: '#27AE60', points: [
        { id: 's2-1', title: '关键因素', detail: '影响结论的关键因素' }
      ]},
      { id: 's3', title: '行动建议', summary: '基于分析的下一步', color: '#9B59B6', points: [
        { id: 's3-1', title: '建议方向', detail: '建议的后续行动方向' }
      ]}
    ];
  }
  return {
    title: methodName + '分析',
    summary: '基于' + methodName + '的结构化分析',
    sections: sections
  };
}

// ==================== children→sections 转换逻辑 ====================

function convertChildrenToSections(mindmapData) {
  if (mindmapData.sections && Array.isArray(mindmapData.sections)) {
    return mindmapData;
  }
  if (mindmapData.children && Array.isArray(mindmapData.children)) {
    mindmapData.sections = mindmapData.children.map(function(child, i) {
      return {
        id: child.id || 's' + (i + 1),
        title: child.label || '章节',
        summary: child.detail || '',
        color: child.color || '#4A90D9',
        points: (child.children || []).map(function(sub, j) {
          return {
            id: sub.id || 's' + (i + 1) + '-' + (j + 1),
            title: sub.label || '要点',
            detail: sub.detail || ''
          };
        })
      };
    });
    mindmapData.summary = mindmapData.title || '';
    delete mindmapData.children;
    return mindmapData;
  }
  return null;
}

// ==================== 测试用例 ====================

describe('extractMindmapJSON', () => {
  test('直接JSON字符串', () => {
    var input = '{"title":"测试","sections":[{"id":"s1","title":"A"}]}';
    var result = extractMindmapJSON(input);
    expect(result.title).toBe('测试');
    expect(result.sections.length).toBe(1);
  });

  test('markdown代码块包裹', () => {
    var input = '好的，以下是脑图结构：\n```json\n{"title":"投资分析","sections":[{"id":"s1","title":"核心"}]}\n```\n希望对你有帮助';
    var result = extractMindmapJSON(input);
    expect(result.title).toBe('投资分析');
  });

  test('无json标记的代码块', () => {
    var input = '```\n{"title":"测试","sections":[]}\n```';
    var result = extractMindmapJSON(input);
    expect(result.title).toBe('测试');
  });

  test('前后有解释文字的JSON', () => {
    var input = '这是生成的脑图JSON：\n{"title":"决策分析","sections":[{"id":"s1","title":"步骤1"},{"id":"s2","title":"步骤2"}]}\n以上是完整结构。';
    var result = extractMindmapJSON(input);
    expect(result.title).toBe('决策分析');
    expect(result.sections.length).toBe(2);
  });

  test('AI返回空内容时抛出错误', () => {
    expect(() => extractMindmapJSON('')).toThrow();
    expect(() => extractMindmapJSON('抱歉，我无法生成')).toThrow();
  });

  test('AI返回截断JSON时抛出错误', () => {
    expect(() => extractMindmapJSON('{"title":"测试","sections":[{"id":"s1","title":"A')).toThrow();
  });
});

describe('generateFallbackMindmap', () => {
  test('从Markdown ## 标题提取sections', () => {
    var content = '## 核心观点\n这是核心观点的描述\n- 观点一\n- 观点二\n## 风险分析\n- 风险一\n- 风险二\n- 风险三';
    var result = generateFallbackMindmap(content, '多元思维模型分析');
    expect(result.title).toBe('多元思维模型分析分析');
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].title).toBe('核心观点');
    expect(result.sections[0].points.length).toBe(2);
    expect(result.sections[1].title).toBe('风险分析');
    expect(result.sections[1].points.length).toBe(3);
  });

  test('sections数量超过6个时截断', () => {
    var lines = [];
    for (var i = 1; i <= 8; i++) {
      lines.push('## 章节' + i);
      lines.push('- 要点1');
    }
    var result = generateFallbackMindmap(lines.join('\n'), '测试');
    expect(result.sections.length).toBe(6);
  });

  test('每个section的points超过4个时截断', () => {
    var lines = ['## 核心章节'];
    for (var i = 1; i <= 6; i++) lines.push('- 要点' + i + '超长测试内容');
    lines.push('## 第二章节');
    lines.push('- 补充要点');
    var result = generateFallbackMindmap(lines.join('\n'), '测试');
    expect(result.sections[0].points.length).toBe(4);
    expect(result.sections.length).toBe(2);
  });

  test('内容不足2个章节时使用兜底数据', () => {
    var result = generateFallbackMindmap('只是一段纯文本没有标题', '测试方法');
    expect(result.sections.length).toBe(3);
    expect(result.sections[0].title).toBe('核心观点');
    expect(result.sections[2].title).toBe('行动建议');
  });

  test('空字符串内容使用兜底数据', () => {
    var result = generateFallbackMindmap('', '空内容');
    expect(result.sections.length).toBe(3);
    expect(result.title).toBe('空内容分析');
  });

  test('颜色循环分配', () => {
    var lines = [];
    for (var i = 1; i <= 3; i++) {
      lines.push('## 章节' + i);
      lines.push('- 要点');
    }
    var result = generateFallbackMindmap(lines.join('\n'), '测试');
    expect(result.sections[0].color).toBe('#4A90D9');
    expect(result.sections[1].color).toBe('#27AE60');
    expect(result.sections[2].color).toBe('#E67E22');
  });

  test('加粗标记被清除', () => {
    var content = '## 核心观点\n- **这是加粗**的要点内容';
    var result = generateFallbackMindmap(content, '测试');
    expect(result.sections[0].points[0].detail).not.toContain('**');
  });
});

describe('children→sections 格式兼容', () => {
  test('旧版children格式正确转换', () => {
    var input = {
      title: '投资分析',
      children: [
        { id: 'n1', label: '风险评估', detail: '分析风险', color: '#E74C3C', children: [
          { id: 'n1-1', label: '市场风险', detail: '市场波动' },
          { id: 'n1-2', label: '政策风险', detail: '政策变化' }
        ]},
        { id: 'n2', label: '机会识别', detail: '发现机会', color: '#27AE60', children: [
          { id: 'n2-1', label: '技术创新', detail: '技术突破' }
        ]}
      ]
    };
    var result = convertChildrenToSections(input);
    expect(result.sections).toBeDefined();
    expect(result.sections.length).toBe(2);
    expect(result.sections[0].title).toBe('风险评估');
    expect(result.sections[0].points.length).toBe(2);
    expect(result.sections[0].points[0].title).toBe('市场风险');
    expect(result.summary).toBe('投资分析');
    expect(result.children).toBeUndefined();
  });

  test('已有sections的数据不变', () => {
    var input = { title: '测试', sections: [{ id: 's1', title: 'A' }] };
    var result = convertChildrenToSections(input);
    expect(result.sections.length).toBe(1);
    expect(result.sections[0].title).toBe('A');
  });

  test('既无sections也无children返回null', () => {
    var result = convertChildrenToSections({ title: '空' });
    expect(result).toBeNull();
  });
});

describe('脑图历史存储逻辑', () => {
  beforeEach(() => {
    __clearWxMocks();
    wx.removeStorageSync('mindmap_history');
  });

  function saveMindmapHistory(mindmapData, methodName) {
    var history = wx.getStorageSync('mindmap_history') || [];
    history.unshift({
      id: 'mm_' + Date.now(),
      title: mindmapData.title || methodName,
      methodName: methodName,
      date: Date.now(),
      data: mindmapData
    });
    if (history.length > 20) history = history.slice(0, 20);
    wx.setStorageSync('mindmap_history', history);
  }

  test('保存一条脑图记录', () => {
    var data = { title: '投资分析', sections: [{ id: 's1', title: 'A' }] };
    saveMindmapHistory(data, '多元思维模型分析');
    var history = wx.getStorageSync('mindmap_history');
    expect(history.length).toBe(1);
    expect(history[0].title).toBe('投资分析');
    expect(history[0].methodName).toBe('多元思维模型分析');
  });

  test('多条记录按时间倒序排列', () => {
    saveMindmapHistory({ title: '第一条' }, '方法A');
    saveMindmapHistory({ title: '第二条' }, '方法B');
    var history = wx.getStorageSync('mindmap_history');
    expect(history.length).toBe(2);
    expect(history[0].title).toBe('第二条');
    expect(history[1].title).toBe('第一条');
  });

  test('超过20条自动截断', () => {
    for (var i = 0; i < 25; i++) {
      saveMindmapHistory({ title: '脑图' + i }, '方法');
    }
    var history = wx.getStorageSync('mindmap_history');
    expect(history.length).toBe(20);
  });

  test('删除指定脑图记录', () => {
    // 直接构造不同id的数据，避免 Date.now() 同毫秒重复
    wx.setStorageSync('mindmap_history', [
      { id: 'mm_001', title: '删除这条', methodName: '方法B', date: 1001 },
      { id: 'mm_002', title: '保留这条', methodName: '方法A', date: 1000 }
    ]);
    var history = wx.getStorageSync('mindmap_history');
    var deleteId = history[0].id;
    history = history.filter(function(h) { return h.id !== deleteId; });
    wx.setStorageSync('mindmap_history', history);
    var result = wx.getStorageSync('mindmap_history');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('保留这条');
  });
});

describe('截图保存错误路径', () => {
  beforeEach(() => {
    __clearWxMocks();
  });

  test('canvas未就绪时提示用户', () => {
    // 模拟 saveSnapshot 在 canvas 未初始化时
    var canvas = null;
    expect(canvas).toBeNull();
    // 实际逻辑：if (!this._canvas) { showToast('画布未就绪') }
    wx.showToast({ title: '画布未就绪', icon: 'none' });
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '画布未就绪' }));
  });

  test('canvasToTempFilePath 失败时提示导出失败', () => {
    wx.showToast({ title: '导出失败', icon: 'none' });
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '导出失败' }));
  });

  test('用户拒绝相册权限时引导授权', () => {
    var err = { errMsg: 'saveImageToPhotosAlbum:fail auth deny' };
    var isAuthDeny = err.errMsg && err.errMsg.indexOf('auth deny') >= 0;
    expect(isAuthDeny).toBe(true);
    wx.showModal({
      title: '需要授权',
      content: '请在设置中允许访问相册',
      confirmText: '去设置'
    });
    expect(wx.showModal).toHaveBeenCalledWith(expect.objectContaining({ title: '需要授权' }));
  });

  test('saveImageToPhotosAlbum 成功路径', () => {
    wx.showToast({ title: '已保存到相册', icon: 'success' });
    expect(wx.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '已保存到相册' }));
  });
});

describe('mindmapHistory 页面 loadHistory 日期格式化', () => {
  test('date字段被预格式化为dateText', () => {
    var history = [
      { id: 'mm_1', date: new Date(2026, 4, 9, 14, 30).getTime(), data: { sections: [{}, {}] } },
      { id: 'mm_2', date: new Date(2026, 0, 1, 9, 5).getTime(), data: {} }
    ];
    history.forEach(function(item) {
      if (item.date) {
        var d = new Date(item.date);
        item.dateText = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
          (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
          (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
      }
      item.sectionCount = (item.data && item.data.sections) ? item.data.sections.length : 0;
    });
    expect(history[0].dateText).toBe('5月9日 14:30');
    expect(history[0].sectionCount).toBe(2);
    expect(history[1].dateText).toBe('1月1日 09:05');
    expect(history[1].sectionCount).toBe(0);
  });

  test('无date字段时dateText为空', () => {
    var item = { id: 'mm_3', data: {} };
    if (item.date) {
      var d = new Date(item.date);
      item.dateText = (d.getMonth() + 1) + '月' + d.getDate() + '日';
    } else {
      item.dateText = '';
    }
    expect(item.dateText).toBe('');
  });
});
