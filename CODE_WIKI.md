# 智慧笔记小程序 - 代码文档（Code Wiki）

**版本**: v2.1  
**更新日期**: 2026-05-04  
**适用范围**: 全栈开发团队

---

## 目录

1. [系统架构说明](#1-系统架构说明)
2. [模块划分](#2-模块划分)
3. [核心功能实现逻辑](#3-核心功能实现逻辑)
4. [关键算法说明](#4-关键算法说明)
5. [API 接口文档](#5-api-接口文档)
6. [数据模型定义](#6-数据模型定义)
7. [状态管理方案](#7-状态管理方案)
8. [常见问题解决方案](#8-常见问题解决方案)

---

## 1. 系统架构说明

### 1.1 整体架构

本项目采用**微信小程序 + 微信云开发**的全栈架构：

```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序前端                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  页面层   │ │ 组件层   │ │ 工具层   │ │ 状态层   │       │
│  │  pages/  │ │components│ │  utils/  │ │  app.js  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └─────────────┴─────────────┴─────────────┘            │
│                         │                                   │
│                    微信 API / WXML / WXSS                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                      微信云开发后端                          │
│  ┌──────────────────────┼──────────────────────┐           │
│  │     云函数层          │      数据库层         │           │
│  │  cloudfunctions/     │   云开发数据库        │           │
│  │  - replyToLetter     │   - letters          │           │
│  │  - getMentorRules    │   - users            │           │
│  │  - login             │   - roundtable_...   │           │
│  │  - hasSensitiveWord  │   - incubator_...    │           │
│  └──────────────────────┘   - structure_...    │           │
│                             └──────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │           第三方服务层                        │           │
│  │  - DeepSeek API (AI 分析引擎)                │           │
│  │  - 微信登录 / 支付                            │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生框架 | WXML + WXSS + JS |
| 后端服务 | 微信云开发 (CloudBase) | 云函数 + 云数据库 |
| AI 引擎 | DeepSeek API | 文本分析与生成 |
| 状态管理 | 原生 Storage + Page Data | 无外部状态管理库 |
| 构建工具 | 微信开发者工具 | 编译、预览、上传 |

### 1.3 分层规范

遵循 `project_rules.md` 的模块边界规范：

- **前端小程序**: 负责用户界面、用户交互、云函数调用
- **云函数层**: 负责业务逻辑处理、AI API 调用、数据库操作
- **数据层**: 负责数据存储、数据查询（云开发数据库）

---

## 2. 模块划分

### 2.1 前端页面模块

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| 登录页 | `pages/login/login` | 微信授权登录、隐私协议确认 |
| 首页 | `pages/index/index` | 笔记列表、搜索、热力图、浮动菜单 |
| 分析方法 | `pages/write/write` | 单维度分析方法选择、内容输入、提交分析 |
| 多维度分析 | `pages/roundtable/roundtable` | 多维度分析方法选择（3-5种）、内容输入 |
| 思想孵化器 | `pages/incubator/incubator` | 想法孵化、结构化报告生成 |
| 结构分析 | `pages/structureAnalysis/structureAnalysis` | 产品/公司结构分析 |
| 详情页 | `pages/detail/detail` | 笔记详情、分析结果展示 |
| 额度管理 | `pages/stamps/stamps` | 分析额度购买、使用记录 |
| 个人中心 | `pages/profile/profile` | 用户信息、设置、主题切换 |
| 回收站 | `pages/trash/trash` | 已删除笔记恢复 |
| 隐私政策 | `pages/privacy/privacy` | 隐私协议展示 |

### 2.2 云函数模块

| 云函数 | 路径 | 功能描述 |
|--------|------|----------|
| 回复生成 | `cloudfunctions/replyToLetter` | AI 分析核心引擎、DeepSeek API 调用 |
| 规则获取 | `cloudfunctions/getMentorRules` | 获取分析方法规则库 |
| 导师列表 | `cloudfunctions/getMentors` | 返回分析方法列表 |
| 登录 | `cloudfunctions/login` | 用户登录、注册、额度初始化 |
| 敏感词检测 | `cloudfunctions/hasSensitiveWord` | 基础敏感词检测 |
| 增强检测 | `cloudfunctions/detectSensitiveWords` | 增强版敏感词检测 |
| 内容过滤 | `cloudfunctions/filterSensitiveWords` | 敏感词内容过滤 |

### 2.3 工具模块

| 工具类 | 路径 | 功能描述 |
|--------|------|----------|
| 数据库工具 | `utils/cloudbaseUtil.js` | 封装云数据库 CRUD 操作 |
| 敏感词工具 | `utils/sensitiveWordUtil.js` | 前端敏感词检测 |
| 缓存工具 | `utils/cacheUtil.js` | 本地缓存管理（含分析方法规则缓存） |

---

## 3. 核心功能实现逻辑

### 3.1 分析方法选择功能

#### 3.1.1 数据结构

分析方法按**领域分组**，共 4 个领域、21 种方法：

```javascript
const METHOD_FIELDS = [
  { key: 'invest', name: '价值思维', icon: '💰',
    methods: ['多元思维模型分析', '价值投资分析框架', '安全边际分析'] },
  { key: 'startup', name: '创业创新', icon: '🚀',
    methods: ['本分经营分析', '极简产品分析', '创新设计分析', '第一性原理分析', '长期主义分析', '垄断竞争分析'] },
  { key: 'psychology', name: '心理学', icon: '🧠',
    methods: ['原型心理分析', '精神分析框架', '人本精神分析', '目的论分析', '需求层次分析'] },
  { key: 'philosophy', name: '哲学', icon: '📚',
    methods: ['道家思想分析', '儒家伦理分析', '苏格拉底式提问', '理念论分析', '幸福伦理学分析', '超人哲学分析', '语言哲学分析'] }
];
```

#### 3.1.2 选择逻辑

**单选模式**（分析方法页）：

```javascript
toggleMethod(e) {
  const method = e.currentTarget.dataset.method;
  const selectedMethodMap = { ...this.data.selectedMethodMap };

  if (selectedMethodMap[method]) {
    delete selectedMethodMap[method];
    this.setData({ selectedMethod: null, selectedMethodMap });
  } else {
    Object.keys(selectedMethodMap).forEach(k => delete selectedMethodMap[k]);
    selectedMethodMap[method] = true;
    this.setData({ selectedMethod: method, selectedMethodMap });
  }
  this.updateCanSend();
}
```

**多选模式**（多维度分析页、思想孵化器）：

```javascript
toggleMethod(e) {
  const method = e.currentTarget.dataset.method;
  let selectedMethods = [...this.data.selectedMethods];
  let selectedMethodsMap = { ...this.data.selectedMethodsMap };
  
  const index = selectedMethods.indexOf(method);
  if (index > -1) {
    selectedMethods.splice(index, 1);
    delete selectedMethodsMap[method];
  } else {
    if (selectedMethods.length >= maxCount) {
      wx.showToast({ title: `最多选择${maxCount}种分析方法`, icon: 'none' });
      return;
    }
    selectedMethods.push(method);
    selectedMethodsMap[method] = true;
  }
  
  this.setData({ selectedMethods, selectedMethodsMap });
}
```

#### 3.1.3 UI 渲染

统一使用**卡片式领域分组**布局：

```html
<view class="method-fields">
  <view wx:for="{{methodFields}}" wx:key="key" class="method-field">
    <view class="field-header">
      <text class="field-icon">{{item.icon}}</text>
      <text class="field-name">{{item.name}}</text>
    </view>
    <view class="method-tags">
      <view
        wx:for="{{item.methods}}"
        wx:for-item="method"
        wx:key="*this"
        class="method-tag {{selectedMethodMap[method] ? 'selected' : ''}}"
        data-method="{{method}}"
        bindtap="toggleMethod"
      >{{method}}</view>
    </view>
  </view>
</view>
```

### 3.2 AI 分析流程

#### 3.2.1 单维度分析流程

```
用户输入内容 → 选择分析方法 → 提交分析请求
    ↓
前端调用云函数 replyToLetter
    ↓
云函数组装提示词（getMentorPrompt）
    ↓
调用 DeepSeek API（callDeepSeekAPI）
    ↓
质量评估（evaluateReplyQuality）→ 不通过则重试（最多2次）
    ↓
添加 AI 免责声明（addAIDisclaimer）
    ↓
保存到数据库 → 返回结果给前端
```

#### 3.2.2 多维度分析流程

```
用户输入内容 → 选择3-5种分析方法 → 提交分析请求
    ↓
前端调用云函数 replyToLetter（type: 'roundtable'）
    ↓
云函数按领域排序方法（sortMentorsByField）
    ↓
循环调用 DeepSeek API 为每种方法生成分析
    ↓
质量评估 + 重试机制
    ↓
分析讨论结构（analyzeDiscussionStructure）
    ↓
保存到 roundtable_discussions 集合
    ↓
扣除额度 → 返回结果
```

#### 3.2.3 思想孵化器流程

```
用户输入初始想法 → 选择1-3种分析方法 → 生成孵化报告
    ↓
前端调用云函数 replyToLetter（type: 'incubator'）
    ↓
组装孵化器专用提示词（getIncubatorPrompt）
    ↓
调用 DeepSeek API
    ↓
确保包含行动清单（ensureIncubatorActionPlan）
    ↓
保存到 incubator_reports 集合
    ↓
返回结构化报告
```

### 3.3 额度管理逻辑

#### 3.3.1 额度规则

- 新用户默认额度：**2 次**
- 单维度分析消耗：**1 次/次**
- 多维度分析消耗：**3 次/次**
- 每日分析上限：**6 次**（needReply 为 true 的 letters）
- 思想孵化器/结构分析：**不消耗额度**（独立计费）

#### 3.3.2 额度检查流程

```javascript
async submitLetter() {
  // 1. 检查是否需要分析
  if (!needReply) { /* 仅保存笔记 */ return; }
  
  // 2. 检查额度是否充足
  if (userStamps < 1) {
    wx.showModal({ title: '额度不足', content: '...' });
    return;
  }
  
  // 3. 检查每日限额
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const count = await db.collection('letters').where({
    _openid: openid, createTime: db.command.gte(today), needReply: true
  }).count();
  
  if (count.total >= 6) {
    wx.showModal({ title: '每日分析次数已用完', ... });
    return;
  }
  
  // 4. 执行提交
  this.doSubmit();
}
```

---

## 4. 关键算法说明

### 4.1 字数自适应引擎

根据用户输入内容长度，自动调整 AI 回复字数：

```javascript
const wordCountConfig = {
  simple: { min: 200, max: 200, maxTokens: 280, label: '简单' },
  medium: { min: 200, max: 300, maxTokens: 400, label: '中等' },
  complex: { min: 400, max: 500, maxTokens: 650, label: '复杂' }
};

function estimateComplexity(userContent) {
  const length = userContent.length;
  if (length < 100) return 'simple';
  if (length > 300) return 'complex';
  return 'medium';
}
```

### 4.2 中文分词字数统计

```javascript
function countChineseWords(text) {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + Math.round(englishWords.length * 1.5);
}
```

### 4.3 二分截断算法

确保 AI 回复不超过最大字数限制：

```javascript
function truncateByChineseWords(text, maxWords) {
  let low = 0, high = text.length;
  let best = text.substring(0, Math.floor(text.length * 0.7));
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.substring(0, mid);
    const count = countChineseWords(candidate);
    
    if (count <= maxWords) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // 在最后一个标点处截断
  const lastPunc = Math.max(
    best.lastIndexOf('。'),
    best.lastIndexOf('！'),
    best.lastIndexOf('？')
  );
  return lastPunc > 0 ? best.substring(0, lastPunc + 1) : best;
}
```

### 4.4 回复质量评估算法

从四个维度评估 AI 回复质量：

```javascript
function evaluateReplyQuality(mentorName, replyContent, userQuestion, mentorData, previousReplies = []) {
  let score = 0;
  const details = { methodologyFidelity: 0, relevance: 0, uniqueness: 0, depth: 0 };

  // 1. 方法论保真度（40%）
  const corePrinciples = mentorData?.corePrinciples || [];
  let matchCount = 0;
  for (const principle of corePrinciples) {
    const keywords = principle.substring(0, 10);
    if (replyContent.includes(keywords)) matchCount++;
  }
  details.methodologyFidelity = Math.min(0.4, 0.2 + matchCount * 0.05);
  score += details.methodologyFidelity;

  // 2. 相关性（30%）
  const questionKeywords = userQuestion.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20);
  let relevanceCount = 0;
  for (let i = 0; i < questionKeywords.length; i++) {
    if (replyContent.includes(questionKeywords[i])) relevanceCount++;
  }
  details.relevance = Math.min(0.3, 0.15 + relevanceCount * 0.02);
  score += details.relevance;

  // 3. 独特性（20%）
  if (previousReplies.length > 0) {
    // 计算与之前回复的重复度
    let overlapCount = 0;
    const replyWords = replyContent.replace(/[^\u4e00-\u9fa5]/g, '');
    for (const prev of previousReplies) {
      const prevWords = prev.replace(/[^\u4e00-\u9fa5]/g, '');
      for (let i = 0; i < replyWords.length - 2; i++) {
        const gram = replyWords.substring(i, i + 3);
        if (prevWords.includes(gram)) overlapCount++;
      }
    }
    details.uniqueness = Math.max(0, 0.2 - overlapCount * 0.01);
  } else {
    details.uniqueness = 0.2;
  }
  score += details.uniqueness;

  // 4. 深度（10%）
  const lengthScore = Math.min(0.1, replyContent.length * 0.0005);
  const hasQuestions = replyContent.includes('?') || replyContent.includes('？');
  details.depth = lengthScore + (hasQuestions ? 0.03 : 0);
  score += details.depth;

  return { score: Math.min(1, Math.max(0, score)), details, passed: score >= 0.7 };
}
```

---

## 5. API 接口文档

### 5.1 云函数接口

#### 5.1.1 replyToLetter

**功能**: AI 分析核心引擎

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 请求类型: 'roundtable' / 'incubator' / 'structure_analysis' |
| content | string | 条件 | 用户输入内容（type 为 incubator/structure_analysis 时必填） |
| mentor | string | 条件 | 分析方法名称（单维度分析时必填） |
| mentors | array | 条件 | 分析方法数组（多维度分析时必填） |
| mood | string | 否 | 用户情绪状态，默认 '由AI推断' |
| letterId | string | 条件 | 笔记 ID（保存回复时必填） |
| analysisType | string | 否 | 结构分析类型: 'product' / 'company' |

**响应数据**:

```javascript
{
  success: true,
  data: {
    replyLength: 1234,      // 回复长度
    qualityScore: 0.85,     // 质量评分
    roundtableId: 'xxx',    // 多维度分析 ID
    remainingStamps: 1,     // 剩余额度
    report: '...',          // 孵化器/结构分析报告
    mentors: ['...'],       // 使用的方法
    dimensions: ['...']     // 分析维度
  }
}
```

#### 5.1.2 getMentorRules

**功能**: 获取分析方法规则库

**响应数据**:

```javascript
{
  success: true,
  data: {
    mentors: {
      '多元思维模型分析': {
        corePrinciples: ['...'],
        thinkingFrameworks: ['...'],
        commonQuestions: ['...']
      }
    },
    moods: {
      '平和': { tone: '...', focus: '...', keyPoints: ['...'] }
    }
  }
}
```

#### 5.1.3 login

**功能**: 用户登录注册

**响应数据**:

```javascript
{
  success: true,
  data: {
    openid: 'xxx',
    userInfo: { ... },
    stamps: 2
  }
}
```

### 5.2 数据库集合

| 集合名 | 用途 | 核心字段 |
|--------|------|----------|
| letters | 用户笔记 | content, mentor, status, needReply, replyContent |
| users | 用户信息 | openid, stamps, userInfo |
| roundtable_discussions | 多维度分析 | content, mentors, discussions, structure |
| incubator_reports | 孵化器报告 | content, mentors, report, dimensions |
| structure_analysis_reports | 结构分析报告 | content, analysisType, report, dimensions |

---

## 6. 数据模型定义

### 6.1 Letter（笔记）

```javascript
{
  _id: string,              // 文档 ID
  _openid: string,          // 用户 OpenID
  content: string,          // 笔记内容
  mentor: string,           // 分析方法名称
  mood: string,             // 情绪状态
  type: string,             // 记录类型: 'letter' / 'roundtable' / 'incubator' / 'structure'
  displayMethod: string,    // 显示用分析方法名（detail.js 中根据 methodNameMap 计算，兼容旧数据）
  status: string,           // 状态: pending / replied / read / saved / error
  needReply: boolean,       // 是否需要 AI 分析
  replyContent: string,     // AI 回复内容
  replyTime: Date,          // 回复时间
  replyExpectTime: number,  // 预期查看时间（18小时后）
  createTime: Date,         // 创建时间
  deleted: boolean,         // 是否删除
  deleteTime: number        // 删除时间
}
```

### 6.2 Roundtable Discussion（多维度分析）

```javascript
{
  _id: string,
  _openid: string,
  content: string,          // 用户输入内容
  mentors: string[],        // 选择的分析方法
  discussions: [{
    mentor: string,         // 方法名称
    field: string,          // 所属领域
    reply: string,          // AI 回复
    qualityScore: number,   // 质量评分
    retryCount: number      // 重试次数
  }],
  structure: {              // 讨论结构分析
    consensusPoints: string[],
    disagreementPoints: string[],
    keyInsights: string[]
  },
  totalCost: number,        // 消耗额度
  createTime: Date
}
```

### 6.3 Incubator Report（孵化器报告）

```javascript
{
  _id: string,
  _openid: string,
  content: string,          // 初始想法
  mentors: string[],        // 分析方法
  dimensions: string[],     // 分析维度
  report: string,           // 结构化报告
  status: string,           // completed
  createTime: Date
}
```

---

## 7. 状态管理方案

### 7.1 全局状态

使用 `app.js` 的 `globalData` 管理全局状态：

```javascript
App({
  globalData: {
    themeMode: 'system',      // 主题模式: system / light / dark
    sessionStartTime: null    // 使用时长计时起点
  }
});
```

### 7.2 页面状态

每个页面通过 `Page({ data: {} })` 管理本地状态，关键状态：

| 页面 | 关键状态 | 说明 |
|------|----------|------|
| write | selectedMethod, selectedMethodMap, content, canSend | 方法选择、内容、提交状态 |
| roundtable | selectedMethods, selectedMethodsMap, content, canSubmit | 多选方法、内容、提交状态 |
| incubator | selectedMethods, selectedMethodMap, idea, loading, report | 孵化器状态 |
| index | letters, displayItems, userStamps, showSearch | 列表、搜索、额度 |

### 7.3 本地存储

| 键名 | 用途 | 类型 |
|------|------|------|
| openid | 用户身份标识 | string |
| userInfo | 用户信息 | object |
| themeMode | 主题模式 | string |
| sessionStartTime | 使用时长计时 | number |
| mentorRulesCache | 分析方法规则缓存 | object |
| recentRoundtableIds | 最近多维度分析 ID | array |
| letters_{openid}_{page} | 笔记分页缓存 | object |

---

## 8. 常见问题解决方案

### 8.1 真机调试超时（fork process timeout）

**问题**: 项目过大导致真机调试超时  
**解决**:
1. 清理 `node_modules` 中不必要的依赖
2. 优化 `project.config.json`，排除大文件目录
3. 清除微信开发者工具缓存

### 8.2 AI 回复质量不稳定

**问题**: DeepSeek API 回复质量波动  
**解决**:
1. 质量评估算法自动重试（最多2次）
2. 失败时回退到基于规则的智能回复生成器
3. 字数自适应引擎控制回复长度

### 8.3 额度并发扣除问题

**问题**: 多维度分析扣除额度时可能出现并发冲突  
**解决**:
1. 云函数端原子操作扣除额度
2. 前端显示剩余额度时从服务器重新获取
3. 额度不足时提前拦截，避免无效请求

### 8.4 敏感词检测

**问题**: 用户输入包含敏感内容  
**解决**:
1. 前端预检测（sensitiveWordUtil.js）
2. 云函数二次检测（sensitiveWordDetector.js）
3. 分级处理：高敏感拦截、金融词汇提示免责声明

### 8.5 数据兼容性

**问题**: 历史数据字段变更  
**解决**:
1. 旧数据 `mentor` 字段兼容（存储分析方法名称）
2. 旧数据 `mood` 字段兼容（默认 '由AI推断'）
3. 云函数端自动修复归属（repairRoundtableOwnership）

### 8.6 合规改造进度（对照 DEVELOPMENT_PLAN Phase 0）

**已完成：**
✅ 前端文案去拟人化：所有 wxml/js 中无"导师""写信""回信""大师""邮票"等词汇
✅ 前端分析方法选择器：METHOD_FIELDS 使用分析方法名（21种方法，4个领域）
✅ 云函数提示词去拟人化：getAIDeducedPrompt/getOriginalPrompt 已添加合规约束
✅ AI 免责声明：detail.wxml、roundtableResult.wxml、incubatorResult.wxml、structureAnalysisResult.wxml 均有
✅ mentorRules.json：已改为分析方法名（methodology 字段替换 persona 字段）
✅ 2小时使用时长提醒：app.js 中 startUsageTimer/checkUsageTime
✅ 数据导出功能：profile.js 中 exportAllData
✅ 隐私政策更新：privacy.wxml 包含 AI 服务说明、数据权利、使用时长提醒条款
✅ 旧数据兼容：detail.js 中 methodNameMap 将旧导师名映射为新分析方法名
✅ 状态映射：detail.js getStatusLabel 将 pending→分析中, replied→已完成

**未完成：**
❌ mentorRules_expanded.json 仍保留拟人化数据（persona 字段、人名作为 key）
❌ 云函数 getMentorPrompt 中 fallback 仍为"查理·芒格"而非分析方法名
❌ 缺少 reportContent 云函数（举报内容功能）
❌ sideMenu 缺少"一键退出"按钮
❌ 数据字段名未迁移：仍用 mentor（非 method）、status 仍用 pending/replied（非 analyzing/completed）

---

## 附录 A: 文件变更记录

### v2.0 UI 统一化改造（2026-05-02）

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `pages/write/write.wxss` | 重写 | 统一为 incubator 暖色调风格 |
| `pages/write/write.wxml` | 重构 | 卡片式分析方法选择器 |
| `pages/write/write.js` | 重构 | METHOD_FIELDS 常量、toggleMethod 单选逻辑 |
| `pages/roundtable/roundtable.wxss` | 重写 | 统一为 incubator 暖色调风格 |
| `pages/roundtable/roundtable.wxml` | 重构 | 统一布局结构 |
| `pages/incubator/incubator.wxss` | 修改 | 类名统一 method-* |
| `pages/incubator/incubator.wxml` | 修改 | 类名统一、添加 eyebrow |
| `pages/incubator/incubator.js` | 修改 | data-name → data-method |

### v2.0 合规改造（2026-04-26）

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `cloudfunctions/replyToLetter/index.js` | 修改 | 提示词去拟人化、添加 AI 免责声明 |
| `cloudfunctions/replyToLetter/mentorRules.json` | 修改 | 21位导师 → 21种分析方法 |
| `miniprogram/app.js` | 修改 | 2小时使用时长提醒 |
| `pages/privacy/privacy.wxml` | 修改 | 隐私政策更新 |

### v2.1 代码审计更新（2026-05-04）

| 变更范围 | 说明 |
|----------|------|
| CODE_WIKI 审计 | 对照代码库实际状态进行全面校对更新 |
| 云函数列表补全 | 新增 detectSensitiveWords、filterSensitiveWords、getMentors |
| 合规改造进度 | 新增 8.6 节，记录 Phase 0 合规改造完成情况 |
| 已知问题 | 记录 mentorRules_expanded.json 拟人化残留等问题 |

---

*本文档由工程化 Vibe Coding 全栈研发架构师自动生成，如有疑问请联系开发团队。*
