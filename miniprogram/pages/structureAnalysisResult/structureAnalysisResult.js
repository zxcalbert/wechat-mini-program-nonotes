const db = wx.cloud.database();
const reportUtil = require('../../utils/reportUtil');
const mindmapMixin = require('../../utils/mindmapMixin');
const app = getApp();

var mindmapMethods = mindmapMixin.create(
  function() { return this.data.data && this.data.data.report; },
  function() { return '结构分析'; }
);

Page(Object.assign({}, mindmapMethods, {
  data: {
    data: null,
    statusBarHeight: 0,
    loading: true,
    themeClass: '',
    fontClass: ''
  },

  async onLoad(options) {
    const windowInfo = wx.getWindowInfo();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight,
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });

    if (options.id) {
      await this.fetchStructureAnalysisById(options.id);
    }
  },

  onShow() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  async fetchStructureAnalysisById(id) {
    try {
      const result = await db.collection('structure_analysis_reports').doc(id).get();
      if (result.data) {
        this.setData({ data: result.data, loading: false });
      }
    } catch (err) {
      console.error('获取结构分析数据失败:', err);
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

    var typeText = this.data.data.analysisType === 'product' ? '产品结构分析报告' : '公司结构分析报告';
    var text = '【' + typeText + '】\n\n';
    text += '分析对象：' + this.data.data.content + '\n\n';
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
  },

  reportContent() {
    var data = this.data.data;
    if (!data || !data._id) return;
    reportUtil.showReportDialog(data._id, 'structure_analysis');
  }
}));
