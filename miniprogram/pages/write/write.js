const db = wx.cloud.database();
const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    mentors: ['查理·芒格', '巴菲特', '段永平'],
    mentorIndex: 0,
    moodOptions: ['焦虑', '贪婪', '平和', '困惑'],
    selectedMood: '平和',
    content: '',
    wordCount: 0,
    currentDate: '',
    openid: null,
    needReply: false,
    userStamps: 3,
    canSend: false
  },

  onLoad() {
    this.checkAuth();
    
    // 设置今天的日期
    const date = new Date();
    this.setData({
      currentDate: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    });
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 检查登录状态
   */
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

  /**
   * 检查今天需要大师回复的信件数量（限制2次/天）
   * @returns {Promise<{canSend: boolean, remaining: number, total: number}>}
   */
  async checkDailyLimit() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const result = await cloudbaseUtil.query('letters', {
        where: {
          _openid: this.data.openid,
          needReply: true,
          createTime: {
            $gte: startOfDay.getTime(),
            $lt: endOfDay.getTime()
          }
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

  /**
   * 获取用户邮票数
   */
  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const stamps = result.data[0].stamps || 3;
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
  },

  /**
   * 选择是否需要大师回信
   */
  async selectNeedReply(e) {
    const need = e.currentTarget.dataset.need;

    // 如果需要回信但没有邮票，提示
    if (need && this.data.userStamps === 0) {
      wx.showToast({
        title: '邮票不足，请购买',
        icon: 'none'
      });
      return;
    }

    // 如果需要回信，检查每日限制
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
      // 显示剩余次数提示
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

  /**
   * 购买邮票
   */
  buyStamps() {
    wx.navigateTo({
      url: '/pages/stamps/stamps'
    });
  },

  /**
   * 提交笔记
   */
  async submitLetter() {
    if (this.data.wordCount < 100) {
      wx.showModal({
        title: '思考还不够深',
        content: '再多写一点吧，至少100个字',
        showCancel: false
      });
      return;
    }

    // 检查是否需要回信且有邮票
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

    // 如果需要回信，检查每日限制
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
      // 1. 保存笔记到数据库
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

      // 2. 如果需要回信，扣除邮票并调用云函数生成回复
      if (needReply) {
        wx.showLoading({ title: '正在传送信件......', mask: true });

        // 扣除邮票
        const updateUserRes = await cloudbaseUtil.query('users', {
          where: { _openid: this.data.openid },
          limit: 1
        });

        let userDoc = updateUserRes.data[0];
        if (!userDoc) {
          // 创建用户记录
          await db.collection('users').add({
            data: {
              stamps: 2, // 3张免费邮票用掉1张
              totalLetters: 1,
              createdAt: db.serverDate()
            }
          });
        } else {
          // 更新邮票数
          await cloudbaseUtil.update('users', userDoc._id, {
            stamps: Math.max(0, (userDoc.stamps || 3) - 1)
          });
        }

        // 调用云函数生成回复
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
            title: '笔记已寄出，大师将在18小时内回复',
            icon: 'success',
            duration: 3000
          });
          
          // 更新邮票显示
          this.setData({ userStamps: Math.max(0, this.data.userStamps - 1) });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 3000);
        } else {
          throw new Error(cloudReplyRes.result?.error || '云函数调用失败');
        }
      } else {
        // 无需回信，直接返回
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
      wx.hideLoading();
      console.error('提交失败：', err);

      let errorMsg = '邮路受阻，请重试';
      if (err.message) {
        errorMsg = err.message;
      }

      wx.showModal({
        title: '发送失败',
        content: errorMsg,
        showCancel: false
      });
    }
  },

  insertTemplate() {
    const template = `## 公司定性分析 (SWOT)
- **S (优势)**: 
- **W (劣势)**: 
- **O (机会)**: 
- **T (威胁)**: 
---
**核心护城河**: `;
    this.setData({
      content: template,
      wordCount: template.length
    });
  }
});

