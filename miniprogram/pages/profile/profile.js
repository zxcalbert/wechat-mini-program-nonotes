const app = getApp();
const ROUND_TABLE_FIX_STORAGE_KEY = 'roundtableOwnershipFixed_v1';
const ROUND_TABLE_FIX_IDS = [
  'dde8ef4869d88bba03a293ce59345060',
  'c25002a969da3da503d81df908307dd2',
  '69d4baf669da687403d8985006f45df1',
  'f6fcfb9c69da6d0703d86bd34f09d13d'
];

Page({
  data: {
    avatarUrl: '/images/avatar.png',
    nickname: '思考者',
    themeClass: '',
    loading: false,
    showRoundtableFixButton: false,
    fixRoundtableLoading: false
  },

  onLoad: function() {
    this.setData({ themeClass: app.getThemeClass() });
    this.loadUserProfile();
    this.loadFixState();
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  loadUserProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
      nickname: userInfo.nickName || userInfo.nickname || '思考者'
    });
  },

  loadFixState() {
    const fixed = wx.getStorageSync(ROUND_TABLE_FIX_STORAGE_KEY) === true;
    this.setData({
      showRoundtableFixButton: !fixed
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

  async repairRoundtableOwnership() {
    if (this.data.fixRoundtableLoading) return;

    this.setData({ fixRoundtableLoading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'repairRoundtableOwnership',
          roundtableIds: ROUND_TABLE_FIX_IDS
        }
      });

      const repairedIds = result?.result?.data?.repairedIds || [];
      wx.setStorageSync(ROUND_TABLE_FIX_STORAGE_KEY, true);
      this.setData({
        showRoundtableFixButton: false
      });

      wx.showModal({
        title: '修复完成',
        content: repairedIds.length > 0
          ? `已修复 ${repairedIds.length} 条圆桌会议记录归属，返回首页后会显示。`
          : '这 4 条记录已经具备归属信息，或当前无需修复。',
        showCancel: false
      });
    } catch (err) {
      console.error('修复圆桌归属失败:', err);
      wx.showToast({
        title: '修复失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ fixRoundtableLoading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
