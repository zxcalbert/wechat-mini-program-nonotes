'use strict';

/**
 * 脑图功能 Mixin 工厂
 * 提取 detail/incubatorResult/structureAnalysisResult 三页面的公共脑图逻辑
 *
 * 用法：
 *   var mindmapMixin = require('../../utils/mindmapMixin');
 *   var methods = mindmapMixin.create(
 *     function getContent() { return this.data.letter && this.data.letter.replyContent; },
 *     function getMethodName() { return this.data.letter.displayMethod || '分析方法'; }
 *   );
 *   Page(Object.assign({}, methods, { ... }));
 */

function create(getContentFn, getMethodNameFn) {
  return {
    mindmapData: null,
    mindmapLoading: false,
    mindmapError: false,

    generateMindmap: function () {
      if (this.data.mindmapLoading) return;

      var content = getContentFn.call(this);
      var methodName = getMethodNameFn.call(this);
      if (!content) {
        wx.showToast({ title: '无分析内容', icon: 'none' });
        return;
      }

      this.setData({ mindmapLoading: true, mindmapError: false });

      var self = this;
      wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'mindmap',
          analysisContent: content,
          methodName: methodName
        },
        success: function (res) {
          var result = res.result || {};
          if (result.success && result.data) {
            self.setData({ mindmapData: result.data, mindmapLoading: false });
            self._saveMindmapHistory(result.data, methodName);
          } else {
            self.setData({ mindmapError: true, mindmapLoading: false });
            wx.showToast({ title: '脑图生成失败', icon: 'none' });
          }
        },
        fail: function () {
          self.setData({ mindmapError: true, mindmapLoading: false });
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },

    _saveMindmapHistory: function (mindmapData, methodName) {
      try {
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
      } catch (e) {}
    },

    saveMindmapImage: function () {
      var mindmap = this.selectComponent('#mindmapRenderer');
      if (!mindmap) {
        wx.showToast({ title: '脑图未就绪', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '保存中...' });
      mindmap.exportImage().then(function (tempPath) {
        wx.saveImageToPhotosAlbum({
          filePath: tempPath,
          success: function () {
            wx.hideLoading();
            wx.showToast({ title: '已保存到相册', icon: 'success' });
          },
          fail: function (err) {
            wx.hideLoading();
            if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
              wx.showModal({
                title: '需要授权',
                content: '请在设置中允许访问相册',
                confirmText: '去设置',
                success: function (res) {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          }
        });
      }).catch(function () {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
      });
    }
  };
}

module.exports = { create: create };
