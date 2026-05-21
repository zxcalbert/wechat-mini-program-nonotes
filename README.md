# 智慧笔记

个人思考记录与可视化分析工具。用户写下问题、观察或反思，选择分析方法获取 AI 方法论分析，支持脑图可视化浏览。

## 功能特点

- **单维度分析**：选择一种分析方法，针对特定问题获得深度分析
- **多维度分析**：选择 3-5 种分析方法，从不同维度交叉分析问题
- **思想孵化器**：输入初始想法，生成包含行动清单的结构化孵化报告
- **结构分析**：支持产品/公司结构分析，生成结构化报告
- **脑图可视化**：分析结果一键生成交互式脑图，支持缩放、拖拽、截图保存
- **延迟分析机制**：分析结果需等待 18 小时查看，促进深度思考
- **额度管理**：新用户赠送 2 次免费额度，支持额度购买
- **主题切换**：支持亮色、暗色、跟随系统三种主题模式
- **敏感词检测**：前端预检 + 云函数二次检测，保障内容安全
- **隐私合规**：符合微信小程序隐私协议规范，含 AI 免责声明
- **热力图日历**：可视化记录分析提交历史
- **内容举报**：用户可举报不当内容
- **数据导出**：支持导出全部分析数据
- **使用时长提醒**：连续使用 2 小时后弹出健康提醒

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生框架 | WXML + WXSS + JS |
| 后端服务 | 微信云开发 (CloudBase) | 云函数 + 云数据库 |
| AI 引擎 | DeepSeek API | 文本分析与生成 |
| 状态管理 | 原生 Storage + Page Data | 无外部状态管理库 |
| 可视化 | 微信 Canvas 2D API | 脑图渲染 + 手势交互 |
| 构建工具 | 微信开发者工具 | 编译、预览、上传 |

## 安装部署指南

### 前置条件

- 微信开发者工具（2.2.3+ 基础库）
- 可用的小程序 AppID
- 已开通的微信云开发环境
- DeepSeek API Key

### 启动步骤

1. 使用微信开发者工具导入项目根目录
2. 在云开发控制台创建环境，记录环境 ID
3. 创建数据库集合：`users`、`letters`、`roundtable_discussions`、`incubator_reports`、`structure_analysis_reports`、`reports`
4. 部署 `cloudfunctions/` 下所有云函数
5. 为 `replyToLetter` 云函数配置环境变量 `DEEPSEEK_API_KEY`
6. 修改 `miniprogram/envList.js` 配置你的环境 ID
7. 编译并预览小程序

## 使用说明

### 首次使用

1. 打开小程序，点击微信授权登录
2. 同意隐私协议
3. 获得 2 次免费分析额度

### 提交分析请求

1. 首页点击右下角 "+" 按钮
2. 选择 "分析方法" 或 "多维度分析"
3. 选择分析方法（领域分组卡片式选择器）
4. 输入需要分析的内容
5. 点击提交

### 查看分析结果

1. 首页列表查看笔记状态
2. 状态为 "分析中" 的笔记需等待 18 小时后查看
3. 点击笔记进入详情页查看完整分析结果
4. 点击「生成可视化脑图」按钮，查看交互式脑图
5. 支持双指缩放、单指拖拽、节点点击查看详情、截图保存

## 项目结构

```
wxapp-project/
├── miniprogram/                 # 微信小程序前端
│   ├── pages/                   # 页面
│   │   ├── login/               # 登录页
│   │   ├── index/               # 首页（笔记列表、搜索）
│   │   ├── write/               # 分析方法页（单维度）
│   │   ├── roundtable/          # 多维度分析页
│   │   ├── roundtableResult/    # 多维度分析结果
│   │   ├── incubator/           # 思想孵化器
│   │   ├── incubatorResult/     # 孵化器结果（含脑图）
│   │   ├── structureAnalysis/   # 结构分析
│   │   ├── structureAnalysisResult/ # 结构分析结果（含脑图）
│   │   ├── detail/              # 分析详情（含脑图）
│   │   ├── stamps/              # 额度管理
│   │   ├── profile/             # 个人中心
│   │   ├── trash/               # 回收站
│   │   ├── privacy/             # 隐私政策
│   │   ├── about/               # 关于页面
│   │   └── legal/               # 用户协议
│   ├── components/              # 组件
│   │   ├── sideMenu/            # 侧边菜单（含一键退出）
│   │   ├── cloudTipModal/       # 云端提示弹窗
│   │   ├── heatmapCalendar/     # 热力图日历
│   │   ├── mindmap-renderer/    # 脑图渲染组件（Canvas 2D）
│   │   └── markdown-renderer/   # Markdown 渲染组件（rich-text）
│   ├── utils/                   # 工具类
│   │   ├── cloudbaseUtil.js     # 云数据库 CRUD 封装
│   │   ├── sensitiveWordUtil.js # 前端敏感词预检
│   │   ├── cacheUtil.js         # 本地缓存管理
│   │   └── markdownUtil.js      # Markdown→HTML 轻量解析器
│   ├── envList.js               # 云环境 ID 配置
│   └── app.js                   # 应用入口（主题/字体/时长监控）
├── cloudfunctions/              # 云函数（Node.js）
│   ├── replyToLetter/           # AI 分析核心引擎
│   │   ├── index.js             # 主入口（单维度/多维度/孵化器/结构分析/脑图）
│   │   ├── prompts.js           # 提示词模块（分析方法+脑图）
│   │   ├── mentorRules.json     # 分析方法配置（22种方法，4个领域）
│   │   └── sensitiveWordDetector.js # 敏感词检测
│   ├── shared/                  # 共享模块
│   │   └── reasoning/           # 推理管线
│   │       ├── pipeline/        # 数据处理管线
│   │       │   └── stage-2-format-normalizer.js  # 格式归一化
│   │       └── prompts/         # 提示词模板
│   │           ├── base/        # 基础人设
│   │           └── methods/     # 各分析方法专用提示词
│   ├── getMentorRules/          # 获取分析方法规则配置
│   ├── getMentors/              # 获取分析方法列表
│   ├── login/                   # 用户登录
│   ├── hasSensitiveWord/        # 敏感词检测
│   ├── detectSensitiveWords/    # 增强版敏感词检测
│   ├── filterSensitiveWords/    # 内容过滤
│   └── reportContent/           # 内容举报
├── tests/                       # 测试
│   └── fixtures/                # 测试夹具（样本分析数据+期望脑图JSON）
├── scripts/                     # 项目规则检查、预提交钩子、测试套件
├── CODE_WIKI.md                 # 代码级详细文档
├── TEST_CASES.md                # 测试用例文档
├── DEVELOPMENT_PLAN.md          # 开发计划
├── FLIPBOOK_INTEGRATION_REPORT.md # 脑图可视化研究报告
└── README.md                    # 项目入口文档
```

## 分析方法体系

本项目提供 22 种分析方法，覆盖 4 个核心领域：

| 领域 | 分析方法 |
|------|---------|
| 价值思维 | 多元思维模型分析、价值投资分析框架、安全边际分析 |
| 创新创业 | 本分经营分析、极简产品分析、创新设计分析、第一性原理分析、长期主义分析、垄断竞争分析 |
| 心理学 | 原型心理分析、精神分析框架、人本精神分析、目的论分析、需求层次分析 |
| 哲学 | 道家思想分析、儒家伦理分析、苏格拉底式提问、理念论分析、幸福伦理学分析、超人哲学分析、语言哲学分析 |

每种方法拥有独立的方法论框架、核心原则和思考角度，AI 在分析时会严格遵循该方法论的分析逻辑。分析结果以客观分析报告形式呈现，不模拟任何人物身份。

## 开发进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| Phase 0 合规改造 | ✅ 代码完成，待 RC 手测 | 去拟人化、合规标识、隐私政策、举报功能、一键退出 |
| Phase 1 脑图 V1 | ✅ 代码完成，待 RC 手测 | detail + incubatorResult + structureAnalysisResult 全部集成 Canvas 脑图 |
| Phase 1.5 Markdown/导出 | ✅ 自动化通过 | Markdown rich-text 渲染、结果导出、全量 Markdown 导出已纳入测试 |
| Phase 2 知识图谱 | ✅ 主要代码完成，待部署/手测 | knowledgeMap、domainDetail、mindmapHistory、关联发现与洞察云函数 |
| Phase 3 全可视化 | 🔵 RC 外延后 | 小程序内基础可视化已完成；AI 绘图、Web 端、无限层级不属于当前 RC |
| 工程基建 | ✅ 自动化通过 | Jest 测试、规则检查、fixtures、工具模块已接入 RC 门禁 |
| AI Agent/自定义模型 | 🔵 设计阶段 | API Key 基础能力已有；自定义 baseUrl/API Key/model 作为 RC 后 P1 功能 |

### 架构演进方向

```
当前：微信小程序（面向人类用户）
  ↓ RC
合规主流程 + Markdown 导出 + 脑图/知识图谱手测通过
  ↓ P1
用户自定义大模型配置 + 个人知识图谱增强
  ↓ 未来
双端架构：小程序（人类）+ API/CLI（AI Agent）
```

**差异化定位（vs Obsidian / Flomo）**：
- Obsidian：重编辑器、插件生态、本地优先 → 智慧笔记聚焦"AI 方法论分析 + 脑图可视化"，不做编辑器
- Flomo：轻量记录、标签体系 → 智慧笔记聚焦"分析方法论驱动思考"，不做笔记本
- 差异化核心：**AI 作为思考伙伴**而非记录工具，18 小时延迟机制强制深度思考

## 常见问题解答

**Q: 为什么分析结果需要等待 18 小时？**
A: 这是产品的核心设计理念。延迟查看机制迫使用户在提交后先进行自主思考，避免过度依赖 AI。

**Q: 额度用完后如何获得？**
A: 可以在额度管理页购买分析额度。

**Q: 分析结果不满意怎么办？**
A: 可以尝试更换分析方法重新提交，或使用多维度分析获得更全面的视角。

**Q: 支持哪些主题？**
A: 支持亮色、暗色、跟随系统三种模式，可在个人中心切换。

**Q: 脑图功能怎么用？**
A: 在分析结果详情页，点击「生成可视化脑图」按钮即可。支持双指缩放、单指拖拽浏览，点击节点查看详情，支持截图保存到相册。

## 开发与贡献指南

### 代码规范

- 缩进：2 空格
- 引号：单引号
- 分号：必须
- 注释：中文注释，说明"为什么"而非"做什么"

### 提交格式

```
type(scope): subject

type: feat/fix/docs/style/refactor/test/chore
```

### 开发流程

1. 从 `develop` 分支创建功能分支 `feature/xxx`
2. 遵循单次变更限制（修改文件 ≤5，代码行 ≤200，影响模块 ≤1）
3. 提交前运行规则检查：`node scripts/checks/project-rules-check.js`
4. 通过测试后合并回 `develop`

### 开发命令

```bash
# 预提交检查
cd scripts && node checks/project-rules-check.js

# 测试
cd scripts && npm test
cd scripts && npm run test:unit
cd scripts && npm run test:integration
```

## 文档导航

- [开发计划](DEVELOPMENT_PLAN.md) — 阶段规划与进度跟踪
- [设计真源](design.md) — 产品边界、架构、合规和 RC 定义
- [RC 实施控制](implementation-control.md) — Release Candidate 收口 gate 与验收清单
- [脑图可视化研究报告](FLIPBOOK_INTEGRATION_REPORT.md) — 可视化方案与演进路径
- [AI Agent 接口设计](AI_AGENT_INTERFACE_DESIGN.md) — 面向 AI Agent 的 API/CLI 接口设计方案
- [项目强制规范](.trae/rules/project_rules.md) — 开发规范与红线
- [执行与交付规范](.trae/rules/AGENTS.md) — Vibe Coding 全流程规范
- [代码级 Wiki](CODE_WIKI.md) — 代码架构详解
- [测试用例](TEST_CASES.md) — 测试用例文档

## 更新日志

### v2.3-rc (2026-05-21, 收口中)

- 建立 `design.md` 作为 RC 设计真源，明确小程序 RC 边界与后续 P1 能力。
- 建立 `implementation-control.md`，按 Gate 0-6 收口测试、文档、云函数部署和小程序手测。
- 修复 Markdown rich-text 测试契约，`npm run test:jest` 已全绿。
- 全量 Markdown 导出抽取到 `exportUtil.exportAllToMarkdown()` 并补充自动化测试。
- 项目规则检查已通过；仍保留 console 数量警告，作为后续清理项。

### v2.2 (2026-05-05, 进行中)

- Phase 1.5：Markdown 渲染组件优化（表格、任务列表、嵌套列表、链接支持）
- 工程基建补全：分析方法专用提示词填充到 shared/reasoning/prompts/methods/
- 架构规划：AI Agent 接口设计文档，API/CLI 双模式方案研究
- README 结构更新：补充 markdown-renderer、markdownUtil、shared 完整目录结构

### v2.1 (2026-05-05)

- Phase 0 合规改造全部完成：去拟人化文案、AI 免责声明、使用时长提醒
- Phase 1 脑图 V1 全部完成：detail + incubatorResult + structureAnalysisResult 三页脑图集成
- 新增脑图渲染组件：Canvas 2D 绘制 + 手势交互 + 截图保存
- 提示词模块化：prompts.js 独立管理
- 新增页面：关于页面、用户协议页面
- 新增云函数：reportContent（内容举报）
- 新增共享模块：cloudfunctions/shared/reasoning/
- 热力图日历组件修复
- 主题系统字体设置优化

### v2.0 (2026-05-02)

- UI 统一化改造：单维度分析、多维度分析、思想孵化器三页视觉风格统一
- 导师选择器重构：从下拉菜单改为卡片式领域分组选择器
- 合规改造：去拟人化文案、AI 免责声明、使用时长提醒、隐私政策更新
- 文档完善：CODE_WIKI、TEST_CASES、README 全面更新

### v1.5 (2026-04-12)

- 思想孵化器 MVP 上线
- 产品结构分析 MVP 上线
- 公司结构分析 MVP 上线

## 许可协议

本项目为私有项目，未经授权禁止商用或二次分发。
