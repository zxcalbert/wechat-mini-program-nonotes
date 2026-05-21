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

    viewRoundtable() {
      wx.navigateTo({
        url: '/pages/roundtable/roundtable'
      });
      this.closeSideMenu();
    },

    viewProfile() {
      wx.navigateTo({
        url: '/pages/profile/profile'
      });
      this.closeSideMenu();
    },

    toggleTheme() {
      const app = getApp();
      app.toggleTheme();
      
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
      
      this.triggerEvent('themeChanged');
    },

    viewTrash() {
      wx.navigateTo({
        url: '/pages/trash/trash'
      });
      this.closeSideMenu();
    },

    openFontSettings() {
      const currentSize = wx.getStorageSync('fontSize') || 'medium';
      const items = [
        '小号字体',
        '中号字体（默认）',
        '大号字体'
      ];

      wx.showActionSheet({
        itemList: items,
        success: (res) => {
          const sizes = ['small', 'medium', 'large'];
          const selected = sizes[res.tapIndex];
          wx.setStorageSync('fontSize', selected);

          const sizeLabels = { small: '小号', medium: '中号', large: '大号' };
          wx.showToast({
            title: '已切换为' + sizeLabels[selected],
            icon: 'success'
          });

          // 通知父页面刷新
          this.triggerEvent('fontSizeChanged', { fontSize: selected });
        }
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

    // 合规要求第十九条：便捷退出AI服务
    quickExit() {
      this.triggerEvent('close');
      wx.reLaunch({
        url: '/pages/index/index'
      });
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
