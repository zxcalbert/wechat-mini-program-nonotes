/**
 * 分析结果导出工具
 * 将分析记录转为标准 Markdown 格式，支持小程序保存和未来 API 导出
 */

'use strict';

/**
 * 将分析记录转为 Markdown 格式
 * @param {Object} record - 分析记录对象
 * @returns {string} Markdown 文本
 */
function analysisToMarkdown(record) {
  if (!record) return '';

  var lines = [];

  // 标题
  var method = record.displayMethod || record.mentor || '分析方法';
  var contentPreview = (record.content || '').substring(0, 20);
  lines.push('# ' + method + '：' + contentPreview);
  lines.push('');

  // 元信息
  lines.push('> 分析方法：' + method);
  if (record.createTime) {
    var date = _formatDate(record.createTime);
    lines.push('> 分析时间：' + date);
  }
  if (record.status) {
    lines.push('> 状态：' + _statusLabel(record.status));
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // 用户原始输入
  if (record.content) {
    lines.push('## 原始问题');
    lines.push('');
    lines.push(record.content);
    lines.push('');
  }

  // 分析结果（AI 输出本身可能已含标题，避免重复）
  if (record.replyContent) {
    var reply = record.replyContent.trim();
    if (!reply.startsWith('#')) {
      lines.push('## 分析结果');
      lines.push('');
    }
    lines.push(reply);
    lines.push('');
  }

  // AI 免责声明
  lines.push('---');
  lines.push('');
  lines.push('*以上内容由 AI 生成，仅供参考。分析方法：' + method + '*');

  return lines.join('\n');
}

/**
 * 将多维度分析记录转为 Markdown
 */
function roundtableToMarkdown(record) {
  if (!record) return '';

  var lines = [];
  lines.push('# 多维度分析：' + (record.content || '').substring(0, 20));
  lines.push('');

  if (record.createTime) {
    lines.push('> 分析时间：' + _formatDate(record.createTime));
    lines.push('');
  }

  if (record.content) {
    lines.push('## 原始问题');
    lines.push('');
    lines.push(record.content);
    lines.push('');
  }

  // 各方法的分析结果
  if (record.replies && Array.isArray(record.replies)) {
    record.replies.forEach(function(reply, i) {
      var methodName = reply.method || reply.mentor || ('分析方法 ' + (i + 1));
      lines.push('## ' + methodName);
      lines.push('');
      lines.push(reply.content || reply.replyContent || '');
      lines.push('');
    });
  } else if (record.replyContent) {
    lines.push('## 分析结果');
    lines.push('');
    lines.push(record.replyContent);
    lines.push('');
  }

  lines.push('---');
  lines.push('*以上内容由 AI 生成，仅供参考*');

  return lines.join('\n');
}

/**
 * 将孵化器报告转为 Markdown
 */
function incubatorToMarkdown(record) {
  if (!record) return '';

  var lines = [];
  lines.push('# 思想孵化报告');
  lines.push('');

  if (record.createTime) {
    lines.push('> 生成时间：' + _formatDate(record.createTime));
    lines.push('');
  }

  if (record.originalIdea) {
    lines.push('## 初始想法');
    lines.push('');
    lines.push(record.originalIdea);
    lines.push('');
  }

  if (record.replyContent) {
    lines.push('## 孵化结果');
    lines.push('');
    lines.push(record.replyContent);
    lines.push('');
  }

  lines.push('---');
  lines.push('*以上内容由 AI 生成，仅供参考*');

  return lines.join('\n');
}

function _formatDate(date) {
  if (!date) return '未知';
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  var y = date.getFullYear();
  var m = (date.getMonth() + 1).toString().padStart(2, '0');
  var d = date.getDate().toString().padStart(2, '0');
  var h = date.getHours().toString().padStart(2, '0');
  var min = date.getMinutes().toString().padStart(2, '0');
  return y + '-' + m + '-' + d + ' ' + h + ':' + min;
}

function _statusLabel(status) {
  var map = {
    'analyzing': '分析中', 'pending': '分析中',
    'completed': '已完成', 'replied': '已完成',
    'viewed': '已查看', 'read': '已查看',
    'saved': '已保存'
  };
  return map[status] || '未知';
}

/**
 * 根据记录类型自动选择转换函数
 */
function autoExport(record, type) {
  switch (type) {
    case 'roundtable':
      return roundtableToMarkdown(record);
    case 'incubator':
      return incubatorToMarkdown(record);
    default:
      return analysisToMarkdown(record);
  }
}

module.exports = {
  analysisToMarkdown: analysisToMarkdown,
  roundtableToMarkdown: roundtableToMarkdown,
  incubatorToMarkdown: incubatorToMarkdown,
  autoExport: autoExport
};
