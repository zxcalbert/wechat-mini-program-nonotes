const db = wx.cloud.database();
const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const sensitiveWordUtil = require('../../utils/sensitiveWordUtil');
const { saveMentorRulesCache, getMentorRulesCache } = require('../../utils/cacheUtil.js');
const app = getApp();
const RECENT_ROUNDTABLE_IDS_KEY = 'recentRoundtableIds';

Page({
  data: {
    featureEnabled: true,
    mentorsByDomain: {
      '价值思维领域': ['查理·芒格', '巴菲特', '格雷厄姆'],
      '创业创新领域': ['段永平', '张小龙', '乔布斯', '马斯克', '贝佐斯', '彼得·蒂尔'],
      '心理学领域': ['荣格', '弗洛伊德', '弗洛姆', '阿德勒', '马斯洛'],
      '哲学领域': ['老子', '孔子', '苏格拉底', '柏拉图', '亚里士多德', '尼采', '维特根斯坦']
    },
    selectedMentors: [],
    selectedMentorsMap: {},
    content: '',
    wordCount: 0,
    currentDate: '',
    openid: null,
    userStamps: 2,
    canSend: true,
    canSubmit: false,
    statusBarHeight: 0,
    hasSensitiveWarning: false,
    sensitiveWarning: '',
    themeClass: '',
    mentorRules: null,
    fallbackMentorGuides: null
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight,
      themeClass: app.getThemeClass()
    });
    this.fallbackToHardcoded();
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
      '查理·芒格': '核心原则：1. 反过来想，总是反过来想\n2. 多学科思维模型\n3. 在手里拿着锤子的人看来，世界就像一颗钉子\n4. 避免人类误判心理学中的常见陷阱\n5. 避免错误比追求完美更重要\n6. 耐心是人生的智慧\n7. 做决策时留足冗余空间\n8. 长期主义，时间是优秀品质的朋友',
      '巴菲特': '核心原则：1. 时间是优秀品质的朋友，平庸品质的敌人\n2. 决策的第一条原则是不要犯不可挽回的错误\n3. 只做自己理解的事情\n4. 真正的优势比短期收益更重要\n5. 短期是情绪的放大器，长期是价值的试金石\n6. 做决策时留足安全空间\n7. 选择就是承诺\n8. 长期坚持正确的事，忽略短期波动',
      '格雷厄姆': '核心原则：1. 安全边际是决策的核心理念\n2. 市场短期是投票机，长期是称重机\n3. 决策的本质是用低于价值的成本获得收益\n4. 理性比情绪更重要\n5. 分散配置降低风险',
      '段永平': '核心原则：1. 做对的事情，把事情做对\n2. 本分是最重要的价值观\n3. 价值观是最重要的核心竞争力\n4. 不要做不对的事情，即使短期有好处\n5. 慢就是快\n6. 选择就是承诺\n7. 长期坚持做对的事，忽略短期杂音\n8. 回归本分，保持平常心',
      '张小龙': '核心原则：1. 好的产品是用完即走\n2. 用户体验是第一位的\n3. 让创造发挥价值\n4. 简单就是美，复杂的东西往往不可靠\n5. 以用户为中心，而非以功能为中心\n6. 追求极致的细节\n7. 让产品说话，而非营销\n8. 保持对产品的敬畏之心',
      '乔布斯': '核心原则：1. Stay hungry, Stay foolish\n2. 设计不仅仅是外观和感觉，设计是如何工作的\n3. 创新是把不同的事物连接起来\n4. 追求完美，即使别人认为不可能\n5. 产品要简洁到极致\n6. 敢于挑战现状\n7. 把科技与艺术完美结合\n8. 对产品要有宗教般的热情',
      '马斯克': '核心原则：1. 第一性原理思考是解决问题的关键\n2. 要勇于挑战不可能，才能实现伟大目标\n3. 创新不是线性的，需要跳跃式思维\n4. 失败是成功的一部分，重要的是快速迭代\n5. 从物理定律出发，而非从现状出发\n6. 要有宏大的愿景，改变世界\n7. 用工程思维解决问题\n8. 长期思考，以10年、20年为单位',
      '贝佐斯': '核心原则：1. 客户至上，其他自然而来\n2. 长期思维比短期利益更重要\n3. 每天都应该是第一天\n4. 拥抱变化，持续创新\n5. 失败是创新的代价',
      '彼得·蒂尔': '核心原则：1. 创业的目标是建立垄断\n2. 从0到1的创新比从1到N的复制更有价值\n3. 竞争是为失败者准备的\n4. 逆向思维发现被忽视的机会\n5. 相信幂律分布',
      '荣格': '核心原则：1. 认识自己是人生的起点\n2. 每个人都有未被认识的阴影面\n3. 集体无意识影响我们的行为\n4. 个体化是人生的目标\n5. 对立面的统一是成长的标志',
      '弗洛伊德': '核心原则：1. 潜意识支配着我们的行为\n2. 人格由本我、自我、超我构成\n3. 梦境是潜意识的窗口\n4. 童年的经历塑造成年的人格\n5. 防御机制保护自我',
      '弗洛姆': '核心原则：1. 爱是一种需要学习的能力\n2. 自由意味着责任\n3. 现代人困于逃避自由\n4. 存在与拥有的区别\n5. 创造性爱与共生性爱的对比',
      '阿德勒': '核心原则：1. 自卑感是所有人共有的\n2. 优越感是补偿自卑的方式\n3. 人生的意义在于社会兴趣\n4. 早期记忆影响人格\n5. 目的论比因果论更重要',
      '马斯洛': '核心原则：1. 需求层次理论揭示人类动机\n2. 自我实现是人的最高需求\n3. 高峰体验是生命的巅峰时刻\n4. 每个人都潜能无限\n5. 心理健康的标志是创造性',
      '老子': '核心原则：1. 道可道，非常道\n2. 上善若水，水善利万物而不争\n3. 为学日益，为道日损\n4. 祸兮福所倚，福兮祸所伏\n5. 知人者智，自知者明',
      '孔子': '核心原则：1. 己所不欲，勿施于人\n2. 学而不思则罔，思而不学则殆\n3. 三人行，必有我师焉\n4. 中庸之为德也，其至矣乎\n5. 君子求诸己，小人求诸人',
      '苏格拉底': '核心原则：1. 认识你自己\n2. 我唯一知道的就是我一无所知\n3. 未经审视的人生不值得度过\n4. 德性即知识\n5. 思辨是最好的交谈',
      '柏拉图': '核心原则：1. 理念世界高于现实世界\n2. 哲学是对永恒真理的追求\n3. 理想国中的哲人王\n4. 灵魂不朽\n5. 知识是回忆',
      '亚里士多德': '核心原则：1. 中庸之道是德性的极致\n2. 幸福是人生的最终目的\n3. 人是政治的动物\n4. 形式逻辑是推理的基础\n5. 德性是通过实践养成的',
      '尼采': '核心原则：1. 上帝已死，超人尚未诞生\n2. 强力意志是生命的本质\n3. 一切价值都是人创造的\n4. 永恒回归的考验\n5. 成为你自己',
      '维特根斯坦': '核心原则：1. 语言的界限就是世界的界限\n2. 家族相似性揭示概念的模糊边界\n3. 私人语言的不可能性\n4. 哲学是对语言疾病的治疗\n5. 不可言说的应保持沉默'
    };
    this.setData({
      fallbackMentorGuides: mentorGuides
    });
  },

  checkAuth() {
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

  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const userStamps = result.data[0].stamps;
        const stamps = userStamps !== undefined ? userStamps : 2;
        this.setData({ userStamps: stamps });
      } else {
        this.setData({ userStamps: 2 });
      }
    } catch (err) {
      console.error('获取邮票失败:', err);
      this.setData({ userStamps: 2 });
    }
  },

  updateCanSubmit() {
    const selectedCount = this.data.selectedMentors.length;
    const hasContent = this.data.content.trim().length > 0;
    const canSubmit = selectedCount >= 3 && hasContent && this.data.featureEnabled;
    this.setData({ canSubmit: canSubmit });
  },

  toggleMentor(e) {
    const mentor = e.currentTarget.dataset.mentor;
    let selectedMentors = [...this.data.selectedMentors];
    let selectedMentorsMap = { ...this.data.selectedMentorsMap };
    
    const index = selectedMentors.indexOf(mentor);
    if (index > -1) {
      selectedMentors.splice(index, 1);
      delete selectedMentorsMap[mentor];
    } else {
      if (selectedMentors.length >= 5) {
        wx.showToast({
          title: '最多选择5位导师',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      selectedMentors.push(mentor);
      selectedMentorsMap[mentor] = true;
    }
    
    this.setData({ 
      selectedMentors: selectedMentors,
      selectedMentorsMap: selectedMentorsMap
    }, () => {
      this.updateCanSubmit();
    });
  },

  onInput(e) {
    const content = e.detail.value;
    const wordCount = content.length;
    this.setData({
      content: content,
      wordCount: wordCount
    }, () => {
      this.updateCanSubmit();
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
          message: '注意：您的内容包含金融相关词汇，AI回复仅供参考，不构成任何建议。'
        };
      }
    }

    return {
      canSubmit: true,
      message: ''
    };
  },

  buyStamps() {
    wx.navigateTo({
      url: '/pages/stamps/stamps'
    });
  },

  async submitRoundtable() {
    const content = this.data.content.trim();
    
    if (content.length < 10) {
      wx.showModal({
        title: '内容较短',
        content: '您的内容较短，确定要开始讨论吗？',
        confirmText: '继续',
        cancelText: '返回修改',
        success: (res) => {
          if (res.confirm) {
            this.doSubmit();
          }
        }
      });
      return;
    }

    if (this.data.selectedMentors.length < 3) {
      wx.showToast({
        title: '请至少选择3位导师',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (this.data.userStamps < 3) {
      wx.showModal({
        title: '邮票不足',
        content: '圆桌会议需要消耗3张邮票，请先购买',
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
          }
        }
      });
    } else {
      this.doSubmit();
    }
  },

  async doSubmit() {
    wx.showLoading({
      title: '正在生成回复...',
      mask: true
    });

    try {
      const result = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'roundtable',
          mentors: this.data.selectedMentors,
          content: this.data.content.trim()
        }
      });

      wx.hideLoading();

      if (result.result.success) {
        const data = result.result.data;
        this.saveRecentRoundtableId(data.roundtableId);
        this.setData({ userStamps: data.remainingStamps });
        
        wx.navigateTo({
          url: `/pages/roundtableResult/roundtableResult?data=${encodeURIComponent(JSON.stringify(data))}`
        });
      } else {
        wx.showToast({
          title: result.result.error || '生成失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('提交失败:', err);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  },

  showFeatureDisabledTip() {
    wx.showModal({
      title: '功能开发中',
      content: '圆桌会议功能正在开发中，敬请期待',
      showCancel: false
    });
  },

  handleSubmit() {
    if (this.data.featureEnabled) {
      this.submitRoundtable();
    } else {
      this.showFeatureDisabledTip();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  saveRecentRoundtableId(roundtableId) {
    if (!roundtableId) return;

    const recentIds = wx.getStorageSync(RECENT_ROUNDTABLE_IDS_KEY) || [];
    const nextIds = [roundtableId, ...recentIds.filter(id => id !== roundtableId)].slice(0, 10);
    wx.setStorageSync(RECENT_ROUNDTABLE_IDS_KEY, nextIds);
  }
});
