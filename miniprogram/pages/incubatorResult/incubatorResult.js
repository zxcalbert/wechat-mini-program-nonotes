const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    data: null,
    statusBarHeight: 0,
    loading: true
  },

  async onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight 
    });

    if (options.id) {
      await this.fetchIncubatorById(options.id);
    }
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

  exportText() {
    if (!this.data.data) return;

    let text = `【思想孵化报告】\n\n`;
    text += `原始想法：${this.data.data.content}\n\n`;
    text += `=`.repeat(40) + `\n\n`;
    text += this.data.data.report;
    text += `\n\n` + `-`.repeat(40) + `\n`;
    text += `生成时间：${this.formatDate(this.data.data.createTime)}\n`;

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
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
});
