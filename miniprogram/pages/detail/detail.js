const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    letter: null,
    loading: true,
    replyContent: '',
    openid: null
  },

  onLoad: function(options) {
    const openid = wx.getStorageSync('openid');
    
    if (!openid) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }

    this.setData({ openid });

    const letterId = options.id;
    if (letterId) {
      this.loadLetterDetail(letterId);
    }
  },

  /**
   * 加载信件详情 - 检查权限
   */
  async loadLetterDetail(letterId) {
    this.setData({ loading: true });
    
    try {
      const result = await cloudbaseUtil.getById('letters', letterId);
      
      if (result.success) {
        // 权限检查：只有信件所有者才能查看
        if (result.data._openid !== this.data.openid) {
          wx.showToast({ title: '无权限访问此信件', icon: 'error' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }

        // 检查是否显示回复：
        // 1. 老数据数据（没有 replyExpectTime）：只要有 replyContent 就显示
        // 2. 新数据（有 replyExpectTime）：需要等待18小时后才能看到
        const now = Date.now();
        const canShowReply = result.data.replyContent &&
          (!result.data.replyExpectTime || now >= result.data.replyExpectTime);

        const letter = {
          ...result.data,
          displayDate: cloudbaseUtil.formatDateTime(result.data.createTime),
          statusLabel: this.getStatusLabel(result.data.status),
          canShowReply: canShowReply  // 新增字段，用于前端判断是否显示回复
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
   * 获取状态标签
   */
  getStatusLabel(status) {
    const statusMap = {
      'pending': '待回复',
      'replied': '已回复',
      'read': '已读'
    };
    return statusMap[status] || '未知';
  },

  /**
   * 保存回复
   */
  async saveReply() {
    const { letter, replyContent } = this.data;
    
    if (!replyContent.trim()) {
      wx.showToast({ title: '请输入回复内容', icon: 'error' });
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
   * 删除信件
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
  }
});
