var cloudbaseUtil = require('../../utils/cloudbaseUtil');
var dbCmd = wx.cloud.database().command;
var app = getApp();

// 与 mentorRules.json fields 和 index.js domains 保持一致
var DOMAIN_MAP = {
  value: {
    name: '价值思维', icon: '💰', color: '#8b4513',
    methods: ['多元思维模型分析', '价值投资分析框架', '安全边际分析']
  },
  innovation: {
    name: '创新创业', icon: '🚀', color: '#2ecc71',
    methods: ['本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析']
  },
  psychology: {
    name: '心理学', icon: '🧠', color: '#9b59b6',
    methods: ['原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析']
  },
  philosophy: {
    name: '哲学', icon: '📖', color: '#34495e',
    methods: ['道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析']
  }
};

Page({
  data: {
    domainId: '',
    domain: null,
    methodCards: [],
    recentAnalyses: [],
    loading: true,
    themeClass: '',
    fontClass: '',
    breadcrumbPaths: []
  },

  onLoad: function (options) {
    var domainId = options.domain || 'value';
    var domain = DOMAIN_MAP[domainId];

    if (!domain) {
      wx.showToast({ title: '领域不存在', icon: 'none' });
      setTimeout(function () { wx.navigateBack(); }, 1500);
      return;
    }

    var methodCards = domain.methods.map(function (name, i) {
      return { name: name, index: i };
    });

    this.setData({
      domainId: domainId,
      domain: domain,
      methodCards: methodCards,
      themeClass: app.getThemeClass(),
      fontClass: app.getFontSizeClass(),
      breadcrumbPaths: [
        { name: '首页', url: '/pages/index/index' },
        { name: domain.name, url: '' }
      ],
      loading: false
    });

    this.fetchRecentAnalyses();
  },

  // 获取该领域下的历史分析记录
  fetchRecentAnalyses: function () {
    var that = this;
    var openid = wx.getStorageSync('openid');
    if (!openid) return;

    var methods = that.data.domain.methods;

    cloudbaseUtil.query('letters', {
      where: {
        _openid: openid,
        deleted: dbCmd.neq(true),
        mentor: dbCmd.in(methods)
      },
      orderBy: 'createTime',
      orderDirection: 'desc',
      limit: 20
    }).then(function (result) {
      if (result.success) {
        var analyses = result.data.map(function (item) {
          return {
            _id: item._id,
            content: (item.content || '').substring(0, 60),
            mentor: item.mentor,
            createTime: item.createTime,
            displayDate: cloudbaseUtil.formatDate(item.createTime)
          };
        });
        that.setData({ recentAnalyses: analyses });
      }
    }).catch(function (err) {
      console.error('获取领域分析记录失败:', err);
    });
  },

  // 点击方法卡片 → 跳转 write 页并预选该方法
  goToMethod: function (e) {
    var method = e.currentTarget.dataset.method;
    wx.navigateTo({
      url: '../write/write?preselectMethod=' + encodeURIComponent(method)
    });
  },

  // 点击分析记录 → 跳转详情页
  goToDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../detail/detail?id=' + id
    });
  },

  onBreadcrumbNavigate: function (e) {
    var item = e.detail.item;
    if (item.url) {
      wx.navigateTo({ url: item.url });
    }
  }
});
