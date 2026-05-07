const app = getApp();

Page({
  data: {
    themeClass: '',
    fontClass: ''
  },

  onLoad() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  onShow() {
    this.setData({
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass()
    });
  },

  viewPrivacy() {
    wx.navigateTo({
      url: '/pages/legal/legal?type=privacy'
    });
  },

  viewAgreement() {
    wx.navigateTo({
      url: '/pages/legal/legal?type=agreement'
    });
  }
});
