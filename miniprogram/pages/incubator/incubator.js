const app = getApp();

const MENTOR_FIELDS = [
  {
    key: 'invest',
    name: '投资领域',
    icon: '💰',
    mentors: ['查理·芒格', '巴菲特', '格雷厄姆']
  },
  {
    key: 'startup',
    name: '创业领域',
    icon: '🚀',
    mentors: ['段永平', '张小龙', '乔布斯', '马斯克', '贝佐斯', '彼得·蒂尔']
  },
  {
    key: 'psychology',
    name: '心理学领域',
    icon: '🧠',
    mentors: ['荣格', '弗洛伊德', '弗洛姆', '阿德勒', '马斯洛']
  },
  {
    key: 'philosophy',
    name: '哲学领域',
    icon: '📚',
    mentors: ['老子', '孔子', '苏格拉底', '柏拉图', '亚里士多德', '尼采', '维特根斯坦']
  }
];

const DEFAULT_MENTORS = ['查理·芒格', '张小龙', '荣格'];

Page({
  data: {
    themeClass: '',
    idea: '',
    loading: false,
    report: '',
    mentors: [],
    dimensions: [],
    mentorFields: MENTOR_FIELDS,
    selectedMentors: DEFAULT_MENTORS.slice(),
    selectedMentorMap: {}
  },

  onLoad() {
    this.setData({ 
      themeClass: app.getThemeClass(),
      selectedMentorMap: this.buildSelectedMentorMap(DEFAULT_MENTORS)
    });
  },

  onShow() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  buildSelectedMentorMap(selectedMentors) {
    const map = {};
    selectedMentors.forEach(name => {
      map[name] = true;
    });
    return map;
  },

  onInput(e) {
    this.setData({ idea: e.detail.value });
  },

  toggleMentor(e) {
    const name = e.currentTarget.dataset.name;
    let selected = this.data.selectedMentors.slice();
    const index = selected.indexOf(name);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      if (selected.length >= 3) {
        wx.showToast({
          title: '最多选择3位导师',
          icon: 'none'
        });
        return;
      }
      selected.push(name);
    }

    this.setData({ 
      selectedMentors: selected,
      selectedMentorMap: this.buildSelectedMentorMap(selected)
    });
  },

  isMentorSelected(name) {
    return this.data.selectedMentors.includes(name);
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

    if (this.data.selectedMentors.length === 0) {
      wx.showToast({
        title: '请至少选择1位导师',
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
          mentors: this.data.selectedMentors
        }
      });

      if (!result.result?.success || !result.result?.data) {
        throw new Error(result.result?.error || '生成失败');
      }

      this.setData({
        report: result.result.data.report || '',
        mentors: result.result.data.mentors || [],
        dimensions: result.result.data.dimensions || []
      });
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
