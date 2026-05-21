'use strict';

/**
 * API Key 生成与管理工具
 * 用于 AI Agent 接口认证（Phase A）
 */

var ACCESS_KEY_PREFIX = 'wn_';
var ACCESS_KEY_LENGTH = 32;

/**
 * 生成随机 API Key
 * 格式：wn_{32位十六进制字符串}
 * @returns {string}
 */
function generateApiKey() {
  var chars = '0123456789abcdef';
  var key = ACCESS_KEY_PREFIX;
  for (var i = 0; i < ACCESS_KEY_LENGTH; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * 校验 API Key 格式
 * @param {string} key
 * @returns {boolean}
 */
function isValidApiKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  var regex = new RegExp('^' + ACCESS_KEY_PREFIX + '[0-9a-f]{' + ACCESS_KEY_LENGTH + '}$');
  return regex.test(key);
}

/**
 * 脱敏显示 API Key（仅显示前4位和后4位）
 * @param {string} key
 * @returns {string}
 */
function maskApiKey(key) {
  if (!key || key.length < 12) return '***';
  return key.substring(0, 7) + '...' + key.substring(key.length - 4);
}

module.exports = {
  generateApiKey: generateApiKey,
  isValidApiKeyFormat: isValidApiKeyFormat,
  maskApiKey: maskApiKey
};
