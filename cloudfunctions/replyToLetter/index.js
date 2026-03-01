const cloud = require('wx-server-sdk');
const axios = require('axios');
const mentorRules = require('./mentorRules.json');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const sensitiveWords = {
  violence: [
    '杀人', '暴力', '恐怖', '袭击', '爆炸', '枪支', '武器',
    '血腥', '残忍', '虐待', '杀戮', '谋杀', '伤害', '残害'
  ],
  porn: [
    '色情', '淫秽', '性交易', '嫖娼', '卖淫', '裸聊',
    '成人', '黄色', '低俗', '下流', '猥琐', '淫秽物品'
  ],
  investment: [
    '买入', '卖出', '推荐', '估值', '收益率', '回报率',
    '目标价', '股价', '基金净值', '投资建议', '理财规划',
    '增持', '减持', '抄底', '逃顶', '加仓', '减仓'
  ]
};

function detectSensitiveWords(text) {
  if (!text) {
    return {
      hasSensitive: false,
      isHighSensitive: false,
      isInvestment: false
    };
  }

  let hasSensitive = false;
  let isHighSensitive = false;
  let isInvestment = false;

  for (const word of sensitiveWords.violence) {
    if (text.includes(word)) {
      hasSensitive = true;
      isHighSensitive = true;
      break;
    }
  }

  if (!isHighSensitive) {
    for (const word of sensitiveWords.porn) {
      if (text.includes(word)) {
        hasSensitive = true;
        isHighSensitive = true;
        break;
      }
    }
  }

  if (!isHighSensitive) {
    for (const word of sensitiveWords.investment) {
      if (text.includes(word)) {
        hasSensitive = true;
        isInvestment = true;
        break;
      }
    }
  }

  return {
    hasSensitive,
    isHighSensitive,
    isInvestment
  };
}

function processReply(replyContent) {
  const detection = detectSensitiveWords(replyContent);

  if (detection.isHighSensitive) {
    return "感谢你的来信。由于内容合规性要求，我无法针对这个话题给出具体回复。建议你从更宏观的角度思考问题，关注原则和方法论，而不是具体的标的或建议。";
  }

  if (detection.isInvestment) {
    const disclaimer = "\n\n---\n\n⚠️ 免责声明：以上内容仅供参考，不构成任何投资建议。投资有风险，决策需谨慎。";
    return replyContent + disclaimer;
  }

  return replyContent;
}

const wordCountConfig = {
  simple: { min: 200, max: 200, maxTokens: 280, label: '简单' },
  medium: { min: 200, max: 300, maxTokens: 400, label: '中等' },
  complex: { min: 400, max: 500, maxTokens: 650, label: '复杂' }
};

function estimateComplexity(userContent) {
  const length = userContent.length;
  if (length &lt; 100) return 'simple';
  if (length &gt; 300) return 'complex';
  return 'medium';
}

function getWordCountConfig(userContent) {
  const complexity = estimateComplexity(userContent);
  return wordCountConfig[complexity];
}

function countChineseWords(text) {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + Math.round(englishWords.length * 1.5);
}

function truncateByChineseWords(text, maxWords) {
  const currentCount = countChineseWords(text);
  if (currentCount &lt;= maxWords) return text;
  
  let low = 0, high = text.length;
  let best = text.substring(0, Math.floor(text.length * 0.7));
  
  while (low &lt;= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.substring(0, mid);
    const count = countChineseWords(candidate);
    
    if (count &lt;= maxWords) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  const lastPunc = Math.max(
    best.lastIndexOf('。'),
    best.lastIndexOf('！'),
    best.lastIndexOf('？')
  );
  
  return lastPunc &gt; 0 ? best.substring(0, lastPunc + 1) : best;
}

function getAIDeducedPrompt(mentorData, content) {
  const config = getWordCountConfig(content);

  let prompt = `【规则约束部分（不可变，来自规则库）】
你必须以${mentorData.persona}的身份回复，遵循以下核心原则：
`;

  mentorData.corePrinciples.forEach((principle, idx) =&gt; {
    prompt += `${principle}\n`;
  });

  prompt += `
【重要】请根据用户的内容自动判断其情绪状态，并给予相应的回应。

【超详细自由发挥部分】
你的完整人设：
${mentorData.persona}

你的思考框架（5个）：
`;

  mentorData.thinkingFrameworks.forEach((framework, idx) =&gt; {
    prompt += `${framework}\n`;
  });

  prompt += `
你的常用问题（6个）：
`;

  mentorData.commonQuestions.forEach((question, idx) =&gt; {
    prompt += `${question}\n`;
  });

  prompt += `
基于以上约束，针对用户的问题：
${content}

【字数自适应要求】
- 先评估内容复杂度：${config.label}
- ${config.label}问题：${config.min}-${config.max}字
- 上限：严格${config.max}字，不得超过

给出直接、具体、有针对性的回复，${config.min}-${config.max}字。
`;

  return prompt;
}

function getOriginalPrompt(mentor, mentorData, moodData, content) {
  const config = getWordCountConfig(content);

  let prompt = `【规则约束部分（不可变，来自规则库）】
你必须以${mentor}的身份回复，遵循以下核心原则：
`;

  mentorData.corePrinciples.forEach((principle, idx) =&gt; {
    prompt += `${principle}\n`;
  });

  prompt += `
用户当前心境：${moodData.label}
- 语气必须：${moodData.tone}
- 重点必须：${moodData.focus}
- 必须涵盖这5个关键点：
`;

  moodData.keyPoints.forEach((point, idx) =&gt; {
    prompt += `${point}\n`;
  });

  prompt += `
【超详细自由发挥部分】
你的完整人设：
${mentorData.persona}

你的思考框架（5个）：
`;

  mentorData.thinkingFrameworks.forEach((framework, idx) =&gt; {
    prompt += `${framework}\n`;
  });

  prompt += `
你的常用问题（6个）：
`;

  mentorData.commonQuestions.forEach((question, idx) =&gt; {
    prompt += `${question}\n`;
  });

  prompt += `
基于以上约束，针对用户的问题：
${content}

【字数自适应要求】
- 先评估内容复杂度：${config.label}
- ${config.label}问题：${config.min}-${config.max}字
- 上限：严格${config.max}字，不得超过

给出直接、具体、有针对性的回复，${config.min}-${config.max}字。
`;

  return prompt;
}

function getMentorPrompt(mentor, mood, content) {
  const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['查理·芒格'];
  
  if (mood === null || mood === '由AI推断' || !mood) {
    return getAIDeducedPrompt(mentorData, content);
  } else {
    const moodData = mentorRules.moods[mood] || mentorRules.moods['平和'];
    return getOriginalPrompt(mentor, mentorData, moodData, content);
  }
}

async function callDeepSeekAPI(systemPrompt, userContent) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在云函数环境变量中设置 DEEPSEEK_API_KEY');
  }

  const config = getWordCountConfig(userContent);

  const apiUrl = 'https://api.deepseek.com/chat/completions';
  
  const payload = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    temperature: 0.7,
    max_tokens: config.maxTokens
  };

  try {
    console.log('开始调用 DeepSeek API...');
    console.log('字数配置:', config.label, config.max, '字, max_tokens:', config.maxTokens);
    
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data &amp;&amp; response.data.choices &amp;&amp; response.data.choices.length &gt; 0) {
      const choice = response.data.choices[0];
      let reply = choice.message?.content;
      
      if (reply) {
        reply = reply.trim();
        console.log('DeepSeek API 调用成功，原始长度:', reply.length, '字符');
        
        reply = truncateByChineseWords(reply, config.max);
        console.log('截断后长度:', countChineseWords(reply), '字');
        
        return reply;
      }
    }

    if (response.data?.error) {
      throw new Error('DeepSeek API 错误: ' + JSON.stringify(response.data.error));
    }

    throw new Error('DeepSeek API 返回格式异常: ' + JSON.stringify(response.data));
    
  } catch (err) {
    const errorMsg = err.response?.data 
      ? JSON.stringify(err.response.data) 
      : err.message;
    console.error('调用 DeepSeek API 失败:', errorMsg);
    throw new Error('DeepSeek API 调用失败: ' + errorMsg);
  }
}

function generateSmartReply(mentor, mood, content) {
  const mentorProfiles = {
    '查理·芒格': {
      opening: ['我注意到你在思考', '从你的描述来看', '让我从另一个角度分析'],
      principles: [
        '正如我常说的，投资需要多学科思维模型。',
        '反过来想，总是反过来想。',
        '在手里拿着锤子的人看来，世界就像一颗钉子。',
        '避免人类误判心理学中的常见陷阱至关重要。'
      ],
      advice: [
        '建议你建立自己的思维模型框架，',
        '不妨从逆向思考开始，',
        '记住，投资最重要的是避免错误，而不是追求完美。'
      ]
    },
    '巴菲特': {
      opening: ['我理解你的想法', '从长期价值的角度看', '让我分享一些思考'],
      principles: [
        '时间是优秀企业的朋友，平庸企业的敌人。',
        '投资的第一条原则是永远不要亏损，第二条原则是永远不要忘记第一条。',
        '只投资自己理解的生意。',
        '企业的护城河比增长速度更重要。'
      ],
      advice: [
        '建议你专注于企业的内在价值，',
        '保持耐心，让复利发挥作用，',
        '记住，市场短期是投票机，长期是称重机。'
      ]
    },
    '段永平': {
      opening: ['我明白你的困惑', '从本分的角度看', '让我直接说'],
      principles: [
        '做对的事情，把事情做对。',
        '本分是最重要的企业文化。',
        '企业文化是最重要的护城河。',
        '不要做不对的事情，即使能赚钱。'
      ],
      advice: [
        '建议你回归本分，',
        '专注于做对的事情，',
        '记住，慢就是快，本分就是最大的智慧。'
      ]
    },
    '张小龙': {
      opening: ['从用户的角度看', '让我思考一下', '我注意到你关注的问题'],
      principles: [
        '好的产品是用完即走。',
        '用户体验是第一位的。',
        '让创造发挥价值。',
        '简单就是美，复杂的东西往往不可靠。'
      ],
      advice: [
        '建议你从用户需求出发，',
        '追求简单而优雅的解决方案，',
        '记住，真正的创新来自对用户需求的深刻理解。'
      ]
    },
    '乔布斯': {
      opening: ['我认为', '从设计的角度看', '让我分享一个想法'],
      principles: [
        'Stay hungry, Stay foolish.',
        '设计不仅仅是外观和感觉，设计是如何工作的。',
        '创新是把不同的事物连接起来。',
        '追求完美，即使别人认为不可能。'
      ],
      advice: [
        '建议你追求卓越的设计，',
        '将科技与艺术完美结合，',
        '记住，伟大的产品来自对细节的极致追求。'
      ]
    },
    '马斯克': {
      opening: ['我认为', '从技术角度看', '让我大胆预测'],
      principles: [
        '第一性原理思考是解决问题的关键。',
        '要勇于挑战不可能，才能实现伟大目标。',
        '创新不是线性的，需要跳跃式思维。',
        '失败是成功的一部分，重要的是快速迭代。'
      ],
      advice: [
        '建议你采用第一性原理思考问题，',
        '不要被传统思维限制，',
        '记住，伟大的事业需要勇气和坚持。'
      ]
    }
  };

  const profile = mentorProfiles[mentor] || mentorProfiles['查理·芒格'];
  
  const moodAdjustments = {
    '焦虑': '市场波动是常态，保持理性是关键。',
    '贪婪': '贪婪时更要谨慎，安全边际不可忽视。',
    '平和': '平和的心态是长期投资的基础。',
    '困惑': '困惑时不妨回到基本原则思考。'
  };

  const keywords = extractKeywords(content);
  
  const opening = profile.opening[Math.floor(Math.random() * profile.opening.length)];
  const principle = profile.principles[Math.floor(Math.random() * profile.principles.length)];
  const advice = profile.advice[Math.floor(Math.random() * profile.advice.length)];
  const moodAdvice = moodAdjustments[mood] || '';

  let reply = `${opening}${keywords.length &gt; 0 ? '，特别是关于' + keywords.slice(0, 2).join('和') + '的部分' : ''}。\n\n`;
  reply += `${principle}\n\n`;
  if (moodAdvice) {
    reply += `${moodAdvice}\n\n`;
  }
  reply += `${advice}结合你当前的情况，我建议你：\n`;
  reply += `1. 深入思考你提到的核心问题\n`;
  reply += `2. 建立自己的投资原则和框架\n`;
  reply += `3. 保持长期视角，避免短期情绪干扰\n\n`;
  reply += `记住，投资是一场马拉松，不是短跑。持续学习和反思，你会找到属于自己的投资之道。`;

  return reply;
}

function extractKeywords(text) {
  const investmentKeywords = ['投资', '股票', '基金', '公司', '行业', '市场', '价值', '价格', '风险', '机会', '决策', '策略'];
  const found = [];
  for (const keyword of investmentKeywords) {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found.slice(0, 3);
}

exports.main = async (event, context) =&gt; {
  const { letterId, replyContent, mentor, mood, content } = event;
  const db = cloud.database();

  try {
    if (replyContent) {
      const processedReply = processReply(replyContent.trim());
      
      await db.collection('letters').doc(letterId).update({
        data: {
          replyContent: processedReply,
          status: 'replied',
          replyTime: db.serverDate()
        }
      });

      return { 
        success: true,
        replyLength: processedReply.length
      };
    }

    if (mentor &amp;&amp; content) {
      const systemPrompt = getMentorPrompt(mentor, mood || '平和', content);
      
      let replyContent;
      try {
        replyContent = await callDeepSeekAPI(systemPrompt, content);
      } catch (aiErr) {
        console.log('AI调用失败，使用智能回复生成器:', aiErr.message);
        replyContent = generateSmartReply(mentor, mood || '平和', content);
      }
      
      const processedReply = processReply(replyContent);
      
      await db.collection('letters').doc(letterId).update({
        data: {
          replyContent: processedReply,
          replyTime: db.serverDate()
        }
      });

      return {
        success: true,
        replyLength: processedReply.length
      };
    }

    return {
      success: false,
      error: '缺少必要参数',
      errorCode: 'MISSING_PARAMS'
    };

  } catch (err) {
    console.error("保存回复失败：", err);
    console.error("错误详情：", JSON.stringify(err, null, 2));
    
    try {
      await db.collection('letters').doc(letterId).update({
        data: {
          status: 'error',
          errorMessage: err.message
        }
      });
    } catch (dbErr) {
      console.error("更新错误状态失败：", dbErr);
    }
    
    return { 
      success: false, 
      error: err.message,
      errorCode: err.code || 'UNKNOWN_ERROR'
    };
  }
};
