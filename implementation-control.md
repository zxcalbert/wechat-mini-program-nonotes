# 智慧笔记 Release Candidate 实施控制

**状态**：RC 收口控制文档
**更新日期**：2026-05-21
**设计真源**：`design.md`
**目标**：把当前已实现功能收口到可测试、可部署、可手测、可提交审核的 Release Candidate。

---

## 1. 当前事实基线

### 1.1 已实现能力

- 合规改造主链路已完成：去拟人化、AI 标识、免责声明、隐私协议、用户协议。
- 举报链路已有前端工具、结果页按钮和 `reportContent` 云函数。
- 删除全部数据逻辑已扩展到多类业务集合。
- 脑图能力已覆盖 `detail`、`incubatorResult`、`structureAnalysisResult`，并抽取 `mindmapMixin`。
- 知识图谱相关页面已存在并注册：`knowledgeMap`、`domainDetail`、`mindmapHistory`。
- 知识图谱云函数已存在：`getMethodCatalog`、`discoverConnections`、`getKnowledgeInsights`。
- Jest 已有较完整测试集，当前运行结果为 11/12 suites 通过，164/170 tests 通过。

### 1.2 当前阻塞

1. **测试未全绿**
   `markdownUtil.test.js` 失败 6 个用例。原因是测试期望无样式 HTML，当前实现输出带 inline style 的 rich-text HTML。

2. **工作区未收口**
   当前存在大量已修改和未跟踪文件。必须分组确认、清理临时产物、避免把 `.DS_Store`、coverage、临时截图混入 RC。

3. **文档口径冲突**
   `DEVELOPMENT_PLAN.md` 顶部称 Phase 2/3 100%，但 `README.md` 仍称 Phase 2 待决策、Phase 3 未开始；`AUDIT_REPORT.md` 又给出更保守的完成度。

4. **项目规则检查未通过**
   当前规则检查命中 `api_key` 误报/风险项和 console 数量阈值。需要修正规则、重命名常量或建立明确豁免。

5. **云函数部署状态未知**
   本地存在新云函数和云函数改动，但未确认是否已部署到微信云开发环境。

6. **小程序手测未完成**
   脑图、知识图谱、举报、导出、删除、暗色模式、长文本等关键路径需要在微信开发者工具或真机中确认。

## 2. RC 成功标准

Release Candidate 完成必须同时满足：

- `cd scripts && npm run test:jest` 通过。
- `cd scripts && node checks/project-rules-check.js` 通过，或只剩明确记录的非阻塞豁免。
- 文档口径统一，所有开发进度描述与代码事实一致。
- 新增/修改云函数部署清单明确，部署后完成冒烟验证。
- 微信开发者工具手测清单通过。
- 工作区按主题拆分提交，不包含临时文件、系统文件、coverage 产物。
- `README.md` 给出的用户可见能力均可在本地小程序验证。

## 3. 执行原则

- 不再新增非 RC 必需功能。
- 不做大规模重构。
- 单次改动优先控制在一个主题内。
- 任何修复必须指向一个验收失败项。
- 文档只记录当前事实，不把计划写成完成。
- 每完成一个闸门就运行对应验证。
- 遇到代码与文档冲突，以代码和测试结果为准，再修正文档。

## 4. 工作分组

### 4.1 必须保留并收口的主题

| 主题 | 代表文件 | 目标 |
|------|----------|------|
| 代理规范 | `AGENTS.md`, `.trae/rules/AGENTS.md` | 根目录入口 + 主规范，不维护双份正文 |
| Markdown 渲染 | `miniprogram/utils/markdownUtil.js`, `markdown-renderer`, `markdownUtil.test.js` | 测试与 rich-text 输出契约一致 |
| 脑图 | `mindmap-renderer`, `mindmapMixin`, `mindmapHistory` | 生成、截图、历史稳定 |
| 合规举报 | `reportUtil`, 结果页按钮, `reportContent` | 结果页可举报并写入 reports |
| 知识图谱 | `knowledgeMap`, `domainDetail`, 云函数 | 页面可访问、基础加载稳定 |
| Profile/数据 | `profile`, `apiKeyUtil`, `exportUtil` | 导出、删除、API Key 显示不破坏主流程 |
| 模型配置设计 | `design.md`, 后续 `modelConfig` 云函数 | 先入设计和 backlog，不进入当前 RC 编码范围 |
| 测试基建 | `scripts/jest.config.js`, `scripts/tests/*` | Jest 全绿 |
| 文档 | `README.md`, `DEVELOPMENT_PLAN.md`, `DEVELOPMENT_LOG.md`, `design.md` | 口径统一 |

### 4.2 必须清理或排除的产物

- `.DS_Store`
- `scripts/coverage/`
- 临时截图和问题截图，除非明确作为文档附件引用。
- 未使用的实验目录。
- 重复或过期的审计产物，除非作为历史记录保留。

## 5. RC 收口计划

### Gate 0：冻结与基线确认

**目标**：确认当前状态，不再扩大范围。

任务：

- 记录当前 `git status --short`。
- 按主题列出待提交文件。
- 标记临时文件和不应提交文件。
- 确认 `design.md` 为 RC 设计真源。

验收：

- 有一份清晰的文件分组清单。
- 确认 RC 不包含新增 AI Agent API、Web 端、AI 绘图、无限图谱编辑。

建议命令：

```bash
git status --short
git diff --stat
```

### Gate 1：测试全绿

**目标**：让自动化测试恢复可信。

任务：

- 修复 `markdownUtil.test.js` 与 `markdownUtil.js` 的契约不一致。
- 判断 inline style 是否为小程序 rich-text 必需：
  - 若必需，测试改为匹配语义标签和关键样式。
  - 若不必需，实现改为输出更简洁 HTML。
- 跑 Jest 全量测试。

验收：

- `cd scripts && npm run test:jest` 通过。
- 失败测试不得通过删除断言来规避。

建议命令：

```bash
cd scripts && npm run test:jest
```

### Gate 2：项目规则检查

**目标**：让规则检查结果可用于上线前把关。

任务：

- 处理 `api_key` 命中项：
  - 如果是命名误报，调整扫描规则或将常量命名改为不触发密钥误判。
  - 如果存在真实敏感信息，必须移除。
- 处理 console 数量阈值：
  - 保留必要错误日志。
  - 删除或降级非必要调试日志。
  - 若阈值不适合当前项目，修改规则并在文档说明。
- 跑项目规则检查。

验收：

- `cd scripts && node checks/project-rules-check.js` 无阻塞失败。
- 如保留豁免，必须写入 RC 验收说明。

建议命令：

```bash
cd scripts && node checks/project-rules-check.js
```

### Gate 3：文档口径统一

**目标**：让 README、计划和日志反映同一个事实。

任务：

- 更新 `README.md` 开发进度：
  - Phase 0：完成，待 RC 验收。
  - Phase 1：完成，待手测确认。
  - Phase 1.5：功能完成，测试修复中或已通过。
  - Phase 2：主要代码完成，待云端部署和手测确认。
  - Phase 3：小程序内完成基础可视化能力；原 AI 绘图/无限层级目标不属于 RC。
  - AI Agent：概念设计 + API Key 基础能力，不是正式接口。
- 补充产品边界：
  - 一键 Markdown 导出属于 RC 收口能力，必须验证。
  - 用户自定义大模型 `baseUrl/apiKey/model` 属于 RC 后 P1 设计，不进入本轮编码。
- 更新 `DEVELOPMENT_PLAN.md`：
  - 顶部进度改成 RC 视角，避免与旧阶段计划冲突。
  - 保留历史计划但标注"历史规划，不作为当前进度判断"。
- 更新 `DEVELOPMENT_LOG.md`：
  - 记录 2026-05-21 RC 收口启动、测试现状、阻塞项。
- 检查 `miniprogram/README.md` 和 `cloudfunctions/README.md` 是否与实际文件一致。

验收：

- 搜索 `待决策`、`开发中`、`未开始`、`100%` 时不存在互相矛盾的阶段描述。
- 方法数量统一为代码事实。

建议命令：

```bash
rg -n "Phase|开发中|待决策|未开始|100%|21|22" README.md DEVELOPMENT_PLAN.md DEVELOPMENT_LOG.md miniprogram/README.md cloudfunctions/README.md
```

### Gate 4：云函数部署准备

**目标**：明确哪些云函数需要部署，部署后如何验证。

任务：

- 列出需要部署或重新部署的云函数：
  - `replyToLetter`
  - `reportContent`
  - `getMethodCatalog`
  - `discoverConnections`
  - `getKnowledgeInsights`
  - 其他有本地变更的云函数
- 检查每个云函数的 `package.json`、`config.json`、入口文件。
- 确认 `replyToLetter` 的 `DEEPSEEK_API_KEY` 云端环境变量存在。
- 确认数据库集合存在：
  - `users`
  - `letters`
  - `roundtable_discussions`
  - `incubator_reports`
  - `structure_analysis_reports`
  - `reports`
  - `knowledge_connections`
- 制定部署后冒烟方式。

验收：

- 形成云函数部署清单。
- 每个新云函数有最小可调用参数和预期返回。
- 部署状态在 `DEVELOPMENT_LOG.md` 或 RC 报告中记录。

手动部署建议：

```text
微信开发者工具 -> 云开发 -> 云函数 -> 选择函数 -> 上传并部署
```

#### RC 部署清单

| 云函数 | 本轮状态 | 部署原因 | 冒烟方式 |
|--------|----------|----------|----------|
| `replyToLetter` | 需重新部署 | AI 分析核心入口，本地有改动且被多条主流程依赖 | 用单维度分析生成一条测试记录；再用 `type: 'mindmap'` 对结果生成脑图 JSON |
| `reportContent` | 需确认已部署 | 结果页举报依赖 | 在任一结果页提交举报，确认 `reports` 集合新增记录 |
| `getMethodCatalog` | 需确认已部署 | `domainDetail`/领域目录依赖 | 调用云函数，确认返回 4 个领域和 21 种方法 |
| `discoverConnections` | 需确认已部署 | 知识图谱关联线依赖 | 进入 `knowledgeMap` 后触发关联分析，失败时页面应降级提示 |
| `getKnowledgeInsights` | 需重新部署或确认 | 本地有微调，知识洞察面板依赖 | 进入 `knowledgeMap`，确认洞察面板可加载或给出非阻塞提示 |
| `login` | 无本轮改动，部署状态确认 | 登录和额度初始化 | 新用户/老用户登录冒烟 |
| `detectSensitiveWords` | 无本轮改动，部署状态确认 | 内容安全二次检测 | 提交敏感词测试内容，确认阻断或提示 |

#### 数据库集合清单

RC 前在云开发控制台确认集合存在：

- `users`
- `letters`
- `roundtable_discussions`
- `incubator_reports`
- `structure_analysis_reports`
- `reports`
- `knowledge_connections`

#### 云端环境变量清单

- `replyToLetter.DEEPSEEK_API_KEY`：必须存在，且不能在前端或日志中暴露。
- 后续 P1 的用户自定义模型配置若启用，需要新增 `MODEL_CONFIG_ENCRYPTION_KEY`，当前 RC 不使用。

### Gate 5：小程序手测

**目标**：确认用户可见主流程稳定。

手测清单：

- 启动小程序，无启动报错。
- 登录/隐私协议流程可走通。
- 首页记录加载、搜索、领域入口、知识图谱入口正常。
- 单维度分析：
  - 方法选择
  - 内容输入
  - 额度校验
  - 提交
  - 结果查看
- 多维度分析：
  - 3-5 个方法选择
  - 额度不足提示
  - 成功结果展示
- 思想孵化器：
  - 1-3 个方法选择
  - 报告展示
- 结构分析：
  - 产品/公司类型
  - 报告展示
- 结果页：
  - Markdown 渲染
  - 导出
  - 举报
  - 脑图生成
  - 脑图截图
- 知识图谱：
  - 页面进入
  - 节点渲染
  - 拖拽/缩放/点击
  - 洞察面板
  - 截图保存
- 脑图历史：
  - 列表展示
  - 删除记录
- Profile：
  - 数据导出
  - 导出的 `.md` 文件能打开，且包含单维度、多维度、孵化器、结构分析四类内容
  - 导出内容不包含 API Key 明文
  - 删除全部数据
  - API Key 显示/生成
- 侧边菜单：
  - 脑图历史入口
  - 一键退出
  - 退出登录
- 样式：
  - 暗色模式
  - 小屏宽度
  - 长标题和长链接不溢出

验收：

- 每项记录通过、失败或不适用。
- 失败项必须回到 Gate 1/2/3/4 对应修复。

#### RC 手测记录模板

| 模块 | 用例 | 结果 | 备注 |
|------|------|------|------|
| 启动 | 小程序打开无报错 | 待测 | 微信开发者工具/真机 |
| 登录 | 老用户自动进入首页 | 待测 |  |
| 登录 | 新用户完成授权与隐私协议 | 待测 |  |
| 首页 | 记录加载、搜索、领域入口、知识图谱入口 | 待测 |  |
| 单维度分析 | 方法选择、输入、额度校验、提交、结果查看 | 待测 |  |
| 多维度分析 | 3-5 方法选择、额度不足提示、结果展示 | 待测 |  |
| 思想孵化器 | 1-3 方法选择、报告展示 | 待测 |  |
| 结构分析 | 产品/公司类型、报告展示 | 待测 |  |
| 结果页 | Markdown 渲染、导出、举报、脑图生成、截图 | 待测 |  |
| Profile | 全量 Markdown 导出文件可打开且不含 API Key 明文 | 待测 |  |
| Profile | 删除全部数据覆盖四类业务集合 | 待测 |  |
| 知识图谱 | 页面加载、节点交互、洞察、截图 | 待测 |  |
| 脑图历史 | 列表展示、删除记录 | 待测 |  |
| 侧边菜单 | 脑图历史入口、一键退出、退出登录 | 待测 |  |
| 样式 | 暗色模式、小屏、长文本不溢出 | 待测 |  |

### Gate 6：提交整理

**目标**：把 RC 改动整理成可审查提交。

建议提交拆分：

1. `docs(rc): add design and implementation control`
2. `test(markdown): align rich-text parser expectations`
3. `fix(checks): resolve project rules blockers`
4. `docs(rc): align progress and release checklist`
5. `chore(rc): remove local artifacts`

验收：

- 每个提交主题单一。
- 不包含 `.DS_Store`、coverage、临时截图。
- `git status --short` 只剩明确未提交项或干净。

## 6. 优先级排序

| 优先级 | 事项 | 原因 |
|--------|------|------|
| P0 | Jest 全绿 | 测试红灯会掩盖真实回归 |
| P0 | 清理工作区 | 当前改动积累过大，风险不可控 |
| P0 | 文档口径统一 | 决策会被旧计划误导 |
| P0 | 云函数部署确认 | 本地可用不等于线上可用 |
| P0 | 小程序手测 | 微信小程序问题很多无法靠 Jest 覆盖 |
| P0 | 全量 Markdown 导出验收 | 用户数据所有权能力，且已接近完成 |
| P1 | 项目规则检查误报治理 | 上线前质量门禁必须可信 |
| P1 | 用户自定义大模型配置设计 | 价值高但涉及密钥安全，必须先设计后实现 |
| P1 | shared 运行时接入评估 | 如果未接入不影响 RC，可转后续；若文档声称已接入，则必须修正 |
| P2 | AI Agent 正式接口 | 不属于 RC |
| P2 | Web 端和 AI 绘图 | 不属于 RC |

## 7. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Markdown 测试改错方向 | rich-text 显示回退 | 先确认小程序渲染需求，再改测试或实现 |
| 清理工作区误删用户文件 | 数据丢失 | 只删除明确临时产物；不使用破坏性 git 命令 |
| 云函数未部署 | 小程序调用失败 | 建立部署清单和冒烟记录 |
| 用户模型 API Key 暴露 | 密钥泄露、用户损失 | 后续 P1 必须服务端加密存储；RC 只做设计，不前端直连第三方模型 |
| 导出内容不完整 | 用户数据权益受损 | 手测四类集合导出，补测试覆盖 |
| 文档继续冲突 | 计划失真 | 以 `design.md` + 本文件为 RC 真源 |
| Phase 3 范围膨胀 | RC 延期 | 明确 AI 绘图、Web 端、无限图谱不进入 RC |
| 项目规则误报长期存在 | CI 不可信 | 修正规则或将豁免写入规则检查逻辑 |

## 8. 当前建议立即执行

1. 修复 `markdownUtil.test.js`，让 Jest 全绿。
2. 清理 `.DS_Store`、coverage、未引用截图等本地产物。
3. 验证并补齐全量 Markdown 导出，确保四类业务集合都进入 `.md` 文件。
4. 更新 README、DEVELOPMENT_PLAN、DEVELOPMENT_LOG 的进度口径。
5. 跑项目规则检查并处理 `api_key` 和 console 阈值。
6. 生成云函数部署清单，逐个部署并冒烟。
7. 用微信开发者工具跑手测清单。

## 9. 非 RC 后续 Backlog

- AI Agent REST API / CLI / MCP Server。
- 用户自定义大模型配置：
  - 用户可新增、修改、删除 OpenAI-compatible `baseUrl`、模型名和 API Key。
  - API Key 只在云函数侧加密存储，不返回前端明文。
  - `replyToLetter` 支持按用户启用配置调用模型，失败时回退平台默认模型或给出明确错误。
- Web 端知识图谱。
- 图谱懒加载和无限层级。
- 方法论追问。
- shared reasoning 模块完整运行时接入。
- 更细的数据库迁移脚本和回滚工具。
- 更完整的端到端自动化测试。

## 10. 用户自定义大模型配置实施草案（P1）

此功能不进入当前 RC，但应作为 RC 后第一个独立 feature。原因：用户诉求明确、产品价值高，但密钥安全要求高。

### 10.1 最小可交付范围

- 个人中心新增"模型设置"入口。
- 用户可新增一条 OpenAI-compatible 配置：
  - 配置名称
  - `baseUrl`
  - 模型名
  - API Key
- 用户可修改配置名称、`baseUrl`、模型名和 API Key。
- 用户可删除配置。
- 用户可启用或停用配置。
- `replyToLetter` 可读取当前用户启用配置并调用对应模型。
- 配置不可用时给出明确错误；是否回退平台默认模型需由产品确认。

### 10.2 推荐云函数

新增 `cloudfunctions/modelConfig/`，按 `event.action` 分发：

| action | 用途 |
|--------|------|
| `list` | 获取当前用户配置列表，只返回脱敏信息 |
| `create` | 新增配置并加密 API Key |
| `update` | 修改配置；API Key 为空时保留旧密文 |
| `delete` | 删除配置 |
| `enable` | 启用指定配置，并停用同用户其他配置 |
| `test` | 用最小请求测试配置是否可用 |

### 10.3 安全要求

- API Key 不允许进入 `wx.setStorageSync`。
- API Key 不允许写入 console。
- API Key 不允许返回前端明文。
- API Key 必须在云函数侧加密后写入 `model_configs`。
- 加密密钥来自云函数环境变量，例如 `MODEL_CONFIG_ENCRYPTION_KEY`。
- `baseUrl` 只允许 HTTPS 公网地址，拒绝 localhost、内网 IP、metadata 地址。
- 请求第三方模型必须设置超时和最大 token。

### 10.4 测试要求

- `modelConfig` 参数校验测试。
- `baseUrl` 安全校验测试。
- API Key 脱敏测试。
- 启用配置唯一性测试。
- `replyToLetter` 模型选择测试：
  - 有启用配置时使用用户配置。
  - 无配置时使用平台默认配置。
  - 用户配置失败时返回可理解错误或按产品决策回退。

## 11. 全量 Markdown 导出收口草案（RC）

此功能已基本存在于 `profile.exportAllData()`，RC 需要把它从"能用"收口到"可信"。

### 11.1 验收范围

- 查询并导出：
  - `letters`
  - `roundtable_discussions`
  - `incubator_reports`
  - `structure_analysis_reports`
- 输出 `.md` 文件。
- 文件包含：
  - 导出时间
  - 总记录数
  - 目录
  - 每类记录的原始输入
  - 分析方法
  - 创建时间
  - AI 输出
  - 免责声明
- 空集合也能导出，文件中显示暂无记录。
- 不导出 API Key 明文。

### 11.2 建议改造

- 将 `profile.exportAllData()` 中的 Markdown 拼接逻辑迁到 `exportUtil.js`，形成可测试函数：
  - `exportAllToMarkdown({ letters, roundtables, incubators, structures, exportedAt })`
- `profile.js` 只负责查询数据、调用工具函数、保存文件或复制文本。
- 为 `exportAllToMarkdown` 添加 Jest 测试：
  - 四类集合都有数据。
  - 部分集合为空。
  - 长文本和 Markdown 内容不丢失。
  - 不包含 `apiKey`、`api_key`、`authorization` 等敏感字段。
