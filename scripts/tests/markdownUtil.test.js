'use strict';

const { parse } = require('@utils/markdownUtil');

describe('markdownUtil.parse', () => {
  test('空输入返回空字符串', () => {
    expect(parse(null)).toBe('');
    expect(parse(undefined)).toBe('');
    expect(parse('')).toBe('');
  });

  test('标题解析', () => {
    expect(parse('# 标题一')).toMatch(/<h1[^>]*>标题一<\/h1>/);
    expect(parse('## 标题二')).toMatch(/<h2[^>]*>标题二<\/h2>/);
    expect(parse('### 标题三')).toMatch(/<h3[^>]*>标题三<\/h3>/);
    expect(parse('#### 标题四')).toMatch(/<h4[^>]*>标题四<\/h4>/);
  });

  test('粗体和斜体', () => {
    expect(parse('**粗体**')).toContain('<strong>粗体</strong>');
    expect(parse('*斜体*')).toContain('<em>斜体</em>');
    expect(parse('***粗斜体***')).toContain('<strong><em>粗斜体</em></strong>');
  });

  test('代码块', () => {
    const result = parse('```js\nconst x = 1;\n```');
    expect(result).toMatch(/<pre[^>]*><code[^>]*>/);
    expect(result).toContain('const x = 1;');
    expect(result).toContain('</code></pre>');
  });

  test('行内代码', () => {
    expect(parse('使用 `npm install` 安装')).toContain('<code>npm install</code>');
  });

  test('无序列表', () => {
    const result = parse('- 项目一\n- 项目二\n- 项目三');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li');
    expect(result).toContain('项目一');
  });

  test('有序列表', () => {
    const result = parse('1. 第一步\n2. 第二步');
    expect(result).toContain('<ul>');
    expect(result).toContain('ol-item');
  });

  test('任务列表', () => {
    expect(parse('- [x] 已完成')).toContain('task-done');
    expect(parse('- [ ] 未完成')).toContain('task-item');
  });

  test('引用块', () => {
    const result = parse('> 这是一段引用');
    expect(result).toMatch(/<blockquote[^>]*>这是一段引用<\/blockquote>/);
  });

  test('表格', () => {
    const md = '| 名称 | 值 |\n| --- | --- |\n| a | 1 |';
    const result = parse(md);
    expect(result).toMatch(/<table[^>]*>/);
    expect(result).toMatch(/<th[^>]*>名称<\/th>/);
    expect(result).toMatch(/<td[^>]*>a<\/td>/);
  });

  test('分隔线', () => {
    expect(parse('---')).toContain('<hr/>');
  });

  test('链接', () => {
    expect(parse('[文本](http://example.com)')).toContain('<a href="http://example.com">文本</a>');
  });

  test('HTML 特殊字符转义', () => {
    expect(parse('1 < 2 & 3 > 0')).toContain('&lt;');
    expect(parse('1 < 2 & 3 > 0')).toContain('&gt;');
    expect(parse('1 < 2 & 3 > 0')).toContain('&amp;');
  });

  test('连续引用合并', () => {
    const result = parse('> 第一行\n> 第二行');
    expect(result).toContain('<br/>');
  });

  test('复杂文档（多元素组合）', () => {
    const md = '# 标题\n\n一段文字 **加粗** 和 *斜体*。\n\n- 列表项\n\n```\ncode\n```\n\n---';
    const result = parse(md);
    expect(result).toMatch(/<h1[^>]*>标题<\/h1>/);
    expect(result).toContain('<strong>加粗</strong>');
    expect(result).toContain('<em>斜体</em>');
    expect(result).toMatch(/<pre[^>]*><code[^>]*>/);
    expect(result).toContain('<hr/>');
  });
});
