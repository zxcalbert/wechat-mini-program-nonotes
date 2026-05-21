'use strict';

const {
  estimateComplexity,
  getWordCountConfig,
  countChineseWords,
  truncateByChineseWords
} = require('@scripts/wordCountUtil');

describe('wordCountUtil', () => {
  describe('estimateComplexity', () => {
    test('短文本为 simple', () => {
      expect(estimateComplexity('你好')).toBe('simple');
      expect(estimateComplexity('a'.repeat(50))).toBe('simple');
    });

    test('中等文本为 medium', () => {
      expect(estimateComplexity('a'.repeat(100))).toBe('medium');
      expect(estimateComplexity('a'.repeat(200))).toBe('medium');
    });

    test('长文本为 complex', () => {
      expect(estimateComplexity('a'.repeat(301))).toBe('complex');
      expect(estimateComplexity('a'.repeat(500))).toBe('complex');
    });

    test('边界值：99 为 simple，100 为 medium，300 为 medium，301 为 complex', () => {
      expect(estimateComplexity('a'.repeat(99))).toBe('simple');
      expect(estimateComplexity('a'.repeat(100))).toBe('medium');
      expect(estimateComplexity('a'.repeat(300))).toBe('medium');
      expect(estimateComplexity('a'.repeat(301))).toBe('complex');
    });
  });

  describe('getWordCountConfig', () => {
    test('返回对应复杂度的配置', () => {
      const simple = getWordCountConfig('短文');
      expect(simple).toHaveProperty('min');
      expect(simple).toHaveProperty('max');
      expect(simple).toHaveProperty('maxTokens');
      expect(simple.label).toBe('简单');
    });

    test('complex 配置的 maxTokens 大于 simple', () => {
      const simple = getWordCountConfig('短');
      const complex = getWordCountConfig('a'.repeat(400));
      expect(complex.maxTokens).toBeGreaterThan(simple.maxTokens);
    });
  });

  describe('countChineseWords', () => {
    test('纯中文计数', () => {
      expect(countChineseWords('你好世界')).toBe(4);
    });

    test('纯英文单词计数（乘以1.5）', () => {
      expect(countChineseWords('hello world')).toBe(3); // 2 * 1.5 = 3
    });

    test('中英混合', () => {
      const count = countChineseWords('你好hello世界world');
      expect(count).toBe(7); // 4中文 + 2英文*1.5 = 7
    });

    test('空字符串', () => {
      expect(countChineseWords('')).toBe(0);
    });
  });

  describe('truncateByChineseWords', () => {
    test('未超限返回原文', () => {
      expect(truncateByChineseWords('你好世界', 10)).toBe('你好世界');
    });

    test('超限时截断', () => {
      const text = '这是一段很长的文字内容用来测试截断功能的正常工作。';
      const result = truncateByChineseWords(text, 5);
      expect(result.length).toBeLessThan(text.length);
    });

    test('截断在标点处断句', () => {
      const text = '第一句话。第二句话。第三句话。';
      const result = truncateByChineseWords(text, 5);
      // 结果应以句号结尾
      expect(result).toMatch(/[。！？]$/);
    });
  });
});
