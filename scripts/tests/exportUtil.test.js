'use strict';

const {
  analysisToMarkdown,
  roundtableToMarkdown,
  incubatorToMarkdown,
  exportAllToMarkdown,
  autoExport
} = require('@utils/exportUtil');

describe('exportUtil', () => {
  describe('analysisToMarkdown', () => {
    test('空记录返回空字符串', () => {
      expect(analysisToMarkdown(null)).toBe('');
      expect(analysisToMarkdown(undefined)).toBe('');
    });

    test('基本分析记录格式化', () => {
      const record = {
        displayMethod: 'SWOT分析',
        content: '如何提升团队效率',
        replyContent: '## 分析结果\n优势：...',
        createTime: new Date('2026-01-15T10:30:00'),
        status: 'completed'
      };
      const md = analysisToMarkdown(record);
      expect(md).toContain('# SWOT分析');
      expect(md).toContain('如何提升团队效率');
      expect(md).toContain('分析结果');
      expect(md).toContain('2026-01-15');
      expect(md).toContain('已完成');
      expect(md).toContain('AI 生成');
    });

    test('replyContent 已有标题时不重复添加', () => {
      const record = {
        replyContent: '## 已有标题\n内容'
      };
      const md = analysisToMarkdown(record);
      // 不应出现连续两个 "## 分析结果"
      const count = (md.match(/## 分析结果/g) || []).length;
      expect(count).toBe(0);
    });

    test('无 method 时使用默认值', () => {
      const record = { content: '测试内容' };
      const md = analysisToMarkdown(record);
      expect(md).toContain('分析方法');
    });
  });

  describe('roundtableToMarkdown', () => {
    test('多维度分析含多个回复', () => {
      const record = {
        content: '如何做决策',
        createTime: new Date('2026-03-01'),
        replies: [
          { method: 'SWOT分析', content: '优势...' },
          { method: '六顶思考帽', content: '白帽...' }
        ]
      };
      const md = roundtableToMarkdown(record);
      expect(md).toContain('SWOT分析');
      expect(md).toContain('六顶思考帽');
      expect(md).toContain('多维度分析');
    });

    test('无 replies 时回退到 replyContent', () => {
      const record = {
        content: '测试',
        replyContent: '分析内容'
      };
      const md = roundtableToMarkdown(record);
      expect(md).toContain('分析内容');
    });
  });

  describe('incubatorToMarkdown', () => {
    test('孵化器报告格式化', () => {
      const record = {
        originalIdea: '初始想法内容',
        replyContent: '孵化结果内容',
        createTime: new Date('2026-05-01')
      };
      const md = incubatorToMarkdown(record);
      expect(md).toContain('思想孵化报告');
      expect(md).toContain('初始想法内容');
      expect(md).toContain('孵化结果内容');
    });
  });

  describe('autoExport', () => {
    test('roundtable 类型', () => {
      const md = autoExport({ content: '测试' }, 'roundtable');
      expect(md).toContain('多维度分析');
    });

    test('incubator 类型', () => {
      const md = autoExport({ content: '测试' }, 'incubator');
      expect(md).toContain('思想孵化报告');
    });

    test('默认使用 analysisToMarkdown', () => {
      const md = autoExport({ content: '测试内容' }, 'letter');
      expect(md).toContain('分析方法');
    });
  });

  describe('exportAllToMarkdown', () => {
    test('导出四类业务集合为单个 Markdown', () => {
      const md = exportAllToMarkdown({
        exportedAt: new Date('2026-05-21T10:00:00'),
        letters: [{
          displayMethod: '多元思维模型分析',
          content: '如何做判断',
          replyContent: '分析内容',
          status: 'completed',
          createTime: new Date('2026-05-01T08:00:00')
        }],
        roundtables: [{
          content: '如何做选择',
          selectedMethods: ['第一性原理分析', { displayName: '长期主义分析' }],
          replies: [{ method: '第一性原理分析', content: '拆解问题' }],
          createTime: new Date('2026-05-02T08:00:00')
        }],
        incubators: [{
          originalIdea: '做一个知识工具',
          report: '孵化报告内容',
          actionPlan: ['验证需求'],
          selectedMethods: [{ method: '创新设计分析' }],
          createTime: new Date('2026-05-03T08:00:00')
        }],
        structures: [{
          content: '分析某产品结构',
          replyContent: '结构分析内容',
          analysisType: 'product',
          createTime: new Date('2026-05-04T08:00:00')
        }]
      });

      expect(md).toContain('# 智慧笔记 - 数据导出');
      expect(md).toContain('总记录数：4 条');
      expect(md).toContain('## 分析记录');
      expect(md).toContain('## 多维度分析');
      expect(md).toContain('## 孵化报告');
      expect(md).toContain('## 结构分析');
      expect(md).toContain('多元思维模型分析');
      expect(md).toContain('第一性原理分析');
      expect(md).toContain('孵化报告内容');
      expect(md).toContain('结构分析内容');
    });

    test('空集合也导出完整骨架和暂无记录提示', () => {
      const md = exportAllToMarkdown({ exportedAt: new Date('2026-05-21T10:00:00') });
      expect(md).toContain('总记录数：0 条');
      expect(md.match(/暂无记录。/g).length).toBe(4);
      expect(md).toContain('- [分析记录](#分析记录)（0条）');
      expect(md).toContain('- [结构分析](#结构分析)（0条）');
    });

    test('导出内容不包含 API Key 明文字段', () => {
      const md = exportAllToMarkdown({
        letters: [{
          content: '测试',
          replyContent: '结果',
          apiKey: 'sk-secret',
          api_key: 'sk-secret-2',
          authorization: 'Bearer secret'
        }]
      });
      expect(md).not.toContain('sk-secret');
      expect(md).not.toContain('apiKey:');
      expect(md).not.toContain('authorization');
      expect(md).toContain('导出文件不包含 API Key 明文');
    });
  });
});
