const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const exportUtil = require('../../utils/exportUtil');
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

Page({
  data: {
    letter: null,
    loading: true,
    replyContent: '',
    openid: null,
    themeClass: '',
    fontClass: '',
    mindmapData: null,
    mindmapLoading: false,
    mindmapError: false
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

  async generateMindmap() {
    if (this.data.mindmapLoading) return;

    const letter = this.data.letter;
    if (!letter || !letter.replyContent) {
      wx.showToast({ title: '无分析内容', icon: 'none' });
      return;
    }

    this.setData({ mindmapLoading: true, mindmapError: false });

    try {
      const res = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'mindmap',
          analysisContent: letter.replyContent,
          methodName: letter.displayMethod || letter.mentor || '分析方法'
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

  /**
   * 导出分析结果为 Markdown 文本到剪贴板
   */
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
  }
});
