const app = getApp();

Page({
  data: {
    avatarUrl: '/images/avatar.png',
    nickname: '投资爱好者',
    themeClass: '',
    loading: false
  },

  onLoad: function() {
    this.setData({ themeClass: app.getThemeClass() });
    this.loadUserProfile();
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  loadUserProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
      nickname: userInfo.nickName || userInfo.nickname || '投资爱好者'
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
  },

  onNicknameInput(e) {
    let nickname = e.detail.value.trim();
    if (nickname.length > 20) {
      nickname = nickname.substring(0, 20);
    }
    this.setData({ nickname });
  },

  async saveProfile() {
    if (!this.data.nickname || this.data.nickname.trim() === '') {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const userInfo = {
        nickName: this.data.nickname,
        nickname: this.data.nickname,
        avatarUrl: this.data.avatarUrl,
        gender: 0,
        city: '',
        province: '',
        country: ''
      };

      const oldUserInfo = wx.getStorageSync('userInfo') || {};
      if (oldUserInfo.stamps !== undefined) {
        userInfo.stamps = oldUserInfo.stamps;
      }
      if (oldUserInfo.totalLetters !== undefined) {
        userInfo.totalLetters = oldUserInfo.totalLetters;
      }

      wx.setStorageSync('userInfo', userInfo);

      const openid = wx.getStorageSync('openid');
      if (openid) {
        await this.syncUserToDatabase(openid, userInfo);
      }

      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      this.setData({ loading: false });
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async syncUserToDatabase(openid, userInfo) {
    try {
      const cloudbaseUtil = require('../../utils/cloudbaseUtil');
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

  goBack() {
    wx.navigateBack();
  }
});
