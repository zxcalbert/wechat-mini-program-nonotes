'use strict';

/**
 * 举报工具 — 封装举报交互与云函数调用
 * 用于 4 个 AI 结果页（detail/roundtable/incubator/structure）
 */

var REASONS = ['包含违法信息', '含有虚假内容', '涉及个人隐私', '其他'];
var VALID_CONTENT_TYPES = ['letter', 'roundtable', 'incubator', 'structure_analysis'];

/**
 * 弹出 ActionSheet 选择举报原因，确认后提交举报
 * @param {string} contentId - 被举报内容的 _id
 * @param {string} contentType - 内容类型（letter/roundtable/incubator/structure_analysis）
 */
function showReportDialog(contentId, contentType) {
  if (!contentId || VALID_CONTENT_TYPES.indexOf(contentType) === -1) {
    wx.showToast({ title: '参数异常', icon: 'none' });
    return;
  }

  wx.showActionSheet({
    itemList: REASONS,
    success: function (res) {
      var reason = REASONS[res.tapIndex];
      submitReport(contentId, contentType, reason);
    }
  });
}

function submitReport(contentId, contentType, reason) {
  wx.showLoading({ title: '提交中...', mask: true });
  wx.cloud.callFunction({
    name: 'reportContent',
    data: {
      contentId: contentId,
      contentType: contentType,
      reason: reason
    },
    success: function (res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.success) {
        wx.showToast({ title: '举报已提交', icon: 'success' });
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' });
      }
    },
    fail: function () {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  });
}

module.exports = {
  showReportDialog: showReportDialog,
  VALID_CONTENT_TYPES: VALID_CONTENT_TYPES
};
