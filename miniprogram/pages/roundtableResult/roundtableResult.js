const app = getApp();

Page({
  data: {
    data: null,
    statusBarHeight: 0,
    fieldColors: {
      '价值思维': '#8b4513',
      '创业创新': '#2ecc71',
      '心理学': '#9b59b6',
      '哲学': '#34495e'
    }
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight 
    });

    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.setData({ data: data });
      } catch (err) {
        console.error('解析数据失败:', err);
      }
    }
  },

  goBack() {
    wx.navigateBack();
  },

  exportText() {
    if (!this.data.data) return;

    let text = `【圆桌讨论】\n\n`;
    text += `问题：${this.data.data.content}\n\n`;
    text += `=` .repeat(40) + `\n\n`;

    for (const d of this.data.data.discussions) {
      text += `【${d.mentor} - ${d.field}】\n`;
      text += d.reply + `\n\n`;
      text += `-`.repeat(40) + `\n\n`;
    }

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

  shareImage() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});
