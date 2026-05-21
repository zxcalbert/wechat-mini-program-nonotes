'use strict';

const { loadPage, createPageInstance } = require('./pageTestHelper');
const path = require('path');
const projectRoot = path.join(__dirname, '../..');

jest.mock('../../miniprogram/utils/cacheUtil', () => ({
  getMentorRulesCache: jest.fn(() => null),
  saveMentorRulesCache: jest.fn()
}));

// 只加载一次模块
const _loadedPage = loadPage(projectRoot + '/miniprogram/pages/write/write.js');

const ALL_METHODS = _loadedPage.data.methodFields.flatMap(f => f.methods);

describe('write 页面逻辑', () => {
  let page;

  beforeEach(() => {
    global.__clearWxMocks();
    page = createPageInstance(_loadedPage);
  });

  // ==================== 方法选择（单选） ====================

  describe('toggleMethod — 单选逻辑', () => {
    test('选中一个方法', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: 'SWOT分析' } } });
      expect(page.data.selectedMethod).toBe('SWOT分析');
      expect(page.data.selectedMethodMap['SWOT分析']).toBe(true);
    });

    test('选中后再点击同一个方法则取消', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: 'SWOT分析' } } });
      page.toggleMethod({ currentTarget: { dataset: { method: 'SWOT分析' } } });
      expect(page.data.selectedMethod).toBeNull();
      expect(page.data.selectedMethodMap['SWOT分析']).toBeUndefined();
    });

    test('切换方法（选中另一个时自动取消前一个）', () => {
      page.toggleMethod({ currentTarget: { dataset: { method: 'SWOT分析' } } });
      page.toggleMethod({ currentTarget: { dataset: { method: '第一性原理分析' } } });
      expect(page.data.selectedMethod).toBe('第一性原理分析');
      expect(page.data.selectedMethodMap['SWOT分析']).toBeUndefined();
      expect(page.data.selectedMethodMap['第一性原理分析']).toBe(true);
    });

    test('selectedMethodMap 始终只有一个 key', () => {
      ALL_METHODS.slice(0, 5).forEach(m => {
        page.toggleMethod({ currentTarget: { dataset: { method: m } } });
      });
      const keys = Object.keys(page.data.selectedMethodMap);
      expect(keys.length).toBe(1);
    });
  });

  // ==================== updateCanSend ====================

  describe('updateCanSend — 发送按钮状态', () => {
    test('默认状态 canSend = false', () => {
      expect(page.data.canSend).toBe(false);
    });

    test('有内容 + 已选方法 + needReply=true → canSend 为真值', () => {
      page.data.content = '这是一段测试内容';
      page.data.needReply = true;
      page.data.selectedMethod = 'SWOT分析';
      page.updateCanSend();
      const lastCall = page.setData.mock.calls[page.setData.mock.calls.length - 1];
      expect(lastCall[0].canSend).toBeTruthy();
    });

    test('有内容 + 未选方法 + needReply=true → canSend 为假值', () => {
      page.data.content = '这是一段测试内容';
      page.data.needReply = true;
      page.data.selectedMethod = null;
      page.updateCanSend();
      const lastCall = page.setData.mock.calls[page.setData.mock.calls.length - 1];
      expect(lastCall[0].canSend).toBeFalsy();
    });

    test('有内容 + needReply=false → canSend 为真值（不需要选方法）', () => {
      page.data.content = '一段笔记';
      page.data.needReply = false;
      page.data.selectedMethod = null;
      page.updateCanSend();
      const lastCall = page.setData.mock.calls[page.setData.mock.calls.length - 1];
      expect(lastCall[0].canSend).toBeTruthy();
    });

    test('空内容 → canSend 为假值', () => {
      page.data.content = '   ';
      page.data.needReply = false;
      page.updateCanSend();
      const lastCall = page.setData.mock.calls[page.setData.mock.calls.length - 1];
      expect(lastCall[0].canSend).toBeFalsy();
    });
  });

  // ==================== onInput ====================

  describe('onInput — 输入处理', () => {
    test('输入内容更新到 data', () => {
      page.onInput({ detail: { value: '我的思考内容' } });
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ content: '我的思考内容' }));
    });
  });

  // ==================== selectNeedReply ====================

  describe('selectNeedReply — 切换是否需要AI回复', () => {
    test('选择需要回复', () => {
      page.selectNeedReply({ currentTarget: { dataset: { need: 'true' } } });
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ needReply: true }));
    });

    test('选择不需要回复', () => {
      page.selectNeedReply({ currentTarget: { dataset: { need: '' } } });
      expect(page.setData).toHaveBeenCalledWith(expect.objectContaining({ needReply: false }));
    });
  });

  // ==================== 配额校验 ====================

  describe('submitLetter — 配额校验', () => {
    test('canSend=false 时直接返回', async () => {
      page.data.canSend = false;
      await page.submitLetter();
      expect(global.wx.cloud.callFunction).not.toHaveBeenCalled();
    });

    test('needReply=true 且 stamps < 1 时提示额度不足', async () => {
      page.data.canSend = true;
      page.data.content = '测试内容';
      page.data.needReply = true;
      page.data.userStamps = 0;
      page.data.selectedMethod = 'SWOT分析';
      page.data.openid = 'test-openid';

      await page.submitLetter();
      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({ title: '额度不足' })
      );
    });
  });

  // ==================== METHOD_FIELDS 数据完整性 ====================

  describe('METHOD_FIELDS 数据完整性', () => {
    test('恰好 4 个领域', () => {
      expect(page.data.methodFields.length).toBe(4);
    });

    test('总计 21 种分析方法', () => {
      const total = page.data.methodFields.reduce((sum, f) => sum + f.methods.length, 0);
      expect(total).toBe(21);
    });

    test('每个领域都有 key/name/icon/methods', () => {
      page.data.methodFields.forEach(f => {
        expect(f.key).toBeTruthy();
        expect(f.name).toBeTruthy();
        expect(f.icon).toBeTruthy();
        expect(Array.isArray(f.methods)).toBe(true);
        expect(f.methods.length).toBeGreaterThan(0);
      });
    });

    test('所有方法名称唯一', () => {
      const allMethods = page.data.methodFields.flatMap(f => f.methods);
      const uniqueMethods = [...new Set(allMethods)];
      expect(uniqueMethods.length).toBe(allMethods.length);
    });
  });
});
