const cloudbaseUtil = require('../../utils/cloudbaseUtil');

const app = getApp();

Page({
  data: {
    letters: [],
    displayLetters: [],
    loading: false,
    openid: null,
    showMenu: false,
    userStamps: 2,
    heatmapData: [],
    userInfo: null,
    showSearch: false,
    searchKeyword: '',
    searchFocus: false,
    statusBarHeight: 0,
    themeIcon: '🌓',
    themeClass: '',
    menuButtonRight: 0,
    navbarPaddingRight: 16,
    
    // 分页相关
    currentPage: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
    isLoadingMore: false
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
  },

  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const userStamps = result.data[0].stamps;
        const stamps = userStamps !== undefined ? userStamps : 2;
        this.setData({ userStamps: stamps });
      } else {
        this.setData({ userStamps: 2 });
      }
    } catch (err) {
      console.error('获取邮票失败:', err);
      this.setData({ userStamps: 2 });
    }
  },

  /**
   * 分页加载笔记
   * 先读缓存，再后台更新
   */
  async fetchLetters() {
    if (this.data.isLoadingMore) return;
    
    this.setData({ 
      loading: true,
      currentPage: 1,
      hasMore: true,
      letters: []
    });

    try {
      const openid = this.data.openid;
      const cacheKey = `letters_${openid}_1`;
      const cache = wx.getStorageSync(cacheKey);
      
      // 有有效缓存，先展示缓存
      if (cache && cache.timestamp + cache.expire * 1000 > Date.now()) {
        console.log('🔄 [缓存] 使用缓存数据，第一页');
        const letters = this.formatLetters(cache.data);
        this.setData({ letters, displayLetters: letters });
        
        // 后台更新数据，不阻塞UI
        this.fetchPageFromServer(1, true).catch(err => {
          console.warn('🔄 [缓存] 后台更新失败:', err);
        });
      } else {
        // 无缓存，直接请求
        await this.fetchPageFromServer(1, false);
      }
    } catch (err) {
      console.error('加载失败:', err);
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载更多笔记（滚动触发）
   */
  async loadMoreLetters() {
    if (!this.data.hasMore || this.data.isLoadingMore || this.data.loading) {
      console.log('📜 [滚动] 加载条件不满足', {
        hasMore: this.data.hasMore,
        isLoadingMore: this.data.isLoadingMore,
        loading: this.data.loading
      });
      return;
    }
    
    console.log('📜 [滚动] 开始加载更多');
    this.setData({ isLoadingMore: true });
    
    try {
      const nextPage = this.data.currentPage + 1;
      await this.fetchPageFromServer(nextPage, false);
    } catch (err) {
      console.error('加载更多失败:', err);
      wx.showToast({ 
        title: '加载失败，请下拉刷新重试', 
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoadingMore: false });
    }
  },

  /**
   * 从服务器请求单页数据
   * @param {number} page - 页码
   * @param {boolean} backgroundUpdate - 是否后台更新
   */
  async fetchPageFromServer(page, backgroundUpdate = false) {
    const skip = (page - 1) * this.data.pageSize;
    const limit = this.data.pageSize;
    const openid = this.data.openid;
    
    console.log(`� [分页] 请求第${page}页, skip=${skip}, limit=${limit}`);
    
    const pageResult = await cloudbaseUtil.query('letters', {
      where: { _openid: openid },
      orderBy: 'createTime',
      orderDirection: 'desc',
      skip: skip,
      limit: limit
    });
    
    if (pageResult.success) {
      const newLetters = this.formatLetters(pageResult.data);
      const cacheKey = `letters_${openid}_${page}`;
      
      // 更新缓存
      wx.setStorageSync(cacheKey, {
        data: pageResult.data,
        timestamp: Date.now(),
        expire: 3600 // 1小时过期
      });
      
      console.log(`� [分页] 第${page}页加载完成，${newLetters.length}条记录`);
      
      // 后台更新时，只更新第一页数据
      if (backgroundUpdate && page === 1) {
        const oldLetters = this.data.letters;
        // 只有数据有变化时才更新页面
        if (JSON.stringify(oldLetters) !== JSON.stringify(newLetters)) {
          console.log('🔄 [缓存] 数据有更新，刷新页面');
          const isLastPage = newLetters.length < this.data.pageSize;
          this.setData({ 
            letters: newLetters, 
            displayLetters: newLetters,
            hasMore: !isLastPage
          });
        } else {
          console.log('🔄 [缓存] 数据无变化，不更新');
        }
      } else {
        // 前台加载，拼接数据
        const allLetters = page === 1 ? newLetters : [...this.data.letters, ...newLetters];
        const isLastPage = newLetters.length < this.data.pageSize;
        
        this.setData({
          letters: allLetters,
          displayLetters: allLetters,
          currentPage: page,
          hasMore: !isLastPage
        });
        
        // 如果是搜索状态，重新过滤
        if (this.data.showSearch && this.data.searchKeyword) {
          this.filterLetters(this.data.searchKeyword);
        }
      }
      
      return newLetters;
    }
    
    throw new Error(pageResult.error || '请求失败');
  },

  /**
   * 格式化笔记数据
   */
  formatLetters(data) {
    return data
      .filter(item => !item.deleted)
      .map(item => ({
        ...item,
        displayDate: cloudbaseUtil.formatDate(item.createTime),
        statusLabel: this.getStatusLabel(item.status)
      }));
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
            
            // 删除缓存
            const openid = this.data.openid;
            const cachePrefix = `letters_${openid}_`;
            const storageInfo = wx.getStorageInfoSync();
            storageInfo.keys.forEach(key => {
              if (key.startsWith(cachePrefix)) {
                wx.removeStorageSync(key);
              }
            });
            
            // 重新加载
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

  /**
   * 滚动到底部加载更多
   */
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.isLoadingMore && !this.data.loading && !this.data.showSearch) {
      console.log('📜 [滚动] 到达底部，加载更多');
      this.loadMoreLetters();
    }
  },

  /**
   * 滚动到底部（scroll-view备选方案）
   */
  onScrollToLower: function() {
    console.log('📜 [滚动] 检测到滚动到底部(scroll-view)');
    if (this.data.hasMore && !this.data.isLoadingMore && !this.data.loading && !this.data.showSearch) {
      this.loadMoreLetters();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    console.log('🔄 [刷新] 下拉刷新，清除缓存');
    
    // 清除所有笔记缓存
    const openid = this.data.openid;
    const cachePrefix = `letters_${openid}_`;
    const storageInfo = wx.getStorageInfoSync();
    storageInfo.keys.forEach(key => {
      if (key.startsWith(cachePrefix)) {
        wx.removeStorageSync(key);
      }
    });
    
    // 重新加载
    this.fetchLetters().then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: '刷新成功', icon: 'success' });
    }).catch(() => {
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
