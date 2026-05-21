'use strict';

const { loadPage, createPageInstance } = require('./pageTestHelper');
const path = require('path');
const projectRoot = path.join(__dirname, '../..');

jest.mock('../../miniprogram/utils/cacheUtil', () => ({
  getMentorRulesCache: jest.fn(() => null),
  saveMentorRulesCache: jest.fn()
}));

jest.mock('../../miniprogram/utils/cloudbaseUtil', () => ({
  query: jest.fn(() => Promise.resolve({ success: true, data: [{ stamps: 5 }] }))
}));

jest.mock('../../miniprogram/utils/sensitiveWordUtil', () => ({
  detect: jest.fn(() => Promise.resolve({
    hasSensitive: false, isHighSensitive: false, isInvestment: false, words: [], categories: []
  }))
}));

const _loadedPage = loadPage(projectRoot + '/miniprogram/pages/roundtable/roundtable.js');

describe('roundtable 页面逻辑', () => {
  let page;

  beforeEach(() => {
    global.__clearWxMocks();
    global.__wxStorage['openid'] = 'test-openid';
    page = createPageInstance(_loadedPage);
  });

  // ==================== 方法选择（3-5 多选） ====================

  describe('toggleMethod — 多选逻辑（3-5）', () => {
    test('选中一个方法', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      expect(page.data.selectedMethods).toContain('多元思维模型分析');
      expect(page.data.selectedMethodsMap['多元思维模型分析']).toBe(true);
    });

    test('选中后再点取消', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      expect(page.data.selectedMethods).not.toContain('多元思维模型分析');
    });

    test('可以同时选中多个方法', () => {
      const methods = ['多元思维模型分析', '第一性原理分析', '原型心理分析'];
      methods.forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });
      expect(page.data.selectedMethods.length).toBe(3);
      methods.forEach(m => {
        expect(page.data.selectedMethodsMap[m]).toBe(true);
      });
    });

    test('最多选 5 个，超出时提示', () => {
      const methods = [
        '多元思维模型分析', '第一性原理分析', '原型心理分析',
        '道家思想分析', '创新设计分析'
      ];
      methods.forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });
      expect(page.data.selectedMethods.length).toBe(5);

      page.toggleMethod({ currentTarget: { dataset: { method: '需求层次分析' } } });
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('5') })
      );
      expect(page.data.selectedMethods.length).toBe(5);
    });

    test('selectedMethodsMap 与 selectedMethods 保持同步', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: '多元思维模型分析' } } });
      page.toggleMethod({ currentTarget: { dataset: { method: '第一性原理分析' } } });

      const mapKeys = Object.keys(page.data.selectedMethodsMap);
      expect(mapKeys.length).toBe(page.data.selectedMethods.length);
      page.data.selectedMethods.forEach(m => {
        expect(page.data.selectedMethodsMap[m]).toBe(true);
      });
    });
  });

  // ==================== updateCanSubmit ====================

  describe('updateCanSubmit — 提交按钮状态', () => {
    test('默认 canSubmit=false', () => {
      expect(page.data.canSubmit).toBe(false);
    });

    test('选满 3 个方法 + 有内容 + featureEnabled → canSubmit=true', () => {
      page.data.selectedMethods = ['多元思维模型分析', '第一性原理分析', '原型心理分析'];
      page.data.content = '测试内容';
      page.data.featureEnabled = true;
      page.updateCanSubmit();
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ canSubmit: true }));
    });

    test('仅选 2 个方法 → canSubmit=false', () => {
      page.data.selectedMethods = ['多元思维模型分析', '第一性原理分析'];
      page.data.content = '测试内容';
      page.data.featureEnabled = true;
      page.updateCanSubmit();
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ canSubmit: false }));
    });

    test('无内容 → canSubmit=false', () => {
      page.data.selectedMethods = ['多元思维模型分析', '第一性原理分析', '原型心理分析'];
      page.data.content = '';
      page.data.featureEnabled = true;
      page.updateCanSubmit();
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ canSubmit: false }));
    });

    test('featureEnabled=false → canSubmit=false', () => {
      page.data.selectedMethods = ['多元思维模型分析', '第一性原理分析', '原型心理分析'];
      page.data.content = '测试内容';
      page.data.featureEnabled = false;
      page.updateCanSubmit();
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ canSubmit: false }));
    });
  });

  // ==================== onInput ====================

  describe('onInput — 输入处理', () => {
    test('更新内容和字数', () => {
      page.onInput({ detail: { value: '这是一段测试' } });
      // onInput 的 setData 带回调（触发 updateCanSubmit），检查首次调用
      const firstCall = page.setData.mock.calls[0];
      expect(firstCall[0]).toMatchObject({
        content: '这是一段测试',
        wordCount: 6
      });
    });
  });

  // ==================== 配额校验 ====================

  describe('submitRoundtable — 配额校验', () => {
    test('stamps < 3 时提示额度不足', async () => {
      page.data.content = '这是一段足够长的测试内容';
      page.data.selectedMethods = ['多元思维模型分析', '第一性原理分析', '原型心理分析'];
      page.data.userStamps = 2;
      page.data.openid = 'test-openid';

      await page.submitRoundtable();
      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({ title: '额度不足' })
      );
    });

    test('selectedMethods < 3 时提示至少选 3 种', async () => {
      page.data.content = '这是一段足够长的测试内容';
      page.data.selectedMethods = ['多元思维模型分析'];
      page.data.userStamps = 5;
      page.data.openid = 'test-openid';

      await page.submitRoundtable();
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('3') })
      );
    });
  });

  // ==================== 方法领域数据 ====================

  describe('methodsByDomain 数据完整性', () => {
    test('4 个领域', () => {
      const keys = Object.keys(page.data.methodsByDomain);
      expect(keys.length).toBe(4);
    });

    test('总计 21 种方法', () => {
      const total = Object.values(page.data.methodsByDomain)
        .reduce((sum, arr) => sum + arr.length, 0);
      expect(total).toBe(21);
    });

    test('每个领域至少有 3 种方法', () => {
      Object.values(page.data.methodsByDomain).forEach(methods => {
        expect(methods.length).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
