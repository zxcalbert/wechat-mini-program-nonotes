const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    deletedLetters: [],
    loading: false,
    openid: null,
    empty: false,
    statusBarHeight: 0
  },

  onLoad: function() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight });
    this.checkAuth();
  },

  onShow: function() {
    if (this.data.openid) {
      this.fetchDeletedLetters();
    }
  },

  /**
   * 检查登录状态
   */
  checkAuth: function() {
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');

    if (!openid || !userInfo) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }

    this.setData({ openid });
    this.fetchDeletedLetters();
  },

  /**
   * 获取已删除的笔记列表
   */
  async fetchDeletedLetters() {
    this.setData({ loading: true });

    try {
      const result = await cloudbaseUtil.query('letters', {
        where: { _openid: this.data.openid },
        orderBy: 'deleteTime',
        orderDirection: 'desc',
        limit: 100
      });

      if (result.success) {
        // 在客户端过滤已删除的笔记
        const deletedLetters = result.data
          .filter(item => item.deleted === true)
          .map(item => ({
            ...item,
            displayDate: cloudbaseUtil.formatDate(item.deleteTime || item.createTime),
            statusLabel: this.getStatusLabel(item.status)
          }));

        this.setData({
          deletedLetters,
          empty: deletedLetters.length === 0
        });
        console.log('回收站加载成功，共', deletedLetters.length, '篇笔记');
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
        console.error('查询失败:', result.error);
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
      'read': '已读',
      'archived': '已归档'
    };
    return statusMap[status] || '未知';
  },

  /**
   * 恢复笔记
   */
  restoreLetter: function(event) {
    const letterId = event.currentTarget.dataset.id;

    wx.showModal({
      title: '恢复笔记',
      content: '确定要恢复这篇笔记吗？',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.update('letters', letterId, {
            deleted: false,
            deleteTime: null
          });

          if (result.success) {
            wx.showToast({
              title: '已恢复',
              icon: 'success'
            });
            this.fetchDeletedLetters();
          } else {
            wx.showToast({
              title: '恢复失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 阻止点击事件冒泡到 restoreLetter
  stopPropagation: function() {
    // 空函数，用于阻止事件冒泡
  },

  /**
   * 永久删除笔记
   */
  permanentDelete: function(event) {
    const letterId = event.currentTarget.dataset.id;

    wx.showModal({
      title: '永久删除',
      content: '确定要永久删除这篇笔记吗？此操作不可恢复！',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.delete('letters', letterId);

          if (result.success) {
            wx.showToast({
              title: '已永久删除',
              icon: 'success'
            });
            this.fetchDeletedLetters();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * 清空回收站
   */
  emptyTrash: function() {
    if (this.data.deletedLetters.length === 0) {
      wx.showToast({
        title: '回收站为空',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '清空回收站',
      content: '确定要清空回收站吗？所有笔记将被永久删除，此操作不可恢复！',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          let successCount = 0;
          const totalCount = this.data.deletedLetters.length;

          for (const letter of this.data.deletedLetters) {
            const result = await cloudbaseUtil.delete('letters', letter._id);
            if (result.success) {
              successCount++;
            }
          }

          wx.hideLoading();

          if (successCount === totalCount) {
            wx.showToast({
              title: `已清空回收站（${totalCount}篇）`,
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: `部分删除成功（${successCount}/${totalCount}）`,
              icon: 'none'
            });
          }

          this.fetchDeletedLetters();
        }
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.fetchDeletedLetters().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 返回上一页
   */
  goBack: function() {
    wx.navigateBack();
  },

  /**
   * 查看笔记详情（只读）
   */
  viewLetter: function(event) {
    const letterId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${letterId}&readonly=true`
    });
  }
});
