'use strict';

// sensitiveWordDetector.js 是单例导出，需要先加载敏感词词典
// 这里通过 require 直接加载（依赖 sensitiveWords.json 在同目录下）
const detector = require('@cloud/sensitiveWordDetector');

describe('sensitiveWordDetector', () => {
  describe('detect', () => {
    test('空输入返回安全结果', () => {
      const result = detector.detect('');
      expect(result.hasSensitive).toBe(false);
      expect(result.isHighSensitive).toBe(false);
      expect(result.words).toEqual([]);
    });

    test('null/undefined 输入安全', () => {
      const result = detector.detect(null);
      expect(result.hasSensitive).toBe(false);
    });

    test('正常文本无敏感词', () => {
      const result = detector.detect('今天天气真好，适合出去散步');
      expect(result.hasSensitive).toBe(false);
      expect(result.words).toEqual([]);
    });

    test('检测到敏感词返回正确结构', () => {
      // 测试框架不依赖具体敏感词内容，仅验证结构
      const result = detector.detect('测试文本');
      expect(result).toHaveProperty('hasSensitive');
      expect(result).toHaveProperty('isHighSensitive');
      expect(result).toHaveProperty('isInvestment');
      expect(result).toHaveProperty('words');
      expect(result).toHaveProperty('categories');
      expect(Array.isArray(result.words)).toBe(true);
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });

  describe('filter', () => {
    test('空输入返回原值', () => {
      expect(detector.filter('')).toBe('');
      expect(detector.filter(null)).toBe(null);
      expect(detector.filter(undefined)).toBe(undefined);
    });

    test('正常文本不被过滤', () => {
      const text = '这是一段正常的文本';
      expect(detector.filter(text)).toBe(text);
    });
  });

  describe('hasSensitiveWord', () => {
    test('空输入返回 false', () => {
      expect(detector.hasSensitiveWord('')).toBe(false);
      expect(detector.hasSensitiveWord(null)).toBe(false);
    });

    test('正常文本返回 false', () => {
      expect(detector.hasSensitiveWord('你好世界')).toBe(false);
    });
  });
});
