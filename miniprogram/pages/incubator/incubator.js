const app = getApp();

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
    themeClass: '',
    idea: '',
    loading: false,
    report: '',
    methods: [],
    dimensions: [],
    methodFields: METHOD_FIELDS,
    selectedMethods: [],
    selectedMethodMap: {}
  },

  onLoad() {
    this.setData({ 
      themeClass: app.getThemeClass()
    });
  },

  onShow() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  buildSelectedMethodMap(selectedMethods) {
    const map = {};
    selectedMethods.forEach(name => {
      map[name] = true;
    });
    return map;
  },

  onInput(e) {
    this.setData({ idea: e.detail.value });
  },

  toggleMethod(e) {
    const name = e.currentTarget.dataset.method;
    let selected = this.data.selectedMethods.slice();
    const index = selected.indexOf(name);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      if (selected.length >= 3) {
        wx.showToast({
          title: '最多选择3种分析方法',
          icon: 'none'
        });
        return;
      }
      selected.push(name);
    }

    this.setData({ 
      selectedMethods: selected,
      selectedMethodMap: this.buildSelectedMethodMap(selected)
    });
  },

  async generateReport() {
    const idea = this.data.idea.trim();
    if (idea.length < 10) {
      wx.showToast({
        title: '至少输入10个字',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loading: true,
      report: ''
    });

    try {
      const result = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'incubator',
          content: idea,
          mentors: this.data.selectedMethods
        }
      });

      if (!result.result?.success || !result.result?.data) {
        throw new Error(result.result?.error || '生成失败');
      }

      wx.showToast({ title: '分析请求已提交', icon: 'success', duration: 2000 });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({ delta: 1 });
        } else {
          wx.redirectTo({ url: '/pages/index/index' });
        }
      }, 1500);
    } catch (err) {
      console.error('思想孵化器生成失败:', err);
      wx.showToast({
        title: err.message || '生成失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
