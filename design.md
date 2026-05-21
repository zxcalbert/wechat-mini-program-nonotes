# 智慧笔记 Design

**状态**：Release Candidate 设计真源
**更新日期**：2026-05-21
**适用范围**：微信小程序、云函数、测试、文档与上线验收

---

## 1. 第一性原理

智慧笔记不是聊天产品，也不是传统笔记本。它要解决的根问题是：

> 用户在面对复杂问题时，缺少稳定的方法论、结构化反馈和长期复盘路径，容易依赖即时答案而不是形成自己的判断。

因此产品必须坚持三条底层约束：

1. **帮助用户思考，而不是替用户思考**
   AI 输出必须以分析方法、结构化问题拆解和行动建议为主，不模拟人物身份，不制造"导师代答"感。

2. **延迟反馈优先于即时满足**
   18 小时延迟机制是核心产品机制。它让用户先形成自己的想法，再阅读 AI 分析。

3. **知识沉淀优先于单次生成**
   每次分析都应成为个人知识图谱的一部分，支持回看、导出、脑图化、跨分析关联和长期洞察。

## 2. 产品边界

### 2.1 当前必须交付

- 单维度分析：用户选择 1 种分析方法，提交内容，获得结构化分析。
- 多维度分析：用户选择 3-5 种分析方法，获得交叉视角分析。
- 思想孵化器：用户输入早期想法，获得结构化孵化报告和行动清单。
- 结构分析：用户对产品或公司做结构化分析。
- 脑图可视化：对分析结果生成 Canvas 脑图，支持历史记录和截图保存。
- 知识图谱：汇总用户分析记录，展示领域、方法、记录之间的关系。
- 合规能力：AI 生成标识、免责声明、隐私协议、举报、数据导出、数据删除、一键退出、使用时长提醒。
- 全量 Markdown 导出：用户可一键导出自己的全部分析内容为 `.md` 文件。

### 2.2 当前不做

- 不做拟人化导师聊天。
- 不做 Obsidian 式通用编辑器。
- 不做 Flomo 式纯记录流。
- 不接入 AI 绘图作为 Release Candidate 范围。
- 不在小程序中实现无限层级复杂图谱编辑。
- 不在 RC 阶段交付完整 REST API、CLI 或 MCP Server。

### 2.3 后续方向

- 用户自带大模型配置：允许用户维护 OpenAI-compatible `baseUrl`、`apiKey` 和模型名，由云函数在服务端安全调用。
- AI Agent 接口：API Key、REST API、CLI、MCP Server。
- Web 端知识图谱：承接更复杂的图谱编辑、拖拽、无限层级和批量操作。
- 方法论追问：以分析框架为边界的追问，不模拟人物人格。

## 3. 用户旅程

### 3.1 首次使用

1. 用户打开小程序。
2. 完成微信授权与隐私协议确认。
3. 系统初始化用户记录和免费额度。
4. 用户进入首页，看到分析入口、历史记录和知识图谱入口。

### 3.2 提交分析

1. 用户选择单维度、多维度、思想孵化器或结构分析。
2. 用户选择分析方法，并输入内容。
3. 前端做空值、长度、额度和敏感词预检。
4. 云函数做二次内容安全检查。
5. 系统扣减额度并写入对应集合。
6. AI 分析完成后写入结果，同时记录可查看时间。

### 3.3 查看和沉淀

1. 用户在 18 小时后查看分析结果。
2. 结果页显示 AI 生成标识、免责声明、举报入口和导出入口。
3. 用户可生成脑图并保存到本地历史。
4. 知识图谱聚合多类记录，展示领域覆盖、方法使用和跨分析关联。
5. 用户可在个人中心一键导出全部内容为 Markdown 文件，带目录、元信息和各类分析正文。

### 3.4 自定义大模型配置（后续 P1）

1. 用户在个人中心进入"模型设置"。
2. 用户新增 OpenAI-compatible 服务配置：名称、`baseUrl`、模型名、API Key。
3. 小程序只用于录入和脱敏展示，不在本地长期明文保存 API Key。
4. 云函数校验配置、加密存储 API Key，并只展示 `sk-****abcd` 形式的预览。
5. 用户可启用、停用、修改或删除配置。
6. AI 分析时云函数优先使用用户启用的配置；未配置时回退到平台默认 DeepSeek 配置。

## 4. 系统架构

```text
miniprogram/                         微信小程序前端
  pages/
    index/                           首页、混合记录流、知识图谱入口
    write/                           单维度分析
    roundtable/                      多维度分析
    incubator/                       思想孵化器
    structureAnalysis/               产品/公司结构分析
    detail/                          单维分析结果
    roundtableResult/                多维分析结果
    incubatorResult/                 孵化器结果
    structureAnalysisResult/         结构分析结果
    knowledgeMap/                    知识图谱
    domainDetail/                    领域详情
    mindmapHistory/                  脑图历史
    profile/                         个人中心、导出、删除、API Key 基础能力
  components/
    sideMenu/                        侧边菜单、一键退出、脑图历史入口
    mindmap-renderer/                Canvas 2D 脑图组件
    markdown-renderer/               rich-text Markdown 渲染
    breadcrumb/                      层级导航
  utils/
    cloudbaseUtil.js                 云数据库 CRUD 封装
    sensitiveWordUtil.js             前端敏感词预检
    markdownUtil.js                  Markdown 转 rich-text HTML
    exportUtil.js                    Markdown 导出
    mindmapMixin.js                  结果页脑图共享逻辑
    reportUtil.js                    举报对话框与云函数调用
    apiKeyUtil.js                    API Key 生成、校验、脱敏

cloudfunctions/                      微信云函数后端
  replyToLetter/                     AI 分析核心入口
  modelConfig/                       用户自定义大模型配置管理（后续 P1）
  reportContent/                     内容举报
  getMethodCatalog/                  分析方法目录
  discoverConnections/               跨分析关联发现
  getKnowledgeInsights/              知识洞察
  login/                             用户登录与额度初始化
  detectSensitiveWords/              增强内容安全检测
  filterSensitiveWords/              内容过滤
  hasSensitiveWord/                  简单敏感词检查
```

## 5. 数据模型

### 5.1 集合

- `users`：用户资料、额度、设置、创建时间。
- `letters`：单维度分析记录。
- `roundtable_discussions`：多维度分析记录。
- `incubator_reports`：思想孵化器报告。
- `structure_analysis_reports`：结构分析报告。
- `reports`：用户举报记录。
- `knowledge_connections`：跨分析关联缓存。
- `model_configs`：用户自定义大模型配置。后续 P1 引入，API Key 必须加密存储。

### 5.2 通用字段约定

- 所有用户数据必须包含 `_openid` 或等价用户标识。
- 所有读取必须按当前用户过滤。
- 时间字段优先使用 `createTime`、`updateTime`、`replyExpectTime`。
- 状态展示层必须兼容旧值：
  - `pending` / `analyzing` -> 分析中
  - `replied` / `completed` -> 已完成
  - `read` / `viewed` -> 已查看
  - `saved` -> 已保存

### 5.3 方法字段约定

历史字段 `mentor` 只用于旧数据兼容。新增代码应使用分析方法语义：

- 前端显示：`method`、`methodName` 或兼容转换后的 display method。
- 云函数提示词：使用方法论名称，不使用人物人格。
- 文档：如代码实际为 21 种方法，文档必须写 21；如要恢复 22 种，必须先补代码和测试。

### 5.4 自定义模型配置字段约定（后续 P1）

`model_configs` 建议结构：

```json
{
  "_openid": "user-openid",
  "name": "我的 DeepSeek",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "apiKeyCiphertext": "encrypted-payload",
  "apiKeyPreview": "sk-****abcd",
  "enabled": true,
  "providerType": "openai-compatible",
  "createTime": "2026-05-21T00:00:00.000Z",
  "updateTime": "2026-05-21T00:00:00.000Z"
}
```

约束：

- `baseUrl` 必须是 HTTPS，不允许 `http://`、`localhost`、内网地址或空 host。
- API Key 不写入日志，不返回前端明文，不存入本地 storage。
- 加密密钥来自云函数环境变量，不提交到仓库。
- 删除配置必须删除密文，不能只改状态。

## 6. AI 设计约束

### 6.1 输出原则

- 输出必须是方法论分析，不得模拟人物身份。
- 禁止第一人称拟人化表达，如"我是某某"、"我认为"。
- 结果必须包含 AI 生成标识或免责声明。
- 高敏感内容必须阻断，中低风险内容必须提示风险。
- 金融类内容必须有免责声明，避免投资建议承诺。

### 6.2 云函数责任

前端校验只能改善体验，不能作为安全边界。以下能力必须在云函数侧落地：

- 内容安全二次检测。
- AI 调用超时与异常兜底。
- 数据库用户隔离。
- 额度扣减或状态更新的一致性保护。
- AI 输出格式解析和降级方案。

### 6.3 用户自带大模型安全边界（后续 P1）

用户自带大模型配置必须走云函数，不允许前端直接调用第三方模型 API。理由：

- 前端直连会暴露 API Key。
- 第三方错误响应可能泄露密钥或计费信息。
- 内容安全、免责声明、超时、重试和日志策略必须统一在服务端执行。

`replyToLetter` 的模型选择顺序：

1. 如果用户启用了自定义配置，云函数解密后调用该 OpenAI-compatible 服务。
2. 如果未配置或配置不可用，使用平台默认 `DEEPSEEK_API_KEY`。
3. 如果两者都不可用，返回清晰的配置错误，不进入假成功。

## 7. 可视化设计

### 7.1 脑图

脑图是分析结果的结构化视图，不是装饰性图片。

标准数据结构：

```json
{
  "title": "主题",
  "summary": "摘要",
  "sections": [
    {
      "id": "s1",
      "title": "章节",
      "summary": "章节摘要",
      "color": "#5B8DEF",
      "points": ["要点 1", "要点 2"]
    }
  ]
}
```

要求：

- 兼容旧版 `children` 树状格式。
- AI JSON 解析失败时，从 Markdown 标题生成兜底脑图。
- 本地历史最多保留 20 条。
- 截图失败、权限拒绝、canvas 未就绪必须有用户提示。

### 7.2 知识图谱

知识图谱用于回答：

- 用户在哪些领域思考最多？
- 哪些分析方法被频繁使用或长期未使用？
- 哪些分析记录之间存在主题关联？
- 哪些记录值得深入探索？

RC 范围内保持 Canvas 2D 三层结构：领域 -> 方法 -> 分析记录。无限层级、复杂编辑和 Web 端图谱不属于 RC。

## 8. 合规设计

Release Candidate 必须满足以下验收：

- 运行时文案无拟人化导师表达。
- 结果页有 AI 生成标识和免责声明。
- 用户可举报 AI 结果。
- 用户可导出全部分析数据。
- 用户可删除全部个人数据，覆盖全部业务集合。
- 用户可一键退出小程序。
- 连续使用 2 小时后有健康提醒。
- 隐私政策和用户协议覆盖 AI 服务、数据处理和免责声明。
- 若启用用户自带模型配置，隐私政策必须说明第三方模型服务的数据处理边界、费用承担和密钥存储方式。

## 9. 数据导出设计

一键 Markdown 导出是用户数据所有权的核心能力。

导出范围：

- 单维度分析。
- 多维度分析。
- 思想孵化器报告。
- 结构分析报告。
- 后续可追加脑图 JSON 摘要、知识图谱关联和用户模型配置的脱敏元信息。

导出格式要求：

- 输出单个 `.md` 文件。
- 顶部包含导出时间、记录总数和目录。
- 每条记录包含原始输入、分析方法、创建时间、状态和 AI 输出。
- 不导出 API Key 明文。
- 空集合也要给出"暂无记录"说明，避免用户误以为导出失败。

## 10. 质量标准

### 10.1 自动化测试

RC 最低要求：

- `cd scripts && npm run test:jest` 必须全绿。
- `cd scripts && node checks/project-rules-check.js` 必须无阻塞失败，或对误报建立明确豁免说明并修正规则。
- 核心工具函数和页面逻辑测试必须覆盖正常路径、空值、失败路径和旧数据兼容。

### 10.2 手动验证

必须在微信开发者工具或真机中验证：

- 登录与隐私协议。
- 单维度分析提交与结果查看。
- 多维度分析提交与结果查看。
- 思想孵化器和结构分析。
- 脑图生成、截图、历史记录。
- 知识图谱加载、节点交互、截图。
- 举报、导出、删除全部数据、一键退出。
- 全量 Markdown 导出文件可打开，内容包含全部业务集合。
- 暗色模式、小屏布局、长文本溢出。

### 10.3 文档一致性

以下文档必须在 RC 前统一口径：

- `README.md`
- `DEVELOPMENT_PLAN.md`
- `DEVELOPMENT_LOG.md`
- `AUDIT_REPORT.md` 或新的 RC 审核报告
- `miniprogram/README.md`
- `cloudfunctions/README.md`
- `.trae/rules/AGENTS.md`

## 11. Release Candidate 定义

RC 不是"所有未来功能完成"，而是：

1. 当前用户可见主流程能稳定跑通。
2. 合规底线满足上线审核要求。
3. 自动化测试全绿。
4. 云函数部署清单明确且可复现。
5. 手测清单通过。
6. 文档描述的是当前事实，不把未完成能力写成已完成。

满足以上条件后，才进入提交审核或灰度发布。
