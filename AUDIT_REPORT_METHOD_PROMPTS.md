# 21个分析方法提示词文件审核报告

**审核时间**：2026-05-06
**审核范围**：`cloudfunctions/shared/reasoning/prompts/methods/` 下全部 21 个文件
**审核依据**：与 `mentorRules.json` 中的原始数据逐项比对

---

## 审核结果

| 状态 | 数量 |
|------|------|
| ✅ 通过 | 21/21 |
| ⚠️ 需关注 | 0/21 |

**全部通过。**

## 审核维度

1. **标题一致性**：文件 `# 标题` 与 `mentorRules.json` 中的方法名完全一致 ✅
2. **核心原则数量**：每个方法均包含 8 条核心原则 ✅
3. **思考框架数量**：每个方法均包含 5 条思考框架 ✅
4. **文件完整性**：所有文件大小在 950B-1198B 之间，内容完整 ✅
5. **字段覆盖**：方法概述、核心原则、思考框架、常用分析角度、输出风格均完整 ✅

## 各领域覆盖

| 领域 | 方法数量 | 状态 |
|------|---------|------|
| 价值思维 | 3 个方法 | ✅ 完整 |
| 创新创业 | 6 个方法 | ✅ 完整 |
| 心理学 | 5 个方法 | ✅ 完整 |
| 哲学 | 7 个方法 | ✅ 完整 |

## 方法清单

| 方法名 | Slug | 领域 | 原则 | 框架 |
|--------|------|------|------|------|
| 多元思维模型分析 | multi-model-thinking | 价值思维 | 8 | 5 |
| 价值投资分析框架 | value-investing | 价值思维 | 8 | 5 |
| 安全边际分析 | margin-of-safety | 价值思维 | 8 | 5 |
| 本分经营分析 | benfen-business | 创新创业 | 8 | 5 |
| 极简产品分析 | minimalist-product | 创新创业 | 8 | 5 |
| 创新设计分析 | innovation-design | 创新创业 | 8 | 5 |
| 第一性原理分析 | first-principles | 创新创业 | 8 | 5 |
| 长期主义分析 | long-termism | 创新创业 | 8 | 5 |
| 垄断竞争分析 | monopoly-competition | 创新创业 | 8 | 5 |
| 原型心理分析 | archetype-psychology | 心理学 | 8 | 5 |
| 精神分析框架 | psychoanalysis | 心理学 | 8 | 5 |
| 人本精神分析 | humanistic-psychology | 心理学 | 8 | 5 |
| 目的论分析 | teleology | 心理学 | 8 | 5 |
| 需求层次分析 | hierarchy-of-needs | 心理学 | 8 | 5 |
| 道家思想分析 | taoism | 哲学 | 8 | 5 |
| 儒家伦理分析 | confucianism | 哲学 | 8 | 5 |
| 苏格拉底式提问 | socratic-questioning | 哲学 | 8 | 5 |
| 理念论分析 | theory-of-ideas | 哲学 | 8 | 5 |
| 幸福伦理学分析 | eudaimonia | 哲学 | 8 | 5 |
| 超人哲学分析 | overman-philosophy | 哲学 | 8 | 5 |
| 语言哲学分析 | philosophy-of-language | 哲学 | 8 | 5 |

## 结论

**21 个方法提示词文件全部合格**。数据来源为 `mentorRules.json`，自动生成，内容完整且与源数据一致。文件结构统一，可用于：

1. 未来 AI Agent API 调用时提供方法上下文
2. 云函数 `replyToLetter` 的提示词组合器引用
3. CLI/MCP Server 的方法描述输出
