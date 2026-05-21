'use strict';

const {
  generateApiKey,
  isValidApiKeyFormat,
  maskApiKey
} = require('@utils/apiKeyUtil');

describe('apiKeyUtil', () => {
  describe('generateApiKey', () => {
    test('生成格式为 wn_ + 32位十六进制', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^wn_[0-9a-f]{32}$/);
    });

    test('每次生成不同的 key', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });

    test('总长度为 35（3前缀 + 32字符）', () => {
      const key = generateApiKey();
      expect(key.length).toBe(35);
    });
  });

  describe('isValidApiKeyFormat', () => {
    test('合法 key 返回 true', () => {
      expect(isValidApiKeyFormat('wn_' + 'a'.repeat(32))).toBe(true);
      expect(isValidApiKeyFormat('wn_0123456789abcdef0123456789abcdef')).toBe(true);
    });

    test('空输入返回 false', () => {
      expect(isValidApiKeyFormat('')).toBe(false);
      expect(isValidApiKeyFormat(null)).toBe(false);
      expect(isValidApiKeyFormat(undefined)).toBe(false);
    });

    test('前缀错误返回 false', () => {
      expect(isValidApiKeyFormat('sk_' + 'a'.repeat(32))).toBe(false);
    });

    test('长度不足返回 false', () => {
      expect(isValidApiKeyFormat('wn_abc123')).toBe(false);
    });

    test('含大写字母返回 false', () => {
      expect(isValidApiKeyFormat('wn_' + 'A'.repeat(32))).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    test('正常脱敏', () => {
      const key = 'wn_0123456789abcdef0123456789abcdef';
      const masked = maskApiKey(key);
      expect(masked).toBe('wn_0123...cdef');
      expect(masked).not.toContain('0123456789abcdef01234567');
    });

    test('空输入返回 ***', () => {
      expect(maskApiKey('')).toBe('***');
      expect(maskApiKey(null)).toBe('***');
    });

    test('过短输入返回 ***', () => {
      expect(maskApiKey('short')).toBe('***');
    });
  });
});
