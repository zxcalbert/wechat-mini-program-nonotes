const cloud = require('wx-server-sdk');
const axios = require('axios');
const sensitiveWordDetector = require('./sensitiveWordDetector');
// 优先加载扩展版导师规则，如果没有则回退到原版
let mentorRules;
try {
  mentorRules = require('./mentorRules_expanded.json');
  console.log('已加载扩展版导师规则，共', Object.keys(mentorRules.mentors).length, '位导师');
  console.log('领域配置:', Object.keys(mentorRules.fields || {}));
} catch (e) {
  console.log('未找到扩展版导师规则，使用原版');
  mentorRules = require('./mentorRules.json');
}
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function processReply(replyContent) {
  const detection = sensitiveWordDetector.detect(replyContent);

  if (detection.isHighSensitive) {
    return "感谢你的来信。由于内容合规性要求，我无法针对这个话题给出具体回复。建议你从更宏观的角度思考问题，关注原则和方法论，探索人生智慧和成长方向。";
  }

  return replyContent;
}

// 添加AI免责声明
function addAIDisclaimer(replyContent, mentorName) {
  const aiDisclaimer = `\n\n---\n*以上内容为AI模拟${mentorName}的回复，仅供参考和启发，不代表该人物的真实观点或建议。*`;
  return replyContent + aiDisclaimer;
}

// ==================== 字数自适应引擎 ====================

const wordCountConfig = {
  simple: { min: 200, max: 200, maxTokens: 280, label: '简单' },
  medium: { min: 200, max: 300, maxTokens: 400, label: '中等' },
  complex: { min: 400, max: 500, maxTokens: 650, label: '复杂' }
};

function estimateComplexity(userContent) {
  const length = userContent.length;
  if (length < 100) return 'simple';
  if (length > 300) return 'complex';
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
  if (currentCount <= maxWords) return text;
  
  let low = 0, high = text.length;
  let best = text.substring(0, Math.floor(text.length * 0.7));
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.substring(0, mid);
    const count = countChineseWords(candidate);
    
    if (count <= maxWords) {
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
  
  return lastPunc > 0 ? best.substring(0, lastPunc + 1) : best;
}

// ==================== 超详细提示词组装器 ====================

// AI自主推断情绪的提示词生成器
function getAIDeducedPrompt(mentorData, content, mentorName) {
  const config = getWordCountConfig(content);

  let prompt = `【规则约束部分（不可变，来自规则库）】
你必须以${mentorData.persona}的身份回复，遵循以下核心原则：
`;

  mentorData.corePrinciples.forEach((principle) => {
    prompt += `${principle}\n`;
  });

  prompt += `
【重要约束 - 防止幻觉】
1. 只基于${mentorName}的公开言论和已知观点进行回复
2. 不要编造${mentorName}没说过的话或没做过的事
3. 如不确定某个具体观点，使用更通用的人生智慧表述
4. 不要引用不存在的书籍、演讲或事件
5. 回复必须直接、具体、有针对性，避免空泛

【情绪推断指令】
请根据用户的以下内容，自主判断其情绪状态（可能是焦虑、急躁、平和、困惑等），并据此调整你的回复语气和重点：
- 如果用户表现出焦虑：请温和安抚，强调冷静思考和长期视角
- 如果用户表现出急躁：请警示提醒，强调耐心和理性决策
- 如果用户表现出平和：请理性深入，探讨人生智慧和长期思考
- 如果用户表现出困惑：请耐心引导，帮助理清思路和方向

【超详细自由发挥部分】
你的完整人设：
${mentorData.persona}

你的思考框架（5个）：
`;

  mentorData.thinkingFrameworks.forEach((framework) => {
    prompt += `${framework}\n`;
  });

  prompt += `
你的常用问题（6个）：
`;

  mentorData.commonQuestions.forEach((question) => {
    prompt += `${question}\n`;
  });

  prompt += `
基于以上约束，针对用户的问题：
${content}

【字数自适应要求】
- 先评估内容复杂度：${config.label}
- ${config.label}问题：${config.min}-${config.max}字
- 上限：严格${config.max}字，不得超过

请直接、具体、有针对性地回复，${config.min}-${config.max}字。无需重复约束条件。
`;

  return prompt;
}

// 历史数据兼容的提示词生成器
function getOriginalPrompt(mentorData, moodData, content, mentorName) {
  const config = getWordCountConfig(content);

  let prompt = `【规则约束部分（不可变，来自规则库）】
你必须以${mentorData.persona}的身份回复，遵循以下核心原则：
`;

  mentorData.corePrinciples.forEach((principle) => {
    prompt += `${principle}\n`;
  });

  prompt += `
【重要约束 - 防止幻觉】
1. 只基于${mentorName}的公开言论和已知观点进行回复
2. 不要编造${mentorName}没说过的话或没做过的事
3. 如不确定某个具体观点，使用更通用的人生智慧表述
4. 不要引用不存在的书籍、演讲或事件
5. 回复必须直接、具体、有针对性，避免空泛

用户当前心境：${moodData.name || '平和'}
- 语气必须：${moodData.tone}
- 重点必须：${moodData.focus}
- 必须涵盖这5个关键点：
`;

  moodData.keyPoints.forEach((point) => {
    prompt += `${point}\n`;
  });

  prompt += `
【超详细自由发挥部分】
你的完整人设：
${mentorData.persona}

你的思考框架（5个）：
`;

  mentorData.thinkingFrameworks.forEach((framework) => {
    prompt += `${framework}\n`;
  });

  prompt += `
你的常用问题（6个）：
`;

  mentorData.commonQuestions.forEach((question) => {
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

// 为不同导师生成个性化的系统提示词
function getMentorPrompt(mentor, mood, content) {
  const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['查理·芒格'];
  
  // mood兼容处理：AI推断 vs 历史数据
  if (mood === null || mood === '由AI推断' || !mood) {
    // AI从内容推断情绪
    return getAIDeducedPrompt(mentorData, content, mentor);
  } else {
    // 历史数据 - 使用原mood逻辑
    const moodData = mentorRules.moods[mood] || mentorRules.moods['平和'];
    return getOriginalPrompt(mentorData, moodData, content, mentor);
  }
}

// 调用 DeepSeek API
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

    if (response.data && response.data.choices && response.data.choices.length > 0) {
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

// 基于规则的智能回复生成器（临时方案，等AI能力开通后可替换）
function generateSmartReply(mentor, mood, content) {
  const mentorProfiles = {
    '查理·芒格': {
      opening: ['我注意到你在思考', '从你的描述来看', '让我从另一个角度分析'],
      principles: [
        '正如我常说的，思考需要多学科思维模型。',
        '反过来想，总是反过来想。',
        '在手里拿着锤子的人看来，世界就像一颗钉子。',
        '避免人类误判心理学中的常见陷阱至关重要。'
      ],
      advice: [
        '建议你建立自己的思维模型框架，',
        '不妨从逆向思考开始，',
        '记住，避免错误比追求完美更重要。'
      ]
    },
    '巴菲特': {
      opening: ['我理解你的想法', '从长期价值的角度看', '让我分享一些思考'],
      principles: [
        '时间是优秀品质的朋友，平庸品质的敌人。',
        '决策的第一条原则是不要犯不可挽回的错误。',
        '只做自己理解的事情。',
        '真正的优势比短期收益更重要。'
      ],
      advice: [
        '建议你专注于长期价值，',
        '保持耐心，让时间发挥作用，',
        '记住，短期是情绪的放大器，长期是价值的试金石。'
      ]
    },
    '段永平': {
      opening: ['我明白你的困惑', '从本分的角度看', '让我直接说'],
      principles: [
        '做对的事情，把事情做对。',
        '本分是最重要的价值观。',
        '价值观是最重要的核心竞争力。',
        '不要做不对的事情，即使短期有好处。'
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
  
  // 根据心境调整语气
  const moodAdjustments = {
    '焦虑': '情绪波动是常态，保持内心平和是关键。',
    '急躁': '急躁时更要停下来思考，慢就是快。',
    '平和': '平和的心态是长期成长的基础。',
    '困惑': '困惑时不妨回到基本原则思考。'
  };

  // 分析用户内容的关键词
  const keywords = extractKeywords(content);
  
  // 生成回复
  const opening = profile.opening[Math.floor(Math.random() * profile.opening.length)];
  const principle = profile.principles[Math.floor(Math.random() * profile.principles.length)];
  const advice = profile.advice[Math.floor(Math.random() * profile.advice.length)];
  const moodAdvice = moodAdjustments[mood] || '';

  let reply = `${opening}${keywords.length > 0 ? '，特别是关于' + keywords.slice(0, 2).join('和') + '的部分' : ''}。\n\n`;
  reply += `${principle}\n\n`;
  if (moodAdvice) {
    reply += `${moodAdvice}\n\n`;
  }
  reply += `${advice}结合你当前的情况，我建议你：\n`;
  reply += `1. 深入思考你提到的核心问题\n`;
  reply += `2. 建立自己的思考原则和框架\n`;
  reply += `3. 保持长期视角，避免短期情绪干扰\n\n`;
  reply += `记住，成长是一场马拉松，不是短跑。持续学习和反思，你会找到属于自己的人生智慧。`;

  return reply;
}

// 简单提取关键词
function extractKeywords(text) {
  const keywords = ['思考', '人生', '成长', '决策', '选择', '焦虑', '困惑', '目标', '行动', '学习', '反思', '原则'];
  const found = [];
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  }
  return found.slice(0, 3);
}

exports.main = async (event, context) => {
  const { letterId, replyContent, mentor, mood, content } = event;
  const db = cloud.database();

  try {
    // 如果传入了 replyContent，说明是从小程序端生成的回复，直接保存
    if (replyContent) {
      let processedReply = processReply(replyContent.trim());
      if (mentor) {
        processedReply = addAIDisclaimer(processedReply, mentor);
      }
      
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

    if (mentor && content) {
      const systemPrompt = getMentorPrompt(mentor, mood || '平和', content);
      
      let replyContent;
      try {
        replyContent = await callDeepSeekAPI(systemPrompt, content);
      } catch (aiErr) {
        console.log('AI调用失败，使用智能回复生成器:', aiErr.message);
        replyContent = generateSmartReply(mentor, mood || '平和', content);
      }
      
      let processedReply = processReply(replyContent);
      processedReply = addAIDisclaimer(processedReply, mentor);
      
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

    // 如果没有传入必要参数，返回错误
    return {
      success: false,
      error: '缺少必要参数',
      errorCode: 'MISSING_PARAMS'
    };

  } catch (err) {
    console.error("保存回复失败：", err);
    console.error("错误详情：", JSON.stringify(err, null, 2));
    
    // 记录错误到数据库（可选）
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