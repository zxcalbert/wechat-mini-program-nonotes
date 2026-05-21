'use strict';

const { loadPage, createPageInstance } = require('./pageTestHelper');
const path = require('path');
const projectRoot = path.join(__dirname, '../..');

const _loadedPage = loadPage(projectRoot + '/miniprogram/pages/incubator/incubator.js');

describe('incubator 页面逻辑', () => {
  let page;

  beforeEach(() => {
    global.__clearWxMocks();
    page = createPageInstance(_loadedPage);
  });

  // ==================== 方法选择（1-3 多选） ====================

  describe('toggleMethod — 多选逻辑（最多3）', () => {
    test('选中一个方法', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      expect(page.data.selectedMethods).toContain('多元思维模型分析');
    });

    test('取消已选方法', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      expect(page.data.selectedMethods).not.toContain('多元思维模型分析');
    });

    test('可以同时选中多个方法', () => {
      ['多元思维模型分析', '第一性原理分析'].forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });
      expect(page.data.selectedMethods.length).toBe(2);
    });

    test('最多选 3 个，超出时提示', () => {
      ['多元思维模型分析', '第一性原理分析', '原型心理分析'].forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });
      expect(page.data.selectedMethods.length).toBe(3);

      page.toggleMethod({ currentTarget: { dataset: { method: '道家思想分析' } } });
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('3') })
      );
      expect(page.data.selectedMethods.length).toBe(3);
    });

    test('selectedMethodMap 与 selectedMethods 同步', () => {
      ['多元思维模型分析', '第一性原理分析'].forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });

      page.data.selectedMethods.forEach(m => {
        expect(page.data.selectedMethodMap[m]).toBe(true);
      });
      expect(Object.keys(page.data.selectedMethodMap).length).toBe(2);
    });
  });

  // ==================== buildSelectedMethodMap ====================

  describe('buildSelectedMethodMap', () => {
    test('空数组', () => {
      expect(page.buildSelectedMethodMap([])).toEqual({});
    });

    test('正常映射', () => {
      const result = page.buildSelectedMethodMap(['A', 'B']);
      expect(result).toEqual({ A: true, B: true });
    });
  });

  // ==================== onInput ====================

  describe('onInput — 输入处理', () => {
    test('输入更新 idea', () => {
      page.onInput({ detail: { value: '我的创新想法' } });
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ idea: '我的创新想法' }));
    });
  });

  // ==================== generateReport 校验 ====================

  describe('generateReport — 内容校验', () => {
    test('内容 < 10 字提示', async () => {
      page.data.idea = '太短了';
      await page.generateReport();
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('10') })
      );
    });

    test('loading 状态管理', async () => {
      page.data.idea = '这是一个足够长的想法描述内容';
      page.data.selectedMethods = ['多元思维模型分析'];

      global.wx.cloud.callFunction.mockResolvedValue({
        result: { success: false, error: '测试错误' }
      });

      await page.generateReport();
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ loading: false }));
    });
  });

  // ==================== METHOD_FIELDS 数据 ====================

  describe('METHOD_FIELDS 数据完整性', () => {
    test('4 个领域', () => {
      expect(page.data.methodFields.length).toBe(4);
    });

    test('总计 21 种方法', () => {
      const total = page.data.methodFields.reduce((sum, f) => sum + f.methods.length, 0);
      expect(total).toBe(21);
    });
  });
});
