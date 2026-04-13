const app = getApp();

Page({
  data: {
    themeClass: '',
    idea: '',
    loading: false,
    report: '',
    mentors: [],
    dimensions: []
  },

  onLoad() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onShow() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onInput(e) {
    this.setData({ idea: e.detail.value });
  },

  async generateReport() {
    const idea = this.data.idea.trim();
    if (idea.length < 10) {
      wx.showToast({
        title: '至少输入10个字',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loading: true,
      report: ''
    });

    try {
      const result = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'incubator',
          content: idea
        }
      });

      if (!result.result?.success || !result.result?.data) {
        throw new Error(result.result?.error || '生成失败');
      }

      this.setData({
        report: result.result.data.report || '',
        mentors: result.result.data.mentors || [],
        dimensions: result.result.data.dimensions || []
      });
    } catch (err) {
      console.error('思想孵化器生成失败:', err);
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
