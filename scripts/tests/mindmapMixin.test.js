'use strict';

/**
 * mindmapMixin 单元测试
 * 验证工厂函数创建的方法行为和数据初始值
 */

var mockStorage = {};

global.wx = {
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  openSetting: jest.fn(),
  getStorageSync: jest.fn(function (key) { return mockStorage[key] || ''; }),
  setStorageSync: jest.fn(function (key, val) { mockStorage[key] = val; }),
  cloud: {
    callFunction: jest.fn()
  },
  saveImageToPhotosAlbum: jest.fn()
};

var mindmapMixin = require('../../miniprogram/utils/mindmapMixin');

function createPage(methodName) {
  var methods = mindmapMixin.create(
    function() { return this.data.content; },
    function() { return methodName || '测试方法'; }
  );
  var page = Object.assign({}, methods, {
    data: { content: '测试内容' },
    setData: jest.fn(function (updates, cb) {
      Object.assign(this.data, updates);
      if (typeof cb === 'function') cb();
    }),
    selectComponent: jest.fn()
  });
  return page;
}

describe('mindmapMixin', function () {
  beforeEach(function () {
    jest.clearAllMocks();
    mockStorage = {};
  });

  describe('create()', function () {
    test('返回包含 3 个方法和 3 个 data 初始值的对象', function () {
      var methods = mindmapMixin.create(
        function() { return null; },
        function() { return 'test'; }
      );
      expect(typeof methods.generateMindmap).toBe('function');
      expect(typeof methods._saveMindmapHistory).toBe('function');
      expect(typeof methods.saveMindmapImage).toBe('function');
      expect(methods.mindmapData).toBeNull();
      expect(methods.mindmapLoading).toBe(false);
      expect(methods.mindmapError).toBe(false);
    });
  });

  describe('generateMindmap()', function () {
    test('无内容时提示', function () {
      var page = createPage();
      page.data.content = null;
      page.generateMindmap();
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '无分析内容' })
      );
    });

    test('loading 中时不重复调用', function () {
      var page = createPage();
      page.data.mindmapLoading = true;
      page.generateMindmap();
      expect(global.wx.cloud.callFunction).not.toHaveBeenCalled();
    });

    test('成功时更新 data 并保存历史', function () {
      var page = createPage('测试方法');
      var mockResult = {
        title: '测试脑图',
        sections: [{ id: '1', title: '章节1', points: [] }]
      };
      global.wx.cloud.callFunction.mockImplementation(function (opts) {
        opts.success({ result: { success: true, data: mockResult } });
      });

      page.generateMindmap();

      expect(global.wx.cloud.callFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'replyToLetter',
          data: expect.objectContaining({ type: 'mindmap' })
        })
      );
      expect(page.setData).toHaveBeenCalledWith(
        expect.objectContaining({ mindmapData: mockResult })
      );
    });

    test('失败时设置 error 状态', function () {
      var page = createPage();
      global.wx.cloud.callFunction.mockImplementation(function (opts) {
        opts.success({ result: { success: false } });
      });

      page.generateMindmap();
      expect(page.setData).toHaveBeenCalledWith(
        expect.objectContaining({ mindmapError: true })
      );
    });

    test('网络错误时设置 error 状态', function () {
      var page = createPage();
      global.wx.cloud.callFunction.mockImplementation(function (opts) {
        opts.fail();
      });

      page.generateMindmap();
      expect(page.setData).toHaveBeenCalledWith(
        expect.objectContaining({ mindmapError: true })
      );
    });
  });

  describe('_saveMindmapHistory()', function () {
    test('保存到 localStorage', function () {
      var page = createPage('测试方法');
      var mindmapData = { title: '测试脑图', sections: [] };
      page._saveMindmapHistory(mindmapData, '测试方法');

      expect(global.wx.setStorageSync).toHaveBeenCalledWith(
        'mindmap_history',
        expect.arrayContaining([
          expect.objectContaining({
            title: '测试脑图',
            methodName: '测试方法'
          })
        ])
      );
    });

    test('超过 20 条时截断', function () {
      var existing = [];
      for (var i = 0; i < 25; i++) {
        existing.push({ id: 'mm_' + i, title: '旧' + i });
      }
      mockStorage['mindmap_history'] = existing;

      var page = createPage();
      page._saveMindmapHistory({ title: '新脑图' }, '方法');
      var saved = global.wx.setStorageSync.mock.calls[0][1];
      expect(saved.length).toBe(20);
    });
  });

  describe('saveMindmapImage()', function () {
    test('脑图未就绪时提示', function () {
      var page = createPage();
      page.selectComponent.mockReturnValue(null);
      page.saveMindmapImage();
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '脑图未就绪' })
      );
    });

    test('脑图组件存在时调用 exportImage', function () {
      var page = createPage();
      var mockMindmap = {
        exportImage: jest.fn(function () { return Promise.resolve('/tmp/test.png'); })
      };
      page.selectComponent.mockReturnValue(mockMindmap);
      global.wx.saveImageToPhotosAlbum.mockImplementation(function (opts) {
        opts.success();
      });

      page.saveMindmapImage();
      expect(mockMindmap.exportImage).toHaveBeenCalled();
    });
  });
});
