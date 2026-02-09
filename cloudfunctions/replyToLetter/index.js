const cloud = require('wx-server-sdk');
const axios = require('axios');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });


// 为不同投资大师生成个性化的系统提示词
function getMentorPrompt(mentor, mood, content) {
  const mentorProfiles = {
    '查理·芒格': {
      style: '思维模型、逆向思考、多学科思维',
      tone: '睿智、深刻、喜欢用比喻和格言',
      focus: '强调思维模型的重要性，用跨学科知识分析问题，避免常见的人类误判心理',
      examples: '常引用"在手里拿着锤子的人看来，世界就像一颗钉子"、"反过来想，总是反过来想"等'
    },
    '巴菲特': {
      style: '价值投资、长期持有、护城河',
      tone: '温和、耐心、用简单语言解释复杂概念',
      focus: '强调企业内在价值、长期复利、只投资自己理解的生意',
      examples: '常提到"时间是优秀企业的朋友，平庸企业的敌人"、"投资的第一条原则是永远不要亏损"'
    },
    '段永平': {
      style: '本分、做对的事情、把事情做对',
      tone: '朴实、直接、不绕弯子',
      focus: '强调本分文化、企业文化的重要性、做对的事情比把事情做对更重要',
      examples: '常说"本分"、"做对的事情，把事情做对"、"企业文化是最重要的护城河"'
    },
    '张小龙': {
      style: '用户体验、极简设计、产品思维',
      tone: '低调、理性、注重细节',
      focus: '强调以用户为中心，追求极简设计，注重产品的本质和用户体验',
      examples: '常提到"用户体验是第一位的"、"好的产品是用完即走"、"让创造发挥价值"'
    },
    '乔布斯': {
      style: '创新设计、用户体验、完美主义',
      tone: '激情、追求完美、富有远见',
      focus: '强调产品设计的重要性，追求完美的用户体验，将科技与艺术结合',
      examples: '常提到"Stay hungry, Stay foolish"、"设计不仅仅是外观和感觉，设计是如何工作的"'
    },
    '马斯克': {
      style: '创新思维、长期愿景、技术驱动',
      tone: '激进、乐观、充满激情',
      focus: '强调科技创新的力量，勇于挑战传统，追求人类未来的宏大目标',
      examples: '常提到"殖民火星"、"加速可持续能源转型"、"第一性原理思考"'
    }
  };

  const profile = mentorProfiles[mentor] || mentorProfiles['查理·芒格'];
  
  // 根据用户心境调整回复风格
  const moodGuidance = {
    '焦虑': '用户当前处于焦虑状态，需要给予理性分析和心理安抚，帮助他看清长期价值',
    '贪婪': '用户可能被市场情绪冲昏头脑，需要提醒风险，强调安全边际和理性决策',
    '平和': '用户心态平和，可以深入探讨投资理念和长期思考',
    '困惑': '用户对投资方向感到困惑，需要帮助他理清思路，找到核心问题'
  };

  const moodGuide = moodGuidance[mood] || '';

  // 分析用户内容的关键点（简单提取前200字作为上下文）
  const contentPreview = content.substring(0, 200).replace(/\n/g, ' ');

  return `你是投资大师${mentor}，正在回复一位投资者的来信。

**你的风格特点：**
- ${profile.style}
- 语言风格：${profile.tone}
- 核心关注：${profile.focus}
- 典型表达：${profile.examples}

**当前情况：**
- 用户心境：${mood}。${moodGuide}
- 用户来信的核心内容：${contentPreview}...

**回复要求：**
1. 深入分析用户来信中提到的投资思考、困惑或决策
2. 结合你的投资理念，给出具体、有针对性的建议
3. 不要使用模板化的回复，要根据用户的具体内容给出独特见解
4. 保持${profile.tone}的语言风格，但要让回复充满智慧和洞察力
5. 如果用户提到了具体的公司、行业或投资决策，要针对性地分析
6. 回复长度控制在300-500字，要言之有物，避免空泛

现在，请以${mentor}的身份，针对用户的来信给出你的回响：`;
}

// 调用 DeepSeek API
async function callDeepSeekAPI(systemPrompt, userContent) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在云函数环境变量中设置 DEEPSEEK_API_KEY');
  }

  // DeepSeek API 端点
  const apiUrl = 'https://api.deepseek.com/chat/completions';
  
  // 构建请求参数（DeepSeek API 格式）
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
    max_tokens: 500
  };

  try {
    console.log('开始调用 DeepSeek API...');
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });

    // 解析响应（DeepSeek 格式）
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const choice = response.data.choices[0];
      const reply = choice.message?.content;
      
      if (reply) {
        console.log('DeepSeek API 调用成功，生成了', reply.length, '字符');
        return reply.trim();
      }
    }

    // 如果响应中有 error 信息
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
  
  // 根据心境调整语气
  const moodAdjustments = {
    '焦虑': '市场波动是常态，保持理性是关键。',
    '贪婪': '贪婪时更要谨慎，安全边际不可忽视。',
    '平和': '平和的心态是长期投资的基础。',
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
  reply += `2. 建立自己的投资原则和框架\n`;
  reply += `3. 保持长期视角，避免短期情绪干扰\n\n`;
  reply += `记住，投资是一场马拉松，不是短跑。持续学习和反思，你会找到属于自己的投资之道。`;

  return reply;
}

// 简单提取关键词
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

exports.main = async (event, context) => {
  const { letterId, replyContent, mentor, mood, content } = event;
  const db = cloud.database();

  try {
    // 如果传入了 replyContent，说明是从小程序端生成的回复，直接保存
    if (replyContent) {
      await db.collection('letters').doc(letterId).update({
        data: {
          replyContent: replyContent.trim(),
          status: 'replied',
          replyTime: db.serverDate()
        }
      });

      return { 
        success: true,
        replyLength: replyContent.length
      };
    }

    // 如果传入了 mentor, mood, content，说明需要云函数生成回复
    if (mentor && content) {
      const systemPrompt = getMentorPrompt(mentor, mood || '平和', content);
      
      // 尝试调用 DeepSeek API
      let replyContent;
      try {
        replyContent = await callDeepSeekAPI(systemPrompt, content);
      } catch (aiErr) {
        console.log('AI调用失败，使用智能回复生成器:', aiErr.message);
        // 回退到基于规则的智能回复生成器
        replyContent = generateSmartReply(mentor, mood || '平和', content);
      }
      
      // 保存生成的回复，但不改变status（保持pending，由前端根据replyExpectTime判断是否显示）
      await db.collection('letters').doc(letterId).update({
        data: {
          replyContent: replyContent,
          // status 保持 'pending'，由detail页面根据replyExpectTime判断是否显示
          replyTime: db.serverDate()
        }
      });

      return {
        success: true,
        replyLength: replyContent.length
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