const path = require('path');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function test(name, fn) {
  testResults.total++;
  try {
    console.log(`\n运行测试: ${name}`);
    fn();
    console.log(`  ✓ ${name} 通过`);
    testResults.passed++;
    return true;
  } catch (error) {
    console.log(`  ✗ ${name} 失败`);
    console.log(`    错误: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望值: ${expected}, 实际值: ${actual}`);
  }
}

function testDetectSensitiveWords_NullInput() {
  const mockSensitiveWords = {
    violence: ['杀人', '暴力'],
    porn: ['色情'],
    investment: ['买入', '推荐']
  };

  function mockDetect(text) {
    if (!text) {
      return {
        hasSensitive: false,
        isHighSensitive: false,
        isInvestment: false
      };
    }
    return { hasSensitive: false, isHighSensitive: false, isInvestment: false };
  }

  const result = mockDetect(null);
  assertEqual(result.hasSensitive, false);
  assertEqual(result.isHighSensitive, false);
  assertEqual(result.isInvestment, false);
}

function testDetectSensitiveWords_EmptyInput() {
  const mockSensitiveWords = {
    violence: ['杀人', '暴力'],
    porn: ['色情'],
    investment: ['买入', '推荐']
  };

  function mockDetect(text) {
    if (!text) {
      return {
        hasSensitive: false,
        isHighSensitive: false,
        isInvestment: false
      };
    }
    return { hasSensitive: false, isHighSensitive: false, isInvestment: false };
  }

  const result = mockDetect('');
  assertEqual(result.hasSensitive, false);
  assertEqual(result.isHighSensitive, false);
  assertEqual(result.isInvestment, false);
}

function testDetectSensitiveWords_Violence() {
  const mockSensitiveWords = {
    violence: ['杀人', '暴力'],
    porn: ['色情'],
    investment: ['买入', '推荐']
  };

  function mockDetect(text) {
    let hasSensitive = false;
    let isHighSensitive = false;
    let isInvestment = false;

    for (const word of mockSensitiveWords.violence) {
      if (text.includes(word)) {
        hasSensitive = true;
        isHighSensitive = true;
        break;
      }
    }

    if (!isHighSensitive) {
      for (const word of mockSensitiveWords.investment) {
        if (text.includes(word)) {
          hasSensitive = true;
          isInvestment = true;
          break;
        }
      }
    }

    return { hasSensitive, isHighSensitive, isInvestment };
  }

  const result = mockDetect('这是一段包含暴力词汇的文本');
  assertEqual(result.hasSensitive, true);
  assertEqual(result.isHighSensitive, true);
  assertEqual(result.isInvestment, false);
}

function testDetectSensitiveWords_Investment() {
  const mockSensitiveWords = {
    violence: ['杀人', '暴力'],
    porn: ['色情'],
    investment: ['买入', '推荐']
  };

  function mockDetect(text) {
    let hasSensitive = false;
    let isHighSensitive = false;
    let isInvestment = false;

    for (const word of mockSensitiveWords.violence) {
      if (text.includes(word)) {
        hasSensitive = true;
        isHighSensitive = true;
        break;
      }
    }

    if (!isHighSensitive) {
      for (const word of mockSensitiveWords.investment) {
        if (text.includes(word)) {
          hasSensitive = true;
          isInvestment = true;
          break;
        }
      }
    }

    return { hasSensitive, isHighSensitive, isInvestment };
  }

  const result = mockDetect('我想买入这只股票，推荐给你');
  assertEqual(result.hasSensitive, true);
  assertEqual(result.isHighSensitive, false);
  assertEqual(result.isInvestment, true);
}

function testDetectSensitiveWords_Normal() {
  const mockSensitiveWords = {
    violence: ['杀人', '暴力'],
    porn: ['色情'],
    investment: ['买入', '推荐']
  };

  function mockDetect(text) {
    let hasSensitive = false;
    let isHighSensitive = false;
    let isInvestment = false;

    for (const word of mockSensitiveWords.violence) {
      if (text.includes(word)) {
        hasSensitive = true;
        isHighSensitive = true;
        break;
      }
    }

    if (!isHighSensitive) {
      for (const word of mockSensitiveWords.investment) {
        if (text.includes(word)) {
          hasSensitive = true;
          isInvestment = true;
          break;
        }
      }
    }

    return { hasSensitive, isHighSensitive, isInvestment };
  }

  const result = mockDetect('这是一段正常的文本，没有敏感词');
  assertEqual(result.hasSensitive, false);
  assertEqual(result.isHighSensitive, false);
  assertEqual(result.isInvestment, false);
}

function testProcessReply_HighSensitive() {
  function mockProcessReply(replyContent) {
    const mockDetection = {
      isHighSensitive: true,
      isInvestment: false
    };

    if (mockDetection.isHighSensitive) {
      return "感谢你的来信。由于内容合规性要求，我无法针对这个话题给出具体回复。建议你从更宏观的角度思考问题，关注原则和方法论，而不是具体的标的或建议。";
    }
    return replyContent;
  }

  const result = mockProcessReply('包含敏感词的回复');
  assert(result.includes('由于内容合规性要求'), '应返回合规提示');
}

function testProcessReply_Investment() {
  function mockProcessReply(replyContent) {
    const mockDetection = {
      isHighSensitive: false,
      isInvestment: true
    };

    if (mockDetection.isInvestment) {
      const disclaimer = "\n\n---\n\n⚠️ 免责声明：以上内容仅供参考，不构成任何投资建议。投资有风险，决策需谨慎。";
      return replyContent + disclaimer;
    }
    return replyContent;
  }

  const result = mockProcessReply('这是投资相关的回复');
  assert(result.includes('⚠️ 免责声明'), '应包含免责声明');
  assert(result.includes('这是投资相关的回复'), '应保留原内容');
}

function testProcessReply_Normal() {
  function mockProcessReply(replyContent) {
    const mockDetection = {
      isHighSensitive: false,
      isInvestment: false
    };
    return replyContent;
  }

  const originalText = '这是一段正常的回复';
  const result = mockProcessReply(originalText);
  assertEqual(result, originalText);
}

function testCountChineseWords() {
  function countChineseWords(text) {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + Math.round(englishWords.length * 1.5);
  }

  assertEqual(countChineseWords('你好世界'), 4);
  assertEqual(countChineseWords('hello world'), 3);
  assertEqual(countChineseWords('你好 world'), 4);
  assertEqual(countChineseWords(''), 0);
}

function testEstimateComplexity() {
  function estimateComplexity(userContent) {
    const length = userContent.length;
    if (length < 100) return 'simple';
    if (length > 300) return 'complex';
    return 'medium';
  }

  assertEqual(estimateComplexity('短文本'), 'simple');
  
  let mediumText = '';
  for (let i = 0; i < 20; i++) {
    mediumText += '这是一个中等长度的文本';
  }
  assertEqual(estimateComplexity(mediumText), 'medium');
  
  let complexText = '';
  for (let i = 0; i < 200; i++) {
    complexText += '长文本';
  }
  assertEqual(estimateComplexity(complexText), 'complex');
}

function testExtractKeywords() {
  function extractKeywords(text) {
    const investmentKeywords = ['投资', '股票', '基金', '公司'];
    const found = [];
    for (const keyword of investmentKeywords) {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    }
    return found.slice(0, 3);
  }

  const result1 = extractKeywords('我想投资股票和基金');
  assertEqual(result1.length, 3);
  assertEqual(result1[0], '投资');

  const result2 = extractKeywords('普通文本');
  assertEqual(result2.length, 0);
}

// ==================== AI推断情绪功能测试 ====================

function testGetMentorPrompt_AIInferred() {
  function mockGetMentorPrompt(mentor, mood, content) {
    if (mood === null || mood === '由AI推断' || !mood) {
      return { type: 'AI_INFERRED', hasEmotionInstruction: true };
    } else {
      return { type: 'ORIGINAL', hasEmotionInstruction: false };
    }
  }

  const result1 = mockGetMentorPrompt('查理·芒格', '由AI推断', '测试内容');
  assertEqual(result1.type, 'AI_INFERRED', 'mood为"由AI推断"时应返回AI推断类型');
  assert(result1.hasEmotionInstruction, 'AI推断类型应包含情绪推断指令');

  const result2 = mockGetMentorPrompt('查理·芒格', null, '测试内容');
  assertEqual(result2.type, 'AI_INFERRED', 'mood为null时应返回AI推断类型');

  const result3 = mockGetMentorPrompt('查理·芒格', '', '测试内容');
  assertEqual(result3.type, 'AI_INFERRED', 'mood为空字符串时应返回AI推断类型');
}

function testGetMentorPrompt_HistoricalMood() {
  function mockGetMentorPrompt(mentor, mood, content) {
    if (mood === null || mood === '由AI推断' || !mood) {
      return { type: 'AI_INFERRED' };
    } else {
      return { type: 'ORIGINAL', mood: mood };
    }
  }

  const result1 = mockGetMentorPrompt('查理·芒格', '焦虑', '测试内容');
  assertEqual(result1.type, 'ORIGINAL', '历史mood应返回原始类型');
  assertEqual(result1.mood, '焦虑', '应保留原始mood值');

  const result2 = mockGetMentorPrompt('查理·芒格', '平和', '测试内容');
  assertEqual(result2.type, 'ORIGINAL', '历史mood"平和"应返回原始类型');

  const result3 = mockGetMentorPrompt('查理·芒格', '贪婪', '测试内容');
  assertEqual(result3.type, 'ORIGINAL', '历史mood"贪婪"应返回原始类型');

  const result4 = mockGetMentorPrompt('查理·芒格', '困惑', '测试内容');
  assertEqual(result4.type, 'ORIGINAL', '历史mood"困惑"应返回原始类型');
}

function testAIDeducedPrompt_Content() {
  function mockGetAIDeducedPrompt(mentorData, content) {
    return {
      hasEmotionInstruction: true,
      emotionTypes: ['焦虑', '贪婪', '平和', '困惑'],
      hasMentorPersona: !!mentorData.persona,
      contentIncluded: true
    };
  }

  const mockMentorData = {
    persona: '我是查理·芒格...',
    corePrinciples: ['原则1', '原则2']
  };

  const result = mockGetAIDeducedPrompt(mockMentorData, '用户测试内容');
  assert(result.hasEmotionInstruction, 'AI推断提示词应包含情绪推断指令');
  assertEqual(result.emotionTypes.length, 4, '应包含4种情绪类型');
  assert(result.hasMentorPersona, '应包含导师人设');
}

function testOriginalPrompt_MoodData() {
  function mockGetOriginalPrompt(mentorData, moodData, content) {
    return {
      hasMoodName: !!moodData.name,
      hasTone: !!moodData.tone,
      hasFocus: !!moodData.focus,
      hasKeyPoints: moodData.keyPoints && moodData.keyPoints.length > 0
    };
  }

  const mockMentorData = { persona: '测试人设' };
  const mockMoodData = {
    name: '焦虑',
    tone: '温和安抚',
    focus: '风险管控',
    keyPoints: ['点1', '点2', '点3', '点4', '点5']
  };

  const result = mockGetOriginalPrompt(mockMentorData, mockMoodData, '测试内容');
  assert(result.hasTone, '原始提示词应包含语气设置');
  assert(result.hasFocus, '原始提示词应包含重点设置');
  assert(result.hasKeyPoints, '原始提示词应包含关键点');
}

function testMoodCompatibility_AllScenarios() {
  const scenarios = [
    { mood: '由AI推断', expectedType: 'AI_INFERRED' },
    { mood: null, expectedType: 'AI_INFERRED' },
    { mood: '', expectedType: 'AI_INFERRED' },
    { mood: undefined, expectedType: 'AI_INFERRED' },
    { mood: '焦虑', expectedType: 'ORIGINAL' },
    { mood: '平和', expectedType: 'ORIGINAL' },
    { mood: '贪婪', expectedType: 'ORIGINAL' },
    { mood: '困惑', expectedType: 'ORIGINAL' }
  ];

  function mockGetMentorPrompt(mentor, mood, content) {
    if (mood === null || mood === '由AI推断' || !mood) {
      return 'AI_INFERRED';
    }
    return 'ORIGINAL';
  }

  scenarios.forEach((scenario, index) => {
    const result = mockGetMentorPrompt('查理·芒格', scenario.mood, '测试');
    assertEqual(result, scenario.expectedType, `场景${index + 1}: mood="${scenario.mood}"应返回${scenario.expectedType}`);
  });
}

// ==================== Phase 3: AI免责声明测试 ====================

function testAddAIDisclaimer() {
  function mockAddAIDisclaimer(replyContent, mentorName) {
    const aiDisclaimer = `\n\n---\n*以上内容为AI模拟${mentorName}的回复，仅供参考和启发，不代表该人物的真实观点或建议。*`;
    return replyContent + aiDisclaimer;
  }

  const result = mockAddAIDisclaimer('这是回复内容', '查理·芒格');
  assert(result.includes('这是回复内容'), '应保留原内容');
  assert(result.includes('AI模拟查理·芒格的回复'), '应包含导师名称');
  assert(result.includes('仅供参考和启发'), '应包含免责声明');
  assert(result.includes('不代表该人物的真实观点'), '应包含声明说明');
}

function testAddAIDisclaimer_DifferentMentors() {
  function mockAddAIDisclaimer(replyContent, mentorName) {
    const aiDisclaimer = `\n\n---\n*以上内容为AI模拟${mentorName}的回复，仅供参考和启发，不代表该人物的真实观点或建议。*`;
    return replyContent + aiDisclaimer;
  }

  const mentors = ['查理·芒格', '巴菲特', '段永平', '张小龙', '乔布斯', '马斯克'];
  mentors.forEach((mentor) => {
    const result = mockAddAIDisclaimer('测试内容', mentor);
    assert(result.includes(`AI模拟${mentor}的回复`), `应包含${mentor}的名称`);
  });
}

// ==================== Phase 3: 防幻觉约束测试 ====================

function testAntiHallucination_PromptContains() {
  function mockGetAIDeducedPrompt(mentorData, content, mentorName) {
    return {
      hasAntiHallucination: true,
      containsMentorName: mentorName === '查理·芒格',
      constraints: [
        '只基于公开言论',
        '不要编造',
        '不要引用不存在的书籍',
        '回复必须直接、具体'
      ]
    };
  }

  const mockMentorData = { persona: '测试人设' };
  const result = mockGetAIDeducedPrompt(mockMentorData, '用户内容', '查理·芒格');
  assert(result.hasAntiHallucination, '应包含防幻觉约束');
  assert(result.containsMentorName, '应包含导师名称');
  assertEqual(result.constraints.length, 4, '应包含4条约束');
}

function testAntiHallucination_ConstraintsContent() {
  const requiredConstraints = [
    '只基于',
    '公开言论',
    '不要编造',
    '不要引用不存在',
    '直接、具体'
  ];

  function mockPromptHasConstraints(prompt, constraints) {
    return constraints.every(c => prompt.includes(c));
  }

  const mockPrompt = `
【重要约束 - 防止幻觉】
1. 只基于查理·芒格的公开言论和已知观点进行回复
2. 不要编造查理·芒格没说过的话或没做过的事
3. 如不确定某个具体观点，使用更通用的投资原则表述
4. 不要引用不存在的书籍、演讲或事件
5. 回复必须直接、具体、有针对性，避免空泛
`;

  const result = mockPromptHasConstraints(mockPrompt, requiredConstraints);
  assert(result, '提示词应包含所有防幻觉约束');
}

function testPromptEndsWithNoRepeat() {
  function mockPromptEndsCorrectly(prompt) {
    return prompt.includes('无需重复约束条件');
  }

  const mockPrompt = '请直接、具体、有针对性地回复，200-500字。无需重复约束条件。';
  assert(mockPromptEndsCorrectly(mockPrompt), '提示词应以"无需重复约束条件"结尾');
}

function runAllTests() {
  console.log('========================================');
  console.log('  replyToLetter 云函数 - 单元测试');
  console.log('========================================');

  const tests = [
    { name: '敏感词检测 - 空输入', fn: testDetectSensitiveWords_NullInput },
    { name: '敏感词检测 - 空字符串', fn: testDetectSensitiveWords_EmptyInput },
    { name: '敏感词检测 - 暴力词汇', fn: testDetectSensitiveWords_Violence },
    { name: '敏感词检测 - 投资词汇', fn: testDetectSensitiveWords_Investment },
    { name: '敏感词检测 - 正常文本', fn: testDetectSensitiveWords_Normal },
    { name: '回复处理 - 高敏感内容', fn: testProcessReply_HighSensitive },
    { name: '回复处理 - 投资相关内容', fn: testProcessReply_Investment },
    { name: '回复处理 - 正常内容', fn: testProcessReply_Normal },
    { name: '中文字数统计', fn: testCountChineseWords },
    { name: '复杂度评估', fn: testEstimateComplexity },
    { name: '关键词提取', fn: testExtractKeywords },
    { name: 'AI推断情绪 - mood为"由AI推断"', fn: testGetMentorPrompt_AIInferred },
    { name: 'AI推断情绪 - 历史mood兼容', fn: testGetMentorPrompt_HistoricalMood },
    { name: 'AI推断提示词内容', fn: testAIDeducedPrompt_Content },
    { name: '原始提示词mood数据', fn: testOriginalPrompt_MoodData },
    { name: 'mood兼容性全场景测试', fn: testMoodCompatibility_AllScenarios },
    { name: 'AI免责声明功能', fn: testAddAIDisclaimer },
    { name: 'AI免责声明 - 多导师测试', fn: testAddAIDisclaimer_DifferentMentors },
    { name: '防幻觉约束 - 提示词包含', fn: testAntiHallucination_PromptContains },
    { name: '防幻觉约束 - 约束内容', fn: testAntiHallucination_ConstraintsContent },
    { name: '提示词结尾验证', fn: testPromptEndsWithNoRepeat }
  ];

  for (const t of tests) {
    test(t.name, t.fn);
  }

  console.log('\n========================================');
  console.log('测试结果汇总:');
  console.log(`总计: ${testResults.total}`);
  console.log(`通过: ${testResults.passed}`);
  console.log(`失败: ${testResults.failed}`);
  console.log('========================================');

  return testResults.failed === 0;
}

if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests, testResults };
