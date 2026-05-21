# AGENTS.md - 智慧笔记代理开发规范

**版本**：v2.3
**更新日期**：2026-05-21
**适用范围**：所有 AI 代理、自动化脚本和协作者
**优先级**：若与 `project_rules.md` 冲突，一律以 `project_rules.md` 为准。

---

## 1. 项目定位

「智慧笔记」是微信小程序原生项目，核心能力是让用户提交问题、观察或反思，选择分析方法后获得 AI 方法论分析，并通过 18 小时延迟查看机制鼓励自主思考。

- 前端：微信小程序原生框架，WXML + WXSS + JS。
- 后端：微信云开发 CloudBase，云函数 + 云数据库。
- AI：DeepSeek API，由 `replyToLetter` 云函数统一调用。
- 可视化：Canvas 2D 脑图、知识图谱、Markdown 渲染。
- 项目约束：无 TypeScript、无外部前端状态管理、无小程序前端 npm 依赖。

## 2. 规范优先级

1. `project_rules.md`：最高优先级，包含重构禁令、安全红线、单次变更限制。
2. 本文件：代理执行规范，说明如何在现有项目中安全改动。
3. `README.md`、`miniprogram/README.md`、`cloudfunctions/README.md`、`CODE_WIKI.md`：作为项目现状参考。

执行任务前先确认目标文件所在模块，优先阅读离代码最近的 README 或已有实现。文档与代码不一致时，以当前代码为准，并在同次小范围变更中同步修正文档。

## 3. 强制项目红线

- 禁止一次性大规模重构。
- 单次变更建议控制在 5 个文件、200 行、1 个模块内。
- 禁止迁移到 TypeScript。
- 禁止更换状态管理方案。
- 禁止同时修改多个不相关模块。
- 禁止重构时顺手添加新功能。
- 不提交真实 API Key、云环境密钥、用户数据或敏感截图。
- 所有数据库查询必须按用户身份隔离，不能扩大数据可见范围。
- 涉及内容输入、AI 输出、举报、隐私、额度、支付相关逻辑时，优先考虑合规和安全。

## 4. 常用命令

```bash
# 项目规则检查
cd scripts && node checks/project-rules-check.js

# 预提交检查
cd scripts && bash pre-commit-check.sh

# 测试
cd scripts && npm test
cd scripts && npm run test:jest
cd scripts && npm run test:jest:coverage
cd scripts && npm run test:unit
cd scripts && npm run test:integration

# MCP server
cd mcp-server && npm start
cd mcp-server && npm test
```

小程序没有 CLI 构建流程。编译、预览和上传在微信开发者工具中完成。

## 5. 目录速览

```text
miniprogram/        微信小程序前端
  pages/            页面：index、write、detail、roundtable、incubator、knowledgeMap 等
  components/       sideMenu、heatmapCalendar、markdown-renderer、mindmap-renderer 等
  utils/            cloudbaseUtil、sensitiveWordUtil、cacheUtil、markdownUtil、apiKeyUtil 等

cloudfunctions/     云函数后端
  replyToLetter/    AI 分析核心，按 event.type 分发
  shared/           推理管线和方法提示词
  login/            登录注册和额度初始化
  reportContent/    内容举报
  discoverConnections/、getKnowledgeInsights/  知识图谱相关能力

scripts/            规则检查、测试、Jest 配置
tests/              测试夹具和样本数据
mcp-server/         开发辅助 MCP server
```

## 6. 核心数据流

- 单维度分析：`write` 页 -> `replyToLetter` -> DeepSeek -> `letters`。
- 多维度分析：`roundtable` 页 -> `replyToLetter(type: 'roundtable')` -> 并行 AI 调用 -> `roundtable_discussions`。
- 思想孵化器：`incubator` 页 -> `replyToLetter(type: 'incubator')` -> `incubator_reports`。
- 结构分析：`structureAnalysis` 页 -> `replyToLetter(type: 'structure_analysis')` -> `structure_analysis_reports`。
- 脑图生成：结果页 -> `replyToLetter(type: 'mindmap')` -> JSON -> `mindmap-renderer`。
- 知识图谱：`knowledgeMap` 汇总多类分析记录，并调用关联发现与洞察能力。

## 7. 前端开发规则

- 保持原生小程序写法：WXML、WXSS、JS，不引入框架迁移。
- 页面数据使用 `Page({ data, methods })` 和本地 storage，不引入外部状态管理。
- 样式遵循现有主题体系：`themeClass`、`fontClass`、暗色模式和全局 WXSS 变量。
- 分析方法选择沿用 `METHOD_FIELDS` 和 `selectedMethodMap` 模式。
- 新增 UI 要适配 iOS、Android、小屏、暗色主题。
- 用户可输入内容必须做长度、空值和类型校验。
- 调云函数时要处理 loading、失败 toast、网络异常和重复提交。

## 8. 云函数开发规则

- 每个云函数目录独立部署，依赖不要假设跨函数共享运行时可见。
- `replyToLetter` 是核心路由，新增 `event.type` 前先确认不会破坏既有类型。
- DeepSeek 调用必须设置超时、异常处理、必要重试和兜底提示。
- 数据库写入必须带 `_openid` 或等价用户标识，读取必须过滤当前用户。
- 敏感词、内容安全、AI 免责声明逻辑不能被前端校验替代。
- 修改提示词时同步检查 `cloudfunctions/shared/reasoning/` 和 `replyToLetter/prompts.js` 的实际调用路径。

## 9. 代码风格

- 缩进：2 空格。
- 引号：单引号。
- 分号：必须。
- 注释：中文为主，解释为什么这样做，避免复述代码。
- 命名：沿用现有文件和模块风格，不为局部改动引入新命名体系。
- 优先复用现有工具函数，避免复制相似逻辑。
- 只在确实降低复杂度时抽象，避免为了抽象而抽象。

## 10. 测试与验证

改动后至少选择一种匹配验证：

- 通用规则：`cd scripts && node checks/project-rules-check.js`
- 工具或纯 JS 逻辑：`cd scripts && npm run test:jest`
- 核心功能：`cd scripts && npm test`
- MCP server：`cd mcp-server && npm test`
- 小程序页面或样式：在微信开发者工具中编译预览，并进行真机或模拟器冒烟测试。

如果无法运行某项验证，在交付说明中明确原因和剩余风险。

## 11. Git 与交付

- 分支模型：`main` -> `develop` -> `feature/xxx` / `fix/xxx` / `docs/xxx`。
- 提交格式：`type(scope): subject`，type 使用 `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`。
- 不回滚用户已有改动，不清理与当前任务无关的脏工作区。
- 交付时说明：改了什么、验证了什么、哪些验证未运行。

## 12. 文档维护

- 根目录 `README.md`：项目介绍、部署、功能、目录结构。
- `miniprogram/README.md`：前端页面、组件、工具、关键模式。
- `cloudfunctions/README.md`：云函数清单、路由结构、数据库集合。
- `.trae/rules/project_rules.md`：强制规范。
- `.trae/rules/AGENTS.md`：本文件，代理执行规范。
- `CLAUDE.md`：Claude Code 使用指南，应与本文件关键规则保持一致。

更新文档时只写当前事实，不把未落地计划写成已完成能力。

---

## 更新记录

- 2026-05-21：v2.3 同步 README、前端与云函数现状，补充知识图谱、Markdown、脑图、测试命令与代理执行规则。
- 2026-04-07：v2.0 引入工程化 Vibe Coding 全流程规范。
- 2026-03-28：v1.0 初始版本。
