const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const app = getApp();

Page({
  data: {
    avatarUrl: '/images/avatar.png',
    nickname: '思考者',
    hasUserInfo: false,
    loading: false,
    themeClass: '',
    canLogin: true
  },

  onLoad: function() {
    this.setData({ themeClass: app.getThemeClass() });
    this.checkLoginStatus();
    this.checkCanLogin();
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    const isFirstLogin = wx.getStorageSync('isFirstLogin');
    
    if (userInfo && openid) {
      this.setData({ 
        hasUserInfo: true,
        avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
        nickname: userInfo.nickName || userInfo.nickname || '思考者'
      });
      
      if (!isFirstLogin) {
        console.log('检测到老用户回访，自动跳转首页');
        this.goToIndex();
      } else {
        console.log('检测到新登录，留在当前页等待用户点击');
      }
    }
  },

  checkCanLogin() {
    const canLogin = true;
    this.setData({ canLogin });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
    this.checkCanLogin();
  },

  onNicknameInput(e) {
    let nickname = e.detail.value.trim();
    if (nickname.length > 20) {
      nickname = nickname.substring(0, 20);
    }
    this.setData({ nickname });
    this.checkCanLogin();
  },

  async handleLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' });
      let openid = (result.code === 0 && result.data) ? result.data.openid : result.openid;
      
      if (!openid) throw new Error('未能获取到用户唯一标识');

      const userInfo = {
        nickName: this.data.nickname,
        nickname: this.data.nickname,
        avatarUrl: this.data.avatarUrl,
        gender: 0,
        city: '',
        province: '',
        country: ''
      };

      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('isFirstLogin', true);

      await this.syncUserToDatabase(openid, userInfo);

      this.setData({ 
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

  goToIndex: function() {
    wx.removeStorageSync('isFirstLogin');
    wx.reLaunch({
      url: '/pages/index/index',
      success: () => {
        console.log('跳转至首页成功');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
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
          this.setData({ 
            avatarUrl: '/images/avatar.png',
            nickname: '思考者',
            hasUserInfo: false,
            canLogin: true
          });
        }
      }
    });
  }
});
