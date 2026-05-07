var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var dbCmd = db.command;

var DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// 全部21种方法
var ALL_METHODS = [
  '多元思维模型分析', '价值投资分析框架', '安全边际分析',
  '本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析',
  '原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析',
  '道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析'
];

exports.main = async function (event, context) {
  var openid = event.userInfo ? event.userInfo.openId : '';
  if (!openid) {
    return { success: false, error: '未登录' };
  }

  // 检查缓存（7天有效）
  try {
    var cacheResult = await db.collection('knowledge_insights')
      .where({ _openid: openid })
      .limit(1)
      .get();
    if (cacheResult.data.length > 0) {
      var cache = cacheResult.data[0];
      var cacheAge = Date.now() - (cache.updateTime || 0);
      if (cacheAge < 7 * 24 * 3600 * 1000) {
        return { success: true, data: cache.insights, cached: true };
      }
    }
  } catch (e) {
    // 集合可能不存在
  }

  // 获取用户分析记录
  var lettersResult = await db.collection('letters').where({
    _openid: openid,
    deleted: dbCmd.neq(true)
  }).orderBy('createTime', 'desc').limit(100).get();

  var letters = lettersResult.data || [];

  // 基础统计（不依赖 AI）
  var usedMethods = {};
  var topicKeywords = {};
  letters.forEach(function (l) {
    var method = l.mentor || '';
    if (method) usedMethods[method] = (usedMethods[method] || 0) + 1;
    // 简单关键词提取
    var content = (l.content || '').substring(0, 30);
    if (content) topicKeywords[content] = (topicKeywords[content] || 0) + 1;
  });

  var unusedMethods = ALL_METHODS.filter(function (m) { return !usedMethods[m]; });

  // 高频主题 Top 5
  var sortedTopics = Object.keys(topicKeywords)
    .map(function (k) { return { topic: k, count: topicKeywords[k] }; })
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, 5);

  // 方法使用排行
  var sortedMethods = Object.keys(usedMethods)
    .map(function (k) { return { method: k, count: usedMethods[k] }; })
    .sort(function (a, b) { return b.count - a.count; });

  var insights = {
    totalAnalyses: letters.length,
    usedMethodCount: Object.keys(usedMethods).length,
    totalMethodCount: ALL_METHODS.length,
    frequentTopics: sortedTopics,
    topMethods: sortedMethods.slice(0, 5),
    unusedMethods: unusedMethods.slice(0, 5),
    suggestedExplorations: []
  };

  // 如果有足够数据，调用 DeepSeek 生成推荐
  if (letters.length >= 3) {
    var apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (apiKey) {
      var analysisSummary = letters.slice(0, 10).map(function (l, i) {
        return (i + 1) + '. [' + (l.mentor || '') + '] ' + (l.content || '').substring(0, 40);
      }).join('\n');

      var unusedStr = unusedMethods.slice(0, 5).join('、');

      var prompt = '你是一个知识探索顾问。用户已经做过' + letters.length + '次分析，使用过' +
        Object.keys(usedMethods).length + '种分析方法，还有未使用的方法：' + unusedStr + '。\n\n' +
        '最近的分析：\n' + analysisSummary + '\n\n' +
        '请推荐3个探索方向，返回JSON格式（只输出JSON）：\n' +
        '[{"title": "方向标题（≤10字）", "description": "简短说明（≤30字）", "method": "推荐使用的方法名"}]\n\n' +
        '要求：\n1. 基于用户已有的分析主题推荐新方向\n2. 推荐使用用户还没尝试过的方法\n3. 严格JSON格式';

      try {
        var response = await cloud.httpRequest({
          url: DEEPSEEK_URL,
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.5
          }
        });

        var resultText = '';
        if (response.data && response.data.choices && response.data.choices[0]) {
          resultText = response.data.choices[0].message.content.trim();
        }

        resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        var suggestions = [];
        try {
          suggestions = JSON.parse(resultText);
        } catch (e) {
          var match = resultText.match(/\[[\s\S]*\]/);
          if (match) suggestions = JSON.parse(match[0]);
        }

        insights.suggestedExplorations = suggestions.map(function (s) {
          return {
            title: s.title || '',
            description: s.description || '',
            method: s.method || ''
          };
        });
      } catch (err) {
        console.error('推荐生成失败:', err);
      }
    }
  }

  // 缓存结果
  try {
    var existingCache = await db.collection('knowledge_insights')
      .where({ _openid: openid }).limit(1).get();
    if (existingCache.data.length > 0) {
      await db.collection('knowledge_insights')
        .doc(existingCache.data[0]._id)
        .update({ data: { insights: insights, updateTime: Date.now() } });
    } else {
      await db.collection('knowledge_insights').add({ data: { insights: insights, updateTime: Date.now() } });
    }
  } catch (e) {
    // 缓存失败不影响返回
  }

  return { success: true, data: insights };
};
