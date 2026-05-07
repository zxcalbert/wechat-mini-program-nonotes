const app = getApp();

Page({
  data: {
    themeClass: '',
    fontClass: '',
    type: 'privacy',
    title: '隐私政策'
  },

  onLoad(options) {
    const type = options.type || 'privacy';
    const title = type === 'privacy' ? '隐私政策' : '用户协议';
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass(),
      type,
      title
    });
    wx.setNavigationBarTitle({ title });
  },

  onShow() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  }
});
