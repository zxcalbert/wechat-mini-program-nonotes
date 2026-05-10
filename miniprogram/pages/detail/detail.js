const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const exportUtil = require('../../utils/exportUtil');
const reportUtil = require('../../utils/reportUtil');
const mindmapMixin = require('../../utils/mindmapMixin');
const app = getApp();

const COMPLIANCE_DATE = new Date('2026-07-15').getTime();

const methodNameMap = {
  '查理·芒格': '多元思维模型分析',
  '巴菲特': '价值投资分析框架',
  '格雷厄姆': '安全边际分析',
  '段永平': '本分经营分析',
  '张小龙': '极简产品分析',
  '乔布斯': '创新设计分析',
  '马斯克': '第一性原理分析',
  '贝佐斯': '长期主义分析',
  '彼得·蒂尔': '垄断竞争分析',
  '荣格': '原型心理分析',
  '弗洛伊德': '精神分析框架',
  '弗洛姆': '人本精神分析',
  '阿德勒': '目的论分析',
  '马斯洛': '需求层次分析',
  '老子': '道家思想分析',
  '孔子': '儒家伦理分析',
  '苏格拉底': '苏格拉底式提问',
  '柏拉图': '理念论分析',
  '亚里士多德': '幸福伦理学分析',
  '尼采': '超人哲学分析',
  '维特根斯坦': '语言哲学分析'
};

var mindmapMethods = mindmapMixin.create(
  function() { return this.data.letter && this.data.letter.replyContent; },
  function() { return this.data.letter.displayMethod || this.data.letter.mentor || '分析方法'; }
);

Page(Object.assign({}, mindmapMethods, {
  data: {
    letter: null,
    loading: true,
    replyContent: '',
    openid: null,
    themeClass: '',
    fontClass: ''
  },

  onLoad: function(options) {
    const openid = wx.getStorageSync('openid');

    if (!openid) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }

    this.setData({
      openid,
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });

    const letterId = options.id;
    if (letterId) {
      this.loadLetterDetail(letterId);
    }
  },

  onShow: function() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  /**
   * 加载分析详情 - 检查权限
   */
  async loadLetterDetail(letterId) {
    this.setData({ loading: true });

    try {
      const result = await cloudbaseUtil.getById('letters', letterId);

      if (result.success) {
        if (result.data._openid !== this.data.openid) {
          wx.showToast({ title: '无权限访问', icon: 'error' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }

        const now = Date.now();
        const canShowReply = result.data.replyContent &&
          (!result.data.replyExpectTime || now >= result.data.replyExpectTime);

        const displayMethod = this._getDisplayMethod(result.data);

        const letter = {
          ...result.data,
          displayDate: cloudbaseUtil.formatDateTime(result.data.createTime),
          statusLabel: this.getStatusLabel(result.data.status),
          canShowReply: canShowReply,
          showMethod: !!result.data.mentor,
          displayMethod: displayMethod
        };

        this.setData({ letter });
        console.log('加载详情成功:', letter);
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取显示用的分析方法名称（兼容旧数据）
   */
  _getDisplayMethod(letterData) {
    if (!letterData.mentor) return '';
    const createTime = letterData.createTime ? new Date(letterData.createTime).getTime() : 0;
    if (createTime >= COMPLIANCE_DATE) {
      return letterData.mentor;
    }
    return methodNameMap[letterData.mentor] || letterData.mentor;
  },

  /**
   * 获取状态标签
   */
  getStatusLabel(status) {
    const statusMap = {
      'pending': '分析中',
      'replied': '已完成',
      'read': '已查看',
      'saved': '已保存'
    };
    return statusMap[status] || '未知';
  },

  /**
   * 保存回复
   */
  async saveReply() {
    const { letter, replyContent } = this.data;

    if (!replyContent.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'error' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const result = await cloudbaseUtil.update('letters', letter._id, {
        replyContent: replyContent,
        status: 'replied',
        replyTime: new Date()
      });

      wx.hideLoading();

      if (result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '出错了', icon: 'error' });
      console.error('保存失败:', err);
    }
  },

  /**
   * 更新回复内容
   */
  onReplyInput(e) {
    this.setData({ replyContent: e.detail.value });
  },

  /**
   * 删除记录
   */
  async deleteLetter() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除吗？',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.delete('letters', this.data.letter._id);

          if (result.success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          } else {
            wx.showToast({ title: '删除失败', icon: 'error' });
          }
        }
      }
    });
  },

  exportAsMarkdown() {
    var letter = this.data.letter;
    if (!letter) return;

    var md = exportUtil.analysisToMarkdown(letter);
    if (!md) {
      wx.showToast({ title: '无内容可导出', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: md,
      success: function() {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  reportContent() {
    var letter = this.data.letter;
    if (!letter || !letter._id) return;
    reportUtil.showReportDialog(letter._id, 'letter');
  }
}));
