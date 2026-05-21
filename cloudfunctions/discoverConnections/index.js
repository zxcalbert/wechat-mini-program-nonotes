var cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
var db = cloud.database();
var dbCmd = db.command;

// DeepSeek API 配置
var DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

exports.main = async function (event, context) {
  var openid = event.userInfo ? event.userInfo.openId : '';
  if (!openid) {
    return { success: false, error: '未登录' };
  }

  // 检查缓存（7天有效）
  try {
    var cacheResult = await db.collection('knowledge_connections')
      .where({ _openid: openid })
      .limit(1)
      .get();
    if (cacheResult.data.length > 0) {
      var cache = cacheResult.data[0];
      var cacheAge = Date.now() - (cache.updateTime || 0);
      if (cacheAge < 7 * 24 * 3600 * 1000) {
        return { success: true, data: cache.connections || [], cached: true };
      }
    }
  } catch (e) {
    // 集合可能不存在，忽略
  }

  // 获取用户分析记录
  var lettersResult = await db.collection('letters').where({
    _openid: openid,
    deleted: dbCmd.neq(true)
  }).orderBy('createTime', 'desc').limit(50).get();

  var letters = lettersResult.data || [];
  if (letters.length < 2) {
    return { success: true, data: [], reason: '分析记录不足' };
  }

  // 构建分析摘要列表
  var analysisSummaries = letters.map(function (l, i) {
    var content = (l.content || '').substring(0, 50);
    return (i + 1) + '. [' + (l.mentor || '未知方法') + '] ' + content;
  });

  var apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) {
    return { success: false, error: 'API key 未配置' };
  }

  // 调用 DeepSeek 分析关联
  var prompt = '你是一个知识关联分析专家。以下是用户的分析记录列表，请找出其中主题相似或有关联的记录对。\n\n' +
    '分析记录：\n' + analysisSummaries.join('\n') + '\n\n' +
    '请找出3-8对有关联的记录，返回JSON格式（只输出JSON，不要其他内容）：\n' +
    '[{"from": 记录序号, "to": 记录序号, "reason": "简短说明关联原因（≤20字）", "strength": 0.5-1.0之间的数值}]\n\n' +
    '要求：\n1. strength表示关联强度，1.0最强\n2. 优先关联跨领域的记录\n3. 严格JSON格式';

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
        max_tokens: 800,
        temperature: 0.3
      }
    });

    var resultText = '';
    if (response.data && response.data.choices && response.data.choices[0]) {
      resultText = response.data.choices[0].message.content.trim();
    }

    // 清理 JSON
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    var connections = [];
    try {
      connections = JSON.parse(resultText);
    } catch (e) {
      // JSON 解析失败，尝试提取数组
      var match = resultText.match(/\[[\s\S]*\]/);
      if (match) {
        connections = JSON.parse(match[0]);
      }
    }

    // 将序号转换为记录 ID
    var validConnections = [];
    for (var i = 0; i < connections.length; i++) {
      var conn = connections[i];
      var fromIdx = (typeof conn.from === 'number' ? conn.from : parseInt(conn.from)) - 1;
      var toIdx = (typeof conn.to === 'number' ? conn.to : parseInt(conn.to)) - 1;
      if (fromIdx >= 0 && fromIdx < letters.length && toIdx >= 0 && toIdx < letters.length) {
        validConnections.push({
          fromId: letters[fromIdx]._id,
          toId: letters[toIdx]._id,
          reason: conn.reason || '',
          strength: Math.max(0.3, Math.min(1.0, parseFloat(conn.strength) || 0.5))
        });
      }
    }

    // 缓存结果
    try {
      var existingCache = await db.collection('knowledge_connections')
        .where({ _openid: openid }).limit(1).get();
      if (existingCache.data.length > 0) {
        await db.collection('knowledge_connections')
          .doc(existingCache.data[0]._id)
          .update({ data: { connections: validConnections, updateTime: Date.now() } });
      } else {
        await db.collection('knowledge_connections').add({ data: { connections: validConnections, updateTime: Date.now() } });
      }
    } catch (e) {
      // 缓存失败不影响返回
    }

    return { success: true, data: validConnections };
  } catch (err) {
    console.error('关联分析失败:', err);
    return { success: false, error: '关联分析失败' };
  }
};
