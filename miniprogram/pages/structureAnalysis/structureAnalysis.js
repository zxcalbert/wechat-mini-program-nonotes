const app = getApp();

Page({
  data: {
    themeClass: '',
    content: '',
    analysisType: 'company',
    loading: false,
    report: '',
    dimensions: []
  },

  onLoad() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onShow() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ analysisType: type });
  },

  async generateReport() {
    const content = this.data.content.trim();
    if (content.length < 10) {
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
          type: 'structure_analysis',
          analysisType: this.data.analysisType,
          content: content
        }
      });

      if (!result.result?.success || !result.result?.data) {
        throw new Error(result.result?.error || '生成失败');
      }

      this.setData({
        report: result.result.data.report || '',
        dimensions: result.result.data.dimensions || []
      });
    } catch (err) {
      console.error('结构分析生成失败:', err);
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
