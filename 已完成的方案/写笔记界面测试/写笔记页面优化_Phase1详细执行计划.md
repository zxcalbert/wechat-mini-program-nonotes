# 写笔记页面优化 - Phase 1 详细执行计划

**执行日期**：2026-03-01  
**阶段**：Phase 1 - 界面简化  
**预计周期**：6天（含缓冲）  
**关联文档**：
- 写笔记页面优化_项目启动前准备工作.md
- 写笔记页面优化_高优先级风险深入研究报告.md
- 写笔记页面优化_三阶段开发计划.md

---

## 一、Phase 1 目标与里程碑

### 1.1 核心目标

**界面简化，移除不必要的UI元素**

### 1.2 里程碑

| 里程碑 | 时间点 | 交付物 |
|--------|--------|-------|
| M1.1 | Day 2 | 任务1.1+1.2完成 |
| M1.2 | Day 4 | 任务1.3+1.4完成 |
| M1 | Day 6 | Phase 1验收通过 |

---

## 二、Phase 1 任务分解

### 2.1 任务1.1：移除心境选择功能

**优先级**：🔴 高  
**预计周期**：2天  
**负责角色**：前端开发

#### 2.1.1 任务说明

移除心境选择UI，让DeepSeek从内容推断情绪。

#### 2.1.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 移除moodOptions、selectedMood，移除selectMood、showMoodGuideHandler |
| write.wxml | 移除心境选择标签、心境说明按钮 |
| replyToLetter/index.js | 修改getMentorPrompt，mood为null/"由AI推断"时使用AI推断 |

#### 2.1.3 详细修改方案

**write.js 修改**：

```javascript
// 移除data中的mood相关字段
data: {
  mentors: ['查理·芒格', '巴菲特', '段永平', '张小龙', '乔布斯', '马斯克'],
  mentorIndex: 0,
  // 移除：moodOptions, selectedMood
  content: '',
  wordCount: 0,
  // ...
},

// 移除selectMood方法
// 移除showMoodGuideHandler方法

async doSubmit() {
  const mentor = this.data.needReply ? this.data.mentors[this.data.mentorIndex] : null;
  const mood = '由AI推断';  // ← 修改为固定值
  const content = this.data.content;
  // ...
}
```

**write.wxml 修改**：
```xml
<!-- 移除以下代码： -->
<!-- <view class="mood-tags">...</view> -->
<!-- <view class="guide-btn" bindtap="showMoodGuideHandler">...</view> -->
```

**replyToLetter/index.js 修改**：
```javascript
function getMentorPrompt(mentor, mood, content) {
  const mentorData = mentorRules.mentors[mentor] || mentorRules.mentors['查理·芒格'];
  
  // mood兼容处理
  let moodData;
  if (mood === null || mood === '由AI推断' || !mood) {
    // AI从内容推断情绪
    return getAIDeducedPrompt(mentorData, content);
  } else {
    // 历史数据 - 使用原mood逻辑
    moodData = mentorRules.moods[mood] || mentorRules.moods['平和'];
    return getOriginalPrompt(mentorData, moodData, content);
  }
}

function getAIDeducedPrompt(mentorData, content) {
  let prompt = `【规则约束部分】
你必须以${mentorData.persona}的身份回复，遵循以下核心原则：
`;
  mentorData.corePrinciples.forEach((principle) => {
    prompt += `${principle}\n`;
  });
  prompt += `
【重要】请根据用户的内容自动判断其情绪状态，并给予相应的回应。

用户内容：
${content}

请直接、具体地回复，200-500字。
`;
  return prompt;
}

function getOriginalPrompt(mentorData, moodData, content) {
  // 保持原有逻辑不变
  // ...
}
```

#### 2.1.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 心境选择UI | 完全移除，不显示4个心境标签 |
| 心境说明按钮 | 完全移除 |
| 新数据mood | 写入"由AI推断" |
| 云函数兼容 | mood为null/"由AI推断"时正常工作 |
| 历史数据 | mood为历史值时正常显示 |

---

### 2.2 任务1.2：移除规则说明弹窗

**优先级**：🔴 高  
**预计周期**：1天  
**负责角色**：前端开发

#### 2.2.1 任务说明

移除大师规则说明弹窗和心境规则说明弹窗，系统内部保留规则库。

#### 2.2.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 移除showMentorGuide、showMoodGuide、currentMentorGuide、currentMoodGuide，移除相关方法 |
| write.wxml | 移除大师说明按钮 |

#### 2.2.3 详细修改方案

**write.js 修改**：
```javascript
data: {
  // 移除：showMentorGuide, showMoodGuide, currentMentorGuide, currentMoodGuide
  // ...
},

// 移除：showMentorGuideHandler, showMoodGuideHandler, closeMentorGuide, closeMoodGuide
```

**write.wxml 修改**：
```xml
<!-- 移除以下代码： -->
<!-- <view class="guide-btn" bindtap="showMentorGuideHandler">...</view> -->
```

#### 2.2.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 大师说明按钮 | 完全移除 |
| 心境说明按钮 | 完全移除（已随任务1.1移除） |
| 规则库加载 | 继续加载（不展示） |
| AI回复质量 | 不受影响 |

---

### 2.3 任务1.3：移除字数统计显示

**优先级**：🔴 高  
**预计周期**：0.5天  
**负责角色**：前端开发

#### 2.3.1 任务说明

移除"当前字数：XXX"显示，保留wordCount字段用于数据分析。

#### 2.3.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 移除wordCount的setData（保留canSend逻辑，Phase 2会修改） |
| write.wxml | 移除字数统计footer |

#### 2.3.3 详细修改方案

**write.js 修改**：
```javascript
onInput(e) {
  this.setData({
    content: e.detail.value,
    // 移除：wordCount: e.detail.value.length
    // 保留canSend逻辑（Phase 2会修改）
    canSend: e.detail.value.length >= 100
  });
}
```

**write.wxml 修改**：
```xml
<!-- 移除以下代码： -->
<!-- <view class="footer">
  <text class="word-count">当前字数：{{wordCount}}</text>
</view> -->
```

#### 2.3.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 字数统计显示 | 完全移除 |
| wordCount字段 | 继续更新（不展示） |
| 输入功能 | 正常 |

---

### 2.4 任务1.4：选择"自己思考"时隐藏导师选择器

**优先级**：🔴 高  
**预计周期**：1天  
**负责角色**：前端开发

#### 2.4.1 任务说明

选择"自己思考"时隐藏导师选择器，选择"需要回信"时显示。

#### 2.4.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | needReply默认为false |
| write.wxml | 导师选择器添加wx:if="{{needReply}}"条件 |
| detail.js | 添加showMentor标志 |
| detail.wxml | 导师信息添加条件显示 |

#### 2.4.3 详细修改方案

**write.js 修改**（已有，确认即可）：
```javascript
data: {
  needReply: false,  // 默认"自己思考"
  // ...
}
```

**write.wxml 修改**：
```xml
<!-- 导师选择器：只在needReply=true时显示 -->
<view wx:if="{{needReply}}" class="selector-group">
  <picker bindchange="onMentorChange" value="{{mentorIndex}}" range="{{mentors}}">
    <view class="picker-item">
      <text class="picker-label">指引导师：</text>
      <text class="highlight">{{mentors[mentorIndex]}}</text>
      <text class="picker-arrow">▼</text>
    </view>
  </picker>
</view>
```

**detail.js 修改**：
```javascript
async loadLetterDetail(letterId) {
  // ...
  const letter = {
    ...result.data,
    displayDate: cloudbaseUtil.formatDateTime(result.data.createTime),
    statusLabel: this.getStatusLabel(result.data.status),
    canShowReply: canShowReply,
    showMentor: !!result.data.mentor  // ← 新增
  };
  
  const mentorLocation = result.data.mentor 
    ? mentorLocations[result.data.mentor] || '奥马哈' 
    : '';  // ← mentor为null时为空
  
  this.setData({ letter, mentorLocation });
}
```

**detail.wxml 修改**：
```xml
<!-- 只在showMentor为true时显示导师相关信息 -->
<view class="letter-header" wx:if="{{letter.showMentor}}">
  <text class="mentor-name">致：{{letter.mentor}}</text>
</view>

<!-- 回复签名部分 -->
<view class="reply-signature" wx:if="{{letter.showMentor}}">
  <text class="signature-text">—— {{letter.mentor}}</text>
</view>

<!-- 等待提示部分 -->
<view wx:elif="{{letter.needReply && letter.showMentor}}" class="waiting-hint">
  <icon type="waiting" size="18" color="#8b4513"/>
  <text> {{letter.mentor}}正在{{mentorLocation}}寓所研读，回信约在18小时内送达</text>
</view>
```

#### 2.4.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 默认状态 | "自己思考"，导师选择器隐藏 |
| 切换到"需要回信" | 导师选择器显示 |
| 切换回"自己思考" | 导师选择器隐藏 |
| 提交（自己思考） | mentor字段为null |
| 提交（需要回信） | mentor字段为选中的导师 |
| 详情页展示 | mentor为null时不显示导师信息 |

---

## 三、Phase 1 时间规划

### 3.1 详细时间表

| 时间 | 任务 | 交付物 |
|------|------|-------|
| **Day 1** | 准备工作：Git标签、邮票默认值统一、详情页优化 | 代码修改完成 |
| **Day 2** | 任务1.1：移除心境选择功能 | 任务1.1完成 |
| **Day 3** | 任务1.2：移除规则说明弹窗 | 任务1.2完成 |
| **Day 4** | 任务1.3：移除字数统计显示<br>任务1.4：隐藏导师选择器 | 任务1.3+1.4完成 |
| **Day 5** | Phase 1测试<br>Bug修复 | 测试通过 |
| **Day 6** | Phase 1验收<br>创建Git标签v1.0.0-phase1 | M1验收通过 |

---

## 四、Phase 1 验收标准

### 4.1 功能验收

| 验收项 | 验收标准 | 验收方法 |
|-------|---------|---------|
| 心境选择移除 | UI完全移除，AI可推断情绪 | 人工测试 + AI回复验证 |
| 规则说明移除 | 弹窗和按钮完全移除 | 人工测试 |
| 字数统计移除 | 显示完全移除 | 人工测试 |
| 导师选择器隐藏 | 条件显示正确 | 人工测试多种场景 |
| 功能完整性 | 核心功能正常 | 回归测试 |
| Git提交 | 符合规范 | 代码审查 |

### 4.2 质量验收

| 指标 | 目标值 |
|------|--------|
| 功能完整性 | 100% |
| UI显示正确 | 100% |
| 数据兼容性 | 100% |
| Bug数量 | ≤2个（非严重） |

---

## 五、风险监控

### 5.1 Phase 1 风险监控

| 风险 | 监控指标 | 预警阈值 | 应对措施 |
|------|---------|---------|---------|
| 数据兼容性问题 | 历史数据读取错误 | 出现1次 | 立即修复，必要时回滚 |
| UI显示Bug | UI显示异常 | 出现2个 | 快速修复 |
| 功能完整性 | 核心功能不可用 | 出现1个 | 立即修复，必要时回滚 |

---

## 六、回滚方案

### 6.1 回滚触发条件

| 触发条件 | 回滚范围 |
|---------|---------|
| 严重Bug > 3个 | Phase 1全部回滚 |
| 核心功能无法使用 | Phase 1全部回滚 |
| 数据兼容性问题 | Phase 1全部回滚 |

### 6.2 回滚标签

| 标签 | 说明 |
|------|------|
| `v1.0.0-pre-optimize` | 优化前的稳定版本（项目启动前创建） |
| `v1.0.0-phase1` | Phase 1完成后的稳定版本（验收后创建） |

---

**执行计划结束**

**日期**：2026-03-01  
**版本**：v1.0
