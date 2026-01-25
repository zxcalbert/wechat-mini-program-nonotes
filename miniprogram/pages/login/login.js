const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    loading: false
  },

  onLoad: function() {
    this.checkLoginStatus();
  },

  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    // 关键：检查是否是刚完成登录动作
    const isFirstLogin = wx.getStorageSync('isFirstLogin');
    
    if (userInfo && openid) {
      this.setData({ userInfo, hasUserInfo: true });
      
      // 如果不是刚登录完（即：老用户重新打开页面），则直接自动跳转
      if (!isFirstLogin) {
        console.log('检测到老用户回访，自动跳转首页');
        this.goToIndex();
      } else {
        console.log('检测到新登录，留在当前页等待用户点击');
      }
    }
  },

  /**
   * 登录处理
   */
  async handleLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const profileRes = await wx.getUserProfile({
        desc: '展示个人头像昵称', 
      });

      const userInfo = profileRes.userInfo;
      const { result } = await wx.cloud.callFunction({ name: 'login' });
      let openid = (result.code === 0 && result.data) ? result.data.openid : result.openid;
      
      if (!openid) throw new Error('未能获取到用户唯一标识');

      // 存储信息
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('openid', openid);
      // 关键：标记当前为“刚登录”，防止 onLoad 自动跳转
      wx.setStorageSync('isFirstLogin', true);

      await this.syncUserToDatabase(openid, userInfo);

      this.setData({ 
        userInfo,
        hasUserInfo: true,
        loading: false 
      });

      wx.showToast({ title: '登录成功', icon: 'success' });

    } catch (err) {
      this.setData({ loading: false });
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  /**
   * 手动点击"开始使用"按钮触发
   */
  goToIndex: function() {
    // 跳转前清除首次登录标记，确保下次打开小程序时能自动跳转
    wx.removeStorageSync('isFirstLogin');

    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        console.log('跳转至首页成功');
      },
      fail: (err) => {
        console.error('跳转失败，请确保 index 在 app.json 的 tabBar 中:', err);
      }
    });
  },

  async syncUserToDatabase(openid, userInfo) {
    try {
      const userResult = await cloudbaseUtil.query('users', {
        where: { _openid: openid }
      });
      if (userResult.success && userResult.data.length === 0) {
        await cloudbaseUtil.add('users', { ...userInfo, lastLoginTime: new Date() });
      } else if (userResult.success && userResult.data.length > 0) {
        await cloudbaseUtil.update('users', userResult.data[0]._id, { ...userInfo, lastLoginTime: new Date() });
      }
    } catch (dbErr) {
      console.warn('数据库同步忽略:', dbErr);
    }
  },

  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后将无法查看个人记录',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({ userInfo: null, hasUserInfo: false });
        }
      }
    });
  }
});