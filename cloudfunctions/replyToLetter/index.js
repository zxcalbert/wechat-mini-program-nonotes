const cloud = require('wx-server-sdk');
const axios = require('axios');
const sensitiveWordDetector = require('./sensitiveWordDetector');
const mentorRules = require('./mentorRules.json');
const prompts = require('./prompts');
console.log('已加载分析方法规则，共', Object.keys(mentorRules.mentors).length, '种方法');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function getOpenIdFromContext(context) {
  const wxContext = cloud.getWXContext();
  return wxContext.OPENID || context.OPENID || (context.userInfo && context.userInfo.openId) || '';
}

function processReply(replyContent) {
  const detection = sensitiveWordDetector.detect(replyContent);

  if (detection.isHighSensitive) {
    return "由于内容合规性要求，无法针对这个话题给出具体分析。建议从更宏观的角度思考问题，关注原则和方法论。";
  }

  return replyContent;
}

// 添加AI免责声明
function addAIDisclaimer(replyContent, methodName) {
  const aiDisclaimer = `\n\n---\n*以上分析基于${methodName}分析框架，仅供参考学习使用。AI生成内容不代表任何特定个人或机构的观点，不构成任何专业建议。*`;
  return replyContent + aiDisclaimer;
}

// ==================== 字数自适应引擎 ====================
const wordCountConfig = prompts.wordCountConfig;
const estimateComplexity = prompts.estimateComplexity;
const getWordCountConfig = prompts.getWordCountConfig;

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

// ==================== 提示词组装器（从 prompts.js 引入） ====================
const getAIDeducedPrompt = prompts.getAIDeducedPrompt;
const getOriginalPrompt = prompts.getOriginalPrompt;
const getMindmapPrompt = prompts.getMindmapPrompt;

// 为不同分析方法生成个性化的系统提示词
function getMentorPrompt(mentor, mood, content) {
  const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['多元思维模型分析'];
  
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
  const methodProfiles = {
    '多元思维模型分析': {
      framework: '多元思维模型分析',
      principles: [
        '反过来想，总是反过来想——从反面角度审视问题往往更有价值。',
        '多学科思维模型能够帮助避免单一视角的盲区。',
        '避免人类误判心理学中的常见陷阱至关重要。'
      ],
      analysis: [
        '从多学科角度分析，',
        '逆向思考该问题时，',
        '避免常见认知偏误，'
      ]
    },
    '价值投资分析框架': {
      framework: '价值投资分析框架',
      principles: [
        '时间是优秀品质的朋友，平庸品质的敌人。',
        '决策的第一条原则是不要犯不可挽回的错误。',
        '只做自己理解的事情。'
      ],
      analysis: [
        '从长期价值角度分析，',
        '基于安全边际原则，',
        '关注内在价值而非短期波动，'
      ]
    },
    '第一性原理分析': {
      framework: '第一性原理分析',
      principles: [
        '第一性原理思考是解决问题的关键。',
        '从物理本质拆解问题，而非从现状出发。',
        '创新不是线性的，需要跳跃式思维。'
      ],
      analysis: [
        '从第一性原理出发，',
        '回归问题本质分析，',
        '拆解到最基本的事实，'
      ]
    }
  };

  const profile = methodProfiles[mentor] || methodProfiles['多元思维模型分析'];
  
  const keywords = extractKeywords(content);
  
  const principle = profile.principles[Math.floor(Math.random() * profile.principles.length)];
  const analysis = profile.analysis[Math.floor(Math.random() * profile.analysis.length)];

  let reply = `基于${profile.framework}的分析：\n\n`;
  reply += `${analysis}${keywords.length > 0 ? '特别是关于' + keywords.slice(0, 2).join('和') + '的方面' : ''}。\n\n`;
  reply += `${principle}\n\n`;
  reply += `综合分析建议：\n`;
  reply += `1. 深入思考核心问题，建立分析框架\n`;
  reply += `2. 从多角度审视，避免单一视角的局限\n`;
  reply += `3. 保持长期视角，关注本质而非表象\n\n`;
  reply += `以上分析基于${profile.framework}，仅供参考。`;

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
  { key: "价值思维", name: "价值思维", color: "#8b4513" },
  { key: "创业创新", name: "创业创新", color: "#2ecc71" },
  { key: "心理学", name: "心理学", color: "#9b59b6" },
  { key: "哲学", name: "哲学", color: "#34495e" }
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
      "不同领域分析方法的侧重点有所差异",
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
    methodologyFidelity: 0,
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
  details.methodologyFidelity = Math.min(0.4, 0.2 + matchCount * 0.05);
  score += details.methodologyFidelity;

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
  const defaultMethods = ['多元思维模型分析', '极简产品分析', '原型心理分析'];
  if (!Array.isArray(mentors) || mentors.length === 0) {
    return defaultMethods;
  }

  return mentors
    .filter(Boolean)
    .slice(0, 3);
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
  const methodBlocks = mentors.map((name) => {
    const mentorData = mentorRules.mentors[name] || {};
    const principles = (mentorData.corePrinciples || []).slice(0, 2).join('\n');
    return `分析方法：${name}\n核心框架：\n${principles || '运用该方法的核心理论框架进行分析'}`;
  }).join('\n\n');

  return `你正在执行"思想孵化器"任务。

目标：把一个还不成熟的想法，拆成可验证、可推进、可规避风险的结构化方案。

请参考以下分析方法视角：
${methodBlocks}

固定输出要求：
1. 使用中文
2. 只输出结构化正文，不要解释规则
3. 必须完整覆盖以下5个一级章节：${dimensions.join('、')}
4. 必须在最后输出一级章节"未来7天行动清单"
5. 每个一级章节都必须有明确的小点说明，不能只写一句空泛概括
6. 如果信息不足，也必须在对应章节写出"当前缺失信息"和"如何补齐"
7. 总篇幅控制在500-800字，优先完整覆盖，不要冗长铺陈
8. 语气务实，避免空泛鸡汤
9. 不要使用第一人称，以客观分析方法呈现

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

async function generateMindmapJSON(analysisContent, methodName) {
  const prompt = getMindmapPrompt(analysisContent, methodName);
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log('脑图生成第' + attempt + '次重试...');
      }

      const rawReply = await callDeepSeekAPI(prompt, analysisContent, {
        maxTokens: 1000,
        skipTruncate: true
      });

      const mindmapData = extractMindmapJSON(rawReply);

      // 兼容两种数据结构：新版 sections 格式和旧版 children 格式
      if (mindmapData.sections && Array.isArray(mindmapData.sections)) {
        if (mindmapData.sections.length < 2) {
          throw new Error('脑图章节数不足: ' + mindmapData.sections.length);
        }
      } else if (mindmapData.children && Array.isArray(mindmapData.children)) {
        // 旧版格式兼容：转换为 sections 格式
        mindmapData.sections = mindmapData.children.map(function(child, i) {
          return {
            id: child.id || 's' + (i + 1),
            title: child.label || '章节',
            summary: child.detail || '',
            color: child.color || '#4A90D9',
            points: (child.children || []).map(function(sub, j) {
              return {
                id: sub.id || 's' + (i + 1) + '-' + (j + 1),
                title: sub.label || '要点',
                detail: sub.detail || ''
              };
            })
          };
        });
        mindmapData.summary = mindmapData.title || '';
        delete mindmapData.children;
      } else {
        throw new Error('脑图JSON结构不完整: 缺少sections或children');
      }

      if (!mindmapData.title) {
        mindmapData.title = methodName + '分析';
      }

      return { success: true, data: mindmapData };
    } catch (err) {
      console.error('脑图生成失败(第' + (attempt + 1) + '次):', err.message);
      if (attempt === maxRetries) {
        // 最后一次尝试失败，生成降级脑图
        console.log('使用降级方案生成脑图');
        return {
          success: true,
          data: generateFallbackMindmap(analysisContent, methodName)
        };
      }
    }
  }

  return { success: false, error: '所有尝试均失败' };
}

// H5: Flipbook 深入探索 — 从已有分析中提取子主题，生成新的短分析
async function generateDeepExploration(sourceContent, sourceMethod) {
  var prompt = '你是一个知识探索助手。以下是一段已有的分析方法结果，请从中选择一个最值得深入的子主题，生成一段简短的新分析（200-400字）。\n\n' +
    '原始分析（来自「' + sourceMethod + '」）：\n' + sourceContent.substring(0, 800) + '\n\n' +
    '要求：\n' +
    '1. 选择一个子主题深入分析，不要重复原文\n' +
    '2. 从不同角度展开思考\n' +
    '3. 返回JSON格式（只输出JSON）：\n' +
    '{"title": "深入主题标题", "content": "简短分析内容（200-400字）", "method": "推荐使用的方法名（可选）"}\n' +
    '4. 严格JSON格式，不要markdown代码块';

  try {
    var rawReply = await callDeepSeekAPI(prompt, sourceContent.substring(0, 500), {
      maxTokens: 800,
      skipTruncate: true
    });

    var jsonStr = rawReply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    var match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) {
      return { success: false, error: '无法解析探索结果' };
    }

    var result = JSON.parse(match[0]);
    return {
      success: true,
      data: {
        title: result.title || '深入探索',
        content: result.content || '',
        method: result.method || sourceMethod
      }
    };
  } catch (err) {
    console.error('深入探索生成失败:', err);
    return { success: false, error: '深入探索生成失败: ' + err.message };
  }
}

/**
 * 从 AI 回复中提取脑图 JSON，支持多种格式容错
 */
function extractMindmapJSON(rawReply) {
  let jsonStr = rawReply.trim();

  // 尝试1: 直接解析
  try {
    return JSON.parse(jsonStr);
  } catch (e) {}

  // 尝试2: 去掉 markdown 代码块包裹
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {}
  }

  // 尝试3: 查找第一个 { 到最后一个 } 之间的内容
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
    } catch (e) {}
  }

  // 尝试4: 移除常见的非JSON前缀文字
  const jsonStart = jsonStr.indexOf('{"');
  if (jsonStart >= 0) {
    try {
      return JSON.parse(jsonStr.substring(jsonStart));
    } catch (e) {}
  }

  throw new Error('无法从AI回复中提取有效JSON: ' + jsonStr.substring(0, 100));
}

/**
 * 降级方案：从分析内容中自动提取章节结构生成脑图
 */
function generateFallbackMindmap(analysisContent, methodName) {
  var lines = analysisContent.split('\n');
  var sections = [];
  var currentSection = null;
  var colors = ['#4A90D9', '#27AE60', '#E67E22', '#E74C3C', '#9B59B6'];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // 检测二级标题 ## 作为 section
    if (/^##\s+/.test(line)) {
      var title = line.replace(/^##\s+/, '').trim();
      if (title.length > 0 && title.length <= 20) {
        currentSection = {
          id: 's' + (sections.length + 1),
          title: title,
          summary: '',
          color: colors[sections.length % colors.length],
          points: []
        };
        sections.push(currentSection);
      }
      continue;
    }

    // 在当前 section 下提取列表项作为 points
    if (currentSection && (/^[\-\*]\s+/.test(line) || /^\d+\.\s+/.test(line))) {
      var pointText = line.replace(/^[\-\*]\s+/, '').replace(/^\d+\.\s+/, '');
      pointText = pointText.replace(/\*\*(.+?)\*\*/g, '$1').trim();
      if (pointText.length > 2 && pointText.length <= 30) {
        currentSection.points.push({
          id: currentSection.id + '-' + (currentSection.points.length + 1),
          title: pointText.substring(0, 10),
          detail: pointText
        });
      }
    }

    // 第一段非标题文字作为 summary
    if (currentSection && !currentSection.summary && line.length > 5 && !/^#/.test(line)) {
      currentSection.summary = line.substring(0, 25);
    }
  }

  // 限制 sections 数量
  if (sections.length > 6) {
    sections = sections.slice(0, 6);
  }
  // 每个 section 限制 points
  sections.forEach(function(s) {
    if (s.points.length > 4) {
      s.points = s.points.slice(0, 4);
    }
  });

  // 兜底
  if (sections.length < 2) {
    sections = [
      { id: 's1', title: '核心观点', summary: '分析的核心结论', color: '#4A90D9', points: [
        { id: 's1-1', title: '主要发现', detail: '基于分析的主要发现' }
      ]},
      { id: 's2', title: '分析要点', summary: '分析的关键维度', color: '#27AE60', points: [
        { id: 's2-1', title: '关键因素', detail: '影响结论的关键因素' }
      ]},
      { id: 's3', title: '行动建议', summary: '基于分析的下一步', color: '#9B59B6', points: [
        { id: 's3-1', title: '建议方向', detail: '建议的后续行动方向' }
      ]}
    ];
  }

  return {
    title: methodName + '分析',
    summary: '基于' + methodName + '的结构化分析',
    sections: sections
  };
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

      // 步骤2：获取分析方法和构建提示词
      stepTime = Date.now();
      const incubatorMentors = getIncubatorMentors(mentors);
      const prompt = getIncubatorPrompt(content, incubatorMentors);
      console.log('【步骤2】构建提示词耗时:', Date.now() - stepTime, 'ms', '| 方法:', incubatorMentors.join(','), '| 提示词长度:', prompt.length, '字符');

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

      const methodsByDomain = {
        '价值思维': ['多元思维模型分析', '价值投资分析框架', '安全边际分析'],
        '创业创新': ['本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析'],
        '心理学': ['原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析'],
        '哲学': ['道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析']
      };

      const sortedMentors = sortMentorsByField(mentors, methodsByDomain);

      const addResult = await db.collection('roundtable_discussions').add({
        data: {
          _openid: openid,
          content: content,
          mentors: sortedMentors,
          discussions: [],
          status: 'processing',
          totalCost: 3,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });

      const roundtableId = addResult._id;
      console.log('圆桌会议记录已创建:', roundtableId, '| 状态: processing');

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

      const discussions = [];
      let completedCount = 0;
      const totalMentors = sortedMentors.length;

      for (const m of sortedMentors) {
        try {
          const systemPrompt = getMentorPrompt(m, '平和', content);
          const mentorData = mentorRules.mentors[m] || mentorRules.mentors['多元思维模型分析'];
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
            if ((methodsByDomain[f.key] || []).includes(m)) {
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
          completedCount++;
          console.log(`圆桌会议进度: ${completedCount}/${totalMentors} (${m})`);
        } catch (err) {
          console.error(`生成${m}回复失败:`, err);
        }
      }

      const discussionStructure = analyzeDiscussionStructure(content, discussions);
      const finalStatus = completedCount > 0 ? 'completed' : 'partial';

      await db.collection('roundtable_discussions').doc(roundtableId).update({
        data: {
          discussions: discussions,
          structure: discussionStructure,
          status: finalStatus,
          completedCount: completedCount,
          updateTime: db.serverDate()
        }
      });
      console.log(`圆桌会议完成: ${roundtableId} | 状态: ${finalStatus} | 完成: ${completedCount}/${totalMentors}`);

      return {
        success: true,
        data: {
          roundtableId: roundtableId,
          content: content,
          mentors: sortedMentors,
          discussions: discussions,
          status: finalStatus,
          completedCount: completedCount,
          totalCost: 3,
          remainingStamps: remainingStamps,
          createTime: new Date().toISOString()
        }
      };
    }

    if (type === 'mindmap') {
      const { analysisContent, methodName } = event;
      if (!analysisContent) {
        return { success: false, message: '缺少分析内容' };
      }
      return await generateMindmapJSON(analysisContent, methodName || '分析方法');
    }

    // H5: Flipbook 深入探索 — 从已有分析中提取子主题并生成新分析
    if (type === 'deepexplore') {
      const { sourceContent, sourceMethod } = event;
      if (!sourceContent) {
        return { success: false, message: '缺少源分析内容' };
      }
      return await generateDeepExploration(sourceContent, sourceMethod || '分析方法');
    }

    if (mentor && content) {
      const systemPrompt = getMentorPrompt(mentor, mood || '平和', content);
      const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['多元思维模型分析'];
      
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
