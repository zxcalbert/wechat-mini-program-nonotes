const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const _ = wx.cloud.database().command;
const RECENT_ROUNDTABLE_IDS_KEY = 'recentRoundtableIds';

const app = getApp();

Page({
  data: {
    letters: [],
    displayLetters: [],
    roundtables: [],
    displayRoundtables: [],
    incubators: [],
    structureAnalyses: [],
    displayItems: [], // 合并后显示的列表
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
    const systemInfo = wx.getSystemInfoSync();
    
    let menuButtonRight = 0;
    let navbarPaddingRight = 16;
    
    try {
      const menuButton = wx.getMenuButtonBoundingClientRect();
      if (menuButton && menuButton.right) {
        const screenWidth = systemInfo.screenWidth;
        menuButtonRight = screenWidth - menuButton.right;
        navbarPaddingRight = menuButton.width + menuButtonRight + 8;
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
      this.refreshHomeData();
    }
  },

  async refreshHomeData() {
    await this.repairRecentRoundtables();
    this.fetchLetters();
    this.fetchUserStamps();
    this.fetchRoundtables();
    this.fetchIncubators();
    this.fetchStructureAnalyses();
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

  async repairRecentRoundtables() {
    const roundtableIds = wx.getStorageSync(RECENT_ROUNDTABLE_IDS_KEY) || [];
    if (!Array.isArray(roundtableIds) || roundtableIds.length === 0) return;

    try {
      await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'repairRoundtableOwnership',
          roundtableIds
        }
      });
    } catch (err) {
      console.error('修复圆桌归属失败:', err);
    }
  },

  /**
   * 获取圆桌会议列表
   */
  async fetchRoundtables() {
    if (!this.data.openid) return;
    
    try {
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
        this.refreshDisplayItems();
      }
    } catch (err) {
      // 静默失败
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
   * 获取思想孵化器报告列表
   */
  async fetchIncubators() {
    if (!this.data.openid) return;
    
    try {
      const result = await cloudbaseUtil.query('incubator_reports', {
        where: { _openid: this.data.openid },
        orderBy: 'createTime',
        orderDirection: 'desc',
        limit: 50
      });

      if (result.success) {
        const incubators = this.formatIncubators(result.data);
        this.setData({ incubators });
        this.refreshDisplayItems();
      }
    } catch (err) {
      console.error('获取思想孵化器报告失败:', err);
    }
  },

  /**
   * 格式化思想孵化器数据
   */
  formatIncubators(data) {
    return data.map(item => ({
      ...item,
      displayDate: cloudbaseUtil.formatDate(item.createTime),
      type: 'incubator',
      tagText: '思想孵化器',
      tagClass: 'tag-orange',
      content: item.content || '思想孵化'
    }));
  },

  /**
   * 获取结构分析报告列表
   */
  async fetchStructureAnalyses() {
    if (!this.data.openid) return;
    
    try {
      const result = await cloudbaseUtil.query('structure_analysis_reports', {
        where: { _openid: this.data.openid },
        orderBy: 'createTime',
        orderDirection: 'desc',
        limit: 50
      });

      if (result.success) {
        const structureAnalyses = this.formatStructureAnalyses(result.data);
        this.setData({ structureAnalyses });
        this.refreshDisplayItems();
      }
    } catch (err) {
      console.error('获取结构分析报告失败:', err);
    }
  },

  /**
   * 格式化结构分析数据
   */
  formatStructureAnalyses(data) {
    return data.map(item => ({
      ...item,
      displayDate: cloudbaseUtil.formatDate(item.createTime),
      type: 'structure_analysis',
      tagText: item.analysisType === 'product' ? '产品分析' : '公司分析',
      tagClass: 'tag-purple',
      content: item.content || '结构分析'
    }));
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
        const letters = this.formatLetters(cache.data);
        this.setData({ letters, displayLetters: letters });
        this.refreshDisplayItems();

        // 后台更新数据，不阻塞UI
        this.fetchPageFromServer(1, true).catch(err => {
          console.warn('🔄 [缓存] 后台更新失败:', err);
        });
      } else {
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
      return;
    }
    
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

    if (pageResult.success) {
      const newLetters = this.formatLetters(pageResult.data);
      const cacheKey = `letters_${openid}_${page}`;

      wx.setStorageSync(cacheKey, {
        data: pageResult.data,
        timestamp: Date.now(),
        expire: 3600
      });
      
      if (backgroundUpdate && page === 1) {
        const oldLetters = this.data.letters;
        if (JSON.stringify(oldLetters) !== JSON.stringify(newLetters)) {
          const isLastPage = newLetters.length < this.data.pageSize;
          this.setData({
            letters: newLetters,
            displayLetters: newLetters,
            hasMore: !isLastPage
          });
          this.refreshDisplayItems();
        }
      } else {
        const allLetters = page === 1 ? newLetters : [...this.data.letters, ...newLetters];
        const isLastPage = newLetters.length < this.data.pageSize;

        this.setData({
          letters: allLetters,
          displayLetters: allLetters,
          currentPage: page,
          hasMore: !isLastPage
        });
        this.refreshDisplayItems();

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
    const filtered = data.filter(item => item.deleted !== true);
    
    return filtered.map(item => ({
      ...item,
      displayDate: cloudbaseUtil.formatDate(item.createTime),
      statusLabel: this.getStatusLabel(item.status),
      type: 'letter',
      tagText: '导师回信',
      tagClass: 'tag-blue'
    }));
  },

  /**
   * 合并letters和roundtables并按时间降序排序
   */
  mergeAndSortItems() {
    const allItems = [
      ...this.data.letters,
      ...this.data.roundtables,
      ...this.data.incubators,
      ...this.data.structureAnalyses
    ];
    
    // 按createTime降序排序，最新的在前
    return allItems.sort((a, b) => b.createTime - a.createTime);
  },

  /**
   * 刷新合并后的显示列表
   */
  refreshDisplayItems() {
    const mergedItems = this.mergeAndSortItems();
    
    if (this.data.showSearch && this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      const filtered = mergedItems.filter(item => 
        item.content && item.content.toLowerCase().includes(keyword)
      );
      this.setData({ displayItems: filtered });
    } else {
      this.setData({ displayItems: mergedItems });
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
    const id = event.currentTarget.dataset.id;
    const type = event.currentTarget.dataset.type;
    
    if (type === 'roundtable') {
      // 圆桌会议跳转到结果页
      wx.navigateTo({
        url: `../roundtableResult/roundtableResult?id=${id}`
      });
    } else if (type === 'incubator') {
      // 思想孵化器跳转到结果页
      wx.navigateTo({
        url: `../incubatorResult/incubatorResult?id=${id}`
      });
    } else if (type === 'structure_analysis') {
      // 结构分析跳转到结果页
      wx.navigateTo({
        url: `../structureAnalysisResult/structureAnalysisResult?id=${id}`
      });
    } else {
      // 导师回信跳转到详情页
      wx.navigateTo({
        url: `../detail/detail?id=${id}`
      });
    }
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
      this.loadMoreLetters();
    }
  },

  onScrollToLower: function() {
    if (this.data.hasMore && !this.data.isLoadingMore && !this.data.loading && !this.data.showSearch) {
      this.loadMoreLetters();
    }
  },

  onPullDownRefresh: function() {
    const openid = this.data.openid;
    const cachePrefix = `letters_${openid}_`;
    const storageInfo = wx.getStorageInfoSync();
    storageInfo.keys.forEach(key => {
      if (key.startsWith(cachePrefix)) {
        wx.removeStorageSync(key);
      }
    });
    
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

  // 跳转到思想孵化器页面
  goToIncubator: function() {
    this.hideFloatMenu();
    wx.navigateTo({
      url: '../incubator/incubator'
    });
  },

  // 跳转到结构分析页面
  goToStructureAnalysis: function() {
    this.hideFloatMenu();
    wx.navigateTo({
      url: '../structureAnalysis/structureAnalysis'
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
    // 同时过滤两种类型的数据
    const mergedItems = this.mergeAndSortItems();
    const filtered = mergedItems.filter(item => {
      return item.content && item.content.toLowerCase().includes(keyword.toLowerCase());
    });
    this.setData({ 
      displayLetters: filtered.filter(item => item.type === 'letter'),
      displayItems: filtered 
    });
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
