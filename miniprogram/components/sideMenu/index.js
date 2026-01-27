Component({
  properties: {
    showMenu: {
      type: Boolean,
      value: false
    },
    userStamps: {
      type: Number,
      value: 3
    },
    heatmapData: {
      type: Array,
      value: []
    }
  },

  methods: {
    closeSideMenu() {
      this.triggerEvent('close');
    },

    viewTrash() {
      wx.navigateTo({
        url: '/pages/trash/trash'
      });
      this.closeSideMenu();
    },

    openFontSettings() {
      wx.showModal({
        title: '字体设置',
        content: '功能开发中，敬请期待',
        showCancel: false
      });
    },

    viewStamps() {
      wx.navigateTo({
        url: '/pages/stamps/stamps'
      });
      this.closeSideMenu();
    },

    buyStamps() {
      wx.navigateTo({
        url: '/pages/stamps/stamps'
      });
      this.closeSideMenu();
    },

    viewAbout() {
      wx.navigateTo({
        url: '/pages/about/about'
      });
      this.closeSideMenu();
    },

    logout() {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            wx.removeStorageSync('openid');
            wx.removeStorageSync('userInfo');
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        }
      });
    }
  }
});
