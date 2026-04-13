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

function getOpenIdFromContext(context) {
  const wxContext = cloud.getWXContext();
  return wxContext.OPENID || context.OPENID || (context.userInfo && context.userInfo.openId) || '';
}

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
    // 安全访问：如果 moods 不存在或 mood 不存在，使用默认的平和配置
    const defaultMood = {
      tone: '理性深入',
      focus: '深度思考、原则探讨',
      keyPoints: ['平和的心态是长期成长的基础', '深入探讨人生智慧和长期思考']
    };
    const moods = mentorRules.moods || {};
    const moodData = moods[mood] || moods['平和'] || defaultMood;
    return getOriginalPrompt(mentorData, moodData, content, mentor);
  }
}

// 调用 DeepSeek API
async function callDeepSeekAPI(systemPrompt, userContent, options = {}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在云函数环境变量中设置 DEEPSEEK_API_KEY');
  }

  const config = {
    ...getWordCountConfig(userContent),
    ...(options.wordCountConfig || {})
  };

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
    max_tokens: options.maxTokens || config.maxTokens
  };

  try {
    console.log('开始调用 DeepSeek API...');
    console.log('字数配置:', config.label, config.max, '字, max_tokens:', config.maxTokens);
    
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 45000
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const choice = response.data.choices[0];
      let reply = choice.message?.content;
      
      if (reply) {
        reply = reply.trim();
        console.log('DeepSeek API 调用成功，原始长度:', reply.length, '字符');
        
        if (!options.skipTruncate) {
          reply = truncateByChineseWords(reply, config.max);
          console.log('截断后长度:', countChineseWords(reply), '字');
        }
        
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

const fieldOrder = [
  { key: "价值思维领域", name: "价值思维", color: "#8b4513" },
  { key: "创业创新领域", name: "创业创新", color: "#2ecc71" },
  { key: "心理学领域", name: "心理学", color: "#9b59b6" },
  { key: "哲学领域", name: "哲学", color: "#34495e" }
];

function sortMentorsByField(mentors, mentorsByDomain) {
  const result = [];
  for (const field of fieldOrder) {
    const domainMentors = mentorsByDomain[field.key] || [];
    for (const m of mentors) {
      if (domainMentors.includes(m) && !result.includes(m)) {
        result.push(m);
      }
    }
  }
  return result;
}

function extractContextSummary(userQuestion, discussions) {
  const summary = {
    userQuestion: userQuestion.length > 100 ? userQuestion.substring(0, 100) + "..." : userQuestion,
    discussedMentors: [],
    consensusPoints: [],
    disagreementPoints: [],
    focusForNext: ""
  };

  for (const d of discussions) {
    const replyPreview = d.reply.length > 50 ? d.reply.substring(0, 50) + "..." : d.reply;
    summary.discussedMentors.push({
      mentor: d.mentor,
      coreViewpoint: replyPreview,
      stance: "neutral"
    });
  }

  if (discussions.length > 0) {
    summary.focusForNext = "请基于以上讨论继续发表你的观点。";
  }

  return summary;
}

function analyzeDiscussionStructure(userQuestion, discussions) {
  const structure = {
    userQuestion: userQuestion,
    summary: "",
    consensusPoints: [],
    disagreementPoints: [],
    keyInsights: [],
    mentors: discussions.map(d => d.mentor)
  };

  const keywords = ['长期', '原则', '价值', '成长', '思考', '耐心', '本分', '用户', '创新', '自由', '责任'];
  const foundKeywords = new Set();

  for (const d of discussions) {
    for (const keyword of keywords) {
      if (d.reply.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    }
  }

  structure.keyInsights = Array.from(foundKeywords);

  if (discussions.length >= 2) {
    structure.consensusPoints = [
      "保持长期视角",
      "重视原则和价值观",
      "持续学习和反思"
    ];
  }

  if (discussions.length >= 3) {
    structure.disagreementPoints = [
      "不同领域导师的侧重点有所差异",
      "方法论层面的多元化视角"
    ];
  }

  if (discussions.length > 0) {
    const firstReply = discussions[0].reply;
    structure.summary = firstReply.length > 100 ? firstReply.substring(0, 100) + "..." : firstReply;
  }

  return structure;
}

function evaluateReplyQuality(mentorName, replyContent, userQuestion, mentorData, previousReplies = []) {
  let score = 0;
  const details = {
    personaMatch: 0,
    relevance: 0,
    uniqueness: 0,
    depth: 0
  };

  const corePrinciples = mentorData?.corePrinciples || [];
  let matchCount = 0;
  for (const principle of corePrinciples) {
    const keywords = principle.substring(0, 10);
    if (replyContent.includes(keywords) || 
        principle.split('').some(char => replyContent.includes(char))) {
      matchCount++;
    }
  }
  details.personaMatch = Math.min(0.4, 0.2 + matchCount * 0.05);
  score += details.personaMatch;

  const questionKeywords = userQuestion.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
  let relevanceCount = 0;
  for (let i = 0; i < questionKeywords.length; i++) {
    if (replyContent.includes(questionKeywords[i])) {
      relevanceCount++;
    }
  }
  details.relevance = Math.min(0.3, 0.15 + relevanceCount * 0.02);
  score += details.relevance;

  if (previousReplies.length > 0) {
    let uniqueWords = new Set();
    let overlapCount = 0;
    const replyWords = replyContent.replace(/[^\u4e00-\u9fa5]/g, '');
    
    for (const prev of previousReplies) {
      const prevWords = prev.replace(/[^\u4e00-\u9fa5]/g, '');
      for (let i = 0; i < replyWords.length - 2; i++) {
        const gram = replyWords.substring(i, i + 3);
        if (prevWords.includes(gram)) {
          overlapCount++;
        }
      }
    }
    
    details.uniqueness = Math.max(0, 0.2 - overlapCount * 0.01);
  } else {
    details.uniqueness = 0.2;
  }
  score += details.uniqueness;

  const lengthScore = Math.min(0.1, replyContent.length * 0.0005);
  const hasQuestions = replyContent.includes('?') || replyContent.includes('？');
  const hasExclamations = replyContent.includes('!') || replyContent.includes('！');
  details.depth = lengthScore + (hasQuestions ? 0.03 : 0) + (hasExclamations ? 0.02 : 0);
  score += details.depth;

  return {
    score: Math.min(1, Math.max(0, score)),
    details: details,
    passed: score >= 0.7
  };
}

function getIncubatorMentors(mentors) {
  const defaultMentors = ['查理·芒格', '张小龙', '荣格'];
  if (!Array.isArray(mentors) || mentors.length === 0) {
    return defaultMentors;
  }

  return mentors
    .filter(Boolean)
    .slice(0, 3)
    .map(name => mentorRules.mentors[name] ? name : null)
    .filter(Boolean);
}

function buildIncubatorDimensions() {
  return [
    '想法内核',
    '目标对象',
    '关键假设',
    '阻力与风险',
    '最小验证路径'
  ];
}

function getIncubatorPrompt(content, mentors) {
  const dimensions = buildIncubatorDimensions();
  const mentorBlocks = mentors.map((name) => {
    const mentorData = mentorRules.mentors[name] || {};
    const principles = (mentorData.corePrinciples || []).slice(0, 2).join('\n');
    return `导师：${name}\n人设：${mentorData.persona || name}\n核心原则：\n${principles}`;
  }).join('\n\n');

  return `你正在执行“思想孵化器”任务。

目标：把一个还不成熟的想法，拆成可验证、可推进、可规避风险的结构化方案。

请参考以下导师视角：
${mentorBlocks}

固定输出要求：
1. 使用中文
2. 只输出结构化正文，不要解释规则
3. 必须完整覆盖以下5个一级章节：${dimensions.join('、')}
4. 必须在最后输出一级章节“未来7天行动清单”
5. 每个一级章节都必须有明确的小点说明，不能只写一句空泛概括
6. 如果信息不足，也必须在对应章节写出“当前缺失信息”和“如何补齐”
7. 总篇幅控制在500-800字，优先完整覆盖，不要冗长铺陈
8. 语气务实，避免空泛鸡汤

固定输出格式如下，必须严格遵守：
# 思想孵化报告：{一句话命名}
## 一、想法内核
## 二、目标对象
## 三、关键假设
## 四、阻力与风险
## 五、最小验证路径
## 六、未来7天行动清单

请围绕以下初始想法生成一份思想孵化报告：
${content}`;
}

function sanitizeIncubatorReport(report) {
  if (!report) return '';

  return report
    .replace(/\n+##\s*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ensureIncubatorActionPlan(report) {
  const sanitizedReport = sanitizeIncubatorReport(report);
  if (sanitizedReport.includes('## 六、未来7天行动清单')) {
    return sanitizedReport;
  }

  const fallbackPlan = `\n\n## 六、未来7天行动清单
1. 第1天：用一句话重新定义这个想法要解决的核心问题，并写出“不做这个产品会怎样”。
2. 第2天：列出3类最可能使用它的目标用户，明确谁是第一批种子用户。
3. 第3天：访谈至少3位潜在用户，验证他们是否真的有这个痛点，而不是你主观想象的痛点。
4. 第4天：把“最小验证路径”压缩成一个不需要完整开发也能测试的MVP方案。
5. 第5天：整理访谈和验证结果，写出当前最关键的3个假设与风险。
6. 第6天：决定下周只推进一个最关键动作，避免同时做太多方向。
7. 第7天：复盘这周的发现，判断这个想法应该继续、收缩，还是调整方向。`;

  return sanitizedReport + fallbackPlan;
}

function getStructureAnalysisConfig(analysisType) {
  if (analysisType === 'product') {
    return {
      title: '产品结构分析报告',
      dimensions: ['天（外部压力）', '人（核心能力）', '地（边界拓展）', '结构形态判定', '优化建议'],
      promptLabel: '产品',
      asciiLabel: '产品结构快照',
      section6Heading: '## 六、优化建议'
    };
  }

  return {
    title: '公司结构分析报告',
    dimensions: ['天（外部压力）', '人（向心力）', '地（离心力）', '结构形态判定', '关键洞察'],
    promptLabel: '公司',
    asciiLabel: '涡旋结构快照',
    section6Heading: '## 六、关键洞察'
  };
}

/**
 * 组装结构分析任务的系统提示：章节标题与后端校验完全一致，并强制第六节三条完整编号句。
 */
function getStructureAnalysisPrompt(content, analysisType) {
  const config = getStructureAnalysisConfig(analysisType);
  const d = config.dimensions;

  return `你正在执行「${config.promptLabel}结构分析」任务。只输出一份报告正文，不要输出前言、后记或任何与模板无关的说明。

【硬性规则】
1. 全文使用简体中文。
2. 只使用 Markdown，且一级标题必须以 # 开头，二级标题必须以 ## 开头；禁止省略任何一个二级标题。
3. 下列六个二级标题必须逐字一致（含序号与顿号），禁止改写、合并或调换顺序：
   - ## 一、${d[0]}
   - ## 二、${d[1]}
   - ## 三、${d[2]}
   - ## 四、${d[3]}
   - ## 五、ASCII结构快照
   - ${config.section6Heading}
4. 「## 五、ASCII结构快照」下必须用纯文本字符（如 + - | / 空格）绘制至少 4 行的简化示意图，体现${config.promptLabel}结构关系即可，勿用代码块围栏。
5. 全文总字数约 700～1000 字（中文为主）。若篇幅紧张，宁可压缩第一至四节的篇幅，也必须写满第六节；禁止在第六节使用未完句或以「、」「：」结尾。
6. 第六节必须恰好包含 3 条编号要点，格式为三行，且每条独立成行，示例格式（内容请替换为针对材料的结论）：
   1. 第一句完整陈述。
   2. 第二句完整陈述。
   3. 第三句完整陈述。

【输出骨架（把 {对象名称} 换成材料中的具体名称）】
# ${config.title}：{对象名称}
## 一、${d[0]}
（本节正文）
## 二、${d[1]}
（本节正文）
## 三、${d[2]}
（本节正文）
## 四、${d[3]}
（本节正文）
## 五、ASCII结构快照
（ASCII 示意图，至少 4 行）
${config.section6Heading}
1. …
2. …
3. …

【用户提供的材料】
${content}`;
}

function sanitizeStructureAnalysisReport(report) {
  if (!report) return '';

  return report
    .replace(/\n+##\s*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ensureStructureAnalysisSummary(report, analysisType) {
  const sanitizedReport = sanitizeStructureAnalysisReport(report);
  const summaryHeading = getStructureAnalysisConfig(analysisType).section6Heading;
  const fallbackSummary = analysisType === 'product'
    ? `\n\n## 六、优化建议
1. 先收缩问题边界，明确产品只解决一个最高频、最高痛感场景。
2. 用最小可验证版本先确认用户是否愿意持续使用，再决定是否扩展功能矩阵。
3. 把产品核心能力、用户价值和商业化路径拆开验证，避免一次性做全。`
    : `\n\n## 六、关键洞察
1. 当前结构的优势在于核心驱动力清晰，能够通过单点强能力撬动整体增长。
2. 当前结构的风险在于边界扩张和生态承压之间可能出现失衡，导致长期成本上升。
3. 下一步应重点验证核心能力是否还能持续支撑外部压力变化，而不是只追求短期扩张。`;

  if (!sanitizedReport.includes(summaryHeading)) {
    return sanitizedReport + fallbackSummary;
  }

  const parts = sanitizedReport.split(summaryHeading);
  const summaryBody = parts.slice(1).join(summaryHeading).trim();
  const summaryLines = summaryBody
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const numberedItems = summaryLines.filter(line => /^\d+\./.test(line));
  const seemsTruncated =
    summaryBody.length < 120 ||
    numberedItems.length < 3 ||
    /\d+\.\s*$/.test(summaryBody) ||
    /[，、：]$/.test(summaryBody);

  if (!seemsTruncated) {
    return sanitizedReport;
  }

  return `${parts[0].trim()}\n\n${fallbackSummary.trim()}`;
}

exports.main = async (event, context) => {
  const { letterId, replyContent, mentor, mood, content, type, mentors, analysisType } = event;
  const db = cloud.database();
  
  // 全局计时器
  const globalStartTime = Date.now();
  console.log('========== 云函数开始执行 ==========');
  console.log('请求类型:', type, '| 时间:', new Date().toISOString());

  try {
    if (type === 'structure_analysis' && content) {
      console.log('【结构分析】开始处理');
      const stepStartTime = Date.now();
      
      // 步骤1：获取用户身份
      let stepTime = Date.now();
      const openid = getOpenIdFromContext(context);
      console.log('【步骤1】获取openid耗时:', Date.now() - stepTime, 'ms', '| openid:', openid ? '已获取' : '未获取');
      
      if (!openid) {
        return {
          success: false,
          error: '未获取到用户身份，请重新登录后再试',
          errorCode: 'MISSING_OPENID'
        };
      }

      // 步骤2：构建提示词
      stepTime = Date.now();
      const config = getStructureAnalysisConfig(analysisType);
      const prompt = getStructureAnalysisPrompt(content, analysisType);
      console.log('【步骤2】构建提示词耗时:', Date.now() - stepTime, 'ms', '| 提示词长度:', prompt.length, '字符');

      let report;
      
      // 步骤3：调用DeepSeek API
      stepTime = Date.now();
      console.log('【步骤3】开始调用DeepSeek API...');
      try {
        report = await callDeepSeekAPI(prompt, content, {
          maxTokens: 1000,
          timeout: 45000,
          skipTruncate: true,
          wordCountConfig: {
            label: '结构分析',
            min: 700,
            max: 1000,
            maxTokens: 1000
          }
        });
        console.log('【步骤3】DeepSeek API调用成功，耗时:', Date.now() - stepTime, 'ms', '| 返回内容长度:', report ? report.length : 0, '字符');
      } catch (err) {
        const message = err.message || '';
        console.log('【步骤3】DeepSeek API首次调用失败:', message, '| 耗时:', Date.now() - stepTime, 'ms');
        const shouldRetry = message.includes('stream has been aborted') || message.includes('timeout');
        if (!shouldRetry) {
          throw err;
        }

        console.log('【步骤3-重试】开始重试调用DeepSeek API...');
        stepTime = Date.now();
        report = await callDeepSeekAPI(prompt, content, {
          maxTokens: 900,
          timeout: 45000,
          skipTruncate: true,
          wordCountConfig: {
            label: '结构分析-重试',
            min: 700,
            max: 900,
            maxTokens: 900
          }
        });
        console.log('【步骤3-重试】DeepSeek API重试成功，耗时:', Date.now() - stepTime, 'ms');
      }

      // 步骤4：数据处理
      stepTime = Date.now();
      report = ensureStructureAnalysisSummary(report, analysisType);
      console.log('【步骤4】数据处理耗时:', Date.now() - stepTime, 'ms');

      // 步骤5：数据库写入
      stepTime = Date.now();
      const reportData = {
        _openid: openid,
        analysisType: analysisType === 'product' ? 'product' : 'company',
        content: content,
        dimensions: config.dimensions,
        report: report,
        status: 'completed',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      const addResult = await db.collection('structure_analysis_reports').add({
        data: reportData
      });
      console.log('【步骤5】数据库写入耗时:', Date.now() - stepTime, 'ms', '| 记录ID:', addResult._id);

      const totalTime = Date.now() - globalStartTime;
      console.log('========== 结构分析完成，总耗时:', totalTime, 'ms ==========');

      return {
        success: true,
        data: {
          _id: addResult._id,
          title: config.title,
          analysisType: analysisType === 'product' ? 'product' : 'company',
          dimensions: config.dimensions,
          report: report,
          _timing: { totalTime, unit: 'ms' }
        }
      };
    }

    if (type === 'incubator' && content) {
      console.log('【思想孵化器】开始处理');
      const stepStartTime = Date.now();
      
      // 步骤1：获取用户身份
      let stepTime = Date.now();
      const openid = getOpenIdFromContext(context);
      console.log('【步骤1】获取openid耗时:', Date.now() - stepTime, 'ms', '| openid:', openid ? '已获取' : '未获取');
      
      if (!openid) {
        return {
          success: false,
          error: '未获取到用户身份，请重新登录后再试',
          errorCode: 'MISSING_OPENID'
        };
      }

      // 步骤2：获取导师和构建提示词
      stepTime = Date.now();
      const incubatorMentors = getIncubatorMentors(mentors);
      const prompt = getIncubatorPrompt(content, incubatorMentors);
      console.log('【步骤2】构建提示词耗时:', Date.now() - stepTime, 'ms', '| 导师:', incubatorMentors.join(','), '| 提示词长度:', prompt.length, '字符');

      let report;
      
      // 步骤3：调用DeepSeek API
      stepTime = Date.now();
      console.log('【步骤3】开始调用DeepSeek API...');
      try {
        report = await callDeepSeekAPI(prompt, content, {
          maxTokens: 800,
          timeout: 35000,
          skipTruncate: true,
          wordCountConfig: {
            label: '思想孵化器',
            min: 500,
            max: 800,
            maxTokens: 800
          }
        });
        console.log('【步骤3】DeepSeek API调用成功，耗时:', Date.now() - stepTime, 'ms', '| 返回内容长度:', report ? report.length : 0, '字符');
      } catch (err) {
        const message = err.message || '';
        console.log('【步骤3】DeepSeek API首次调用失败:', message, '| 耗时:', Date.now() - stepTime, 'ms');
        const shouldRetry = message.includes('stream has been aborted') || message.includes('timeout');
        if (!shouldRetry) {
          throw err;
        }

        console.log('【步骤3-重试】开始重试调用DeepSeek API...');
        stepTime = Date.now();
        report = await callDeepSeekAPI(prompt, content, {
          maxTokens: 600,
          timeout: 30000,
          skipTruncate: true,
          wordCountConfig: {
            label: '思想孵化器-重试',
            min: 400,
            max: 600,
            maxTokens: 600
          }
        });
        console.log('【步骤3-重试】DeepSeek API重试成功，耗时:', Date.now() - stepTime, 'ms');
      }

      // 步骤4：数据处理
      stepTime = Date.now();
      report = ensureIncubatorActionPlan(report);
      console.log('【步骤4】数据处理耗时:', Date.now() - stepTime, 'ms');

      // 步骤5：数据库写入
      stepTime = Date.now();
      const dimensions = buildIncubatorDimensions();
      const reportData = {
        _openid: openid,
        content: content,
        mentors: incubatorMentors,
        dimensions: dimensions,
        report: report,
        status: 'completed',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      const addResult = await db.collection('incubator_reports').add({
        data: reportData
      });
      console.log('【步骤5】数据库写入耗时:', Date.now() - stepTime, 'ms', '| 记录ID:', addResult._id);

      const totalTime = Date.now() - globalStartTime;
      console.log('========== 思想孵化器完成，总耗时:', totalTime, 'ms ==========');

      return {
        success: true,
        data: {
          _id: addResult._id,
          title: '思想孵化报告',
          mentors: incubatorMentors,
          dimensions: dimensions,
          report: report,
          _timing: { totalTime, unit: 'ms' }
        }
      };
    }

    if (type === 'repairRoundtableOwnership') {
      const openid = getOpenIdFromContext(context);
      const roundtableIds = Array.isArray(event.roundtableIds) ? event.roundtableIds.slice(0, 10) : [];

      if (!openid) {
        return { success: false, error: '未获取到用户身份', errorCode: 'MISSING_OPENID' };
      }

      const repairedIds = [];
      for (const id of roundtableIds) {
        if (!id) continue;
        const doc = await db.collection('roundtable_discussions').doc(id).get().catch(() => null);
        if (!doc || !doc.data) continue;
        if (doc.data._openid && doc.data._openid !== openid) continue;
        if (!doc.data._openid) {
          await db.collection('roundtable_discussions').doc(id).update({
            data: {
              _openid: openid
            }
          });
          repairedIds.push(id);
        }
      }

      return {
        success: true,
        data: {
          repairedIds
        }
      };
    }

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

    if (type === 'roundtable' && mentors && mentors.length > 0 && content) {
      const openid = getOpenIdFromContext(context);
      if (!openid) {
        return {
          success: false,
          error: '未获取到用户身份，请重新登录后再试',
          errorCode: 'MISSING_OPENID'
        };
      }

      const mentorsByDomain = {
        '价值思维领域': ['查理·芒格', '巴菲特', '格雷厄姆'],
        '创业创新领域': ['段永平', '张小龙', '乔布斯', '马斯克', '贝佐斯', '彼得·蒂尔'],
        '心理学领域': ['荣格', '弗洛伊德', '弗洛姆', '阿德勒', '马斯洛'],
        '哲学领域': ['老子', '孔子', '苏格拉底', '柏拉图', '亚里士多德', '尼采', '维特根斯坦']
      };

      const sortedMentors = sortMentorsByField(mentors, mentorsByDomain);
      const discussions = [];
      
      for (const m of sortedMentors) {
        try {
          const systemPrompt = getMentorPrompt(m, '平和', content);
          const mentorData = mentorRules.mentors[m] || mentorRules.mentors['查理·芒格'];
          const previousReplies = discussions.map(d => d.reply);
          
          let reply = null;
          let qualityResult = null;
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries && (!qualityResult || !qualityResult.passed)) {
            try {
              if (retryCount > 0) {
                console.log(`[${m}] 第${retryCount}次重试生成回复...`);
              }
              
              reply = await callDeepSeekAPI(systemPrompt, content);
              
              qualityResult = evaluateReplyQuality(
                m, 
                reply, 
                content, 
                mentorData, 
                previousReplies
              );
              
              console.log(`[${m}] 回复质量评分: ${(qualityResult.score * 100).toFixed(1)}分`, qualityResult.details);
              
              if (!qualityResult.passed && retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (aiErr) {
              console.log(`[${m}] AI调用失败，使用智能回复生成器:`, aiErr.message);
              reply = generateSmartReply(m, '平和', content);
              qualityResult = { score: 0.8, passed: true, details: {} };
              break;
            }
          }
          
          let processedReply = processReply(reply);
          processedReply = addAIDisclaimer(processedReply, m);
          
          let field = '其他';
          for (const f of fieldOrder) {
            if ((mentorsByDomain[f.key] || []).includes(m)) {
              field = f.name;
              break;
            }
          }
          
          discussions.push({
            mentor: m,
            field: field,
            reply: processedReply,
            qualityScore: qualityResult?.score || 0,
            qualityDetails: qualityResult?.details || {},
            retryCount: retryCount,
            timestamp: Date.now(),
            contextSummary: extractContextSummary(content, discussions)
          });
        } catch (err) {
          console.error(`生成${m}回复失败:`, err);
        }
      }

      const discussionStructure = analyzeDiscussionStructure(content, discussions);
      
      const addResult = await db.collection('roundtable_discussions').add({
        data: {
          _openid: openid,
          content: content,
          mentors: sortedMentors,
          discussions: discussions,
          structure: discussionStructure,
          totalCost: 3,
          createTime: db.serverDate()
        }
      });
      
      const roundtableId = addResult._id;
      
      let remainingStamps = 2;
      try {
        const userResult = await db.collection('users').where({
          _openid: openid
        }).get();
        
        if (userResult.data.length > 0) {
          remainingStamps = (userResult.data[0].stamps || 2) - 3;
          await db.collection('users').where({
            _openid: openid
          }).update({
            data: {
              stamps: db.command.inc(-3)
            }
          });
        }
      } catch (userErr) {
        console.error('更新用户积分失败:', userErr);
      }

      return {
        success: true,
        data: {
          roundtableId: roundtableId,
          content: content,
          mentors: sortedMentors,
          discussions: discussions,
          totalCost: 3,
          remainingStamps: remainingStamps,
          createTime: new Date().toISOString()
        }
      };
    }

    if (mentor && content) {
      const systemPrompt = getMentorPrompt(mentor, mood || '平和', content);
      const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['查理·芒格'];
      
      let replyContent = null;
      let qualityResult = null;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries && (!qualityResult || !qualityResult.passed)) {
        try {
          if (retryCount > 0) {
            console.log(`[${mentor}] 第${retryCount}次重试生成回复...`);
          }
          
          replyContent = await callDeepSeekAPI(systemPrompt, content);
          
          qualityResult = evaluateReplyQuality(
            mentor, 
            replyContent, 
            content, 
            mentorData, 
            []
          );
          
          console.log(`[${mentor}] 回复质量评分: ${(qualityResult.score * 100).toFixed(1)}分`, qualityResult.details);
          
          if (!qualityResult.passed && retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (aiErr) {
          console.log(`[${mentor}] AI调用失败，使用智能回复生成器:`, aiErr.message);
          replyContent = generateSmartReply(mentor, mood || '平和', content);
          qualityResult = { score: 0.8, passed: true, details: {} };
          break;
        }
      }
      
      let processedReply = processReply(replyContent);
      processedReply = addAIDisclaimer(processedReply, mentor);
      
      await db.collection('letters').doc(letterId).update({
        data: {
          replyContent: processedReply,
          replyTime: db.serverDate(),
          qualityScore: qualityResult?.score || 0,
          qualityDetails: qualityResult?.details || {},
          retryCount: retryCount
        }
      });

      return {
        success: true,
        replyLength: processedReply.length,
        qualityScore: qualityResult?.score || 0
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
