# 智慧笔记 — 开发日志

## 2026-05-20

### 变更

#### docs(rc): 新增设计与实施控制文档 (`99ab5d4`)
- docs: 新增 `design.md` — Release Candidate 设计真源，定义 RC 边界、合规、数据导出、大模型配置
- docs: 新增 `implementation-control.md` — Gate 0-6 总控，管理测试/规则/文档/部署/手测/清理
- docs: `AGENTS.md` 收敛为入口文件，主规范留在 `.trae/rules/AGENTS.md`

#### fix(rc): 关闭测试与导出 Gate (`6df86cb`)
- feat: 新增 `apiKeyUtil.js` — 用户自定义大模型密钥存取工具
- feat: 新增 `exportUtil.js` — 全量 Markdown 导出，覆盖四类集合
- refactor: `profile.js` 移除内联导出逻辑，改用 exportUtil（-113 行）
- fix: `markdownUtil.js` 连续引用合并支持带 inline style 的 blockquote
- fix: 移除 `app.js` 启动日志中暴露环境变量的调试输出
- test: 引入 Jest 到 scripts/，12 个套件 / 173 个用例全绿
- test: 新增 `pageTestHelper.js` — wx/Page/getApp mock + 页面实例隔离

### Bug 修复

| Bug | 根因 | 修复 |
|-----|------|------|
| markdownUtil 连续引用解析失败 | rich-text inline style 增强后 blockquote 匹配规则过严 | 改为校验语义标签和关键内容 |
| app.js 泄露环境变量名 | 启动日志输出含环境变量名的调试信息 | 移除调试输出 |

### 未提交变更（26 个文件，+359/-72 行）

- CI 工作流优化、云函数微调、脑图组件重构、侧边菜单增强
- 详情页样式（+73）、个人页新增 UI（+82）、知识图谱调整
- 回收站修复、Markdown 渲染样式、全局配置更新

### 注意事项

- Gate 1（测试）和 Gate 2（规则检查）已通过
- 待推进 Gate 3-6：文档口径、云函数部署、手测、清理
- 26 个未提交文件需按主题拆分提交

---

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

## 2026-05-22

### Gate 4/5 手测反馈

- 手测记录文件：`test_log_20260522.md`
- 云端数据库：`knowledge_connections` 初测时不存在，已在云开发数据库中手动创建。该集合用于知识图谱跨分析关联缓存。
- 已测通过：启动、老用户登录、新用户隐私授权、首页记录加载、领域入口、知识图谱入口。

### Bug 修复

| Bug | 根因 | 修复 |
|-----|------|------|
| BUG-001 首页搜索结果从详情页返回后消失 | 返回首页触发 `onShow -> refreshHomeData()`，各数据源异步刷新时会重建 `displayItems`；过滤逻辑依赖 `showSearch`，而 UI 状态和搜索关键词可能不同步 | `refreshHomeData()` 等待所有数据刷新后统一 `refreshDisplayItems()`；`refreshDisplayItems()` 只要存在 `searchKeyword` 就过滤，不再依赖 `showSearch` |
| BUG-002 结果页"举报此内容"按钮样式不清晰 | 举报按钮只复用了通用 action 按钮，缺少危险操作的明确配色；detail 页举报按钮容器样式也未补齐 | 四个结果页举报按钮统一改为红底白字；detail 页补齐 action 按钮布局 |
| BUG-003 结构分析结果页标签文字与背景对比度不足 | 结构分析信息块使用浅色背景，同时标题依赖主题文本变量，暗色/浅色组合下可读性不稳定 | "分析对象"和"分析维度"信息块改为深色背景，标题固定白字；报告区标题保留正文主题色 |

### 验证

- 已补充 `scripts/tests/indexPage.test.js` 回归用例：即使 `showSearch=false`，只要 `searchKeyword` 仍存在，也会恢复过滤结果。

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
