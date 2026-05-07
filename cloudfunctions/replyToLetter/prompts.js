/**
 * 提示词生成模块
 * 将分析方法和脑图的提示词逻辑从主 index.js 中抽取
 */

var wordCountConfig = {
  simple: { min: 200, max: 200, maxTokens: 280, label: '简单' },
  medium: { min: 200, max: 300, maxTokens: 400, label: '中等' },
  complex: { min: 400, max: 500, maxTokens: 650, label: '复杂' }
};

function estimateComplexity(userContent) {
  var length = userContent.length;
  if (length < 100) return 'simple';
  if (length > 300) return 'complex';
  return 'medium';
}

function getWordCountConfig(userContent) {
  var complexity = estimateComplexity(userContent);
  return wordCountConfig[complexity];
}

/**
 * AI自主推断的提示词生成器（无情绪数据时使用）
 */
function getAIDeducedPrompt(mentorData, content, mentorName) {
  var config = getWordCountConfig(content);

  var prompt = '【分析方法约束部分（不可变，来自规则库）】\n';
  prompt += '请运用' + mentorName + '的核心理论框架，客观分析以下问题。遵循以下核心原则：\n';

  mentorData.corePrinciples.forEach(function(principle) {
    prompt += principle + '\n';
  });

  prompt += '\n【重要约束 - 合规要求】\n';
  prompt += '1. 不要模拟任何人物的身份、语气或人格\n';
  prompt += '2. 不要使用第一人称（"我"、"我们认为"）\n';
  prompt += '3. 以书面分析报告的形式呈现\n';
  prompt += '4. 列出分析逻辑和推导过程\n';
  prompt += '5. 明确标注哪些是' + mentorName + '的核心理论，哪些是分析推导的扩展\n';
  prompt += '6. 不要编造不存在的书籍、演讲或事件\n';
  prompt += '7. 回复必须直接、具体、有针对性，避免空泛\n';
  prompt += '\n【分析角度推断】\n';
  prompt += '请根据用户的以下内容，自主判断其核心关注点，并据此调整分析重点：\n';
  prompt += '- 如果用户表现出焦虑：侧重冷静分析和长期视角\n';
  prompt += '- 如果用户表现出急躁：强调耐心和理性决策的重要性\n';
  prompt += '- 如果用户表现平和：深入探讨方法论和长期思考\n';
  prompt += '- 如果用户表现出困惑：帮助理清思路和方向\n';
  prompt += '\n【分析方法框架】\n';
  prompt += '分析框架名称：\n' + mentorName + '\n\n';
  prompt += '核心思考框架：\n';

  mentorData.thinkingFrameworks.forEach(function(framework) {
    prompt += framework + '\n';
  });

  prompt += '\n常用分析角度：\n';
  mentorData.commonQuestions.forEach(function(question) {
    prompt += question + '\n';
  });

  prompt += '\n基于以上约束，针对用户的问题：\n' + content + '\n\n';
  prompt += '【字数自适应要求】\n';
  prompt += '- 先评估内容复杂度：' + config.label + '\n';
  prompt += '- ' + config.label + '问题：' + config.min + '-' + config.max + '字\n';
  prompt += '- 上限：严格' + config.max + '字，不得超过\n\n';
  prompt += '请以客观分析报告的形式回复，' + config.min + '-' + config.max + '字。无需重复约束条件。\n\n';
  prompt += '【输出格式要求】\n';
  prompt += '使用 Markdown 格式输出，结构如下：\n';
  prompt += '## 分析结果\n';
  prompt += '（核心分析内容，使用列表和粗体强调关键点）\n';
  prompt += '### 核心观点\n';
  prompt += '- **观点1**：说明\n';
  prompt += '- **观点2**：说明\n';
  prompt += '### 行动建议\n';
  prompt += '1. 建议1\n';
  prompt += '2. 建议2\n';
  prompt += '注意：不要使用 # 一级标题，从 ## 开始；使用粗体标注关键概念\n';

  return prompt;
}

/**
 * 历史数据兼容的提示词生成器（有情绪数据时使用）
 */
function getOriginalPrompt(mentorData, moodData, content, mentorName) {
  var config = getWordCountConfig(content);

  var prompt = '【分析方法约束部分（不可变，来自规则库）】\n';
  prompt += '请运用' + mentorName + '的核心理论框架，客观分析以下问题。遵循以下核心原则：\n';

  mentorData.corePrinciples.forEach(function(principle) {
    prompt += principle + '\n';
  });

  prompt += '\n【重要约束 - 合规要求】\n';
  prompt += '1. 不要模拟任何人物的身份、语气或人格\n';
  prompt += '2. 不要使用第一人称（"我"、"我们认为"）\n';
  prompt += '3. 以书面分析报告的形式呈现\n';
  prompt += '4. 列出分析逻辑和推导过程\n';
  prompt += '5. 明确标注哪些是' + mentorName + '的核心理论，哪些是分析推导的扩展\n';
  prompt += '6. 不要编造不存在的书籍、演讲或事件\n';
  prompt += '7. 回复必须直接、具体、有针对性，避免空泛\n';
  prompt += '\n用户当前关注点：' + (moodData.name || '平和') + '\n';
  prompt += '- 分析语气：' + moodData.tone + '\n';
  prompt += '- 分析重点：' + moodData.focus + '\n';
  prompt += '- 必须涵盖以下关键点：\n';

  moodData.keyPoints.forEach(function(point) {
    prompt += point + '\n';
  });

  prompt += '\n【分析方法框架】\n';
  prompt += '分析框架名称：\n' + mentorName + '\n\n';
  prompt += '核心思考框架：\n';

  mentorData.thinkingFrameworks.forEach(function(framework) {
    prompt += framework + '\n';
  });

  prompt += '\n常用分析角度：\n';
  mentorData.commonQuestions.forEach(function(question) {
    prompt += question + '\n';
  });

  prompt += '\n基于以上约束，针对用户的问题：\n' + content + '\n\n';
  prompt += '【字数自适应要求】\n';
  prompt += '- 先评估内容复杂度：' + config.label + '\n';
  prompt += '- ' + config.label + '问题：' + config.min + '-' + config.max + '字\n';
  prompt += '- 上限：严格' + config.max + '字，不得超过\n\n';
  prompt += '请以客观分析报告的形式回复，' + config.min + '-' + config.max + '字。\n\n';
  prompt += '【输出格式要求】\n';
  prompt += '使用 Markdown 格式输出，结构如下：\n';
  prompt += '## 分析结果\n';
  prompt += '（核心分析内容，使用列表和粗体强调关键点）\n';
  prompt += '### 核心观点\n';
  prompt += '- **观点1**：说明\n';
  prompt += '注意：不要使用 # 一级标题，从 ## 开始；使用粗体标注关键概念\n';

  return prompt;
}

/**
 * 脑图生成提示词 — 专业知识结构重建
 * 不是提取关键词，而是重建文档的逻辑层级
 */
function getMindmapPrompt(analysisContent, methodName) {
  return '你是一位麦肯锡级别的知识可视化专家。任务：将以下分析报告重建为结构化知识脑图。\n\n'
    + '【核心要求】\n'
    + '这不是简单的关键词提取，而是逻辑结构重建。每个节点都必须承载独立的信息价值。\n\n'
    + '分析报告：\n' + analysisContent + '\n\n'
    + '分析方法：' + methodName + '\n\n'
    + '【JSON格式要求】严格输出以下结构（不要markdown代码块包裹）：\n'
    + '{\n'
    + '  "title": "报告的核心主题（≤15字）",\n'
    + '  "summary": "一句话概括报告的核心结论（≤40字）",\n'
    + '  "sections": [\n'
    + '    {\n'
    + '      "id": "s1",\n'
    + '      "title": "章节标题（≤12字，保留原文逻辑）",\n'
    + '      "summary": "该章节的核心论点（≤25字）",\n'
    + '      "color": "#4A90D9",\n'
    + '      "points": [\n'
    + '        {\n'
    + '          "id": "s1-1",\n'
    + '          "title": "关键要点（≤10字）",\n'
    + '          "detail": "该要点的具体论证或数据（≤30字）"\n'
    + '        }\n'
    + '      ]\n'
    + '    }\n'
    + '  ]\n'
    + '}\n\n'
    + '【设计规则】\n'
    + '1. sections 数量：3-6个，每个对应报告的一个逻辑板块（不一定是原文章节，可以重新组织）\n'
    + '2. 每个 section 的 points 数量：2-4个，每个承载独立论据\n'
    + '3. title 必须精炼有力，像PPT标题一样一目了然\n'
    + '4. detail 必须是具体论证，不是空泛概括\n'
    + '5. color 颜色分配规则（每个section不同色）：\n'
    + '   - 外部/威胁/风险类 → "#E74C3C"（红）\n'
    + '   - 优势/核心/驱动类 → "#27AE60"（绿）\n'
    + '   - 挑战/变化/趋势类 → "#E67E22"（橙）\n'
    + '   - 结构/框架/综合类 → "#4A90D9"（蓝）\n'
    + '   - 洞察/建议/未来类 → "#9B59B6"（紫）\n'
    + '6. 整体结构应该让读者一眼看清：报告论证了什么、论据是什么、结论是什么\n'
    + '7. 不要以"我"开头\n'
    + '8. 只输出JSON，不要任何额外文字';
}

module.exports = {
  wordCountConfig: wordCountConfig,
  estimateComplexity: estimateComplexity,
  getWordCountConfig: getWordCountConfig,
  getAIDeducedPrompt: getAIDeducedPrompt,
  getOriginalPrompt: getOriginalPrompt,
  getMindmapPrompt: getMindmapPrompt
};
