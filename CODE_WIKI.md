# 智慧笔记项目 Code Wiki

## 1. 项目概述

### 1.1 项目定位
智慧笔记是一款基于微信小程序 + 微信云开发的个人思考记录与 AI 导师对话工具。用户选择 21 位横跨 4 个领域的虚拟导师（查理·芒格、巴菲特、段永平、张小龙、荣格、老子等），以**书信式延迟回信**的方式获得模拟智慧回复。项目提供单导师写信、多导师圆桌会议、思想孵化器、结构分析四种 AI 交互模式。

### 1.2 核心功能矩阵

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| 单导师写信 + AI 回信 | ✅ 生产可用 | 选择 1 位导师，DeepSeek 模拟回信，支持字数自适应 |
| 圆桌会议 | ✅ 生产可用 | 选择 3-5 位导师并行生成观点，分领域排序展示 |
| 思想孵化器 | ✅ 隐藏验证 | 输入想法，3 位导师多维度分析（5 个维度 + 行动清单） |
| 产品/公司结构分析 | ✅ 验收通过 | 输入内容，生成六章结构化报告 + ASCII 结构快照 |
| 邮票系统 | ✅ 生产可用 | 每次回信消耗 1 张，圆桌 3 张，支持购买套餐 |
| 每日限制 | ✅ 生产可用 | 单导师每天最多 6 次寄信 |
| 本地缓存分页 | ✅ 生产可用 | 首頁 10 条/页，1 小时缓存 |
| 敏感词治理 | ✅ 生产可用 | 前端预检 + 云函数二次检测 + 高敏内容兜底替换 |
| 主题切换 | ✅ 生产可用 | light / dark / system，CSS 变量驱动 |
| 专注模式 | ✅ 可用 | 简化的干净界面，隐藏无关元素 |
| 回收站 | ✅ 可用 | 软删除，可恢复 |
| 热力图 | ✅ 可用 | 365 天笔记日历（当前为模拟数据） |

### 1.3 项目状态
- 项目形态：微信小程序 + 云函数 + 云数据库
- AI 服务：DeepSeek Chat API（deepseek-chat 模型）
- 导师规模：21 位导师，4 个领域
- 代码行数：约 6,048 行代码 + 22,000 行文档
- 核心文档：README.md（项目入口）、CODE_WIKI.md（代码级说明）、.trae/rules/（项目规范）
- 最后更新：2026-04-12

---

## 2. 架构概览

### 2.1 三层架构

```
┌──────────────────────────────────────────────┐
│              微信小程序前端                     │
│      14 页面 + 3 组件 + 3 工具模块              │
│     WXML + WXSS + JavaScript（原生框架）         │
└──────────────────┬────────────────────────────┘
                   │ wx.cloud.callFunction()
                   ▼
┌──────────────────────────────────────────────┐
│             微信云开发平台                      │
│  ┌────────────────────────────────────────┐   │
│  │  云函数层（Node.js 14）                │   │
│  │  login / replyToLetter / getMentorRules│   │
│  │  detectSensitiveWords / filterSensitive│   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │  云数据库层（MongoDB 兼容）             │   │
│  │  users / letters / roundtable_discussions│  │
│  │  stampHistory / incubator_reports / ... │  │
│  └────────────────────────────────────────┘   │
└──────────────────┬────────────────────────────┘
                   │ HTTPS POST
                   ▼
┌──────────────────────────────────────────────┐
│           外部 AI 服务                         │
│    DeepSeek API (api.deepseek.com/v1)         │
│    模型：deepseek-chat                        │
│    Temperature: 0.7, max_tokens: 280-1000     │
│    基于用户内容复杂度的字数自适应策略             │
└──────────────────────────────────────────────┘
```

### 2.2 数据流向
```
用户写笔记 → 前端敏感词预检 → 云函数 replyToLetter
  → 组装提示词（导师人设 + 核心原则 + 思考框架 + 字数约束）
  → 调用 DeepSeek API → 后处理（敏感词检测 + AI 免责声明）
  → 云端入 letters/roundtable_discussions 集合
  → 前端分页加载（1 小时缓存策略）
```

---

## 3. 前端模块详解

### 3.1 页面路由与导航

```json
// app.json 中注册的页面，按路由顺序排列
pages/login/login              → 登录页
pages/privacy/privacy          → 隐私协议页
pages/index/index              → 首页（笔记+圆桌混合流）
pages/write/write              → 写笔记/写信页
pages/incubator/incubator      → 思想孵化器
pages/incubatorResult/...      → 孵化器结果页
pages/structureAnalysis/...    → 结构分析输入页
pages/structureAnalysisResult  → 结构分析结果页
pages/roundtable/roundtable    → 圆桌会议创建页
pages/roundtableResult/roundtableResult → 圆桌结果页
pages/detail/detail            → 笔记详情页
pages/stamps/stamps            → 邮票购买页
pages/trash/trash              → 回收站
pages/profile/profile          → 个人中心
```

**路由特点：**
- 首次使用（isFirstLogin 标记）→ 登录页
- 老用户复访 → 自动跳转首页（`wx.reLaunch`）
- 未登录 → `wx.redirectTo` 强制返回登录页
- 所有列表跳详情：`wx.navigateTo` 传递 `?id=` 或 `?data=`

### 3.2 首页核心逻辑

**文件：** `miniprogram/pages/index/index.js`（694 行，项目最复杂的前端模块）

**混合流展示机制：**
首页合并 4 种数据类型按时间降序排列：
```javascript
mergeAndSortItems() {
  return [...letters, ...roundtables, ...incubators, ...structureAnalyses]
    .sort((a, b) => b.createTime - a.createTime);
}
```
每种数据类型自动标记标签色：蓝色（导师回信）/ 绿色（圆桌会议）/ 橙色（思想孵化器）/ 紫色（结构分析）

**缓存策略（第 257-291 行）：**
```javascript
// 首页先展示缓存，后台静默更新
if (cache && cache.timestamp + cache.expire * 1000 > Date.now()) {
  this.setData({ letters: cacheData });
  this.fetchPageFromServer(1, true); // 后台更新，不阻塞 UI
}
```
- 每页独立缓存键：`letters_{openid}_{page}`
- 缓存有效期：1 小时
- 下拉刷新：**清除所有页缓存**后重新加载
- 删除笔记：清除全部缓存

**分页逻辑（第 296-381 行）：**
- 每页 10 条
- 滚动到底部自动触发 `loadMoreLetters()`
- `onReachBottom` + `onScrollToLower` 双重触发
- 搜索模式下不分页

**身份验证：**
- 检查 `wx.getStorageSync('openid')` 和 `userInfo`
- 缺失则 `redirectTo` 登录页
- 必须通过 `checkAuth()` 后才能渲染

**热力图（第 431-446 行）：**
- ⚠️ 当前为**模拟数据**：`Math.floor(Math.random() * 4)`
- 基于 `component/heatmapCalendar` 组件渲染
- 数据范围：过去 365 天

### 3.3 写笔记页（核心业务入口）

**文件：** `miniprogram/pages/write/write.js`（461 行）

**导师选择机制：**
- 硬编码 21 位导师，按 4 个领域分组（见第 9-18 行）
- `mentorIndex` 通过 `picker` 组件选择
- 当前默认选中 `mentorIndex=0`（查理·芒格）

**导师指引弹出层：**
- 从云端 `getMentorRules` 云函数加载
- 本地缓存（`cacheUtil.js` 中的 `saveMentorRulesCache`）
- 降级方案：硬编码的 `fallbackMentorGuides`（第 77-99 行）
- 展示格式：「核心原则：\n1. ...\n2. ...」

**字数自适应 @ 前端侧：**
- 实时统计：`e.detail.value.length`
- 长度判定：10 字 min 触发短内容提示

**每日限制检查（第 119-147 行）：**
```javascript
// 查询当天 0 点到 24 点间，该用户已寄出的 needReply=true 的记录数
where: {
  _openid: this.data.openid,
  needReply: true,
  createTime: _.gte(startOfDay).and(_.lt(endOfDay))
}
```
- 上限 6 次/天
- 前端在用户选择「需要回信」时提前检查
- 提交时再次检查（双重检查）

**邮票消费逻辑（第 311-417 行）：**
1. 用户选中「需要回信」→ 消耗 1 张邮票（`stamps - 1`）
2. 调用 `replyToLetter` 云函数 → DeepSeek 异步生成回复
3. 成功后清除首页缓存 → 3 秒后返回首页
4. 不勾选「需要回信」→ 仅保存到数据库，不扣邮票

**提交流程时序：**
```
用户点击提交 → 内容 < 10字？ → 短内容确认弹窗
  → 需要回信且邮票=0？ → 引导购买
  → 需要回信且超每日限制？ → 拒绝
  → 敏感词检查（高敏→阻止，金融→提示）
  → doSubmit() → 写入 letters 集合 → 扣邮票 → 调用云函数 → 跳转
```

### 3.4 圆桌会议页

**文件：** `miniprogram/pages/roundtable/roundtable.js`（353 行）

**与写笔记页的代码复用：**
- 导师列表完全复用（同样 21 位 4 领域）
- 敏感词检测逻辑完全复用
- `checkAuth()` / `fetchUserStamps()` / `loadMentorRules()` 完全复用
- `fallbackToHardcoded()` 完全复用（但单独定义，未抽取公共模块）

**差异：**
- 圆桌会消耗 3 张邮票（`totalCost: 3`）
- 最少选 3 位，最多选 5 位导师
- 提交后跳转 `roundtableResult` 结果页
- 保存最近 10 次圆桌 ID 到本地存储，用于首页修复归属

### 3.5 笔记详情页

**文件：** `miniprogram/pages/detail/detail.js`（170 行）

**权限校验：**
```javascript
if (result.data._openid !== this.data.openid) {
  wx.showToast({ title: '无权限', icon: 'error' });
  setTimeout(() => wx.navigateBack(), 1500);
  return;
}
```

**延迟回信展示逻辑：**
```javascript
const canShowReply = result.data.replyContent &&
  (!result.data.replyExpectTime || now >= result.data.replyExpectTime);
```
- 老数据（无 `replyExpectTime`）: 有回复直接展示
- 新数据：需等待 18 小时后才显示

**功能：**
- 查看笔记内容 + AI 回复
- 手动编辑/保存回复（管理员功能）
- 导师位置展示（硬编码映射 `mentorLocations`）
- 删除笔记

### 3.6 组件体系

**侧边菜单** (`components/sideMenu/`)：
- 全局导航，支持功能入口
- 通过 `showMenu` 控制显示/隐藏

**热力图日历** (`components/heatmapCalendar/`)：
- 年度笔记创作分布
- 颜色深度反映笔记得分
- 数据源：`365 天 * {date, count}` 数组

**云提示弹窗** (`components/cloudTipModal/`)：
- 通用操作提示组件

### 3.7 工具模块

**cloudbaseUtil.js**（318 行）：
完整封装了云数据库 CRUD + 分页 + 聚合操作：
- `query(collection, options)` — 条件查询，支持 where/orderBy/limit/skip
- `getById(collection, docId)` — 单条文档查询
- `add(collection, data)` — 自动添加 createTime/updateTime
- `update(collection, docId, data)` — 自动更新 updateTime
- `delete(collection, docId)` — 物理删除
- `updateBatch(collection, where, data)` — 批量更新
- `queryWithPagination(collection, options)` — 带总页数的分页查询
- `aggregate(collection, pipeline)` — 聚合管道

**sensitiveWordUtil.js**：
前端敏感词预检测工具，和云函数端共享敏感词字典。

**cacheUtil.js**：
本地缓存管理，封装 `saveXxxCache` / `getXxxCache` 模式。

---

## 4. 后端云函数详解

### 4.1 核心：replyToLetter 云函数（1,306 行）

**位置：** `cloudfunctions/replyToLetter/index.js`
**运行时：** Node.js 14，256MB 内存，60 秒超时
**关键依赖：** axios（HTTP 请求）、wx-server-sdk（云 SDK）
**环境变量：** `DEEPSEEK_API_KEY`

#### 4.1.1 请求类型分发（第 809 行入口）

云函数根据 `event.type` 分发到不同业务逻辑：

| type 值 | 功能 | 消耗 |
|---------|------|------|
| `undefined` + `mentor` | 单导师回信 | 1 张邮票 |
| `roundtable` | 圆桌会议 | 3 张邮票 |
| `incubator` | 思想孵化器 | 无（隐藏验证） |
| `structure_analysis` | 结构分析 | 无（隐藏验证） |
| `repairRoundtableOwnership` | 归属修复 | 无 |

#### 4.1.2 单导师回信流程

```
1. getMentorPrompt(mentor, mood, content)
   └── mood === "由AI推断"?
       ├── YES → getAIDeducedPrompt()（AI自主推断情绪）
       └── NO  → getOriginalPrompt()（使用历史 mood 数据）
2. callDeepSeekAPI(systemPrompt, content)
   └── 字数自适应配置 + 质量评分循环（最多 2 次重试）
   └── 失败 → generateSmartReply()（规则模板备用）
3. processReply(replyContent)
   └── 高敏内容 → 替换为合规提示
   └── 非高敏 → 保留原文
4. addAIDisclaimer(replyContent, mentorName)
   └── 追加 "以上内容为AI模拟{name}的回复"
5. 写入 letters 集合更新 replyContent/replyTime/qualityScore
```

**质量评分循环（第 1227-1255 行）：**
```javascript
while (retryCount <= maxRetries && (!qualityResult || !qualityResult.passed)) {
  replyContent = await callDeepSeekAPI(systemPrompt, content);
  qualityResult = evaluateReplyQuality(mentor, replyContent, content, mentorData, []);
  if (!qualityResult.passed && retryCount < maxRetries) {
    retryCount++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
// 全部失败 → 降级到 generateSmartReply()
```

#### 4.1.3 圆桌会议流程

```
1. sortMentorsByField(mentors, fieldOrder)
   └── 按领域排序：价值思维 → 创业创新 → 心理学 → 哲学
2. for each mentor (顺序执行，非并行):
   a. 获取导师数据 + 构建 systemPrompt
   b. 传入 previousReplies 用于去重
   c. callDeepSeekAPI() + 质量评分（最多 2 次重试）
   d. processReply() + addAIDisclaimer()
   e. 推入 discussions 数组
3. analyzeDiscussionStructure() — 分析共识/分歧
4. 写入 roundtable_discussions 集合
5. 扣 3 张邮票
```

**⚠️ 关键问题：** 圆桌不支持 `mood` 参数，所有导师使用 `'平和'` 心境。多导师**串行执行**，每个约 5-10 秒，3-5 位约 15-50 秒（受 DeepSeek API 响应速度影响）。

#### 4.1.4 思想孵化器流程

```
1. getIncubatorMentors(mentors)
   └── 默认：[查理·芒格, 张小龙, 荣格]（各领域取代表）
   └── 用户可自选最多 3 位
2. buildIncubatorDimensions()
   └── 5 个维度：想法内核 / 目标对象 / 关键假设 / 阻力与风险 / 最小验证路径
3. getIncubatorPrompt(content, mentors)
   └── 组装提示词，要求输出 6 个一级章节（含「未来7天行动清单」）
4. callDeepSeekAPI() — 超时和 stream abort 自动重试（降 max_tokens）
5. ensureIncubatorActionPlan(report)
   └── 检查是否包含「六、未来7天行动清单」
   └── 缺失 → append 默认 7 天行动计划
6. 写入 incubator_reports 集合
```

#### 4.1.5 结构分析流程

```
1. getStructureAnalysisConfig(analysisType)
   └── type='product' → 产品分析维度（天/人/地/结构/优化）
   └── type='company' → 公司分析维度（天/人/地/结构/洞察）
2. getStructureAnalysisPrompt(content, analysisType)
   └── 严格的格式要求：6 个固定标题 + ASCII 快照 + 3 条编号要点
3. callDeepSeekAPI() — 超时/abort 自动重试
4. ensureStructureAnalysisSummary(report, analysisType)
   └── 检查第六节完整性（是否有 3 条编号要点）
   └── 截断或缺失 → 替换为兜底内容
5. 写入 structure_analysis_reports 集合
```

#### 4.1.6 提示词架构（核心 AI 工程）

**导师数据来源：**
- 主数据源：`mentorRules_expanded.json`（21 位导师 + 4 领域 + moods 配置）
- 降级方案：`mentorRules.json`
- 每个导师包含：`persona`（人设）、`corePrinciples`（核心原则）、`thinkingFrameworks`（思考框架）、`commonQuestions`（常用问题）

**提示词结构（第 95-153 行）：**
```
【规则约束部分】→ 导师人设 + 核心原则
【重要约束 - 防止幻觉】→ 5 条 hard rule
【情绪推断指令】→ AI 自主判断用户情绪
【超详细自由发挥部分】→ 人设 + 5 个思考框架 + 6 个常用问题
【字数自适应要求】→ 根据 content 长度决定回复篇幅
```

**字数自适应策略（第 39-90 行）：**

| 用户内容长度 | 复杂度级别 | 回复字数 | max_tokens |
|------------|-----------|---------|-----------|
| < 100 字 | simple | 200 字 | 280 |
| 100-300 字 | medium | 200-300 字 | 400 |
| > 300 字 | complex | 400-500 字 | 650 |

截断机制：二分查找截断点 + 句号/感叹号/问号保持完整句。

#### 4.1.7 AI 回复质量评分（第 542-605 行）

```javascript
evaluateReplyQuality(mentorName, replyContent, userQuestion, mentorData, previousReplies)
```
评分维度：
- `personaMatch` (0-0.4)：回复是否匹配导师核心原则关键词
- `relevance` (0-0.3)：回复是否覆盖用户问题的关键字符
- `uniqueness` (0-0.2)：与之前导师回复的三元组重叠度（去重）
- `depth` (0-0.1)：回复长度 + 是否包含问号/叹号

阈值：`score >= 0.7` 才通过，否则重试。

#### 4.1.8 敏感词治理（第 21-29 行）

```
processReply(replyContent) → AI 回复后处理
  ├── sensitiveWordDetector.detect(replyContent)
  ├── isHighSensitive? → 替换为合规提示
  └── 通过 → 保留原文
```

敏感词检测三件套：
- 前端：`sensitiveWordUtil.js`（预检）
- 云函数端：`sensitiveWordDetector.js`（二次检测 + 回复替换）
- 独立云函数：`detectSensitiveWords` / `filterSensitiveWords` / `hasSensitiveWord`

**敏感词分级：**
- **高敏** → 阻止提交，或替换 AI 回复为合规提示
- **金融敏感** → 允许提交但添加风险提示
- **低敏** → 仅记录日志

#### 4.1.9 智能回复生成器（第 318-437 行）

当 DeepSeek API 彻底失败时的降级方案：
```javascript
generateSmartReply(mentor, mood, content)
```
- 硬编码 6 位导师的模板（查理·芒格、巴菲特、段永平、张小龙、乔布斯、马斯克）
- 其他导师回退到查理·芒格
- 从 opening/principles/advice 数组中随机选取拼接
- 简单关键词提取 + mood 语气调整

### 4.2 登录云函数

**文件：** `cloudfunctions/login/index.js`（36 行）

最简单的云函数，仅调用 `cloud.getWXContext()` 获取用户身份：
```javascript
return { code: 0, data: { openid, appid, unionid } };
```

小程序端通过 `wx.setStorageSync('openid', openid)` 持久化。

### 4.3 导师规则云函数

**文件：** `cloudfunctions/getMentorRules/index.js`

从 `mentorRules_expanded.json` 读取导师规则配置并返回。
前端缓存到本地存储（`saveMentorRulesCache`），减少重复请求。

---

## 5. 数据模型

### 5.1 集合总览

| 集合名称 | 用途 | 状态 |
|---------|------|------|
| `users` | 用户基本信息、邮票、统计 | ✅ |
| `letters` | 笔记/信件 + AI 回复 | ✅ |
| `roundtable_discussions` | 圆桌会议 + 多导师回复 | ✅ |
| `stampHistory` | 邮票购买/消费流水 | ✅ |
| `incubator_reports` | 思想孵化器报告 | ✅ (Phase 3) |
| `structure_analysis_reports` | 结构分析报告 | ✅ (Phase 3) |

### 5.2 核心文档结构

#### users
```
{
  _openid: string,        // 用户微信 openid
  stamps: number,          // 邮票余额（默认 2）
  totalPurchased: number,  // 累计购买
  totalLetters: number,    // 累计寄信
  nickName: string,        // 昵称
  avatarUrl: string,       // 头像
  lastLoginTime: date,
  createdAt: date
}
```

#### letters
```
{
  _openid: string,
  mentor: string,           // 导师名称
  mood: string,             // 用户心境（如"困惑"）
  content: string,          // 内容
  status: "pending"|"replied"|"saved"|"error",
  needReply: boolean,       // true=需回信, false=仅保存
  replyContent: string,     // AI 回复
  replyTime: date,
  replyExpectTime: number,  // 18h 后才可查看
  createTime: date,
  deleted: boolean,
  deleteTime: date,
  qualityScore: number,     // AI 回复质量评分
  qualityDetails: object,   // 各维度评分明细
  retryCount: number        // DeepSeek 重试次数
}
```

#### roundtable_discussions
```
{
  _openid: string,
  content: string,
  mentors: [string, ...],       // 选中的导师列表
  discussions: [{
    mentor: string,
    field: string,               // 所属领域
    reply: string,               // 该导师回复
    qualityScore: number,
    qualityDetails: object,
    retryCount: number,
    timestamp: number,
    contextSummary: object       // 已讨论上下文摘要
  }],
  structure: {                   // 讨论结构分析
    userQuestion: string,
    summary: string,
    consensusPoints: [string],
    disagreementPoints: [string],
    keyInsights: [string],
    mentors: [string]
  },
  totalCost: 3,                  // 圆桌固定扣 3 张
  createTime: date
}
```

#### incubator_reports
```
{
  _openid: string,
  content: string,           // 用户输入的想法
  mentors: [string],         // 参与分析的导师
  dimensions: [string],      // 5 个分析维度
  report: string,            // Markdown 格式报告
  status: "completed",
  createTime: date
}
```

#### structure_analysis_reports
```
{
  _openid: string,
  analysisType: "product"|"company",
  content: string,
  dimensions: [string],      // 分析维度
  report: string,            // Markdown 六章格式
  status: "completed",
  createTime: date
}
```

---

## 6. 项目规则与约束

### 6.1 开发规范

摘自 `.trae/rules/project_rules.md`：
- **保护现有原型**：渐进式升级，禁止一次性大规模重构
- **单次修改**：文件数 ≤ 5 个，代码行数 ≤ 200 行，影响模块 ≤ 1 个
- **禁止**：迁移 TypeScript、更换状态管理方案
- **代码风格**：2 空格缩进、分号必须、单引号、完整中文 docstring
- **Git 分支**：main → develop → feature/fix/docs

### 6.2 安全红线
- **用户数据隔离是绝对红线**：所有查询必须携带 `_openid` 过滤
- 云数据库权限：仅创建者可读写
- 云函数操作前必须校验 openid
- API Key 使用环境变量存储，禁止硬编码
- 用户输入必须经过敏感词检测

### 6.3 Git 提交格式
```
<type>(<scope>): <subject>
type: feat/fix/docs/style/refactor/test/chore
```

---

## 7. 已知问题与技术债务

### 7.1 前端
1. **热力图数据为模拟**：`Math.floor(Math.random() * 4)`，未接入真实笔记统计数据
2. **导师列表硬编码**：21 位导师出现在 3 个文件（write.js / roundtable.js / replyToLetter/index.js），修改时需同步
3. **fallbackToHardcoded 重复定义**：write.js 和 roundtable.js 各维护一份完全相同的 fallback 代码（约 30 行），未抽象为公共模块
4. **圆桌搜索混合过滤**：`filterLetters()` 同时过滤 letters 和 displayItems，函数名有误导性
5. **无网络请求失败重试**：页面级别的云函数调用没有重试机制（仅在云函数内部有重试）

### 7.2 后端
1. **圆桌串行执行**：3-5 位导师按顺序调用 DeepSeek API，总耗时 ≈ 位数 × 单次耗时（单次 5-10 秒）
2. **generateSmartReply 导师覆盖不全**：仅 6/21 位导师有模板，其余回退到芒格
3. **结构分析/孵化器超时敏感**：DeepSeek API 的 stream abort 错误在 30 秒超时时容易触发
4. **云函数无数据库事务**：扣邮票和写入讨论记录非原子操作

### 7.3 产品体验
1. **延迟回信 18 小时硬编码**：`replyExpectTime` 在 write.js 和 detail.js 中两次出现此常量
2. **无分页状态恢复**：从详情页返回首页时，滚动位置和搜索状态不保留
3. **回复质量评分可靠性**：基于字符串匹配的评分（关键词包含率）可能不准确

---

## 8. 部署与运维

### 8.1 环境依赖

| 环境 | 配置项 | 位置 |
|------|--------|------|
| 云函数 | DEEPSEEK_API_KEY | 云函数环境变量 |
| 小程序 | envList.js | miniprogram/envList.js |
| 云函数配置 | runtime/memory/timeout | 各云函数 config.json |

### 8.2 云函数列表

| 云函数名 | 暴露点 | 依赖 |
|---------|--------|------|
| login | wx.cloud.callFunction({name:'login'}) | wx-server-sdk |
| replyToLetter | wx.cloud.callFunction({name:'replyToLetter'}) | axios, wx-server-sdk, mentorRules.json |
| getMentorRules | wx.cloud.callFunction({name:'getMentorRules'}) | mentorRules_expanded.json |
| getMentors | wx.cloud.callFunction({name:'getMentors'}) | — |
| detectSensitiveWords | HTTP / 云函数调用 | sensitiveWords.json |

### 8.3 数据库集合

所有集合权限设置为「仅创建者可读写」，索引建议：
- `letters`：`_openid` + `createTime`（降序）复合索引
- `roundtable_discussions`：`_openid` + `createTime`（降序）复合索引
- `users`：`_openid` 唯一索引

### 8.4 部署步骤
1. 微信开发者工具导入项目
2. 创建云开发环境，记录环境 ID
3. 创建全部数据库集合
4. 右键云函数 → 「上传并部署：云端安装依赖」
5. 为 `replyToLetter` 配置 `DEEPSEEK_API_KEY`
6. 更新 `envList.js` 中的环境 ID
7. 编译预览

（详见 README.md 第 11-19 行）

---

## 9. 测试体系

### 9.1 测试文件

| 测试文件 | 覆盖内容 |
|---------|---------|
| scripts/tests/unit-tests.js | 核心工具函数 |
| scripts/tests/phase2-unit-tests.js | Phase 2 功能 |
| scripts/tests/replyToLetter-unit-tests.js | 云函数逻辑 |
| scripts/tests/integration-tests.js | 集成测试 |
| test-sensitive-words.js | 敏感词检测 |
| test_cloud_function.js | 云函数调用测试 |

### 9.2 运行方式
```bash
cd scripts && npm install && npm run test
```

### 9.3 项目规则检查
```bash
node scripts/checks/project-rules-check.js
```

---

## 10. 路线图与演进

### 10.1 已完成的 Phase
- Phase 1: 基础写信回信、登录、邮票系统 ✅
- Phase 2: 圆桌会议、缓存分页、敏感词治理、主题切换、夜间模式 ✅
- Phase 3: 思想孵化器 MVP、结构分析（产品+公司）✅

### 10.2 潜在未来方向
- 热力图接入真实数据
- 导师管理后台（增删改导师）
- 圆桌并行调用优化
- 回复质量评分算法改进
- 数据导出 / 分享能力
