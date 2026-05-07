const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    data: null,
    statusBarHeight: 0,
    loading: true,
    themeClass: '',
    fontClass: '',
    mindmapData: null,
    mindmapLoading: false,
    mindmapError: false
  },

  async onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight,
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });

    if (options.id) {
      await this.fetchIncubatorById(options.id);
    }
  },

  onShow() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  async fetchIncubatorById(id) {
    try {
      const result = await db.collection('incubator_reports').doc(id).get();
      if (result.data) {
        this.setData({ data: result.data, loading: false });
      }
    } catch (err) {
      console.error('获取思想孵化器数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  async generateMindmap() {
    if (this.data.mindmapLoading) return;

    const data = this.data.data;
    if (!data || !data.report) {
      wx.showToast({ title: '无报告内容', icon: 'none' });
      return;
    }

    this.setData({ mindmapLoading: true, mindmapError: false });

    try {
      const res = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'mindmap',
          analysisContent: data.report,
          methodName: '思想孵化分析'
        }
      });

      const result = res.result || {};
      if (result.success && result.data) {
        this.setData({ mindmapData: result.data, mindmapLoading: false });
      } else {
        this.setData({ mindmapError: true, mindmapLoading: false });
        wx.showToast({ title: '脑图生成失败', icon: 'none' });
      }
    } catch (err) {
      console.error('生成脑图失败:', err);
      this.setData({ mindmapError: true, mindmapLoading: false });
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },

  saveMindmapImage() {
    const mindmap = this.selectComponent('#mindmapRenderer');
    if (!mindmap) {
      wx.showToast({ title: '脑图未就绪', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    mindmap.exportImage().then((tempPath) => {
      wx.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: () => {
          wx.hideLoading();
          wx.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: (err) => {
          wx.hideLoading();
          if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
            wx.showModal({
              title: '需要授权',
              content: '请在设置中允许访问相册',
              confirmText: '去设置',
              success: (res) => {
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
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    });
  },

  exportText() {
    if (!this.data.data) return;

    let text = '【思想孵化报告】\n\n';
    text += '原始想法：' + this.data.data.content + '\n\n';
    text += '='.repeat(40) + '\n\n';
    text += this.data.data.report;
    text += '\n\n' + '-'.repeat(40) + '\n';
    text += '生成时间：' + this.formatDate(this.data.data.createTime) + '\n';

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  formatDate(date) {
    if (!date) return '';
    var d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
});
