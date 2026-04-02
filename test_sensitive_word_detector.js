const sensitiveWordDetector = require('./cloudfunctions/replyToLetter/sensitiveWordDetector');

console.log('========================================');
console.log('敏感词检测模块 - 全面测试方案');
console.log('========================================\n');

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function testCase(name, testFn) {
  try {
    const result = testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED', message: '' });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', message: error.message });
    console.log(`❌ FAIL: ${name} - ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message} - 期望: ${JSON.stringify(expected)}, 实际: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}

console.log('-------------------');
console.log('1. 单元测试 - 基础功能');
console.log('-------------------\n');

testCase('检测空文本 - 返回默认值', () => {
  const result = sensitiveWordDetector.detect('');
  assertEqual(result.hasSensitive, false, '空文本应返回无敏感词');
  assertEqual(result.isHighSensitive, false, '空文本不应标记为高敏感');
  assertEqual(result.isInvestment, false, '空文本不应标记为投资敏感');
});

testCase('检测 null 输入 - 返回默认值', () => {
  const result = sensitiveWordDetector.detect(null);
  assertEqual(result.hasSensitive, false, 'null输入应返回无敏感词');
});

testCase('检测 undefined 输入 - 返回默认值', () => {
  const result = sensitiveWordDetector.detect(undefined);
  assertEqual(result.hasSensitive, false, 'undefined输入应返回无敏感词');
});

console.log('\n-------------------');
console.log('2. 单元测试 - 暴力敏感词检测');
console.log('-------------------\n');

testCase('检测暴力敏感词 "暴力"', () => {
  const result = sensitiveWordDetector.detect('这是一段包含暴力的文本');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.words.includes('暴力'), '应找到"暴力"词');
  assertTrue(result.categories.includes('violence'), '应归类为violence');
});

testCase('检测暴力敏感词 "杀人"', () => {
  const result = sensitiveWordDetector.detect('杀人是不对的');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.words.includes('杀人'), '应找到"杀人"词');
});

testCase('检测多个暴力敏感词', () => {
  const result = sensitiveWordDetector.detect('暴力和恐怖都是不好的');
  assertTrue(result.words.includes('暴力'), '应找到"暴力"');
  assertTrue(result.words.includes('恐怖'), '应找到"恐怖"');
  assertEqual(result.words.length, 2, '应找到2个敏感词');
});

console.log('\n-------------------');
console.log('3. 单元测试 - 色情敏感词检测');
console.log('-------------------\n');

testCase('检测色情敏感词 "色情"', () => {
  const result = sensitiveWordDetector.detect('这是一段包含色情内容的文本');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.words.includes('色情'), '应找到"色情"词');
  assertTrue(result.categories.includes('porn'), '应归类为porn');
});

testCase('检测色情敏感词 "淫秽"', () => {
  const result = sensitiveWordDetector.detect('淫秽内容应该被禁止');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.words.includes('淫秽'), '应找到"淫秽"词');
});

console.log('\n-------------------');
console.log('4. 单元测试 - 投资敏感词检测');
console.log('-------------------\n');

testCase('检测投资敏感词 "买入"', () => {
  const result = sensitiveWordDetector.detect('我想买入一些股票');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertFalse(result.isHighSensitive, '不应标记为高敏感');
  assertTrue(result.isInvestment, '应标记为投资敏感');
  assertTrue(result.words.includes('买入'), '应找到"买入"词');
  assertTrue(result.categories.includes('investment'), '应归类为investment');
});

testCase('检测投资敏感词 "卖出"', () => {
  const result = sensitiveWordDetector.detect('我应该卖出吗？');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isInvestment, '应标记为投资敏感');
  assertTrue(result.words.includes('卖出'), '应找到"卖出"词');
});

testCase('检测多个投资敏感词', () => {
  const result = sensitiveWordDetector.detect('我想买入目标价合理的股票');
  assertTrue(result.words.includes('买入'), '应找到"买入"');
  assertTrue(result.words.includes('目标价'), '应找到"目标价"');
  assertTrue(result.isInvestment, '应标记为投资敏感');
});

console.log('\n-------------------');
console.log('5. 集成测试 - 混合敏感词检测');
console.log('-------------------\n');

testCase('暴力 + 投资混合 - 优先标记高敏感', () => {
  const result = sensitiveWordDetector.detect('暴力买入股票');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.isInvestment, '应同时标记为投资敏感');
  assertTrue(result.words.includes('暴力'), '应找到"暴力"');
  assertTrue(result.words.includes('买入'), '应找到"买入"');
});

testCase('色情 + 投资混合 - 优先标记高敏感', () => {
  const result = sensitiveWordDetector.detect('色情内容推荐');
  assertTrue(result.hasSensitive, '应检测到敏感词');
  assertTrue(result.isHighSensitive, '应标记为高敏感');
  assertTrue(result.isInvestment, '应同时标记为投资敏感');
});

console.log('\n-------------------');
console.log('6. 集成测试 - 正常文本检测');
console.log('-------------------\n');

testCase('正常文本 - 无敏感词', () => {
  const result = sensitiveWordDetector.detect('今天天气很好，适合出去散步');
  assertFalse(result.hasSensitive, '不应检测到敏感词');
  assertFalse(result.isHighSensitive, '不应标记为高敏感');
  assertFalse(result.isInvestment, '不应标记为投资敏感');
  assertEqual(result.words.length, 0, '敏感词列表应为空');
  assertEqual(result.categories.length, 0, '分类列表应为空');
});

testCase('长文本 - 无敏感词', () => {
  const longText = '这是一段很长的正常文本，包含很多内容，但没有任何敏感词。' +
    '我们可以在这里讨论各种话题，比如人生、哲学、艺术、科学等等。' +
    '这些都是很好的话题，可以激发思考和讨论。';
  const result = sensitiveWordDetector.detect(longText);
  assertFalse(result.hasSensitive, '长文本不应检测到敏感词');
});

console.log('\n-------------------');
console.log('7. 边界条件测试');
console.log('-------------------\n');

testCase('敏感词在文本开头', () => {
  const result = sensitiveWordDetector.detect('暴力行为应该被制止');
  assertTrue(result.hasSensitive, '应检测到开头的敏感词');
  assertTrue(result.words.includes('暴力'), '应找到"暴力"');
});

testCase('敏感词在文本中间', () => {
  const result = sensitiveWordDetector.detect('不要谈论色情内容');
  assertTrue(result.hasSensitive, '应检测到中间的敏感词');
  assertTrue(result.words.includes('色情'), '应找到"色情"');
});

testCase('敏感词在文本结尾', () => {
  const result = sensitiveWordDetector.detect('我想考虑买入');
  assertTrue(result.hasSensitive, '应检测到结尾的敏感词');
  assertTrue(result.words.includes('买入'), '应找到"买入"');
});

testCase('重复的敏感词 - 只记录一次', () => {
  const result = sensitiveWordDetector.detect('暴力暴力暴力');
  assertEqual(result.words.length, 1, '重复敏感词只应记录一次');
  assertTrue(result.words.includes('暴力'), '应找到"暴力"');
});

testCase('超长文本 - 性能测试', () => {
  const startTime = Date.now();
  let longText = '';
  for (let i = 0; i < 1000; i++) {
    longText += '这是一段测试文本，';
  }
  longText += '包含敏感词暴力';
  const result = sensitiveWordDetector.detect(longText);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  assertTrue(result.hasSensitive, '超长文本应能检测到敏感词');
  assertTrue(duration < 100, `检测时间应小于100ms，实际: ${duration}ms`);
  console.log(`   超长文本检测耗时: ${duration}ms`);
});

console.log('\n-------------------');
console.log('8. 过滤功能测试');
console.log('-------------------\n');

testCase('过滤单个敏感词', () => {
  const result = sensitiveWordDetector.filter('这是暴力的');
  assertEqual(result, '这是***的', '应将"暴力"替换为***');
});

testCase('过滤多个敏感词', () => {
  const result = sensitiveWordDetector.filter('暴力和色情都是不好的');
  assertEqual(result, '***和***都是不好的', '应将多个敏感词都替换为***');
});

testCase('过滤投资敏感词', () => {
  const result = sensitiveWordDetector.filter('我想买入股票');
  assertEqual(result, '我想***股票', '应将"买入"替换为***');
});

testCase('过滤空文本', () => {
  const result = sensitiveWordDetector.filter('');
  assertEqual(result, '', '空文本应返回空');
});

testCase('过滤null输入', () => {
  const result = sensitiveWordDetector.filter(null);
  assertEqual(result, null, 'null输入应返回null');
});

console.log('\n-------------------');
console.log('9. hasSensitiveWord 简单检测测试');
console.log('-------------------\n');

testCase('hasSensitiveWord - 检测到敏感词', () => {
  const result = sensitiveWordDetector.hasSensitiveWord('这段文本包含暴力');
  assertTrue(result, '应返回true');
});

testCase('hasSensitiveWord - 无敏感词', () => {
  const result = sensitiveWordDetector.hasSensitiveWord('这段文本很正常');
  assertFalse(result, '应返回false');
});

testCase('hasSensitiveWord - 空文本', () => {
  const result = sensitiveWordDetector.hasSensitiveWord('');
  assertFalse(result, '空文本应返回false');
});

console.log('\n-------------------');
console.log('10. 性能测试 - 大量调用');
console.log('-------------------\n');

testCase('性能测试 - 1000次检测调用', () => {
  const startTime = Date.now();
  const testTexts = [
    '正常文本',
    '包含暴力的文本',
    '包含色情的文本',
    '包含买入的文本'
  ];
  
  for (let i = 0; i < 1000; i++) {
    const text = testTexts[i % 4];
    sensitiveWordDetector.detect(text);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const avgTime = (duration / 1000).toFixed(3);
  
  assertTrue(duration < 500, `1000次调用应小于500ms，实际: ${duration}ms`);
  console.log(`   1000次检测总耗时: ${duration}ms，平均: ${avgTime}ms/次`);
});

console.log('\n========================================');
console.log('测试总结');
console.log('========================================');
console.log(`总测试数: ${testResults.passed + testResults.failed}`);
console.log(`通过: ${testResults.passed}`);
console.log(`失败: ${testResults.failed}`);
console.log('========================================');

if (testResults.failed > 0) {
  console.log('\n失败的测试:');
  testResults.tests
    .filter(t => t.status === 'FAILED')
    .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
}
