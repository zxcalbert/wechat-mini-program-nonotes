const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    letters: [],
    displayLetters: [],
    loading: false,
    openid: null,
    showMenu: false,
    userStamps: 3,
    heatmapData: [],
    userInfo: null,
    showSearch: false,
    searchKeyword: '',
    searchFocus: false
  },

  onLoad: function() {
    this.checkAuth();
    this.generateHeatmapData();
  },

  onShow: function() {
    if (this.data.openid) {
      this.fetchLetters();
      this.fetchUserStamps();
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
    
    this.setData({ openid, userInfo });
    this.fetchLetters();
    this.fetchUserStamps();
  },

  /**
   * 获取用户邮票数
   */
  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const userStamps = result.data[0].stamps;
        // 只有当 stamps 字段不存在时才使用默认值 3
        const stamps = userStamps !== undefined ? userStamps : 3;
        this.setData({ userStamps: stamps });
      } else {
        this.setData({ userStamps: 3 });
      }
    } catch (err) {
      console.error('获取邮票失败:', err);
      this.setData({ userStamps: 3 });
    }
  },

  /**
   * 获取笔记列表
   */
  async fetchLetters() {
    this.setData({ loading: true });
    
    try {
      const result = await cloudbaseUtil.query('letters', {
        where: { _openid: this.data.openid },
        orderBy: 'createTime',
        orderDirection: 'desc',
        limit: 50
      });

      if (result.success) {
        const letters = result.data.map(item => ({
          ...item,
          displayDate: cloudbaseUtil.formatDate(item.createTime),
          statusLabel: this.getStatusLabel(item.status)
        }));

        this.setData({ letters, displayLetters: letters });
        console.log('加载成功，共', letters.length, '篇笔记');
      } else {
        wx.showToast({ title: '加载失败', icon: 'error' });
        console.error('查询失败:', result.error);
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 生成热力图数据（过去一年的日期）
   */
  generateHeatmapData() {
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const data = [];

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // 这里可以从数据库查询该日期有多少笔记
      // 暂时随机生成用于演示
      const count = Math.floor(Math.random() * 4);
      data.push({
        date: dateStr,
        count: count
      });
    }

    this.setData({ heatmapData: data });
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
   * 点击笔记进入详情页
   */
  goToDetail: function(event) {
    const letterId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${letterId}`
    });
  },

  /**
   * 长按删除笔记到回收站
   */
  deleteLetter: function(event) {
    const letterId = event.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除笔记',
      content: '确定要删除这篇笔记吗？可以在回收站恢复。',
      success: async (res) => {
        if (res.confirm) {
          const result = await cloudbaseUtil.update('letters', letterId, {
            deleted: true,
            deleteTime: new Date().getTime()
          });
          
          if (result.success) {
            wx.showToast({ 
              title: '已移入回收站',
              icon: 'success'
            });
            this.fetchLetters();
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
   * 切换侧边菜单
   */
  toggleSideMenu() {
    this.setData({
      showMenu: !this.data.showMenu
    });
  },

  /**
   * 关闭侧边菜单
   */
  closeSideMenu() {
    this.setData({
      showMenu: false
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.fetchLetters().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 跳转到写笔记页面
   */
  goToWrite: function() {
    wx.navigateTo({
      url: '../write/write'
    });
  },

  /**
   * 显示搜索框
   */
  showSearchInput: function() {
    this.setData({
      showSearch: true,
      searchFocus: true
    });
  },

  /**
   * 隐藏搜索框
   */
  hideSearchInput: function() {
    this.setData({
      showSearch: false,
      searchKeyword: '',
      displayLetters: this.data.letters,
      searchFocus: false
    });
  },

  /**
   * 搜索输入处理
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });

    if (keyword === '') {
      this.setData({ displayLetters: this.data.letters });
      return;
    }

    this.filterLetters(keyword);
  },

  /**
   * 过滤笔记
   */
  filterLetters: function(keyword) {
    const letters = this.data.letters;
    const filtered = letters.filter(letter => {
      return letter.content && letter.content.toLowerCase().includes(keyword.toLowerCase());
    });
    this.setData({ displayLetters: filtered });
  }
});

