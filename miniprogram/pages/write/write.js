const app = getApp();
const db = wx.cloud.database();
const { getMentorRulesCache, saveMentorRulesCache } = require('../../utils/cacheUtil');

const METHOD_FIELDS = [
  {
    key: 'invest',
    name: '价值思维',
    icon: '💰',
    methods: ['多元思维模型分析', '价值投资分析框架', '安全边际分析']
  },
  {
    key: 'startup',
    name: '创业创新',
    icon: '🚀',
    methods: ['本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析']
  },
  {
    key: 'psychology',
    name: '心理学',
    icon: '🧠',
    methods: ['原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析']
  },
  {
    key: 'philosophy',
    name: '哲学',
    icon: '📚',
    methods: ['道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析']
  }
];

Page({
  data: {
    methodFields: METHOD_FIELDS,
    selectedMethod: null,
    selectedMethodMap: {},
    content: '',
    canSend: false,
    userStamps: 2,
    needReply: true,
    hasSensitiveWarning: false,
    sensitiveWarning: '',
    methodRules: null,
    fallbackMethodGuides: null,
    showMethodGuide: false,
    currentMethodGuide: ''
  },

  onLoad() {
    this.fallbackToHardcoded();
    this.checkAuth();
    this.loadMethodRules();
  },

  onShow() {
    if (this.data.openid) {
      this.fetchUserStamps();
      this.checkDailyLimit();
    }
  },

  checkAuth() {
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      wx.redirectTo({ url: '../login/login' });
      return;
    }
    this.setData({ openid });
    this.fetchUserStamps();
    this.checkDailyLimit();
  },

  loadMethodRules() {
    const cached = getMentorRulesCache();
    if (cached) {
      this.setData({ methodRules: cached });
      return;
    }
    wx.cloud.callFunction({
      name: 'getMentorRules',
      success: (res) => {
        if (res.result.success) {
          this.setData({ methodRules: res.result.data });
          saveMentorRulesCache(res.result.data);
        }
      },
      fail: (err) => {
        console.error('加载规则库失败:', err);
        this.fallbackToHardcoded();
      }
    });
  },

  fallbackToHardcoded() {
    const methodGuides = {
      '多元思维模型分析': '核心框架：1. 反过来想，总是反过来想\n2. 多学科思维模型\n3. 避免人类误判心理学中的常见陷阱\n4. 避免错误比追求完美更重要\n5. 耐心是人生的智慧\n6. 做决策时留足冗余空间\n7. 长期主义，时间是优秀品质的朋友',
      '价值投资分析框架': '核心框架：1. 时间是优秀品质的朋友，平庸品质的敌人\n2. 决策的第一条原则是不要犯不可挽回的错误\n3. 只做自己理解的事情\n4. 真正的优势比短期收益更重要\n5. 短期是情绪的放大器，长期是价值的试金石\n6. 做决策时留足安全空间\n7. 长期坚持正确的事，忽略短期波动',
      '安全边际分析': '核心框架：1. 安全边际是决策的核心理念\n2. 市场短期是投票机，长期是称重机\n3. 决策的本质是用低于价值的成本获得收益\n4. 理性比情绪更重要\n5. 分散配置降低风险',
      '本分经营分析': '核心框架：1. 做对的事情，把事情做对\n2. 本分是最重要的价值观\n3. 价值观是最重要的核心竞争力\n4. 不要做不对的事情，即使短期有好处\n5. 慢就是快\n6. 长期坚持做对的事，忽略短期杂音\n7. 回归本分，保持平常心',
      '极简产品分析': '核心框架：1. 好的产品是用完即走\n2. 用户体验是第一位的\n3. 让创造发挥价值\n4. 简单就是美，复杂的东西往往不可靠\n5. 以用户为中心，而非以功能为中心\n6. 追求极致的细节\n7. 让产品说话，而非营销',
      '创新设计分析': '核心框架：1. Stay hungry, Stay foolish\n2. 设计不仅仅是外观和感觉，设计是如何工作的\n3. 创新是把不同的事物连接起来\n4. 追求完美，即使别人认为不可能\n5. 产品要简洁到极致\n6. 敢于挑战现状\n7. 把科技与艺术完美结合',
      '第一性原理分析': '核心框架：1. 第一性原理思考是解决问题的关键\n2. 要勇于挑战不可能，才能实现伟大目标\n3. 创新不是线性的，需要跳跃式思维\n4. 失败是成功的一部分，重要的是快速迭代\n5. 从物理定律出发，而非从现状出发\n6. 要有宏大的愿景\n7. 用工程思维解决问题\n8. 长期思考，以10年、20年为单位',
      '长期主义分析': '核心框架：1. 客户至上，其他自然而来\n2. 长期思维比短期利益更重要\n3. 每天都应该是第一天\n4. 拥抱变化，持续创新\n5. 失败是创新的代价',
      '垄断竞争分析': '核心框架：1. 创业的目标是建立垄断\n2. 从0到1的创新比从1到N的复制更有价值\n3. 竞争是为失败者准备的\n4. 逆向思维发现被忽视的机会\n5. 相信幂律分布',
      '原型心理分析': '核心框架：1. 认识自己是人生的起点\n2. 每个人都有未被认识的阴影面\n3. 集体无意识影响我们的行为\n4. 个体化是人生的目标\n5. 对立面的统一是成长的标志',
      '精神分析框架': '核心框架：1. 潜意识支配着我们的行为\n2. 人格由本我、自我、超我构成\n3. 梦境是潜意识的窗口\n4. 童年的经历塑造成年的人格\n5. 防御机制保护自我',
      '人本精神分析': '核心框架：1. 爱是一种需要学习的能力\n2. 自由意味着责任\n3. 现代人困于逃避自由\n4. 存在与拥有的区别\n5. 创造性爱与共生性爱的对比',
      '目的论分析': '核心框架：1. 自卑感是所有人共有的\n2. 优越感是补偿自卑的方式\n3. 人生的意义在于社会兴趣\n4. 早期记忆影响人格\n5. 目的论比因果论更重要',
      '需求层次分析': '核心框架：1. 需求层次理论揭示人类动机\n2. 自我实现是人的最高需求\n3. 高峰体验是生命的巅峰时刻\n4. 每个人都潜能无限\n5. 心理健康的标志是创造性',
      '道家思想分析': '核心框架：1. 道可道，非常道\n2. 上善若水，水善利万物而不争\n3. 为学日益，为道日损\n4. 祸兮福所倚，福兮祸所伏\n5. 知人者智，自知者明',
      '儒家伦理分析': '核心框架：1. 己所不欲，勿施于人\n2. 学而不思则罔，思而不学则殆\n3. 三人行，必有我师焉\n4. 中庸之为德也，其至矣乎\n5. 君子求诸己，小人求诸人',
      '苏格拉底式提问': '核心框架：1. 认识你自己\n2. 我唯一知道的就是我一无所知\n3. 未经审视的人生不值得度过\n4. 德性即知识\n5. 思辨是最好的交谈',
      '理念论分析': '核心框架：1. 理念世界高于现实世界\n2. 哲学是对永恒真理的追求\n3. 理想国中的哲人王\n4. 灵魂不朽\n5. 知识是回忆',
      '幸福伦理学分析': '核心框架：1. 中庸之道是德性的极致\n2. 幸福是人生的最终目的\n3. 人是政治的动物\n4. 形式逻辑是推理的基础\n5. 德性是通过实践养成的',
      '超人哲学分析': '核心框架：1. 上帝已死，超人尚未诞生\n2. 强力意志是生命的本质\n3. 一切价值都是人创造的\n4. 永恒回归的考验\n5. 成为你自己',
      '语言哲学分析': '核心框架：1. 语言的界限就是世界的界限\n2. 家族相似性揭示概念的模糊边界\n3. 私人语言的不可能性\n4. 哲学是对语言疾病的治疗\n5. 不可言说的应保持沉默'
    };
    this.setData({ fallbackMethodGuides: methodGuides });
  },

  toggleMethod(e) {
    const method = e.currentTarget.dataset.method;
    const selectedMethodMap = { ...this.data.selectedMethodMap };

    if (selectedMethodMap[method]) {
      delete selectedMethodMap[method];
      this.setData({ selectedMethod: null, selectedMethodMap });
    } else {
      Object.keys(selectedMethodMap).forEach(k => delete selectedMethodMap[k]);
      selectedMethodMap[method] = true;
      this.setData({ selectedMethod: method, selectedMethodMap });
    }
    this.updateCanSend();
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
    this.updateCanSend();
  },

  updateCanSend() {
    const canSend = this.data.content.trim().length > 0 &&
      (!this.data.needReply || this.data.selectedMethod);
    this.setData({ canSend });
  },

  selectNeedReply(e) {
    const needReply = e.currentTarget.dataset.need === 'true';
    this.setData({ needReply });
    this.updateCanSend();
  },

  async fetchUserStamps() {
    try {
      const result = await db.collection('users').where({ _openid: this.data.openid }).get();
      if (result.data.length > 0) {
        const userStamps = result.data[0].stamps;
        const stamps = userStamps !== undefined ? userStamps : 2;
        this.setData({ userStamps: stamps });
      }
    } catch (err) {
      console.error('获取额度失败:', err);
    }
  },

  async checkDailyLimit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const result = await db.collection('letters').where({
        _openid: this.data.openid,
        createTime: db.command.gte(today),
        needReply: true
      }).count();
      const count = result.total;
      const remaining = Math.max(0, 6 - count);
      if (remaining <= 0) {
        wx.showModal({
          title: '每日分析次数已用完',
          content: '今天已提交6次分析请求，请明天再来',
          showCancel: false
        });
      } else {
        wx.showToast({
          title: `今天还可以提交${remaining}次分析`,
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('检查每日限额失败:', err);
    }
  },

  async submitLetter() {
    if (!this.data.canSend) return;

    const content = this.data.content.trim();
    const needReply = this.data.needReply;

    if (needReply && this.data.userStamps < 1) {
      wx.showModal({
        title: '额度不足',
        content: '需要购买分析额度才能使用AI分析功能',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/stamps/stamps' });
        }
      });
      return;
    }

    if (needReply) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        const result = await db.collection('letters').where({
          _openid: this.data.openid,
          createTime: db.command.gte(today),
          needReply: true
        }).count();
        if (result.total >= 6) {
          wx.showModal({
            title: '每日分析次数已用完',
            content: '今天已提交6次分析请求，请明天再来',
            showCancel: false
          });
          return;
        }
      } catch (err) {
        console.error('检查每日限额失败:', err);
      }
    }

    this.doSubmit();
  },

  async doSubmit() {
    const selectedMethod = this.data.needReply ? this.data.selectedMethod : null;
    const content = this.data.content;
    const needReply = this.data.needReply;

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const addRes = await db.collection('letters').add({
        data: {
          mentor: selectedMethod,
          mood: '由AI推断',
          content: content,
          status: needReply ? 'pending' : 'saved',
          needReply: needReply,
          createTime: db.serverDate(),
          replyExpectTime: needReply ? new Date(Date.now() + 18 * 60 * 60 * 1000).getTime() : null
        }
      });

      const letterId = addRes._id;

      if (needReply) {
        wx.showLoading({ title: '正在分析中......', mask: true });
        const cloudReplyRes = await wx.cloud.callFunction({
          name: 'replyToLetter',
          data: {
            letterId: letterId,
            mentor: selectedMethod,
            mood: '由AI推断',
            content: content
          }
        });
        wx.hideLoading();
        if (cloudReplyRes.result && cloudReplyRes.result.success) {
          wx.showToast({ title: '分析请求已提交', icon: 'success', duration: 3000 });
        } else {
          wx.showToast({ title: '分析请求已提交，结果稍后查看', icon: 'none', duration: 3000 });
        }
      } else {
        wx.hideLoading();
        wx.showToast({ title: '笔记已保存', icon: 'success', duration: 2000 });
      }

      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({ delta: 1 });
        } else {
          wx.redirectTo({ url: '/pages/index/index' });
        }
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      console.error('提交失败:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },

  formatMethodGuide(methodName) {
    const rules = this.data.methodRules;
    if (!rules || !rules.mentors || !rules.mentors[methodName]) {
      return this.data.fallbackMethodGuides[methodName] || '';
    }
    const method = rules.mentors[methodName];
    let guide = `核心框架：\n`;
    method.corePrinciples.forEach((principle) => { guide += `${principle}\n`; });
    return guide;
  },

  showMethodGuideHandler() {
    if (!this.data.selectedMethod) {
      wx.showToast({ title: '请先选择一种分析方法', icon: 'none' });
      return;
    }
    const guide = this.formatMethodGuide(this.data.selectedMethod);
    this.setData({ showMethodGuide: true, currentMethodGuide: guide });
  },

  closeMethodGuide() {
    this.setData({ showMethodGuide: false });
  },

  buyStamps() {
    wx.navigateTo({ url: '/pages/stamps/stamps' });
  }
});
