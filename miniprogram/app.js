
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
      this.setTheme(savedTheme);
    }
  },

  setTheme: function (mode) {
    this.globalData.themeMode = mode;
    wx.setStorageSync('themeMode', mode);
    
    if (wx.setThemeStyle) {
      if (mode === 'system') {
        wx.setThemeStyle({
          style: 'auto'
        });
      } else if (mode === 'light') {
        wx.setThemeStyle({
          style: 'light'
        });
      } else if (mode === 'dark') {
        wx.setThemeStyle({
          style: 'dark'
        });
      }
    } else {
      console.warn('当前基础库不支持 wx.setThemeStyle，主题切换功能将不可用');
    }
  },

  getTheme: function () {
    return this.globalData.themeMode;
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

