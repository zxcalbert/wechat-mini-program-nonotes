const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 领域和方法的分类目录（与 mentorRules.json 保持同步）
var CATALOG = [
  {
    id: 'value', name: '价值思维', icon: '💰', color: '#8b4513',
    methods: [
      { name: '多元思维模型分析', summary: '运用逆向思维、多学科思维模型和心理偏误清单，对问题进行多维度分析。' },
      { name: '价值投资分析框架', summary: '运用护城河分析、安全边际和能力圈原则，评估事物的长期价值。' },
      { name: '安全边际分析', summary: '运用内在价值评估、市场先生理论和安全边际原则，进行风险可控的决策分析。' }
    ]
  },
  {
    id: 'innovation', name: '创新创业', icon: '🚀', color: '#2ecc71',
    methods: [
      { name: '本分经营分析', summary: '运用消费者导向、聚焦原则和做对的事的理念，进行经营和决策分析。' },
      { name: '极简产品分析', summary: '运用用户价值、自然交互和去中心化的理念，进行产品和用户体验分析。' },
      { name: '创新设计分析', summary: '运用用户不被告知法、端到端体验和极致简约的理念，进行创新和设计分析。' },
      { name: '第一性原理分析', summary: '运用物理本质拆解和终极目标导向的方法，从最基本的事实出发分析问题。' },
      { name: '长期主义分析', summary: '运用Day1心态、飞轮效应和顾客至上的理念，进行长期战略分析。' },
      { name: '垄断竞争分析', summary: '运用从0到1、秘密和幂律法则的理念，进行竞争和差异化分析。' }
    ]
  },
  {
    id: 'psychology', name: '心理学', icon: '🧠', color: '#9b59b6',
    methods: [
      { name: '原型心理分析', summary: '运用集体无意识、个性化和阴影整合的理论，进行深层心理分析。' },
      { name: '精神分析框架', summary: '运用潜意识、防御机制和本我自我超我理论，进行深层心理分析。' },
      { name: '人本精神分析', summary: '运用逃避自由、爱的艺术和社会性格的理论，进行人本主义心理分析。' },
      { name: '目的论分析', summary: '运用自卑与超越、社会兴趣和生活方式的理论，进行目的论导向的心理分析。' },
      { name: '需求层次分析', summary: '运用需求金字塔、自我实现和超越需求的理论，进行人类动机分析。' }
    ]
  },
  {
    id: 'philosophy', name: '哲学', icon: '📖', color: '#34495e',
    methods: [
      { name: '道家思想分析', summary: '运用无为而治、自然之道和矛盾统一的理论，进行道家哲学分析。' },
      { name: '儒家伦理分析', summary: '运用中庸之道、仁政和修身齐家的理论，进行儒家伦理分析。' },
      { name: '苏格拉底式提问', summary: '运用反诘法、质询式引导和辩证思考的方法，通过提问引导深入思考。' },
      { name: '理念论分析', summary: '运用洞穴隐喻、理想国和形式与本质的理论，进行理念论哲学分析。' },
      { name: '幸福伦理学分析', summary: '运用中庸美德、幸福观和四因说的理论，进行幸福和伦理分析。' },
      { name: '超人哲学分析', summary: '运用价值重估、权力意志和永恒回归的理论，进行超人哲学分析。' },
      { name: '语言哲学分析', summary: '运用语言游戏、私人语言和世界与事实的理论，进行语言哲学分析。' }
    ]
  }
];

exports.main = async (event, context) => {
  return {
    success: true,
    data: {
      domains: CATALOG,
      totalMethods: CATALOG.reduce(function (sum, d) { return sum + d.methods.length; }, 0)
    }
  };
};
