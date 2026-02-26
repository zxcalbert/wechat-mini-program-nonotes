
App({
  globalData: {
    themeMode: 'system'
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true
      });

      console.log('✅ 云开发已初始化');
      console.log('📌 AI 回复使用 DeepSeek API');
      console.log('📌 云函数: replyToLetter');
      console.log('📌 环境变量: DEEPSEEK_API_KEY');
    }

    this.initTheme();
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
  }
});

