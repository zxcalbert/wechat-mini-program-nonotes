'use strict';

/**
 * reportUtil 单元测试
 * 验证举报工具的参数校验和 contentType 映射
 */

// 模拟微信 API
global.wx = {
  showToast: jest.fn(),
  showActionSheet: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  cloud: {
    callFunction: jest.fn()
  }
};

var reportUtil = require('../../miniprogram/utils/reportUtil');

describe('reportUtil', function () {
  beforeEach(function () {
    jest.clearAllMocks();
  });

  describe('VALID_CONTENT_TYPES', function () {
    test('包含 4 种合法类型', function () {
      expect(reportUtil.VALID_CONTENT_TYPES).toEqual([
        'letter', 'roundtable', 'incubator', 'structure_analysis'
      ]);
    });
  });

  describe('showReportDialog', function () {
    test('缺少 contentId 时提示参数异常', function () {
      reportUtil.showReportDialog(null, 'letter');
      expect(global.wx.showToast).toHaveBeenCalledWith({
        title: '参数异常', icon: 'none'
      });
      expect(global.wx.showActionSheet).not.toHaveBeenCalled();
    });

    test('不合法的 contentType 时提示参数异常', function () {
      reportUtil.showReportDialog('abc123', 'invalid_type');
      expect(global.wx.showToast).toHaveBeenCalledWith({
        title: '参数异常', icon: 'none'
      });
    });

    test('参数合法时弹出 ActionSheet', function () {
      reportUtil.showReportDialog('abc123', 'letter');
      expect(global.wx.showActionSheet).toHaveBeenCalled();
      var callArgs = global.wx.showActionSheet.mock.calls[0][0];
      expect(callArgs.itemList).toContain('包含违法信息');
      expect(callArgs.itemList).toContain('含有虚假内容');
      expect(callArgs.itemList).toContain('涉及个人隐私');
      expect(callArgs.itemList).toContain('其他');
      expect(callArgs.itemList).toHaveLength(4);
    });

    test('选择原因后调用 reportContent 云函数', function () {
      global.wx.showActionSheet.mockImplementation(function (opts) {
        opts.success({ tapIndex: 0 });
      });
      global.wx.cloud.callFunction.mockImplementation(function (opts) {
        opts.success({ result: { success: true } });
      });

      reportUtil.showReportDialog('record_123', 'roundtable');

      expect(global.wx.cloud.callFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'reportContent',
          data: {
            contentId: 'record_123',
            contentType: 'roundtable',
            reason: '包含违法信息'
          }
        })
      );
    });

    test('4 种 contentType 均可正常提交', function () {
      var types = ['letter', 'roundtable', 'incubator', 'structure_analysis'];
      types.forEach(function (type) {
        global.wx.showActionSheet.mockImplementation(function (opts) {
          opts.success({ tapIndex: 1 });
        });
        global.wx.cloud.callFunction.mockReset();
        global.wx.cloud.callFunction.mockImplementation(function (opts) {
          opts.success({ result: { success: true } });
        });

        reportUtil.showReportDialog('id_' + type, type);
        expect(global.wx.cloud.callFunction).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ contentType: type })
          })
        );
      });
    });

    test('云函数返回失败时显示错误信息', function () {
      global.wx.showActionSheet.mockImplementation(function (opts) {
        opts.success({ tapIndex: 2 });
      });
      global.wx.cloud.callFunction.mockImplementation(function (opts) {
        opts.success({ result: { success: false, message: '举报原因不能超过500字' } });
      });

      reportUtil.showReportDialog('abc', 'letter');

      expect(global.wx.hideLoading).toHaveBeenCalled();
      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '举报原因不能超过500字' })
      );
    });
  });
});
