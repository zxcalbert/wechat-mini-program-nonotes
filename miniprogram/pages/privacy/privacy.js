const app = getApp();

Page({
  data: {
    themeClass: ''
  },

  onLoad: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  handleAgree: function() {
    wx.setStorageSync('privacyAgreed', true);
    wx.navigateBack();
  },

  handleDisagree: function() {
    wx.showModal({
      title: '提示',
      content: '您需要同意隐私政策才能使用本小程序',
      showCancel: false,
      confirmText: '返回',
      success: () => {
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }
    });
  }
});
