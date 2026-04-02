// 敏感词功能单元测试脚本
const sensitiveWordDetector = require('./cloudfunctions/replyToLetter/sensitiveWordDetector');

console.log('🧪 开始敏感词功能单元测试...\n');

// 测试 1：基本检测功能
console.log('=== 测试 1：基本检测功能 ===');

// 正常文本
const result1 = sensitiveWordDetector.detect("这是一段正常的文本");
console.log('测试 1.1 - 正常文本:', result1.hasSensitive ? '❌ 错误' : '✅ 正确');

// 暴力敏感词
const result2 = sensitiveWordDetector.detect("这是一段包含杀人的暴力文本");
console.log('测试 1.2 - 暴力敏感词:', 
  result2.hasSensitive && result2.isHighSensitive && !result2.isInvestment && 
  result2.words.includes('杀人') && result2.categories.includes('violence') ? '✅ 正确' : '❌ 错误',
  result2
);

// 色情敏感词
const result3 = sensitiveWordDetector.detect("这是一段包含色情的低俗文本");
console.log('测试 1.3 - 色情敏感词:', 
  result3.hasSensitive && result3.isHighSensitive && !result3.isInvestment &&
  result3.words.includes('色情') && result3.categories.includes('porn') ? '✅ 正确' : '❌ 错误',
  result3
);

// 投资敏感词
const result4 = sensitiveWordDetector.detect("这是一段包含投资建议的理财文本");
console.log('测试 1.4 - 投资敏感词:', 
  result4.hasSensitive && !result4.isHighSensitive && result4.isInvestment &&
  result4.words.includes('投资建议') && result4.categories.includes('investment') ? '✅ 正确' : '❌ 错误',
  result4
);

// 混合敏感词
const result5 = sensitiveWordDetector.detect("暴力杀人色情投资建议");
console.log('测试 1.5 - 混合敏感词:', 
  result5.hasSensitive && result5.isHighSensitive && result5.isInvestment &&
  result5.words.length === 4 && result5.categories.length === 3 ? '✅ 正确' : '❌ 错误',
  result5
);

// 测试 2：边界条件
console.log('\n=== 测试 2：边界条件 ===');

// 空文本
const result6 = sensitiveWordDetector.detect("");
console.log('测试 2.1 - 空文本:', !result6.hasSensitive ? '✅ 正确' : '❌ 错误');

// null
const result7 = sensitiveWordDetector.detect(null);
console.log('测试 2.2 - null:', !result7.hasSensitive ? '✅ 正确' : '❌ 错误');

// undefined
const result8 = sensitiveWordDetector.detect(undefined);
console.log('测试 2.3 - undefined:', !result8.hasSensitive ? '✅ 正确' : '❌ 错误');

// 特殊字符
const result9 = sensitiveWordDetector.detect("杀@#$人 色!!!情");
console.log('测试 2.4 - 特殊字符:', 
  result9.words.includes('杀人') && result9.words.includes('色情') ? '✅ 正确' : '❌ 错误',
  result9.words
);

// 重复敏感词
const result10 = sensitiveWordDetector.detect("杀人杀人杀人");
console.log('测试 2.5 - 重复敏感词:', 
  result10.words.length === 1 ? '✅ 正确' : '❌ 错误',
  result10.words
);

// 测试 3：过滤功能
console.log('\n=== 测试 3：过滤功能 ===');

const filterResult1 = sensitiveWordDetector.filter("这是一段包含杀人的暴力文本");
console.log('测试 3.1 - 正常过滤:', filterResult1);

const filterResult2 = sensitiveWordDetector.filter("暴力杀人色情投资建议");
console.log('测试 3.2 - 多敏感词过滤:', filterResult2);

const filterResult3 = sensitiveWordDetector.filter("");
console.log('测试 3.3 - 空文本过滤:', filterResult3 === "" ? '✅ 正确' : '❌ 错误');

// 测试 4：快速检测功能
console.log('\n=== 测试 4：快速检测功能 ===');

const hasResult1 = sensitiveWordDetector.hasSensitiveWord("这是一段包含杀人的文本");
console.log('测试 4.1 - 有敏感词:', hasResult1 ? '✅ 正确' : '❌ 错误');

const hasResult2 = sensitiveWordDetector.hasSensitiveWord("这是一段正常的文本");
console.log('测试 4.2 - 无敏感词:', !hasResult2 ? '✅ 正确' : '❌ 错误');

const hasResult3 = sensitiveWordDetector.hasSensitiveWord("");
console.log('测试 4.3 - 空文本:', !hasResult3 ? '✅ 正确' : '❌ 错误');

// 测试 5：性能测试
console.log('\n=== 测试 5：性能测试 ===');

const shortText = "这是一段包含杀人、色情、投资建议的测试文本";
console.time('短文本 1000次检测');
for (let i = 0; i < 1000; i++) {
  sensitiveWordDetector.detect(shortText);
}
console.timeEnd('短文本 1000次检测');

const longText = "测试文本".repeat(100) + "杀人" + "测试文本".repeat(100);
console.time('长文本 100次检测');
for (let i = 0; i < 100; i++) {
  sensitiveWordDetector.detect(longText);
}
console.timeEnd('长文本 100次检测');

console.time('短文本 1000次过滤');
for (let i = 0; i < 1000; i++) {
  sensitiveWordDetector.filter(shortText);
}
console.timeEnd('短文本 1000次过滤');

console.log('\n🎉 单元测试完成！');
