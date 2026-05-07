# 智慧笔记 2.0 开发计划

**使命：把有价值的思想孵化迭代出来，可视化，让人不再迷茫**
**基于：合规改造（COMPLIANCE_PLAN.md）+ Flipbook 可视化（FLIPBOOK_INTEGRATION_REPORT.md）+ Dayu 工程吸收（去财务版）+ AI Agent 接口（AI_AGENT_INTERFACE_DESIGN.md）**

---

## 📍 当前进度总览（2026-05-06 最新审计）

```
Phase 0 合规改造：  ████████████████████ 100%  （全部通过）
Phase 1 脑图 V1：   ████████████████████ 100%  （detail + incubatorResult + structureAnalysisResult 全部集成）
Phase 1.5 Markdown： ████████████████░░░░ ~75%  （markdown-renderer 增强 + exportUtil + AI输出规范化）
Phase 2 全景首页：   ████████████████████ 100%  （领域卡片 + 搜索 + 面包屑 + domainDetail + getMethodCatalog）
Phase 3 全可视化：   ████████████████████ 100%  （H1-H6 全部完成）
工程基建：           ██████████████████░░ ~95%  （shared/ + tests/fixtures + prompts模块化 + 21方法提示词已生成）
AI Agent 接口：     ██░░░░░░░░░░░░░░░░░░ ~10%  （概念设计完成，详见 AI_AGENT_INTERFACE_DESIGN.md）
```

**Phase 1 已完成清单**：
- detail 页脑图：生成/重试/截图保存 ✅
- incubatorResult 页脑图：同上 ✅
- structureAnalysisResult 页脑图：同上 ✅
- 脑图样式提取到 app.wxss 全局复用 ✅
- 提示词模块化（prompts.js）✅
- 脑图容器尺寸优化、reset 按钮移除 ✅

**其他已完成**：
- 热力图修复（WXML 模板方法调用问题）✅
- 字体设置生效（fontClass 系统）✅
- 隐私政策/用户协议页面 + About 页链接 ✅
- 用户协议页面「邮票」残留清理 ✅
- Markdown 渲染增强：表格/任务列表/嵌套列表/链接/暗色主题 ✅
- AI 输出规范化：prompts.js 增加 Markdown 结构要求 ✅
- 导出功能：exportUtil.js + detail 页「导出 Markdown」按钮 ✅
- 方法提示词：21 个分析方法独立 prompt 文件 ✅
- AI Agent 接口概念设计完成 ✅

**Phase 2 启动决策点**：需先上线运行 2-4 周，收集脑图功能使用率数据。点击率 > 15% 才启动。

---

## 核心时间线总览

```
2026年4月     5月        6月        7月15日     8月         9月         10月+
│ 合规红线    │ ←当前    │         █████     │          │          │
│             │         │    法规生效日     │          │          │
└─────────────┴─────────┴─────────┴─────────┴──────────┴──────────┴──
  Phase 0               Phase 1              Phase 2           Phase 3
  合规改造               文字+脑图 V1         知识全景图首页      全可视化
```

---

## Phase 0：合规改造（现在 - 7月15日）

> **🚨 不可逾越的死线：2026年7月15日，《人工智能拟人化互动服务管理暂行办法》正式施行**

### 核心目标
将"虚拟导师写信"改造为"分析方法论工具"：**P0去拟人化 / P1算法备案 / P2合规标识 / P3隐私政策**

### 依赖关系

```
P0（去拟人化文案）──── 是所有 P1 改造的前置条件
  ↓
P1（核心功能改造）──── 是「方案一脑图」的底层基础
  ↓
P2（合规标识）──── 可以与 P1 并行，但必须在 7/15 前完成
  ↓
P3（隐私政策）──── 发布前的最终检查
```

### 文件改动清单

#### 🚨 P0（第1-2天）：去拟人化文案改造

| 文件 | 改动内容 | 行数范围 | 工时 |
|------|---------|---------|------|
| `miniprogram/pages/write/write.js` | 导师列表→分析方法列表 | 全部重构 | 1.5h |
| `miniprogram/pages/write/write.wxml` | "写信给XX"→"选择分析方法" | 全局替换 | 1h |
| `miniprogram/pages/detail/detail.js` | `mentorLocations` 删除；`showMentor`→`showMethod` | L4-11, L80-82 | 0.5h |
| `miniprogram/pages/detail/detail.wxml` | "致：XX导师"→"分析方法：XX" | L3-4 | 0.5h |
| `miniprogram/pages/index/index.js` | 状态标签/混合流字段 | 搜索替换 | 0.5h |
| `miniprogram/pages/index/index.wxml` | 导航文案 | 搜索替换 | 0.5h |
| `miniprogram/pages/roundtable/roundtable.js` | 圆桌会议→多维视角分析 | 全局替换 | 1h |
| `miniprogram/pages/roundtable/roundtable.wxml` | 领域标签/标题 | 全局替换 | 0.5h |
| `miniprogram/pages/stamps/stamps.wxml` | 邮票→分析额度 | 全局替换 | 1h |
| `miniprogram/pages/stamps/stamps.js` | 购买邮票→购买额度 | L1-200 | 0.5h |
| `miniprogram/pages/incubator/*` | "参考导师"→"参考分析方法" | L22 | 0.5h |
| `miniprogram/pages/structureAnalysis/*` | 同上去"导师" | L6 | 0.5h |
| `cloudfunctions/replyToLetter/index.js` | `addAIDisclaimer` 禁用"AI模拟XX" | L32-35 | 0.5h |
| **P0 小计** | 14 个文件 | | **~9h/1天** |

#### 🔴 P1（第2-4天）：核心功能改造

| 文件 | 改动内容 | 工时 |
|------|---------|------|
| `cloudfunctions/replyToLetter/index.js` | `getAIDeducedPrompt` 改为"运用XX框架分析"；`evaluateReplyQuality` 移除 personaMatch | 3h |
| `cloudfunctions/replyToLetter/mentorRules.json` | 导师规则→分析方法库（21个方法） | 2h |
| `cloudfunctions/replyToLetter/index.js` | `addAIDisclaimer` 改为"以上分析基于XX视角" | 0.5h |
| `cloudfunctions/replyToLetter/index.js` | 圆桌生成逻辑→"并行生成各框架分析" | 2h |
| `cloudfunctions/replyToLetter/index.js` | 状态字段：`pending`/`replied`→`analyzing`/`completed` | 0.5h |
| **P1 小计** | 4 个函数改动 | **~8h/1天** |

#### 🟡 P2（第4-5天）：通用合规标识

| 文件 | 改动内容 | 工时 |
|------|---------|------|
| `miniprogram/pages/detail/detail.wxml` | 加"AI 生成"灰色标识 | 0.5h |
| `miniprogram/pages/roundtableResult/*` | 加 AI 免责声明 | 0.5h |
| `miniprogram/pages/incubatorResult/*` | 同上 | 0.5h |
| `miniprogram/pages/structureAnalysisResult/*` | 同上 | 0.5h |
| `miniprogram/app.js` | 全局 2h 时长监控 | 1h |
| `miniprogram/components/sideMenu/*` | 一键退出按钮 | 0.5h |
| `miniprogram/pages/profile/profile.js` | 数据导出功能 | 2h |
| 新增云函数 `reportContent` | 举报内容云函数 | 1h |
| **P2 小计** | 8 个改动 | **~6.5h/0.8天** |

#### 🔵 P3（第6天）：用户协议+隐私政策

| 文件 | 改动内容 | 工时 |
|------|---------|------|
| `miniprogram/pages/privacy/privacy.wxml` | 更新隐私政策内容 | 1h |
| `用户协议.md` | 更新 AI 分析服务说明 | 1h |
| **P3 小计** | 2 个文件 | **~2h** |

### 算法备案（并行启动）

```
第1天：注册 beian.cac.gov.cn → 企业/个体户认证
第2-3天：提交材料（使用方备案，接入 DeepSeek API）
第60-90天：审核期（预计 8-9 月通过）
```

### 数据结构迁移

| 字段 | 旧 | 新 | 兼容方案 |
|------|----|----|---------|
| `letter.status` | `pending/replied/read` | `analyzing/completed/viewed` | 前端判断: 旧值映射新标签 |
| `letter.mentor` | `"查理·芒格"` | `"多元思维模型分析"` | 通过 `methodMap` 转换显示 |
| `letter.type` | `letter/roundtable` | `analysis/roundtable` | 仅改显示层 |
| `letter.replyContent` | 拟人化回复 | 方法论分析 | 旧数据渲染层转换 |

### 验收标准

```
✅ 所有前端文案搜索不到"导师""写信""回信""大师""邮票"等拟人化词汇
✅ 所有分析结果以"XXX分析显示/基于XX视角"开头，不以"我"开头
✅ 每个 AI 生成页有"AI 生成"标识 + 免责声明
✅ 微信侧边菜单有"一键退出"按钮
✅ 数据导出功能正常
✅ 隐私政策已更新 AI 服务说明
✅ 算法备案已提交材料
✅ 2h 使用时长提醒测试通过
✅ 旧数据兼容正确显示
```

---

## 🔥 下一步开发计划（从当前状态出发，分阶段推进）

> **原则**：不搞一次性大重构，每阶段改动 ≤5 文件、≤200 行、≤1 模块
> **前置条件**：Phase 0 必须在 7月15日前彻底收尾

### Stage A：Phase 0 收尾 — 清除拟人化残留（优先级最高，5月）

> **目标**：让 Phase 0 验收标准全部通过，为 Phase 1 扫清障碍
> **预估工时**：~6h / 1个工作日

#### A1. 页面导航标题修正（15分钟）

| 文件 | 当前值 | 改为 |
|------|--------|------|
| `pages/detail/detail.json` | "信件详情" | "分析详情" |
| `pages/roundtable/roundtable.json` | "圆桌会议" | "多维度分析" |
| `pages/roundtableResult/roundtableResult.json` | "圆桌讨论" | "多维度分析" |
| `pages/write/write.json` | "写笔记" | "分析方法" |

#### A2. 云函数描述去拟人化（15分钟）

| 文件 | 当前值 | 改为 |
|------|--------|------|
| `replyToLetter/config.json` | "获取人生导师的回复" | "AI 分析引擎" |
| `getMentorRules/config.json` | "获取AI大师和心境规则库" | "获取分析方法规则库" |
| `getMentorRules/package.json` | "获取AI大师和心境规则库的云函数" | "获取分析方法规则库" |

#### A3. mentorRules_expanded.json 去拟人化（1小时）

**问题**：`mentorRules_expanded.json` 仍以人名作为 key（"查理·芒格"等），包含 `persona` 字段（"我是查理·芒格..."），且云函数优先加载此文件。

**方案**：
1. 将 `mentorRules_expanded.json` 的 key 从人名改为分析方法名（与 `mentorRules.json` 一致）
2. 将 `persona` 字段改为 `methodology` 字段
3. 将 `field: "投资"` 等改为新领域名（"价值思维"等）
4. 合并两个文件，只保留一个 `mentorRules.json`
5. 删除 `mentorRules_expanded.json`

#### A4. 云函数 fallback 去拟人化（30分钟）

| 文件 | 行号 | 问题 | 修复 |
|------|------|------|------|
| `replyToLetter/index.js` | L226 | `mentorRules.mentors['查理·芒格']` fallback | 改为 `'多元思维模型分析'` |
| `replyToLetter/index.js` | L1086 | 同上 | 同上 |

#### A5. sideMenu 添加"一键退出"按钮（30分钟）

在 `components/sideMenu/index.wxml` 的"退出登录"按钮旁，新增"一键退出"按钮：
- 点击直接调用 `wx.exitMiniProgram()`，无需二次确认弹窗
- 满足合规要求中"用户可随时退出"的规定

#### A6. 新增 reportContent 云函数（1小时）

新建 `cloudfunctions/reportContent/`，实现内容举报功能：
- 接收参数：`contentId`, `contentType`, `reason`
- 存入 `reports` 集合
- 返回成功状态

**A阶段验收清单**：
```
✅ 所有页面标题无拟人化文字
✅ 云函数描述无"导师""大师"
✅ 只存在一个 mentorRules.json（分析方法名作 key）
✅ 云函数 fallback 使用分析方法名
✅ sideMenu 有"一键退出"按钮
✅ reportContent 云函数可用
```

---

### Stage B：Phase 0 收尾 — 数据字段名迁移（5月-6月）

> **目标**：将数据库字段从 `mentor` 迁移到 `method`，状态从 `pending/replied` 到 `analyzing/completed`
> **预估工时**：~4h / 0.5个工作日
> **风险**：需要兼容旧数据，必须做双向映射

#### B1. 状态字段迁移

| 旧值 | 新值 | 影响文件 |
|------|------|---------|
| `pending` | `analyzing` | detail.js, index.js, trash.js |
| `replied` | `completed` | 同上 |
| `read` | `viewed` | 同上 |

**兼容方案**：前端 `getStatusLabel()` 同时识别新旧值：
```javascript
getStatusLabel(status) {
  const map = {
    'analyzing': '分析中', 'pending': '分析中',    // 旧值兼容
    'completed': '已完成', 'replied': '已完成',    // 旧值兼容
    'viewed': '已查看', 'read': '已查看',          // 旧值兼容
    'saved': '已保存'
  };
  return map[status] || '未知';
}
```

#### B2. 数据字段名 `mentor` → `method` 评估

**暂不建议做此迁移**，原因：
1. `mentor` 字段贯穿数据库所有集合（letters, roundtable_discussions, incubator_reports）
2. 云函数、前端十几个文件都引用此字段
3. 迁移需同时处理历史数据（数千条记录的 `_openid` 级别更新）
4. 代码层面的 `mentor` 是内部字段名，不影响合规（用户看不到）

**替代方案**：仅做展示层映射（已在 detail.js 的 `methodNameMap` 和 `_getDisplayMethod` 中实现），数据库字段名不变。

**如果未来要做完整迁移**，应放在 Phase 2 或更后，作为独立的"数据层现代化"任务。

---

### Stage C：Phase 1 前置 — 工程基建（6月）

> **目标**：为脑图功能搭建工程基础设施
> **预估工时**：~5h / 0.5个工作日

#### C1. 创建 `tests/fixtures/` 测试夹具（1小时）

收集真实用户样本用于脑图提示词调优：
- `tests/fixtures/sample-analysis-simple.json` — 短文本分析结果
- `tests/fixtures/sample-analysis-medium.json` — 中等文本分析结果
- `tests/fixtures/sample-analysis-complex.json` — 长文本分析结果
- `tests/fixtures/expected-mindmap-simple.json` — 期望的脑图 JSON 输出

#### C2. 创建 `cloudfunctions/shared/` 共享层（2小时）

```
cloudfunctions/shared/
└── reasoning/
    ├── pipeline/
    │   └── stage-2-format-normalizer.js   // 格式归一化
    └── prompts/
        ├── base/
        │   └── soul.md                     // "你是一个方法论分析工具"
        └── methods/                        // 21个分析方法目录
            ├── multi-model-thinking.md
            └── ...
```

#### C3. 提示词拆分为独立文件（2小时）

将 `replyToLetter/index.js` 中内嵌的提示词字符串，抽取到 `cloudfunctions/shared/reasoning/prompts/` 目录下，便于脑图提示词复用。

---

### Stage D：Phase 1 核心 — detail 页脑图功能（7月）

> **目标**：在分析详情页增加"生成可视化脑图"功能
> **预估工时**：~17h / 2-3个工作日
> **前置条件**：Stage A + C 完成

#### D1. 新建 mindmap-renderer 组件（8h）

```
miniprogram/components/mindmap-renderer/
├── index.js      // 树状布局算法 + canvas 绘制 + 手势交互
├── index.wxml    // canvas 画布
├── index.wxss    // 画布/窗口/工具栏样式
└── index.json    // 组件配置
```

核心技术点：
- 使用微信 Canvas 2D API（非旧版 canvas）
- 树状布局算法：递归位置分配（参考 DEVELOPMENT_PLAN.md 1.6 节）
- 手势：双指缩放 + 单指拖拽 + 节点点击
- 节点 ≤ 20 时性能目标 60fps

#### D2. 云函数新增脑图 JSON 生成（2h）

在 `replyToLetter/index.js` 新增 `generateMindmapJSON()` 函数：
- 输入：分析结果文本
- 调用 DeepSeek API 返回结构化脑图 JSON
- JSON 契约参考 DEVELOPMENT_PLAN.md 1.4 节

#### D3. detail 页集成脑图（4h）

- `detail.wxml`：添加"🧠 生成可视化脑图"按钮 + canvas overlay
- `detail.js`：新增 `generateMindmap` 事件处理 + 脑图状态管理
- `detail.wxss`：脑图按钮/overlay 样式

#### D4. 测试与优化（3h）

- 脑图节点 ≤ 20 性能测试
- AI JSON 输出不稳定时的前端校验+修复
- 生成失败重试按钮
- 截图保存功能

**D阶段验收清单**：
```
✅ detail 页"分析结果"卡片下有「🧠 生成可视化脑图」按钮
✅ 点击后 2-5秒展示脑图
✅ 脑图节点可点击展开详情
✅ 双指缩放/单指拖拽流畅
✅ 截图保存功能正常
✅ 脑图内容无拟人化表述
✅ 生成失败时有"重试"按钮
```

---

### Stage E：Phase 1 扩展 — 其他页面脑图（8月）

> **目标**：将脑图功能扩展到孵化器结果页、结构分析结果页
> **预估工时**：~8h / 1个工作日
> **前置条件**：Stage D 完成，且脑图组件稳定

#### E1. incubatorResult 页集成脑图（4h）
#### E2. structureAnalysisResult 页集成脑图（4h）

复用 D1 的 mindmap-renderer 组件，仅做数据适配。

---

### Stage F：Phase 2 — 知识全景图首页（9月-10月）

> **目标**：首页从列表流改造为领域卡片网格
> **预估工时**：~15h / 2个工作日
> **前置条件**：Stage D 完成

参考 DEVELOPMENT_PLAN.md Phase 2 原始设计，此处不再展开。

---

## 总工时重新评估

| 阶段 | 时间窗口 | 核心工时 | 文件改动数 | 状态 |
|------|---------|---------|-----------|------|
| **Stage A** Phase 0收尾 | 5月 | ~6h / 1天 | ~10 文件 | ✅ 已完成 |
| **Stage B** 数据字段迁移 | 5-6月 | ~4h / 0.5天 | ~5 文件 | ✅ 展示层映射已完成，数据库层暂缓 |
| **Stage C** 工程基建 | 6月 | ~5h / 0.5天 | ~8 新文件 | ✅ 已完成（shared/ + tests/fixtures + prompts模块化） |
| **Stage D** 脑图核心 | 7月 | ~17h / 2.5天 | ~6 新建+4 修改 | ✅ 已完成 |
| **Stage E** 脑图扩展 | 8月 | ~8h / 1天 | ~8 修改 | ✅ 已完成（incubatorResult + structureAnalysisResult） |
| **Stage F** 全景首页 | 9-10月 | ~15h / 2天 | ~7 文件 | ✅ 已完成（领域卡片+搜索+混合列表+面包屑+domainDetail+getMethodCatalog） |
| **Stage G** Phase 2补完 | 5月 | ~10h / 1.5天 | ~10 文件 | ✅ 已完成 |
| **Stage H1** 知识图谱基础 | 5月 | ~8h / 1天 | ~6 新建+3 修改 | ✅ 已完成（Canvas 2D + LOD渲染 + 三种视图模式） |
| **Stage H2-H6** 图谱交互+关联+洞察+深入探索+快照 | 5-6月 | ~27h / 4天 | ~10 新建+6 修改 | ✅ 已完成 |

> **核心理念："文字分析为骨，可视化脑图为翼"**
> 基于合规改造后的"方法论分析工具"形态，在分析结果页增加脑图生成功能

### 1.1 用户旅程

```
用户 → 选择分析方法 → 输入分析内容
  ↓
云函数 → DeepSeek 生成文字分析结果
  ↓
前端展示文字分析结果（现有 detail.wxml 改造版）
  ↓
用户点击「🧠 生成可视化脑图」
  ↓
云函数调用 DeepSeek → 返回 JSON 节点结构
  ↓
前端 canvas 渲染为交互式脑图
  ↓
用户点击节点 → 展开详情弹窗
  ↓
用户可：缩放/平移/截图保存/分享
```

### 1.2 新增文件清单

| 文件 | 类型 | 说明 | 工时 |
|------|------|------|------|
| `miniprogram/components/mindmap-renderer/index.js` | **组件（新建）** | 脑图画布组件：树状布局算法 + canvas 绘制 + 手势交互 | 8h |
| `miniprogram/components/mindmap-renderer/index.wxml` | 组件模板 | canvas 画布 WXML | 1h |
| `miniprogram/components/mindmap-renderer/index.wxss` | 组件样式 | 画布/窗口/工具栏样式 | 1h |
| `miniprogram/components/mindmap-renderer/index.json` | 组件配置 | JSON 配置 | 0.5h |
| `cloudfunctions/shared/reasoning/pipeline/` | **目录（新建）** | 数据清洗管线 | 0.5h |
| `cloudfunctions/shared/reasoning/pipeline/stage-2-format-normalizer.js` | 模块（新建） | 格式归一化（最快见效） | 1h |
| `cloudfunctions/shared/reasoning/prompts/base/soul.md` | 提示词（新建） | "你是一个方法论分析工具" | 0.5h |
| `cloudfunctions/shared/reasoning/prompts/methods/` | 目录（新建） | 21个分析方法目录 | 0.5h |

### 1.3 修改文件清单

| 文件 | 改动内容 | 工时 |
|------|---------|------|
| `cloudfunctions/replyToLetter/index.js` | 新增 `generateMindmapJSON()` 函数 | 2h |
| `cloudfunctions/replyToLetter/index.js` | 提示词改用 `prompt-composer` 组装 | 3h |
| `miniprogram/pages/detail/detail.js` | 新增 `generateMindmap` / 触摸事件 / 状态管理 | 4h |
| `miniprogram/pages/detail/detail.wxml` | 加"生成脑图"按钮 + canvas overlay | 2h |
| `miniprogram/pages/detail/detail.wxss` | 脑图按钮/overlay 样式 | 1h |
| `miniprogram/pages/incubatorResult/*` | 可选：孵化器结果加脑图（Phase 1.2） | 4h |
| `miniprogram/pages/structureAnalysisResult/*` | 可选：结构分析加脑图（Phase 1.2） | 4h |

### 1.4 脑图 JSON 数据契约

```json
{
  "title": "如何学习游泳 - 方法论分析",
  "root": "学习游泳",
  "method_name": "系统分解分析法",
  "created_at": "2026-07-20T10:30:00Z",
  "analysis_id": "anlys_20260720_001",
  "children": [
    {
      "id": "n1",
      "label": "第一步：克服恐水",
      "detail": "在浅水区逐步适应水的浮力和阻力，建立对水的信任感",
      "color": "#4A90D9",
      "children": [
        { "id": "n1-1", "label": "浅水区行走", "detail": "在膝盖深水中走动，感受水流", "color": "#7CB5EC" },
        { "id": "n1-2", "label": "呼吸练习", "detail": "水中吐气、出水吸气的节奏练习", "color": "#7CB5EC" }
      ]
    },
    {
      "id": "n2",
      "label": "第二步：漂浮",
      "detail": "掌握水中漂浮技巧是游泳的基础",
      "color": "#27AE60",
      "children": [
        { "id": "n2-1", "label": "背部漂浮", "detail": "仰躺水面，身体放松呈星形", "color": "#6FCF97" },
        { "id": "n2-2", "label": "俯卧漂浮", "detail": "面部入水，背部露出水面", "color": "#6FCF97" }
      ]
    },
    {
      "id": "n3",
      "label": "第三步：划水踢腿",
      "detail": "协调上下肢动作推进",
      "color": "#E67E22",
      "children": []
    },
    {
      "id": "n4",
      "label": "第四步：换气配合",
      "detail": "划水节奏中自然转头换气",
      "color": "#E74C3C",
      "children": []
    }
  ]
}
```

### 1.5 提示词改造

**脑图生成提示词**（在 `replyToLetter/index.js` 中新增）：

```javascript
function getMindmapPrompt(analysisContent) {
  return `你是一个知识可视化专家。请将以下分析内容提炼为知识脑图 JSON。

分析内容：
${analysisContent}

输出格式（只输出 JSON，不要其他内容）：
{
  "title": "脑图标题",
  "root": "核心主题",
  "method_name": "使用的分析方法",
  "children": [
    {
      "id": "n1",
      "label": "节点标签（≤10字）",
      "detail": "简要说明（≤30字）",
      "children": []
    }
  ]
}

要求：
1. 提取 3-6 个核心节点
2. 每个节点深度不超过 2 层
3. label ≤10字，detail ≤30字
4. 严格 JSON 格式，不要 markdown 代码块包裹`;
}
```

### 1.6 前端脑图组件核心逻辑

```javascript
// components/mindmap-renderer/index.js（核心算法框架）
Component({
  properties: {
    nodeData: { type: Object }  // 脑图 JSON 数据
  },
  data: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    selectedNode: null
  },
  methods: {
    // 树状布局算法
    layoutTree(root) {
      return this._assignPosition(root, 0, 0, 50);
    },
    _assignPosition(node, depth, x, y, siblingGap) {
      node.x = depth * 200 + 50;     // 每层水平偏移 200px
      node.y = y;                     // 垂直位置
      if (node.children && node.children.length > 0) {
        const totalHeight = (node.children.length - 1) * siblingGap;
        const startY = y - totalHeight / 2;
        node.children.forEach((child, i) => {
          this._assignPosition(child, depth + 1, node.x, startY + i * siblingGap, siblingGap);
        });
      }
      return node;
    },

    // canvas 绘制
    drawMindmap() {
      const ctx = wx.createCanvasContext('mindmapCanvas');
      const layoutData = this.layoutTree(this.data.nodeData);
      this._drawNode(ctx, layoutData);
      this._drawEdges(ctx, layoutData);
      ctx.draw();
    },
    _drawNode(ctx, node) {
      // 画圆角矩形
      ctx.setFillStyle(node.color || '#4A90D9');
      ctx.setFontSize(14);
      // 绘制节点 + label
    },
    _drawEdges(ctx, node) {
      // 从父节点中心连线到子节点顶部
    },

    // 手势处理
    onTouchStart(e) { /* 记录起始位置 */ },
    onTouchMove(e) { /* 计算偏移量，更新 scale/offsetX/offsetY */ },
    onTouchEnd(e) { /* 检测是否点击到了某个节点 */ },
  }
})
```

### 1.7 工作量汇总

从合规改造完成后的时间点算起：

```
Phase 1 核心：detail 页脑图         ~17h / ~2天
Phase 1.2 可选：孵化器+结构分析脑图  ~8h / ~1天
Phase 1 工程基建：
  - 数据清洗管线 Stage 2             ~1h
  - prompts 三层目录                ~2h
  - CLAUDE.md 创建                  ~0.5h
  - config/default/ 配置抽取          ~1h
  - tests/fixtures/ 夹具收集          ~1h
Phase 1 工程基建小计                  ~5.5h / ~0.5天

Phase 1 总计：约 22-30h / 3-4个工作日
```

### 1.8 验收标准

```
✅ detail 页"分析结果"卡片下有「🧠 生成可视化脑图」按钮
✅ 点击后显示加载状态 → 2-5秒后展示脑图
✅ 脑图节点可点击展开详情
✅ 双指缩放/单指拖拽流畅（60fps）
✅ 截图保存和分享功能正常
✅ 脑图内容无拟人化表述
✅ 节点≤20个时无性能问题
✅ 生成失败时有"重试"按钮
✅ 返回按钮回到文字分析页
```

---

## 1.9 方案二的跳板设计

脑图的每层节点天然支持展开：
- Phase 1 中点击节点 → 弹窗显示 `detail` 文本
- Phase 1 的树状布局算法已经预留了递归位置分配
- Phase 1 的 JSON 数据结构已经支持多层 `children`
- Phase 2 只需要将"弹窗"改为"在 canvas 中展开子节点"即可

---

## Phase 2：知识全景图首页（9月 - 11月）

### 核心目标
将首页从"列表流"改造为"领域分类卡片网格"，每个卡片对应一个分析领域，点击进入分析方法列表，再点击进入分析详情（带脑图）

### 2.1 新增/修改文件

| 文件 | 改动 | 工时 |
|------|------|------|
| `miniprogram/pages/index/index.wxml` | **重写**：列表→领域卡片网格（4个领域） | 6h |
| `miniprogram/pages/index/index.wxss` | **重写**：卡片/网格/响应式布局 | 3h |
| `miniprogram/pages/index/index.js` | 增加领域数据加载、卡片事件 | 4h |
| `cloudfunctions/shared/domain/models/method-catalog.js` | **新建**：领域+方法分类数据模型 | 1h |
| `cloudfunctions/shared/domain/models/analysis-record.js` | **新建**：分析记录数据模型 | 1h |
| `miniprogram/components/breadcrumb/index.js` | **新建**：面包屑导航组件 → 显示层级路径 | 2h |
| 新增云函数 `getMethodCatalog` | 返回领域和方法的分类信息 | 1h |

### 2.2 首页改造后效果

```
┌─────────────────────────────┐
│  🔍 搜索分析主题...          │
├─────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 商业   │ │ 创新   │ │ 心理   ││
│  │ 分析   │ │ 方法   │ │ 分析   ││
│  │ ━━━━━ │ │ ━━━━━ │ │ ━━━━━ ││
│  │ 3种方法│ │ 5种方法│ │ 4种方法││
│  └──────┘ └──────┘ └──────┘│
│  ┌──────┐ ┌──────┐         │
│  │ 哲学   │ │ 结构   │         │
│  │ 思考   │ │ 分析   │         │
│  │ ━━━━━ │ │ ━━━━━ │         │
│  │ 5种方法│ │ 2种方法│         │
│  └──────┘ └──────┘         │
│                             │
│  📋 最近分析:                 │
│  · 如何提高决策质量           │
│    → 多元思维模型分析         │
│  · 产品定位困惑              │
│    → 本质思考分析             │
└─────────────────────────────┘
```

### 2.3 验收标准

```
✅ 首页显示 4 个领域卡片（商业/创新/心理/哲学）
✅ 每个卡片显示该领域下的分析方法数量
✅ 点击卡片进入方法列表页
✅ 顶部搜索功能可用
✅ 底部有"最近分析"快捷入口
✅ 面包屑导航显示当前路径（首页 > 商业分析 > 多元思维模型）
✅ 点击分析方法 → 进入合规改造后的分析详情页（带脑图）
✅ 旧数据（尚无领域分类）在首页以"未分类"标签展示
```

---

## Phase 3：全可视化浏览（5月+）

### 核心目标
**"知识是景观，不是数据库"**（Flipbook 启发）+ **"从 -1 到 0"**（South Park Commons 启发）

采用混合模式：首页保持领域卡片，新增独立知识图谱页面。用户像探索地图一样探索自己的思考历程。

### 已完成（Stage H1）

- ✅ `miniprogram/pages/knowledgeMap/` — 全屏 Canvas 2D 知识图谱页
- ✅ 虚拟坐标系（支持无限平移和缩放）
- ✅ LOD 渲染策略（远景只显示领域节点，近景显示全部）
- ✅ 三层节点：领域→方法→分析记录
- ✅ 三种视图模式：图谱/聚类/时间线
- ✅ 手势：双指缩放 + 单指拖拽 + 单击详情 + 双击聚焦
- ✅ 首页添加"🗺️ 图谱"入口按钮

### 已完成（Stage H2-H6）

#### Stage H2: 图谱交互与节点详情
- ✅ 单击节点底部弹出详情卡片（领域/方法/分析记录三种类型）
- ✅ 选中节点时关联节点联动高亮，非关联节点降低透明度
- ✅ 导航栏新增"洞察"和"截图"按钮

#### Stage H3: 跨分析关联发现
- ✅ `cloudfunctions/discoverConnections/` — DeepSeek API 分析分析记录间的主题相似性
- ✅ 关联线渲染（橙色虚线，关联强度可视化）
- ✅ 结果缓存 7 天（`knowledge_connections` 集合）

#### Stage H4: "从 -1 到 0" 知识洞察
- ✅ `cloudfunctions/getKnowledgeInsights/` — 生成知识洞察
- ✅ 洞察面板：概览统计 + 未使用方法 + 推荐探索方向 + 最常用方法排行
- ✅ DeepSeek 生成个性化推荐（基于已有分析内容）
- ✅ 点击推荐/未使用方法直接跳转 write 页

#### Stage H5: Flipbook 式深入探索
- ✅ 双击分析记录节点 → 弹出操作选项（查看脑图/深入探索）
- ✅ 查看脑图：全屏 overlay 展示 mindmap-renderer 组件
- ✅ 深入探索：调用 DeepSeek 从原分析中提取子主题生成新分析
- ✅ 新分析自动添加为图谱节点 + 连线
- ✅ 平滑 easeOut 动画过渡到新节点位置
- ✅ `replyToLetter/index.js` 新增 `deepexplore` 类型处理 + `generateDeepExploration()` 函数

#### Stage H6: 知识图谱快照
- ✅ 导航栏"截图"按钮 → Canvas 导出为图片 → 保存到相册
- ✅ 复用 mindmap-renderer 的 `canvasToTempFilePath` + `saveImageToPhotosAlbum` 模式

### 3.2 不照搬 Flipbook（纯图片模式）

```
❌ 不做：AI 生成图片 → 点击图片某个区域 → 生成子图片
✅ 做：canvas 渲染文字节点 → 点击节点 → 展开子节点
❌ 不做：用 AI 绘图替换所有文字
✅ 做：图文混合，文字分析是主体，脑图是增强导航
```

---

## 工程基建同步（跨所有 Phase）

以下工作不依赖具体功能的开发进度，可以随时启动：

### Dayu 工程吸收（去财务版）

| 项 | 启动时机 | 工时 |
|---|---------|------|
| **CLAUDE.md** 创建（最高约束+思考纪律） | 立即（Phase 0 并行） | 0.5h |
| **config/default/** 目录 + 配置抽取 | Phase 1 开始时 | 1h |
| **prompts/ 三层目录**（base/scenes/contracts） | Phase 1 开始时 | 2h |
| **数据清洗 Stage 2**（格式归一化） | Phase 1 中期 | 1h |
| **tests/fixtures/** 收集真实用户样本 | Phase 1 持续 | 随用积累 |
| **来源标注**（分析结果尾部追加） | Phase 1 末 - Phase 2 初 | 2h |
| **trace 记录** | Phase 2 | 3h |
| **重放分析功能** | Phase 2-3 | 4h |

---

## 风险矩阵

| 风险 | Phase | 概率 | 影响 | 应对 |
|------|-------|------|------|------|
| 合规改造超期 | 0 | 中 | 高 | 先 P0 后 P1，P3 可延至 Phase 1 |
| 算法备案未在法规生效前通过 | 0 | 高 | 中 | 合规改造后可正常运营，备案只是补充要求 |
| 微信 canvas 性能不足 | 1 | 中 | 高 | V1 限制节点≤20；降级为列表展示 |
| AI JSON 输出不稳定 | 1 | 中 | 中 | 前端校验+修复；重试按钮 |
| 脑图点击率过低 | 1→2 | 中 | 中 | 以 15% 为门槛决策是否投入 Phase 2 |
| 模型切换导致脑图功能异常 | 1+ | 低 | 中 | JSON 生成与主模型解耦 |
| 小程序包超 2MB | 1+ | 中 | 高 | 组件分包；脑图走远程 |
| 脑图内容含拟人化残留 | 1+ | 低 | 高 | 提示词禁止 + 后处理检查 |

---

## 总工作量评估

| Phase | 时间窗口 | 核心工时 | 文件改动数 |
|-------|---------|---------|-----------|
| Phase 0 合规改造 | 现在-7/15 | ~25h / 3天 | ~25 个文件 |
| Phase 1 脑图 V1 | 7/15-9月 | ~30h / 4天 | ~12 个文件（6新增+6修改） |
| Phase 2 全景图首页 | 9月-11月 | ~15h / 2天 | ~7 个文件（4新增+3重写） |
| Phase 3 全可视化 | 11月+ | 待定 | 待定 |
| 工程基建（持续） | 跨所有 Phase | ~10h | ~8 个文件 |
| **总计** | | **~80h / 10个工作日** | **~50 个文件** |

---

## 你的使命

> **"把有价值的思想孵化迭代出来，可视化，让人不再迷茫"**

这个路线图的每一步都在回答这个问题：
- Phase 0：从"导师代答"变为"方法指引"——让用户学会思考，不是依赖"大师"
- Phase 1：脑图让分析过程**可视化**——用户一眼看清思考路径
- Phase 2：知识全景图让**思想可浏览**——所有方法论像图书馆一样排列
- Phase 3：全可视化让**知识可以穿梭**——用户在自己的知识地图中自由探索

远不止是"在分析结果上加个图"，而是在构建一个**思考可视化平台**。
