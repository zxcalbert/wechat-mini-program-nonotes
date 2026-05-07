const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const app = getApp();

Page({
  data: {
    deletedLetters: [],
    loading: false,
    openid: null,
    empty: false,
    statusBarHeight: 0,
    themeClass: ''
  },

  onLoad: function() {
    const windowInfo = wx.getWindowInfo();
    this.setData({ 
      statusBarHeight: windowInfo.statusBarHeight,
      themeClass: app.getThemeClass()
    });
    this.checkAuth();
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
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
      const openid = this.data.openid;
      const allDeleted = [];

      // 查询所有集合中软删除的记录
      const collections = [
        { name: 'letters', type: 'letter', label: '笔记' },
        { name: 'roundtable_discussions', type: 'roundtable', label: '多维度分析' },
        { name: 'incubator_reports', type: 'incubator', label: '孵化报告' },
        { name: 'structure_analysis_reports', type: 'structure_analysis', label: '结构分析' }
      ];

      for (const col of collections) {
        try {
          const result = await cloudbaseUtil.query(col.name, {
            where: { _openid: openid, deleted: true },
            orderBy: 'deleteTime',
            orderDirection: 'desc',
            limit: 100
          });
          if (result.success && result.data.length > 0) {
            result.data.forEach(item => {
              allDeleted.push({
                ...item,
                type: item.originalType || col.type,
                typeLabel: col.label,
                displayDate: cloudbaseUtil.formatDate(item.deleteTime || item.createTime),
                statusLabel: this.getStatusLabel(item.status),
                collectionName: col.name
              });
            });
          }
        } catch (e) {
          console.error('查询' + col.label + '失败:', e);
        }
      }

      // 按删除时间降序排列
      allDeleted.sort((a, b) => (b.deleteTime || 0) - (a.deleteTime || 0));

      this.setData({
        deletedLetters: allDeleted,
        empty: allDeleted.length === 0
      });
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
    const collectionName = event.currentTarget.dataset.collection || 'letters';

    wx.showModal({
      title: '恢复记录',
      content: '确定要恢复这条记录吗？',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.update(collectionName, letterId, {
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
    const collectionName = event.currentTarget.dataset.collection || 'letters';

    wx.showModal({
      title: '永久删除',
      content: '确定要永久删除这条记录吗？此操作不可恢复！',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.delete(collectionName, letterId);

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
