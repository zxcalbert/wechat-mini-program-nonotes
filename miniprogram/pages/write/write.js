const db = wx.cloud.database();
const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const sensitiveWordUtil = require('../../utils/sensitiveWordUtil');
const { saveMentorRulesCache, getMentorRulesCache } = require('../../utils/cacheUtil.js');
const app = getApp();

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
    sensitiveWarning: '',
    themeClass: '',
    mentorRules: null,
    fallbackMentorGuides: null,
    fallbackMoodGuides: null,
    showMentorGuide: false,
    showMoodGuide: false,
    currentMentorGuide: '',
    currentMoodGuide: ''
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight,
      themeClass: app.getThemeClass()
    });
    this.checkAuth();
    this.loadMentorRules();
    
    const date = new Date();
    this.setData({
      currentDate: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    });
  },

  loadMentorRules() {
    const cached = getMentorRulesCache();
    if (cached) {
      this.setData({ mentorRules: cached });
      return;
    }

    wx.cloud.callFunction({
      name: 'getMentorRules',
      success: (res) => {
        if (res.result.success) {
          const rules = res.result.data;
          this.setData({ mentorRules: rules });
          saveMentorRulesCache(rules);
        }
      },
      fail: (err) => {
        console.error('加载规则库失败:', err);
        this.fallbackToHardcoded();
      }
    });
  },

  fallbackToHardcoded() {
    const mentorGuides = {
      '查理·芒格': '核心原则：1. 反过来想，总是反过来想\n2. 多学科思维模型\n3. 在手里拿着锤子的人看来，世界就像一颗钉子\n4. 避免人类误判心理学中的常见陷阱\n5. 投资最重要的是避免错误，而不是追求完美\n6. 耐心是投资的美德\n7. 安全边际是投资的生命线\n8. 长期主义，时间是优秀企业的朋友',
      '巴菲特': '核心原则：1. 时间是优秀企业的朋友，平庸企业的敌人\n2. 投资的第一条原则是永远不要亏损，第二条原则是永远不要忘记第一条\n3. 只投资自己理解的生意\n4. 企业的护城河比增长速度更重要\n5. 市场短期是投票机，长期是称重机\n6. 安全边际是投资的基石\n7. 买股票就是买公司\n8. 长期持有，忽略短期波动',
      '段永平': '核心原则：1. 做对的事情，把事情做对\n2. 本分是最重要的企业文化\n3. 企业文化是最重要的护城河\n4. 不要做不对的事情，即使能赚钱\n5. 慢就是快\n6. 买股票就是买公司\n7. 长期持有，忽略短期波动\n8. 回归本分，保持平常心',
      '张小龙': '核心原则：1. 好的产品是用完即走\n2. 用户体验是第一位的\n3. 让创造发挥价值\n4. 简单就是美，复杂的东西往往不可靠\n5. 以用户为中心，而非以功能为中心\n6. 追求极致的细节\n7. 让产品说话，而非营销\n8. 保持对产品的敬畏之心',
      '乔布斯': '核心原则：1. Stay hungry, Stay foolish\n2. 设计不仅仅是外观和感觉，设计是如何工作的\n3. 创新是把不同的事物连接起来\n4. 追求完美，即使别人认为不可能\n5. 产品要简洁到极致\n6. 敢于挑战现状\n7. 把科技与艺术完美结合\n8. 对产品要有宗教般的热情',
      '马斯克': '核心原则：1. 第一性原理思考是解决问题的关键\n2. 要勇于挑战不可能，才能实现伟大目标\n3. 创新不是线性的，需要跳跃式思维\n4. 失败是成功的一部分，重要的是快速迭代\n5. 从物理定律出发，而非从现状出发\n6. 要有宏大的愿景，改变世界\n7. 用工程思维解决问题\n8. 长期思考，以10年、20年为单位'
    };
    const moodGuides = {
      '焦虑': '当前心境：焦虑\n\n建议：保持理性，关注长期价值\n\n关键点：1. 市场波动是常态，保持理性\n2. 关注企业内在价值，而非短期价格\n3. 安全边际是投资的生命线\n4. 不要被恐慌情绪影响决策\n5. 时间会平滑短期波动',
      '贪婪': '当前心境：贪婪\n\n建议：注意安全边际，避免冲动决策\n\n关键点：1. 贪婪时更要谨慎，安全边际不可忽视\n2. 不要被短期利益冲昏头脑\n3. 理性决策比快速收益更重要\n4. 市场狂热时往往是风险最高时\n5. 保持安全边际，避免冲动决策',
      '平和': '当前心境：平和\n\n建议：可以深入探讨投资理念和长期思考\n\n关键点：1. 平和的心态是长期投资的基础\n2. 可以深入探讨投资理念和长期思考\n3. 保持原则，不被短期情绪影响\n4. 持续学习和反思，形成自己的投资之道\n5. 投资是一场马拉松，不是短跑',
      '困惑': '当前心境：困惑\n\n建议：回到基本原则思考\n\n关键点：1. 困惑时不妨回到基本原则思考\n2. 帮助用户理清思路，找到核心问题\n3. 简化问题，从第一性原理出发\n4. 不要试图同时解决所有问题\n5. 保持耐心，逐步梳理'
    };
    this.setData({
      fallbackMentorGuides: mentorGuides,
      fallbackMoodGuides: moodGuides
    });
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
      const remaining = Math.max(0, 6 - totalSent);

      return {
        canSend: remaining > 0,
        remaining: remaining,
        total: totalSent
      };
    } catch (err) {
      console.error('检查每日限制失败:', err);
      return { canSend: true, remaining: 6, total: 0 };
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
  },

  checkSensitiveWords(text) {
    const result = sensitiveWordUtil.detect(text);

    if (result.hasSensitive) {
      if (result.isHighSensitive) {
        return {
          canSubmit: false,
          message: '您的内容包含敏感词，请修改后再提交。'
        };
      } else if (result.isInvestment) {
        return {
          canSubmit: true,
          message: '注意：您的内容包含投资相关词汇，AI回复不会提供具体投资建议。'
        };
      }
    }

    return {
      canSubmit: true,
      message: ''
    };
  },

  async selectNeedReply(e) {
    const need = e.currentTarget.dataset.need;

    if (need) {
      const limit = await this.checkDailyLimit();
      if (!limit.canSend) {
        wx.showModal({
          title: '每日寄信次数已用完',
          content: '今天已寄信6次，大师需要时间深思熟虑，明天再来吧',
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
          content: '今天已寄信6次，大师需要时间深思熟虑，明天再来吧',
          showCancel: false
        });
        return;
      }
    }

    const sensitiveCheck = this.checkSensitiveWords(this.data.content);

    if (!sensitiveCheck.canSubmit) {
      wx.showModal({
        title: '内容包含敏感词',
        content: sensitiveCheck.message,
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    if (sensitiveCheck.message) {
      wx.showModal({
        title: '温馨提示',
        content: sensitiveCheck.message + '\n\n是否继续提交？',
        confirmText: '继续提交',
        cancelText: '修改内容',
        success: (res) => {
          if (res.confirm) {
            this.doSubmit();
          } else {
            return;
          }
        }
      });
    } else {
      this.doSubmit();
    }
  },

  async doSubmit() {
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
  },

  formatMentorGuide(mentorName) {
    const rules = this.data.mentorRules;
    if (!rules || !rules.mentors[mentorName]) {
      return this.data.fallbackMentorGuides[mentorName] || '';
    }

    const mentor = rules.mentors[mentorName];
    let guide = `核心原则：\n`;
    mentor.corePrinciples.forEach((principle) => {
      guide += `${principle}\n`;
    });
    return guide;
  },

  formatMoodGuide(moodName) {
    const rules = this.data.mentorRules;
    if (!rules || !rules.moods[moodName]) {
      return this.data.fallbackMoodGuides[moodName] || '';
    }

    const mood = rules.moods[moodName];
    let guide = `当前心境：${moodName}\n\n建议：${mood.tone}\n\n关键点：\n`;
    mood.keyPoints.forEach((point) => {
      guide += `${point}\n`;
    });
    return guide;
  },

  showMentorGuideHandler() {
    const selectedMentor = this.data.mentors[this.data.mentorIndex];
    const guide = this.formatMentorGuide(selectedMentor);
    this.setData({
      showMentorGuide: true,
      currentMentorGuide: guide
    });
  },

  showMoodGuideHandler() {
    const guide = this.formatMoodGuide(this.data.selectedMood);
    this.setData({
      showMoodGuide: true,
      currentMoodGuide: guide
    });
  },

  closeMentorGuide() {
    this.setData({
      showMentorGuide: false
    });
  },

  closeMoodGuide() {
    this.setData({
      showMoodGuide: false
    });
  }
});
