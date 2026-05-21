'use strict';

function normalizeAnalysisText(text) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text;

  // 移除markdown代码块包裹
  normalized = normalized.replace(/^```[\w]*\n?/gm, '');
  normalized = normalized.replace(/\n?```$/gm, '');

  // 移除多余空行（超过2个连续换行压缩为2个）
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  // 统一引号
  normalized = normalized.replace(/[""]/g, '"');
  normalized = normalized.replace(/['']/g, "'");

  // 移除首尾空白
  normalized = normalized.trim();

  return normalized;
}

function validateAnalysisResult(text) {
  if (!text || text.length < 50) return false;
  if (text.includes('我无法回答') || text.includes('我不能提供')) return false;
  return true;
}

module.exports = {
  normalizeAnalysisText,
  validateAnalysisResult
};
