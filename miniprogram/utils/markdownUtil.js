/**
 * 轻量 Markdown → HTML 转换器
 * 专为微信小程序 rich-text 组件设计
 * 支持 AI 分析输出常用的标记语法，包括表格、任务列表、嵌套列表等
 */

'use strict';

function parseMarkdown(md) {
  if (!md || typeof md !== 'string') return '';

  var html = md;

  // 转义 HTML 特殊字符
  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');

  // 代码块（```lang ... ```）— 先处理，防止内部被后续规则干扰
  // 用占位符保护代码块内容
  var codeBlocks = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function(m, lang, code) {
    var idx = codeBlocks.length;
    codeBlocks.push('<pre style="background-color:#f5f5f5;padding:20rpx;border-radius:12rpx;overflow-x:auto;margin:16rpx 0;"><code style="font-family:monospace;font-size:26rpx;line-height:1.6;word-break:break-word;overflow-wrap:break-word;">' + code.trim() + '</code></pre>');
    return '%%CODEBLOCK_' + idx + '%%';
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题（必须在行首）
  html = html.replace(/^#### (.+)$/gm, '<h4 style="word-break:break-all;overflow-wrap:break-word;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="word-break:break-all;overflow-wrap:break-word;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="word-break:break-all;overflow-wrap:break-word;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="word-break:break-all;overflow-wrap:break-word;">$1</h1>');

  // 表格：匹配 | ... | 格式的表格块
  html = html.replace(/((?:^\|.+\|$\n?)+)/gm, function(tableBlock) {
    var rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;

    // rich-text 不继承外部 CSS，必须用内联样式强制换行
    var tableHtml = '<table style="table-layout:fixed;width:100%;border-collapse:collapse;">';
    var isHeader = true;

    rows.forEach(function(row) {
      // 跳过分隔行（|---|---|）
      if (/^\|[\s\-:|]+\|$/.test(row)) return;

      var cells = row.split('|').filter(function(c, i, arr) {
        // 过滤首尾空元素
        return i > 0 && i < arr.length - 1;
      });

      if (cells.length === 0) return;

      var tag = isHeader ? 'th' : 'td';
      var rowHtml = '<tr>';
      cells.forEach(function(cell) {
        // 内联样式防止长文本撑破表格
        var cellStyle = 'word-break:break-word;overflow-wrap:break-word;padding:10rpx 16rpx;border:1rpx solid #e0e0e0;';
        if (isHeader) {
          cellStyle += 'background-color:#f5f5f5;font-weight:600;text-align:left;';
        }
        rowHtml += '<' + tag + ' style="' + cellStyle + '">' + cell.trim() + '</' + tag + '>';
      });
      rowHtml += '</tr>';
      tableHtml += rowHtml;

      // 第一行数据行之后视为表体
      if (isHeader) isHeader = false;
    });

    tableHtml += '</table>';
    return tableHtml;
  });

  // 引用块
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="word-break:break-all;overflow-wrap:break-word;">$1</blockquote>');

  // 任务列表（- [x] 或 - [ ]）
  html = html.replace(/^[\-\*] \[x\] (.+)$/gm, '<li class="task-item task-done">$1</li>');
  html = html.replace(/^[\-\*] \[ \] (.+)$/gm, '<li class="task-item">$1</li>');

  // 粗体 + 斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 分隔线
  html = html.replace(/^---$/gm, '<hr/>');

  // 无序列表（- 或 * 开头，支持缩进）
  html = html.replace(/^(\s*)[\-\*] (.+)$/gm, function(m, indent, content) {
    var depth = Math.floor(indent.length / 2);
    return '<li class="list-depth-' + depth + '" style="word-break:break-all;overflow-wrap:break-word;">' + content + '</li>';
  });

  // 有序列表（支持缩进）
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, function(m, indent, content) {
    var depth = Math.floor(indent.length / 2);
    return '<li class="ol-item list-depth-' + depth + '" style="word-break:break-all;overflow-wrap:break-word;">' + content + '</li>';
  });

  // 包裹连续 <li> 为 <ul>（保留 class）
  html = html.replace(/((?:<li[^>]*>[\s\S]*?<\/li>\s*)+)/g, function(m) {
    return '<ul>' + m + '</ul>';
  });

  // 段落：非标签开头的行包裹 <p>（跳过代码块占位符）
  html = html.replace(/^(?!<[hublop]|<\/|<hr|<pre|<code|<block|<table|%%CODEBLOCK)(.*\S.*)$/gm, '<p style="word-break:break-all;overflow-wrap:break-word;">$1</p>');

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  // 合并连续 blockquote；rich-text 内联样式会让第二个开标签带属性。
  html = html.replace(/<\/blockquote>\s*<blockquote[^>]*>/g, '<br/>');

  // 压缩多余换行
  html = html.replace(/\n{2,}/g, '\n');

  // 恢复代码块占位符
  html = html.replace(/%%CODEBLOCK_(\d+)%%/g, function(m, idx) {
    return codeBlocks[parseInt(idx)];
  });

  return html;
}

/**
 * 将 markdown 文本转为 rich-text 组件可用的 HTML
 */
function toNodes(md) {
  var html = parseMarkdown(md);
  return html;
}

module.exports = {
  parse: parseMarkdown,
  toNodes: toNodes
};
