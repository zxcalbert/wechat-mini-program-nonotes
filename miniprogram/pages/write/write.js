const db = wx.cloud.database();
const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const sensitiveWordUtil = require('../../utils/sensitiveWordUtil');

Page({
  data: {
    mentors: ['查理·芒格', '巴菲特', '段永平', '张小龙', '乔布斯', '马斯克'],
    mentorIndex: 0,
    moodOptions: ['焦虑', '贪婪', '平和', '困惑'],
    selectedMood: '平和',
    content: '',
    wordCount: 0,
    currentDate: '',
    openid: null,
    needReply: false,
    userStamps: 3,
    canSend: false,
    statusBarHeight: 0,
    hasSensitiveWarning: false,
    sensitiveWarning: ''
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight });
    this.checkAuth();
    
    const date = new Date();
    this.setData({
      currentDate: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    });
  },

  onUnload() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  },

  checkAuth: function() {
    const openid = wx.getStorageSync('openid');

    if (!openid) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }

    this.setData({ openid });
    this.fetchUserStamps();
  },

  async checkDailyLimit() {
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const result = await cloudbaseUtil.query('letters', {
        where: {
          _openid: this.data.openid,
          needReply: true,
          createTime: _.gte(startOfDay).and(_.lt(endOfDay))
        }
      });

      const totalSent = result.success ? result.data.length : 0;
      const remaining = Math.max(0, 2 - totalSent);

      return {
        canSend: remaining > 0,
        remaining: remaining,
        total: totalSent
      };
    } catch (err) {
      console.error('检查每日限制失败:', err);
      return { canSend: true, remaining: 2, total: 0 };
    }
  },

  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const userStamps = result.data[0].stamps;
        const stamps = userStamps !== undefined ? userStamps : 3;
        this.setData({ userStamps: stamps });
      } else {
        this.setData({ userStamps: 3 });
      }
    } catch (err) {
      console.error('获取邮票失败:', err);
      this.setData({ userStamps: 3 });
    }
  },

  onMentorChange(e) {
    this.setData({ mentorIndex: e.detail.value });
  },

  selectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    if (mood) {
      this.setData({ selectedMood: mood });
    }
  },

  onInput(e) {
    const wordCount = e.detail.value.length;
    this.setData({
      content: e.detail.value,
      wordCount: wordCount,
      canSend: wordCount >= 100
    });

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.checkSensitiveWords(e.detail.value);
    }, 500);
  },

  checkSensitiveWords(text) {
    const result = sensitiveWordUtil.detect(text);

    if (result.hasSensitive) {
      if (result.isHighSensitive) {
        this.setData({
          hasSensitiveWarning: true,
          sensitiveWarning: '您的内容包含敏感词，请修改后再提交。',
          canSend: false
        });
      } else if (result.isInvestment) {
        this.setData({
          hasSensitiveWarning: true,
          sensitiveWarning: '注意：您的内容包含投资相关词汇，AI回复不会提供具体投资建议。'
        });
      }
    } else {
      this.setData({
        hasSensitiveWarning: false,
        sensitiveWarning: '',
        canSend: this.data.wordCount >= 100
      });
    }
  },

  async selectNeedReply(e) {
    const need = e.currentTarget.dataset.need;

    if (need) {
      const limit = await this.checkDailyLimit();
      if (!limit.canSend) {
        wx.showModal({
          title: '每日寄信次数已用完',
          content: '今天已寄信2次，大师需要时间深思熟虑，明天再来吧',
          showCancel: false
        });
        return;
      }
      if (limit.remaining > 1) {
        wx.showToast({
          title: `今天还可以寄信${limit.remaining}次`,
          icon: 'none',
          duration: 2000
        });
      }
    }

    this.setData({ needReply: need });
  },

  buyStamps() {
    wx.navigateTo({
      url: '/pages/stamps/stamps'
    });
  },

  async submitLetter() {
    if (this.data.wordCount < 100) {
      wx.showModal({
        title: '思考还不够深',
        content: '再多写一点吧，至少100个字',
        showCancel: false
      });
      return;
    }

    if (this.data.needReply && this.data.userStamps === 0) {
      wx.showModal({
        title: '邮票不足',
        content: '需要购买邮票才能请求大师回信',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/stamps/stamps'
            });
          }
        }
      });
      return;
    }

    if (this.data.needReply) {
      const limit = await this.checkDailyLimit();
      if (!limit.canSend) {
        wx.showModal({
          title: '每日寄信次数已用完',
          content: '今天已寄信2次，大师需要时间深思熟虑，明天再来吧',
          showCancel: false
        });
        return;
      }
    }

    const mentor = this.data.mentors[this.data.mentorIndex];
    const mood = this.data.selectedMood;
    const content = this.data.content;
    const needReply = this.data.needReply;

    wx.showLoading({ title: '寄出中...', mask: true });

    try {
      const addRes = await db.collection('letters').add({
        data: {
          mentor: mentor,
          mood: mood,
          content: content,
          status: needReply ? 'pending' : 'saved',
          needReply: needReply,
          createTime: db.serverDate(),
          replyExpectTime: needReply ? new Date(Date.now() + 18 * 60 * 60 * 1000).getTime() : null
        }
      });

      const letterId = addRes._id;
      console.log('笔记已保存，ID:', letterId);

      if (needReply) {
        wx.showLoading({ title: '正在传送信件......', mask: true });

        const updateUserRes = await cloudbaseUtil.query('users', {
          where: { _openid: this.data.openid },
          limit: 1
        });

        let userDoc = updateUserRes.data[0];
        if (!userDoc) {
          await db.collection('users').add({
            data: {
              stamps: 2,
              totalLetters: 1,
              createdAt: db.serverDate()
            }
          });
        } else {
          await cloudbaseUtil.update('users', userDoc._id, {
            stamps: Math.max(0, (userDoc.stamps !== undefined ? userDoc.stamps : 3) - 1)
          });
        }

        const cloudReplyRes = await wx.cloud.callFunction({
          name: 'replyToLetter',
          data: {
            letterId: letterId,
            mentor: mentor,
            mood: mood,
            content: content
          }
        });

        console.log('云函数响应:', cloudReplyRes);

        if (cloudReplyRes.result && cloudReplyRes.result.success) {
          wx.hideLoading();
          wx.showToast({
            title: '笔记已寄出',
            icon: 'success',
            duration: 3000
          });
          
          this.setData({ userStamps: Math.max(0, this.data.userStamps - 1) });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 3000);
        } else {
          throw new Error(cloudReplyRes.result?.error || '云函数调用失败');
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '笔记已保存',
          icon: 'success',
          duration: 2000
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } catch (err) {
      console.error('提交失败:', err);
      wx.hideLoading();
      wx.showModal({
        title: '提交失败',
        content: err.message || '请稍后重试',
        showCancel: false
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
