# Phase 1 建议项分析与实施计划

**文档版本**：v1.0  
**创建日期**：2026-02-28  
**关联文档**：
- Phase1_测试报告.md
- 方案三融合与优化_详细开发计划.md

---

## 一、建议项系统性分析

### 1.1 建议一：规则库内容优化

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| 技术可行性 | 🟢 高 | 纯内容调整，无需架构改动 |
| 实施复杂度 | 🟢 低 | 只需修改JSON文件 |
| 资源需求 | 🟢 低 | 1-2人天 |
| 与现有系统兼容性 | 🟢 完全兼容 | 规则库JSON格式不变 |
| 潜在技术债务 | 🟢 无 | 纯内容调整 |
| 业务影响 | 🟡 中 | 用户体验提升 |

**技术实现难度**: 🟢 低

**采纳建议**：✅ 采纳，作为Phase 2迭代优化项

---

### 1.2 建议二：前端动态读取

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| 技术可行性 | 🟢 高 | 微信小程序支持云函数调用或本地文件读取 |
| 实施复杂度 | 🟡 中 | 需要云函数API + 前端缓存机制 |
| 资源需求 | 🟡 中 | 2-3人天 |
| 与现有系统兼容性 | 🟢 完全兼容 | mentorRules.json已就绪 |
| 潜在技术债务 | 🟡 低 | 需处理网络请求异常处理 |
| 业务影响 | 🔴 高 | 规则库可热更新，无需发版即可更新说明 |

**技术实现难度**: 🟡 中等

**采纳建议**：✅ 采纳，作为Phase 2优先实施项

---

### 1.3 建议三：添加缓存机制

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| 技术可行性 | 🟢 高 | 微信小程序Storage API支持 |
| 实施复杂度 | 🟢 低 | wx.setStorageSync/wx.getStorageSync |
| 资源需求 | 🟢 低 | 0.5人天 |
| 与现有系统兼容性 | 🟢 完全兼容 | 独立模块，不影响现有逻辑 |
| 潜在技术债务 | 🟢 无 | 简单的缓存逻辑 |
| 业务影响 | 🟢 低 | 减少网络请求，提升体验 |

**技术实现难度**: 🟢 低

**采纳建议**：✅ 采纳，作为Phase 2实施项

---

## 二、采纳建议实施计划

### 2.1 建议二：前端动态读取（优先级：🔴 高）

#### 实施步骤

| 步骤 | 任务 | 时间 | 责任人 |
|-----|------|------|------|
| **2.1.1 | 创建云函数getMentorRules | 0.5h | 后端 |
| **2.1.2 | 前端调用云函数 | 1h | 前端 |
| **2.1.3 | 本地缓存机制 | 0.5h | 前端 |
| **2.1.4 | 测试验证 | 0.5h | 全团队 |

#### 技术方案

**云函数实现 (`cloudfunctions/getMentorRules/index.js`:

```javascript
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const mentorRules = require('./mentorRules.json');
  return {
    success: true,
    data: mentorRules
  };
};
```

**前端实现 (`miniprogram/pages/write/write.js`:

```javascript
Page({
  data: {
    mentorRules: null,
    showMentorGuide: false,
    showMoodGuide: false,
    currentMentorGuide: '',
    currentMoodGuide: ''
  },

  onLoad() {
    this.loadMentorRules();
  },

  loadMentorRules() {
    const cached = wx.getStorageSync('mentorRules');
    if (cached) {
      this.setData({ mentorRules: cached });
      return;
    }

    wx.cloud.callFunction({
      name: 'getMentorRules',
      success: (res) => {
        if (res.result.success) {
          const rules = res.result.data;
          this.setData({ mentorRules: rules });
          wx.setStorageSync('mentorRules', rules);
        }
      },
      fail: (err) => {
        console.error('加载规则库失败:', err);
      }
    });
  },

  formatMentorGuide(mentorName) {
    const rules = this.data.mentorRules;
    if (!rules || !rules.mentors[mentorName]) return '';

    const mentor = rules.mentors[mentorName];
    let guide = `核心原则：\n`;
    mentor.corePrinciples.forEach((principle, idx) => {
      guide += `${principle}\n`;
    });
    return guide;
  },

  showMentorGuideHandler() {
    const selectedMentor = this.data.mentors[this.data.mentorIndex];
    const guide = this.formatMentorGuide(selectedMentor);
    this.setData({
      showMentorGuide: true,
      currentMentorGuide: guide
    });
  },

  formatMoodGuide(moodName) {
    const rules = this.data.mentorRules;
    if (!rules || !rules.moods[moodName]) return '';

    const mood = rules.moods[moodName];
    let guide = `当前心境：${moodName}\n\n建议：${mood.tone}\n\n关键点：\n`;
    mood.keyPoints.forEach((point) => {
      guide += `${point}\n`;
    });
    return guide;
  },

  showMoodGuideHandler() {
    const guide = this.formatMoodGuide(this.data.selectedMood);
    this.setData({
      showMoodGuide: true,
      currentMoodGuide: guide
    });
  }
});
```

---

### 2.2 建议三：添加缓存机制（优先级：🟢 低）

#### 实施步骤

| 步骤 | 任务 | 时间 | 责任人 |
|-----|------|------|------|
| **2.2.1 | 实现本地缓存 | 0.5h | 前端 |
| **2.2.2 | 缓存过期机制 | 0.2h | 前端 |
| **2.2.3 | 测试验证 | 0.3h | 全团队 |

#### 技术方案

**缓存实现 (`miniprogram/utils/cacheUtil.js`):

```javascript
const CACHE_KEY = 'mentorRules';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

function saveMentorRulesCache(data) {
  wx.setStorageSync(CACHE_KEY, {
    data,
    timestamp: Date.now()
  });
}

function getMentorRulesCache() {
  const cached = wx.getStorageSync(CACHE_KEY);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_EXPIRE) {
    return null;
  }
  return cached.data;
}

module.exports = {
  saveMentorRulesCache,
  getMentorRulesCache
};
```

---

### 2.3 建议一：规则库内容优化（优先级：🟡 中）

#### 实施步骤

| 步骤 | 任务 | 时间 | 责任人 |
|-----|------|------|------|
| **2.3.1 | 收集用户反馈 | 持续 | 产品 |
| **2.3.2 | 迭代规则内容 | 按需 | 后端 |
| **2.3.3 | 规则库更新 | 按需 | 后端 |

---

## 三、Phase 2 开发计划更新

### 3.1 时间安排更新

| 阶段 | 原时间 | 更新后时间 |
|-----|-------|-------|
| **Phase 2** | Day 2 | Day 2 |
| | 09:00-11:00 | 剩余4位大师规则定义 |
| | 11:00-12:00 | 4种心境规则定义 |
| | 14:00-15:00 | 前端动态读取（新增） |
| | 15:00-16:00 | 超详细提示词组装器 |
| | 16:00-17:00 | 字数自适应引擎 |
| | 17:00-18:00 | 测试验证 |

### 3.2 任务分解更新

新增任务：

#### 任务2.5：前端动态读取规则库

**修改文件**：
- `cloudfunctions/getMentorRules/index.js`
- `miniprogram/pages/write/write.js`
- `miniprogram/utils/cacheUtil.js`

**验收标准**：
- ✅ 云函数返回规则库JSON
- ✅ 前端调用云函数
- ✅ 本地缓存机制
- ✅ 异常处理完整

---

## 四、风险评估与应对

| 风险 | 等级 | 应对策略 |
|-----|------|---------|
| 云函数调用失败 | 🟡 中 | 降级到硬编码备用方案 |
| 缓存过期导致体验差 | 🟢 低 | 缓存过期时间设置为7天 |
| 规则库内容迭代频繁 | 🟡 中 | 版本控制，按需更新 |

---

**文档结束**
