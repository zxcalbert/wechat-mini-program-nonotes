
const cloudbaseUtil = require('../../utils/cloudbaseUtil');

const app = getApp();

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
    searchFocus: false,
    statusBarHeight: 0,
    themeIcon: '🌓',
    themeClass: '',
    menuButtonRight: 0,
    navbarPaddingRight: 16
  },

  onLoad: function() {
    const systemInfo = wx.getSystemInfoSync();
    
    let menuButtonRight = 0;
    let navbarPaddingRight = 16;
    
    try {
      const menuButton = wx.getMenuButtonBoundingClientRect();
      if (menuButton && menuButton.right) {
        const screenWidth = systemInfo.screenWidth;
        menuButtonRight = screenWidth - menuButton.right;
        navbarPaddingRight = menuButton.width + menuButtonRight + 8;
        console.log('胶囊按钮位置:', menuButton, '屏幕宽度:', screenWidth, 'padding-right:', navbarPaddingRight);
      }
    } catch (e) {
      console.warn('获取胶囊按钮位置失败:', e);
    }
    
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight,
      themeClass: app.getThemeClass(),
      menuButtonRight,
      navbarPaddingRight
    });
    this.checkAuth();
    this.generateHeatmapData();
    this.updateThemeIcon();
  },

  onShow: function() {
    if (this.data.openid) {
      this.fetchLetters();
      this.fetchUserStamps();
    }
  },

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

  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const userStamps = result.data[0].stamps;
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

  async fetchLetters() {
    this.setData({ loading: true });

    try {
      console.log('🔍 [调试] 开始查询数据库...');
      
      const db = wx.cloud.database();
      
      const countRes = await db.collection('letters')
        .where({ _openid: this.data.openid })
        .count();
      
      console.log('🔍 [调试] 数据库总记录数 (count):', countRes.total);
      
      const totalRecords = countRes.total;
      const pageSize = 20;
      const pageCount = Math.ceil(totalRecords / pageSize);
      const allData = [];
      
      console.log('🔍 [调试] 需要分页查询:', pageCount, '页');
      
      for (let i = 0; i < pageCount; i++) {
        const skip = i * pageSize;
        console.log('🔍 [调试] 查询第', i+1, '页, skip:', skip);
        
        const pageResult = await cloudbaseUtil.query('letters', {
          where: { _openid: this.data.openid },
          orderBy: 'createTime',
          orderDirection: 'desc',
          skip: skip,
          limit: pageSize
        });
        
        if (pageResult.success) {
          allData.push(...pageResult.data);
        }
      }
      
      console.log('🔍 [调试] 分页查询完成，共获取:', allData.length, '条记录');
      
      const letters = allData
        .filter(item => !item.deleted)
        .map(item => ({
          ...item,
          displayDate: cloudbaseUtil.formatDate(item.createTime),
          statusLabel: this.getStatusLabel(item.status)
        }));

      this.setData({ letters, displayLetters: letters });
      console.log('加载成功，共', letters.length, '篇笔记');
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'error' });
      console.error('查询失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  generateHeatmapData() {
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    const data = [];

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const count = Math.floor(Math.random() * 4);
      data.push({
        date: dateStr,
        count: count
      });
    }

    this.setData({ heatmapData: data });
  },

  getStatusLabel(status) {
    const statusMap = {
      'pending': '待回复',
      'replied': '已回复',
      'read': '已读',
      'archived': '已归档'
    };
    return statusMap[status] || '未知';
  },

  goToDetail: function(event) {
    const letterId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../detail/detail?id=${letterId}`
    });
  },

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

  toggleSideMenu() {
    this.setData({
      showMenu: !this.data.showMenu
    });
  },

  closeSideMenu() {
    this.setData({
      showMenu: false
    });
  },

  onThemeChanged() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onPullDownRefresh: function() {
    this.fetchLetters().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  goToWrite: function() {
    wx.navigateTo({
      url: '../write/write'
    });
  },

  showSearchInput: function() {
    this.setData({
      showSearch: true,
      searchFocus: true
    });
  },

  hideSearchInput: function() {
    this.setData({
      showSearch: false,
      searchKeyword: '',
      displayLetters: this.data.letters,
      searchFocus: false
    });
  },

  onSearchInput: function(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });

    if (keyword === '') {
      this.setData({ displayLetters: this.data.letters });
      return;
    }

    this.filterLetters(keyword);
  },

  filterLetters: function(keyword) {
    const letters = this.data.letters;
    const filtered = letters.filter(letter => {
      return letter.content && letter.content.toLowerCase().includes(keyword.toLowerCase());
    });
    this.setData({ displayLetters: filtered });
  },

  updateThemeIcon: function() {
    const theme = app.getTheme();
    let icon;
    if (theme === 'system') {
      icon = '🌓';
    } else if (theme === 'light') {
      icon = '☀️';
    } else {
      icon = '🌙';
    }
    this.setData({ themeIcon: icon });
  },

  toggleTheme: function() {
    app.toggleTheme();
    this.updateThemeIcon();
    this.setData({ themeClass: app.getThemeClass() });
    
    const theme = app.getTheme();
    let tip;
    if (theme === 'system') {
      tip = '跟随系统';
    } else if (theme === 'light') {
      tip = '亮色模式';
    } else {
      tip = '暗色模式';
    }
    
    wx.showToast({
      title: tip,
      icon: 'none',
      duration: 1500
    });
  }
});

