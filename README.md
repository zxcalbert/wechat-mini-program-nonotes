# 智慧笔记

基于微信小程序和微信云开发的个人思考记录产品。用户可以写下问题、观察或反思，选择 AI 导师获取延迟回信，也可以发起多导师圆桌讨论。项目当前已经从早期“投资笔记”演进为覆盖价值思维、创业创新、心理学、哲学四大领域的通用思考工具。

## 当前状态

- 项目形态：微信小程序 + 云函数 + 云数据库
- AI 服务：DeepSeek Chat API
- 当前代码范围：单导师回信、圆桌会议、邮票机制、缓存分页、主题切换、敏感词检测、隐私页
- **Phase 3 进展**：思想孵化器 MVP（✅可用）、公司结构分析 MVP（✅验收通过）、产品结构分析 MVP（✅验收通过）
- 导师规模：21 位导师，4 个领域
- 文档基准日期：2026-04-12

## 项目规则

开始改动前建议先看两份规则：

- [项目强制规范](/Users/bill/编程/invest-diary/.trae/rules/project_rules.md)
- [执行与交付规范](/Users/bill/编程/invest-diary/.trae/rules/AGENTS.md)

这两份文件定义了这个仓库的工作方式，其中 `project_rules.md` 优先级更高。核心约束是保护现有原型、渐进式升级、禁止一次性大重构。

## 核心能力

- 单导师写信：在 [write.js](/Users/bill/编程/invest-diary/miniprogram/pages/write/write.js) 中选择导师并提交内容，可请求 AI 回信。
- 延迟回信机制：回信不是即时聊天，项目强调"记录后等待思考结果"的体验。
- 圆桌会议：在 [roundtable.js](/Users/bill/编程/invest-diary/miniprogram/pages/roundtable/roundtable.js) 中选择 3-5 位导师发起多角色讨论。
- 首页混合流：在 [index.js](/Users/bill/编程/invest-diary/miniprogram/pages/index/index.js) 中将普通信件和圆桌记录按时间混合展示。
- 邮票系统：用户默认邮票余额为 2，普通回信和圆桌功能都受邮票约束。
- 每日限制：单导师寄信每天最多 6 次。
- 本地缓存与分页：首页信件列表支持分页加载和 1 小时缓存。
- 主题切换：支持 `light`、`dark`、`system` 三种主题模式。
- 敏感词治理：前端预检 + 云函数处理，包含检测、过滤和高敏内容兜底。
- **思想孵化器 MVP**：输入想法，多位导师从不同维度进行深度分析（隐藏验证页）。
- **公司结构分析 MVP**：输入公司相关内容，生成结构化分析报告，包含 6 个固定章节和 ASCII 结构快照（✅验收通过）。
- **产品结构分析 MVP**：输入产品相关内容，生成结构化分析报告，包含 6 个固定章节和 ASCII 结构快照（✅验收通过）。

## 技术架构

### 前端

- 技术：微信小程序原生框架
- 目录：`miniprogram/`
- 页面：
  - `login` 登录与用户信息初始化
  - `index` 首页列表、搜索、分页、混合流展示
  - `write` 单导师写信
  - `roundtable` 多导师圆桌讨论
  - `roundtableResult` 圆桌结果展示
  - `detail` 信件详情
  - `stamps` 邮票页
  - `trash` 回收站
  - `profile` 个人中心与热力图
  - `privacy` 隐私协议页
- 组件：侧边菜单、云提示弹窗、热力图日历

### 后端

- 技术：微信云开发云函数 + 云数据库
- 目录：`cloudfunctions/`
- 核心云函数：
  - `login` 获取 `openid`
  - `replyToLetter` 调用 DeepSeek 生成单导师回信和圆桌结果
  - `getMentorRules` 获取导师规则库
  - `getMentors` 获取导师列表
  - `detectSensitiveWords` / `filterSensitiveWords` / `hasSensitiveWord` 负责内容治理
  - `diagnoseRoundtable`、`migrateRoundtable`、`migrateRoundtableData` 用于诊断和迁移

### 数据层

从当前代码可确认的主要集合：

- `users`
- `letters`
- `roundtable_discussions`
- `stampHistory`

所有查询都应带用户身份过滤，仓库规则也明确要求数据隔离是安全红线。

## 关键实现说明

- [app.js](/Users/bill/编程/invest-diary/miniprogram/app.js) 负责云开发初始化和主题状态管理。
- [cloudbaseUtil.js](/Users/bill/编程/invest-diary/miniprogram/utils/cloudbaseUtil.js) 封装了前端对云数据库的常用 CRUD、分页和聚合操作。
- [index.js](/Users/bill/编程/invest-diary/miniprogram/pages/index/index.js) 是首页核心，负责缓存、分页、圆桌数据加载和混合排序。
- [replyToLetter/index.js](/Users/bill/编程/invest-diary/cloudfunctions/replyToLetter/index.js) 是项目核心后端逻辑，负责提示词组装、字数控制、敏感词处理、DeepSeek 调用和 AI 免责声明追加。
- `mentorRules_expanded.json` 当前包含 21 位导师和 4 个领域配置，是导师系统的主数据源。

## 目录概览

```text
invest-diary/
├── miniprogram/                 # 微信小程序前端
├── cloudfunctions/              # 云函数与云端业务逻辑
├── scripts/                     # 规则检查、测试、导入脚本
├── .trae/rules/                 # 项目规则与协作规范
├── CODE_WIKI.md                 # 更细的代码级说明
├── TEST_REPORT.md               # 测试记录
└── README.md                    # 当前项目入口文档
```

## 本地开发

### 前置条件

- 微信开发者工具
- 一个可用的小程序 AppID
- 已开通的微信云开发环境
- DeepSeek API Key

### 启动步骤

1. 使用微信开发者工具导入项目根目录 `/Users/bill/编程/invest-diary`。
2. 在云开发控制台创建环境，并记录环境 ID。
3. 按需创建数据库集合：`users`、`letters`、`roundtable_discussions`、`stampHistory`。
4. 部署 `cloudfunctions/` 下需要使用的云函数。
5. 为 `replyToLetter` 云函数配置环境变量 `DEEPSEEK_API_KEY`。
6. 根据你的环境修改 `miniprogram/envList.js`。
7. 在微信开发者工具中编译并预览小程序。

## 脚本与检查

仓库包含一套本地规则检查脚本，说明见 [scripts/README.md](/Users/bill/编程/invest-diary/scripts/README.md)。

常用命令：

```bash
cd /Users/bill/编程/invest-diary/scripts
npm install
node checks/project-rules-check.js
npm run test
```

## 文档导航

- [项目强制规范](/Users/bill/编程/invest-diary/.trae/rules/project_rules.md)
- [执行与交付规范](/Users/bill/编程/invest-diary/.trae/rules/AGENTS.md)
- [代码级 Wiki](/Users/bill/编程/invest-diary/CODE_WIKI.md)
- [脚本说明](/Users/bill/编程/invest-diary/scripts/README.md)
- [测试报告](/Users/bill/编程/invest-diary/TEST_REPORT.md)

## 当前 README 的定位

按照仓库规则，根目录 `README.md` 应该是“用户手册和项目入口”，因此这里重点保留：

- 这个项目现在是什么
- 代码里已经实现了什么
- 从哪里开始看规则、看代码、跑项目

更细的模块级说明、函数清单和设计细节，请直接看 `CODE_WIKI.md`。
