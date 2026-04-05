const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const _ = wx.cloud.database().command;

const app = getApp();

Page({
  data: {
    letters: [],
    displayLetters: [],
    roundtables: [],
    displayRoundtables: [],
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
    isLoadingMore: false,
    
    // 浮动菜单
    showFloatMenu: false
  },

  onLoad: function() {
    console.log('🟢 [index] onLoad 开始');
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
    console.log('🟢 [index] 开始调用 checkAuth()');
    this.checkAuth();
    this.generateHeatmapData();
    this.updateThemeIcon();
    console.log('🟢 [index] onLoad 结束');
  },

  onShow: function() {
    console.log('👁️ [onShow] 页面显示');
    console.log('👁️ [onShow] 当前openid:', this.data.openid ? '存在' : '不存在');
    console.log('👁️ [onShow] 当前letters数量:', this.data.letters.length);
    console.log('👁️ [onShow] 当前displayLetters数量:', this.data.displayLetters.length);

    if (this.data.openid) {
      console.log('👁️ [onShow] 开始调用fetchLetters');
      this.fetchLetters();
      this.fetchUserStamps();
      this.fetchRoundtables();
    } else {
      console.log('👁️ [onShow] openid不存在，不调用fetchLetters');
    }
  },

  checkAuth: function() {
    console.log('🔐 [checkAuth] 开始检查');
    const openid = wx.getStorageSync('openid');
    const userInfo = wx.getStorageSync('userInfo');
    
    console.log('🔐 [checkAuth] openid:', !!openid ? '存在' : '不存在', 'userInfo:', !!userInfo ? '存在' : '不存在');
    
    if (!openid || !userInfo) {
      console.log('🔐 [checkAuth] 未登录，跳转到登录页');
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }
    
    console.log('🔐 [checkAuth] 已登录，openid:', openid.substring(0, 10) + '...');
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
   * 获取圆桌会议列表
   */
  async fetchRoundtables() {
    if (!this.data.openid) return;
    
    try {
      console.log('📥 [fetchRoundtables] 开始加载圆桌会议');
      const result = await cloudbaseUtil.query('roundtable_discussions', {
        where: { _openid: this.data.openid },
        orderBy: 'createTime',
        orderDirection: 'desc',
        limit: 50
      });

      if (result.success) {
        const roundtables = this.formatRoundtables(result.data);
        this.setData({ 
          roundtables,
          displayRoundtables: roundtables
        });
        console.log('✅ [fetchRoundtables] 加载完成:', roundtables.length, '条');
      }
    } catch (err) {
      console.error('获取圆桌会议失败:', err);
    }
  },

  /**
   * 格式化圆桌会议数据
   */
  formatRoundtables(data) {
    return data.map(item => ({
      ...item,
      displayDate: cloudbaseUtil.formatDate(item.createTime),
      type: 'roundtable',
      tagText: '圆桌会议',
      tagClass: 'tag-green',
      content: item.content || '圆桌讨论'
    }));
  },

  /**
   * 分页加载笔记
   * 先读缓存，再后台更新
   */
  async fetchLetters() {
    if (this.data.isLoadingMore) return;

    console.log('📥 [fetchLetters] 开始加载');
    console.log('📥 [fetchLetters] 当前openid:', this.data.openid ? this.data.openid.substring(0, 10) + '...' : 'null');

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

      console.log('📥 [fetchLetters] cacheKey:', cacheKey);
      console.log('📥 [fetchLetters] 缓存状态:', cache ? '存在' : '不存在');

      // 有有效缓存，先展示缓存
      if (cache && cache.timestamp + cache.expire * 1000 > Date.now()) {
        console.log('🔄 [缓存] 使用缓存数据，第一页');
        console.log('🔄 [缓存] 缓存原始数据量:', cache.data.length, '条');
        console.log('🔄 [缓存] 缓存时间:', new Date(cache.timestamp).toLocaleString());
        console.log('🔄 [缓存] 过期时间:', cache.expire, '秒');
        const letters = this.formatLetters(cache.data);
        console.log('🔄 [缓存] 格式化后显示:', letters.length, '条');
        this.setData({ letters, displayLetters: letters });

        // 后台更新数据，不阻塞UI
        this.fetchPageFromServer(1, true).catch(err => {
          console.warn('🔄 [缓存] 后台更新失败:', err);
        });
      } else {
        // 无缓存，直接请求
        console.log('🌐 [网络] 无有效缓存，直接请求服务器');
        if (cache) {
          console.log('⚠️ [网络] 缓存已过期或无效');
          console.log('⚠️ [网络] 缓存时间:', new Date(cache.timestamp).toLocaleString());
          console.log('⚠️ [网络] 当前时间:', new Date().toLocaleString());
          console.log('⚠️ [网络] 剩余时间:', ((cache.timestamp + cache.expire * 1000 - Date.now()) / 1000).toFixed(0), '秒');
        }
        await this.fetchPageFromServer(1, false);
      }

      console.log('📥 [fetchLetters] 加载完成，最终显示:', this.data.displayLetters.length, '条');
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

    console.log(`📡 [分页] ===== 开始请求第${page}页 =====`);
    console.log(`📡 [分页] openid:`, openid ? openid.substring(0, 10) + '...' : 'null');
    console.log(`📡 [分页] skip=${skip}, limit=${limit}`);
    console.log(`📡 [分页] backgroundUpdate=${backgroundUpdate}`);

    console.log(`📡 [分页] 发送数据库查询...`);
    const startTime = Date.now();

    const pageResult = await cloudbaseUtil.query('letters', {
      where: {
        _openid: openid,
        deleted: _.neq(true)
      },
      orderBy: 'createTime',
      orderDirection: 'desc',
      skip: skip,
      limit: limit
    });

    const queryTime = Date.now() - startTime;
    console.log(`📡 [分页] 数据库查询耗时: ${queryTime}ms`);

    if (pageResult.success) {
      console.log(`📡 [分页] 查询成功！原始返回数据量: ${pageResult.data.length} 条`);
      console.log(`📡 [分页] 调用 formatLetters 格式化...`);

      const newLetters = this.formatLetters(pageResult.data);

      console.log(`📡 [分页] 格式化后数据量: ${newLetters.length} 条`);

      const cacheKey = `letters_${openid}_${page}`;

      // 更新缓存
      wx.setStorageSync(cacheKey, {
        data: pageResult.data,
        timestamp: Date.now(),
        expire: 3600 // 1小时过期
      });

      console.log(`📡 [分页] 缓存已保存, key=${cacheKey}`);
      
      // 后台更新时，只更新第一页数据
      if (backgroundUpdate && page === 1) {
        const oldLetters = this.data.letters;
        // 只有数据有变化时才更新页面
        if (JSON.stringify(oldLetters) !== JSON.stringify(newLetters)) {
          console.log('🔄 [缓存] 数据有更新，刷新页面');
          console.log('🔄 [缓存] 更新前:', oldLetters.length, '条 → 更新后:', newLetters.length, '条');
          const isLastPage = newLetters.length < this.data.pageSize;
          this.setData({
            letters: newLetters,
            displayLetters: newLetters,
            hasMore: !isLastPage
          });
          console.log('✅ [setData] 后台更新完成，displayLetters:', this.data.displayLetters.length, '条');
        } else {
          console.log('🔄 [缓存] 数据无变化，不更新');
        }
      } else {
        // 前台加载，拼接数据
        const allLetters = page === 1 ? newLetters : [...this.data.letters, ...newLetters];
        const isLastPage = newLetters.length < this.data.pageSize;

        console.log(`📡 [分页] ===== 设置第${page}页数据到页面 =====`);
        console.log(`📡 [分页] 当前已有: ${this.data.letters.length} 条，新增: ${newLetters.length} 条，总计: ${allLetters.length} 条`);

        this.setData({
          letters: allLetters,
          displayLetters: allLetters,
          currentPage: page,
          hasMore: !isLastPage
        });

        console.log(`✅ [setData] 第${page}页数据已设置，displayLetters: ${this.data.displayLetters.length} 条, hasMore: ${this.data.hasMore}`);

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
    console.log('📋 [formatLetters] 原始数据:', data.length, '条');
    data.forEach((item, idx) => {
      console.log(`  笔记${idx+1}: deleted = ${item.deleted}, type = ${typeof item.deleted}`);
    });
    
    const filtered = data.filter(item => item.deleted !== true);
    console.log('📋 [formatLetters] 过滤后:', filtered.length, '条');
    
    return filtered.map(item => ({
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

  // 显示/隐藏浮动菜单
  toggleFloatMenu: function() {
    this.setData({
      showFloatMenu: !this.data.showFloatMenu
    });
  },

  // 隐藏浮动菜单
  hideFloatMenu: function() {
    this.setData({ showFloatMenu: false });
  },

  // 跳转到写信页面
  goToWriteLetter: function() {
    this.hideFloatMenu();
    wx.navigateTo({
      url: '../write/write'
    });
  },

  // 跳转到圆桌会议页面
  goToRoundtable: function() {
    this.hideFloatMenu();
    wx.navigateTo({
      url: '../roundtable/roundtable'
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
