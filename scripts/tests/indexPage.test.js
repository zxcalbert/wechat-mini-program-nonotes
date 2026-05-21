'use strict';

const { loadPage, createPageInstance } = require('./pageTestHelper');
const path = require('path');
const projectRoot = path.join(__dirname, '../..');

jest.mock('../../miniprogram/utils/cloudbaseUtil', () => ({
  query: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  formatDate: jest.fn((d) => d ? '2026-05-08' : '未知'),
  formatDateTime: jest.fn((d) => d ? '2026-05-08 10:30' : '未知'),
  update: jest.fn(() => Promise.resolve({ success: true }))
}));

const _loadedPage = loadPage(projectRoot + '/miniprogram/pages/index/index.js');

describe('index 页面逻辑', () => {
  let page;

  beforeEach(() => {
    global.__clearWxMocks();
    global.__wxStorage['openid'] = 'test-openid';
    global.__wxStorage['userInfo'] = JSON.stringify({ nickName: 'test' });
    page = createPageInstance(_loadedPage);
  });

  // ==================== getStatusLabel ====================

  describe('getStatusLabel — 状态映射', () => {
    test('pending → 分析中', () => {
      expect(page.getStatusLabel('pending')).toBe('分析中');
    });

    test('replied → 已完成', () => {
      expect(page.getStatusLabel('replied')).toBe('已完成');
    });

    test('read → 已查看', () => {
      expect(page.getStatusLabel('read')).toBe('已查看');
    });

    test('saved → 已保存', () => {
      expect(page.getStatusLabel('saved')).toBe('已保存');
    });

    test('archived → 已归档', () => {
      expect(page.getStatusLabel('archived')).toBe('已归档');
    });

    test('未知状态 → 未知', () => {
      expect(page.getStatusLabel('something_else')).toBe('未知');
    });

    test('undefined → 未知', () => {
      expect(page.getStatusLabel(undefined)).toBe('未知');
    });
  });

  // ==================== mergeAndSortItems ====================

  describe('mergeAndSortItems — 合并排序', () => {
    test('空列表返回空数组', () => {
      const result = page.mergeAndSortItems();
      expect(result).toEqual([]);
    });

    test('按 createTime 降序排列', () => {
      page.data.letters = [
        { content: '旧', createTime: 1 },
        { content: '新', createTime: 10 }
      ];
      page.data.roundtables = [
        { content: '中', createTime: 5 }
      ];
      page.data.incubators = [];
      page.data.structureAnalyses = [];

      const result = page.mergeAndSortItems();
      expect(result.length).toBe(3);
      expect(result[0].content).toBe('新');
      expect(result[1].content).toBe('中');
      expect(result[2].content).toBe('旧');
    });

    test('合并所有类型的数据', () => {
      page.data.letters = [{ content: 'L', createTime: 1, type: 'letter' }];
      page.data.roundtables = [{ content: 'R', createTime: 2, type: 'roundtable' }];
      page.data.incubators = [{ content: 'I', createTime: 3, type: 'incubator' }];
      page.data.structureAnalyses = [{ content: 'S', createTime: 4, type: 'structure_analysis' }];

      const result = page.mergeAndSortItems();
      expect(result.length).toBe(4);
    });
  });

  // ==================== _countDomainUsage ====================

  describe('_countDomainUsage — 领域使用次数统计', () => {
    test('空 letters 所有领域 count=0', () => {
      page.data.letters = [];
      page._countDomainUsage();
      page.data.domains.forEach(d => {
        expect(d.count).toBe(0);
      });
    });

    test('正确统计各领域使用次数', () => {
      page.data.letters = [
        { mentor: '多元思维模型分析' },
        { mentor: '多元思维模型分析' },
        { mentor: '第一性原理分析' },
        { mentor: '原型心理分析' },
        { mentor: '道家思想分析' }
      ];
      page._countDomainUsage();

      const domainMap = {};
      page.data.domains.forEach(d => { domainMap[d.id] = d.count; });

      expect(domainMap['value']).toBe(2);
      expect(domainMap['innovation']).toBe(1);
      expect(domainMap['psychology']).toBe(1);
      expect(domainMap['philosophy']).toBe(1);
    });
  });

  // ==================== formatRoundtables ====================

  describe('formatRoundtables — 圆桌数据格式化', () => {
    test('正常格式化', () => {
      const data = [{ content: '测试', createTime: '2026-05-08', status: 'completed' }];
      const result = page.formatRoundtables(data);
      expect(result[0].type).toBe('roundtable');
      expect(result[0].tagText).toBe('多维度分析');
    });

    test('processing 状态标记为分析中', () => {
      const data = [{ content: '测试', createTime: '2026-05-08', status: 'processing' }];
      const result = page.formatRoundtables(data);
      expect(result[0].tagText).toContain('分析中');
      expect(result[0].isProcessing).toBe(true);
    });
  });

  // ==================== formatIncubators ====================

  describe('formatIncubators — 孵化器数据格式化', () => {
    test('正常格式化', () => {
      const data = [{ content: '想法', createTime: '2026-05-08' }];
      const result = page.formatIncubators(data);
      expect(result[0].type).toBe('incubator');
      expect(result[0].tagText).toBe('思想孵化器');
      expect(result[0].tagClass).toBe('tag-orange');
    });
  });

  // ==================== formatStructureAnalyses ====================

  describe('formatStructureAnalyses — 结构分析格式化', () => {
    test('产品分析类型', () => {
      const data = [{ content: '分析', analysisType: 'product', createTime: '2026-05-08' }];
      const result = page.formatStructureAnalyses(data);
      expect(result[0].tagText).toBe('产品分析');
    });

    test('公司分析类型', () => {
      const data = [{ content: '分析', analysisType: 'company', createTime: '2026-05-08' }];
      const result = page.formatStructureAnalyses(data);
      expect(result[0].tagText).toBe('公司分析');
    });
  });

  // ==================== 搜索过滤 ====================

  describe('refreshDisplayItems — 搜索过滤', () => {
    test('无搜索关键词时显示全部', () => {
      page.data.showSearch = false;
      page.data.letters = [{ content: '思考关于AI', createTime: 1, type: 'letter' }];
      page.data.roundtables = [{ content: '创业想法', createTime: 2, type: 'roundtable' }];
      page.data.incubators = [];
      page.data.structureAnalyses = [];

      page.refreshDisplayItems();
      expect(page.setData).toHaveBeenCalledWith(
        expect.objectContaining({ displayItems: expect.any(Array) })
      );
    });

    test('有搜索关键词时过滤匹配项', () => {
      page.data.showSearch = true;
      page.data.searchKeyword = 'AI';
      page.data.letters = [
        { content: '关于AI的思考', createTime: 2, type: 'letter' },
        { content: '普通笔记', createTime: 1, type: 'letter' }
      ];
      page.data.roundtables = [];
      page.data.incubators = [];
      page.data.structureAnalyses = [];

      page.refreshDisplayItems();
      const callArgs = page.setData.mock.calls.find(c => c[0].displayItems);
      if (callArgs) {
        expect(callArgs[0].displayItems.length).toBe(1);
        expect(callArgs[0].displayItems[0].content).toContain('AI');
      }
    });
  });

  // ==================== domains 数据 ====================

  describe('domains 领域卡片数据', () => {
    test('4 个领域', () => {
      expect(page.data.domains.length).toBe(4);
    });

    test('每个领域都有 id/name/icon/color/methods/count', () => {
      page.data.domains.forEach(d => {
        expect(d.id).toBeTruthy();
        expect(d.name).toBeTruthy();
        expect(d.icon).toBeTruthy();
        expect(d.color).toBeTruthy();
        expect(Array.isArray(d.methods)).toBe(true);
        expect(typeof d.count).toBe('number');
      });
    });

    test('总计 21 种方法', () => {
      const total = page.data.domains.reduce((sum, d) => sum + d.methods.length, 0);
      expect(total).toBe(21);
    });
  });

  // ==================== deleteItem ====================

  describe('deleteItem — 删除操作', () => {
    test('不支持的类型提示无法删除', () => {
      page.deleteItem({ currentTarget: { dataset: { id: '123', type: 'unknown' } } });
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '无法删除' })
      );
    });

    test('支持的类型弹出确认框', () => {
      page.deleteItem({ currentTarget: { dataset: { id: '123', type: 'letter' } } });
      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('删除') })
      );
    });
  });
});
