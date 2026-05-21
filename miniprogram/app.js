
App({
  globalData: {
    themeMode: 'system',
    sessionStartTime: null,
    fontSize: 'medium'
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true
      });

      console.log('✅ 云开发已初始化');
    }

    this.initTheme();
    this.globalData.fontSize = wx.getStorageSync('fontSize') || 'medium';
    this.startUsageTimer();
  },

  onShow: function () {
    this.checkUsageTime();
  },

  initTheme: function () {
    const savedTheme = wx.getStorageSync('themeMode');
    if (savedTheme) {
      this.globalData.themeMode = savedTheme;
    }
  },

  setTheme: function (mode) {
    this.globalData.themeMode = mode;
    wx.setStorageSync('themeMode', mode);
  },

  getTheme: function () {
    return this.globalData.themeMode;
  },

  getFontSize: function () {
    return wx.getStorageSync('fontSize') || 'medium';
  },

  getFontSizeClass: function () {
    var size = this.getFontSize();
    if (size === 'small') return 'font-small';
    if (size === 'large') return 'font-large';
    return '';
  },

  getThemeClass: function () {
    const mode = this.globalData.themeMode;
    if (mode === 'light') {
      return 'theme-light';
    } else if (mode === 'dark') {
      return 'theme-dark';
    }
    return '';
  },

  toggleTheme: function () {
    const current = this.globalData.themeMode;
    let next;
    
    if (current === 'system') {
      next = 'light';
    } else if (current === 'light') {
      next = 'dark';
    } else {
      next = 'system';
    }
    
    this.setTheme(next);
    return next;
  },

  startUsageTimer() {
    const existingStart = wx.getStorageSync('sessionStartTime');
    if (!existingStart) {
      const now = Date.now();
      wx.setStorageSync('sessionStartTime', now);
      this.globalData.sessionStartTime = now;
    } else {
      this.globalData.sessionStartTime = existingStart;
    }
  },

  checkUsageTime() {
    const startTime = wx.getStorageSync('sessionStartTime');
    if (!startTime) {
      this.startUsageTimer();
      return;
    }

    const elapsed = Date.now() - startTime;
    const TWO_HOURS = 7200000;

    if (elapsed >= TWO_HOURS) {
      wx.showModal({
        title: '使用提醒',
        content: '您已连续使用2小时，建议适当休息',
        showCancel: false,
        confirmText: '知道了'
      });
      wx.setStorageSync('sessionStartTime', Date.now());
      this.globalData.sessionStartTime = Date.now();
    }
  }
});
