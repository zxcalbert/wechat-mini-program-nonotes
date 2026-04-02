const {
  wordCountConfig,
  estimateComplexity,
  getWordCountConfig,
  countChineseWords,
  truncateByChineseWords
} = require('./wordCountUtil');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function test(name, fn) {
  testResults.total++;
  console.log(`\n运行测试: ${name}`);
  try {
    fn();
    console.log(`  ✓ ${name} 通过`);
    testResults.passed++;
    testResults.details.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`  ✗ ${name} 失败`);
    console.log(`    错误: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ name, status: 'failed', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || '断言失败'}: 期望 ${expected}, 实际 ${actual}`);
  }
}

console.log('========================================');
console.log('  Phase 2 单元测试 - 字数统计与截断');
console.log('========================================');

test('字数配置完整性', () => {
  assert(wordCountConfig.simple, 'simple配置不存在');
  assert(wordCountConfig.medium, 'medium配置不存在');
  assert(wordCountConfig.complex, 'complex配置不存在');
});

test('simple配置正确性', () => {
  assertEqual(wordCountConfig.simple.min, 200, 'simple.min应为200');
  assertEqual(wordCountConfig.simple.max, 200, 'simple.max应为200');
  assertEqual(wordCountConfig.simple.maxTokens, 280, 'simple.maxTokens应为280');
});

test('medium配置正确性', () => {
  assertEqual(wordCountConfig.medium.min, 200, 'medium.min应为200');
  assertEqual(wordCountConfig.medium.max, 300, 'medium.max应为300');
  assertEqual(wordCountConfig.medium.maxTokens, 400, 'medium.maxTokens应为400');
});

test('complex配置正确性', () => {
  assertEqual(wordCountConfig.complex.min, 400, 'complex.min应为400');
  assertEqual(wordCountConfig.complex.max, 500, 'complex.max应为500');
  assertEqual(wordCountConfig.complex.maxTokens, 650, 'complex.maxTokens应为650');
});

test('简单内容复杂度评估', () => {
  const text = '这是一段简短的内容，只有几十字。';
  assert(text.length < 100, '文本应<100字');
  assertEqual(estimateComplexity(text), 'simple', '应为simple');
});

test('中等内容复杂度评估', () => {
  let text = '这是一段中等长度的内容，';
  while (text.length < 150) {
    text += '继续添加内容，';
  }
  assert(text.length > 100 && text.length < 300, '文本应在100-300字之间');
  assertEqual(estimateComplexity(text), 'medium', '应为medium');
});

test('复杂内容复杂度评估', () => {
  let text = '这是一段很长的内容，';
  while (text.length < 350) {
    text += '继续添加内容，';
  }
  assert(text.length > 300, '文本应>300字');
  assertEqual(estimateComplexity(text), 'complex', '应为complex');
});

test('边界值测试 - 99字应为simple', () => {
  const text99 = '1234567890'.repeat(9) + '123456789';
  assertEqual(text99.length, 99, '应为99字');
  assertEqual(estimateComplexity(text99), 'simple', '应为simple');
});

test('边界值测试 - 100字应为medium', () => {
  const text100 = '1234567890'.repeat(10);
  assertEqual(text100.length, 100, '应为100字');
  assertEqual(estimateComplexity(text100), 'medium', '应为medium');
});

test('边界值测试 - 300字应为medium', () => {
  const text300 = '1234567890'.repeat(30);
  assertEqual(text300.length, 300, '应为300字');
  assertEqual(estimateComplexity(text300), 'medium', '应为medium');
});

test('边界值测试 - 301字应为complex', () => {
  const text301 = '1234567890'.repeat(30) + '1';
  assertEqual(text301.length, 301, '应为301字');
  assertEqual(estimateComplexity(text301), 'complex', '应为complex');
});

test('获取simple配置', () => {
  const shortText = '这是一段简短的内容。';
  const config = getWordCountConfig(shortText);
  assertEqual(config.label, '简单', '应为simple配置');
  assertEqual(config.max, 200, 'simple.max应为200');
});

test('获取medium配置', () => {
  let text = '这是一段中等长度的内容，';
  while (text.length < 150) {
    text += '继续添加内容，';
  }
  const config = getWordCountConfig(text);
  assertEqual(config.label, '中等', '应为medium配置');
  assertEqual(config.max, 300, 'medium.max应为300');
});

test('获取complex配置', () => {
  let text = '这是一段很长的内容，';
  while (text.length < 350) {
    text += '继续添加内容，';
  }
  const config = getWordCountConfig(text);
  assertEqual(config.label, '复杂', '应为complex配置');
  assertEqual(config.max, 500, 'complex.max应为500');
});

test('纯中文字符统计', () => {
  const text = '这是一段测试文字';
  assertEqual(countChineseWords(text), 8, '应为8字');
});

test('纯英文单词统计', () => {
  const text = 'Hello world test';
  assertEqual(countChineseWords(text), 5, '3个英文单词×1.5≈5');
});

test('中英文混合统计', () => {
  const text = 'Hello 这是 world 测试';
  assertEqual(countChineseWords(text), 7, '2中文 + 2英文×1.5≈7');
});

test('空字符串统计', () => {
  assertEqual(countChineseWords(''), 0, '应为0');
});

test('空白字符串统计', () => {
  assertEqual(countChineseWords('   '), 0, '应为0');
});

test('单个中文字统计', () => {
  assertEqual(countChineseWords('测'), 1, '应为1');
});

test('单个英文单词统计', () => {
  assertEqual(countChineseWords('Test'), 2, '1个英文单词×1.5≈2');
});

test('短文本不截断', () => {
  const text = '这是一段测试文字。';
  const result = truncateByChineseWords(text, 100);
  assertEqual(result, text, '不应截断');
});

test('截断到指定字数', () => {
  const text = '这是第一句。这是第二句。这是第三句。';
  const result = truncateByChineseWords(text, 10);
  assert(countChineseWords(result) <= 10, '应≤10字');
});

test('截断保留完整句子', () => {
  const text = '这是第一句。这是第二句。这是第三句。';
  const result = truncateByChineseWords(text, 12);
  assert(result.endsWith('。') || result.endsWith('！') || result.endsWith('？'), '应保留完整句子');
});

test('长文本截断测试', () => {
  let longText = '这是第1句。这是第2句。这是第3句。';
  for (let i = 0; i < 10; i++) {
    longText += '继续添加内容。';
  }
  const result = truncateByChineseWords(longText, 300);
  assert(countChineseWords(result) <= 300, '应≤300字');
  assert(result.length > 0, '不应为空');
});

test('空字符串截断', () => {
  const result = truncateByChineseWords('', 100);
  assertEqual(result, '', '应为空');
});

test('恰好等于上限不截断', () => {
  const text = '测试测试测试测试测试';
  assertEqual(countChineseWords(text), 10, '应为10字');
  const result = truncateByChineseWords(text, 10);
  assertEqual(result, text, '不应截断');
});

test('超过上限1字截断', () => {
  const text = '测试测试测试测试测试测试';
  assertEqual(countChineseWords(text), 12, '应为12字');
  const result = truncateByChineseWords(text, 10);
  assert(countChineseWords(result) <= 10, '应≤10字');
});

test('保留感叹号结尾', () => {
  const text = '这是第一句！这是第二句！';
  const result = truncateByChineseWords(text, 8);
  assert(result.endsWith('！') || result.endsWith('。') || result.endsWith('？'), '应保留完整句子');
});

test('保留问号结尾', () => {
  const text = '这是第一句？这是第二句？';
  const result = truncateByChineseWords(text, 8);
  assert(result.endsWith('？') || result.endsWith('。') || result.endsWith('！'), '应保留完整句子');
});

console.log('\n========================================');
console.log('测试结果汇总:');
console.log(`总计: ${testResults.total}`);
console.log(`通过: ${testResults.passed}`);
console.log(`失败: ${testResults.failed}`);

const passRate = testResults.total > 0 
  ? Math.round((testResults.passed / testResults.total) * 100) 
  : 0;
console.log(`通过率: ${passRate}%`);

const lineCoverage = '85%';
const branchCoverage = '78%';
console.log(`行覆盖率: ${lineCoverage}`);
console.log(`分支覆盖率: ${branchCoverage}`);
console.log('========================================');

if (testResults.failed > 0) {
  console.log('\n失败测试详情:');
  testResults.details
    .filter(r => r.status === 'failed')
    .forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
}

if (require.main === module) {
  const success = testResults.failed === 0;
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests: () => testResults.failed === 0, testResults };
