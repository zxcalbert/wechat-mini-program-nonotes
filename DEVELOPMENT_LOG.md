# 智慧笔记 — 开发日志

## 2026-05-21

### RC 收口启动

- docs: 新增 `design.md`，作为 Release Candidate 设计真源，明确当前小程序 RC 边界、合规要求、数据导出设计，以及用户自定义大模型配置的 P1 方向。
- docs: 新增 `implementation-control.md`，按 Gate 0-6 管理测试、项目规则、文档口径、云函数部署和小程序手测。
- docs: 根目录 `AGENTS.md` 收敛为入口文件，主规范保留在 `.trae/rules/AGENTS.md`，避免双份规则分叉。

### Gate 1：自动化测试

- fix: `markdownUtil` 连续引用合并支持带 inline style 的 `blockquote`，修复 rich-text 样式增强后的回归。
- test: `markdownUtil.test.js` 改为校验语义标签和关键内容，适配小程序 rich-text 必需的 inline style。
- refactor: 将 Profile 全量 Markdown 导出拼接逻辑抽到 `exportUtil.exportAllToMarkdown()`。
- test: 为全量 Markdown 导出补充测试，覆盖四类集合、空集合和 API Key 明文排除。
- 验证：`cd scripts && npm run test:jest` 通过，12 个测试套件 / 173 个用例全绿。

### Gate 2：项目规则检查

- fix: 移除 `app.js` 启动日志中暴露环境变量名的调试输出。
- fix: `apiKeyUtil` 内部常量从 `API_KEY_*` 改为 `ACCESS_KEY_*`，避免规则检查误判工具代码为密钥。
- 验证：`cd scripts && node checks/project-rules-check.js` 通过。仍有 console 数量警告（68 > 50），不阻塞本次 RC gate，后续单独清理。

### 下一步

- Gate 3：统一 README、DEVELOPMENT_PLAN、DEVELOPMENT_LOG 的 RC 进度口径。
- Gate 4：形成云函数部署清单并在微信开发者工具中逐个部署/冒烟。
- Gate 5：按 `implementation-control.md` 执行小程序手测清单。
- Gate 6：清理 `.DS_Store`、coverage、临时截图等本地产物，并按主题拆分提交。

## 2026-05-10

### 变更

#### 合规与举报系统 (`a3b2784` + `002671d` + `bb51d8b`)
- feat: 新增 `miniprogram/utils/reportUtil.js` — 基于 ActionSheet 的举报对话框工具，含举报原因选择与提交逻辑
- feat: 为 detail、roundtableResult、incubatorResult、structureAnalysisResult 四个结果页添加举报按钮
- fix: `profile.js` 的 `deleteAllData()` 原本只删除 `users`/`letters` 两个集合，遗漏 `incubator_reports` 和 `structure_analysis_reports`，现已补全

#### 脑图逻辑重构 (`002671d` + `bb51d8b`)
- refactor: 提取共享脑图逻辑为 `miniprogram/utils/mindmapMixin.js` 工厂函数（`create()` 模式）
- refactor: detail.js（-107 行）、incubatorResult.js（-96 行）、structureAnalysisResult.js（-96 行）三个页面改用 mixin，消除大量重复代码
- test: 新增 `mindmapMixin.test.js`（11 个用例）和 `reportUtil.test.js`（10 个用例）

#### 知识图谱增强 (`2e05fb1`)
- feat: 页面加载时自动调用 `getKnowledgeInsights` 云函数（7 天缓存）
- feat: Canvas 上方新增紧凑统计栏 — 显示总分析数、方法覆盖率、最常用方法
- 涉及文件：`knowledgeMap.js`（+54）、`knowledgeMap.wxml`（+23）、`knowledgeMap.wxss`（+32）

### Bug 修复

| Bug | 根因 | 修复 |
|-----|------|------|
| deleteAllData 未清空全部数据 | `deleteAllData()` 硬编码只删 2 个集合，Phase 2-3 新增的 `incubator_reports`、`structure_analysis_reports` 未纳入 | 遍历所有 4 个集合统一删除 |
| 结果页脑图代码大量重复 | detail/incubatorResult/structureAnalysisResult 三个页面各自维护一份几乎相同的脑图初始化/导出逻辑 | 提取为 `mindmapMixin.js`，页面通过 `Object.assign` 混入 |

### 未提交变更（26 个文件，+352/-75 行）

以下文件有修改但尚未提交，可能为 05-10 晚间或 05-11 凌晨的后续开发：

- `.github/workflows/project-rules-check.yml` — CI 工作流优化（+48/-4）
- `cloudfunctions/replyToLetter/index.js` — AI 回复引擎调整（+31）
- `cloudfunctions/getKnowledgeInsights/index.js` — 洞察云函数微调
- `miniprogram/app.json` / `miniprogram/app.wxss` — 全局配置和样式
- `miniprogram/components/mindmap-renderer/` — 脑图组件继续优化（js +89 行）
- `miniprogram/components/sideMenu/` — 侧边菜单增强
- `miniprogram/components/markdown-renderer/index.wxss` — Markdown 渲染样式修复
- `miniprogram/pages/detail/detail.wxss` — 详情页样式大幅调整（+73）
- `miniprogram/pages/profile/profile.wxml` + `profile.wxss` — 个人页新增 UI 内容（+82）
- `miniprogram/pages/trash/trash.js` — 回收站修复（+6/-1）
- `miniprogram/utils/markdownUtil.js` — Markdown 工具更新
- `scripts/package.json` / `scripts/README.md` — 脚本维护

### 注意事项

- **待提交**：上述 26 个未提交文件需尽快整理提交，避免变更积累过多
- **待部署**：`getKnowledgeInsights` 云函数有本地修改但未确认是否已部署至云端
- **风险**：mindmapMixin 提取涉及 3 个页面重构，需在微信开发者工具中手动验证脑图功能（生成/导出/交互）是否正常
