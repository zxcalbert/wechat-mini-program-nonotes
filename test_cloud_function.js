// 模拟云函数调用测试
const testCases = [
  {
    name: '空文本测试',
    text: '',
    expected: {
      hasSensitive: false,
      isHighSensitive: false,
      isInvestment: false,
      words: [],
      categories: []
    }
  },
  {
    name: '暴力敏感词测试',
    text: '这是一段包含暴力的文本，暴力行为应该被制止',
    expected: {
      hasSensitive: true,
      isHighSensitive: true,
      isInvestment: false,
      words: ['暴力'],
      categories: ['violence']
    }
  },
  {
    name: '色情敏感词测试',
    text: '不要传播色情内容',
    expected: {
      hasSensitive: true,
      isHighSensitive: true,
      isInvestment: false,
      words: ['色情'],
      categories: ['porn']
    }
  },
  {
    name: '投资敏感词测试',
    text: '我想买入一些股票',
    expected: {
      hasSensitive: true,
      isHighSensitive: false,
      isInvestment: true,
      words: ['买入'],
      categories: ['investment']
    }
  },
  {
    name: '混合敏感词测试',
    text: '暴力买入股票',
    expected: {
      hasSensitive: true,
      isHighSensitive: true,
      isInvestment: true,
      words: ['暴力', '买入'],
      categories: ['violence', 'investment']
    }
  },
  {
    name: '正常文本测试',
    text: '今天天气很好，适合出去散步',
    expected: {
      hasSensitive: false,
      isHighSensitive: false,
      isInvestment: false,
      words: [],
      categories: []
    }
  }
];

console.log('========================================');
console.log('云函数敏感词检测 - 模拟测试');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message} - 期望: ${JSON.stringify(expected)}, 实际: ${JSON.stringify(actual)}`);
  }
}

function testCase(name, text, expected) {
  console.log(`测试: ${name}`);
  console.log(`输入: "${text}"`);
  
  // 这里模拟云函数调用，实际应该使用云函数SDK
  // 由于我们无法在本地直接调用云函数，这里使用本地模块进行验证
  const sensitiveWordDetector = require('./cloudfunctions/replyToLetter/sensitiveWordDetector');
  const result = sensitiveWordDetector.detect(text);
  
  console.log(`结果: ${JSON.stringify(result)}`);
  
  try {
    assertEqual(result.hasSensitive, expected.hasSensitive, 'hasSensitive 不匹配');
    assertEqual(result.isHighSensitive, expected.isHighSensitive, 'isHighSensitive 不匹配');
    assertEqual(result.isInvestment, expected.isInvestment, 'isInvestment 不匹配');
    assertEqual(result.words.sort(), expected.words.sort(), 'words 不匹配');
    assertEqual(result.categories.sort(), expected.categories.sort(), 'categories 不匹配');
    
    console.log(`✅ PASS\n`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    failed++;
  }
}

// 执行所有测试
testCases.forEach(test => {
  testCase(test.name, test.text, test.expected);
});

console.log('========================================');
console.log('测试总结');
console.log('========================================');
console.log(`总测试数: ${testCases.length}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log('========================================');

if (failed === 0) {
  console.log('\n🎉 所有测试通过！云函数功能正常。');
} else {
  console.log('\n⚠️ 有测试失败，请检查云函数实现。');
  process.exit(1);
}
