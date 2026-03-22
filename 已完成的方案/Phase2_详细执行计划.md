# Phase 2 详细执行计划

**执行日期**：2026-03-02  
**阶段**：Phase 2 - 功能优化  
**预计周期**：4天（Day 5-8）  
**关联文档**：
- 写笔记页面优化_三阶段开发计划.md
- Phase1_验收报告.md
- Phase1_测试报告.md

---

## 一、Phase 2 目标与里程碑

### 1.1 核心目标

**功能优化，完善交互逻辑**

### 1.2 里程碑

| 里程碑 | 时间点 | 交付物 |
|--------|--------|-------|
| M2.1 | Day 2 | 任务2.1+2.2完成 |
| M2.2 | Day 4 | 任务2.3+2.4完成 |
| M2 | Day 6 | Phase 2验收通过 |

---

## 二、Phase 2 任务分解

### 2.1 任务2.1：移除最小字数限制，添加空内容警告

**优先级**：🔴 高  
**预计周期**：2天  
**负责角色**：前端开发

#### 2.1.1 任务说明

移除最小字数限制（100字），添加空内容警告弹窗。

#### 2.1.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 移除canSend的字数限制，添加空内容警告逻辑 |
| write.wxml | 无需修改（UI不变） |

#### 2.1.3 详细修改方案

**write.js 修改**：

```javascript
// 移除data中的canSend的字数限制
data: {
  content: '',
  wordCount: 0,
  // 移除：canSend依赖字数检查
  canSend: true,  // 默认可发送
  // ...
},

onInput(e) {
  const wordCount = e.detail.value.length;
  this.setData({
    content: e.detail.value,
    wordCount: wordCount
    // 移除：canSend: wordCount >= 100
  });
},

async submitLetter() {
  const content = this.data.content.trim();
  
  // 空内容警告
  if (content.length &lt; 10) {
    wx.showModal({
      title: '内容较短',
      content: '您的内容较短，确定要保存吗？',
      confirmText: '继续保存',
      cancelText: '返回修改',
      success: (res) =&gt; {
        if (res.confirm) {
          this.doSubmit();
        }
      }
    });
    return;
  }
  
  // 原有的邮票检查、敏感词检查
  if (this.data.needReply &amp;&amp; this.data.userStamps === 0) {
    // ...
  }
  
  // 原有的敏感词检查
  const sensitiveCheck = this.checkSensitiveWords(this.data.content);
  if (!sensitiveCheck.canSubmit) {
    // ...
  }
  
  if (sensitiveCheck.message) {
    // ...
  } else {
    this.doSubmit();
  }
},
```

#### 2.1.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 最小字数限制 | 完全移除，无100字限制 |
| 空内容警告 | &lt;10字弹窗警告 |
| 用户选择 | 可选择"继续保存"或"返回修改" |
| 正常内容 | 直接提交，无弹窗 |

---

### 2.2 任务2.2：敏感词检测改为提交时检测

**优先级**：🟡 中  
**预计周期**：1天  
**负责角色**：前端开发

#### 2.2.1 任务说明

移除实时敏感词检测（输入时检测），改为提交时一次性检测。

#### 2.2.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 移除onInput中的实时敏感词检测 |

#### 2.2.3 详细修改方案

**write.js 修改**（已有，确认即可）：

```javascript
onInput(e) {
  const wordCount = e.detail.value.length;
  this.setData({
    content: e.detail.value,
    wordCount: wordCount
    // 移除：实时敏感词检测逻辑
  });
},
```

#### 2.2.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 实时检测 | 完全移除 |
| 提交时检测 | 正常工作 |
| 敏感词弹窗 | 检测到敏感词弹窗提示 |
| 投资敏感词 | 免责声明保留 |

---

### 2.3 任务2.3：邮票机制优化

**优先级**：🟡 中  
**预计周期**：1天  
**负责角色**：前端开发

#### 2.3.1 任务说明

邮票充足（&gt;1张）时，隐藏购买选项；邮票不足（&lt;=1张）时，显示购买选项。

#### 2.3.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| write.js | 无需修改（已有userStamps） |
| write.wxml | 邮票信息添加wx:if条件 |

#### 2.3.3 详细修改方案

**write.wxml 修改**：

```xml
&lt;!-- 邮票选择 --&gt;
&lt;view class="stamp-section"&gt;
  &lt;view class="stamp-title"&gt;📮 需要大师回信吗？&lt;/view&gt;
  &lt;view class="stamp-options"&gt;
    &lt;view class="stamp-option {{needReply === false ? 'selected' : ''}}" bindtap="selectNeedReply" data-need="{{false}}"&gt;
      &lt;text class="option-text"&gt;无需回复&lt;/text&gt;
      &lt;text class="option-desc"&gt;自己思考就好&lt;/text&gt;
    &lt;/view&gt;
    &lt;view class="stamp-option {{needReply === true ? 'selected' : ''}}" bindtap="selectNeedReply" data-need="{{true}}"&gt;
      &lt;text class="option-text"&gt;需要回信&lt;/text&gt;
      &lt;text class="option-desc"&gt;使用邮票 ({{userStamps}}/2)&lt;/text&gt;
    &lt;/view&gt;
  &lt;/view&gt;
  
  &lt;!-- 邮票警告/提示：只在邮票&lt;=1张时显示 --&gt;
  &lt;view wx:if="{{needReply &amp;&amp; userStamps &lt;= 1}}"&gt;
    &lt;view wx:if="{{userStamps === 0}}" class="warn-section"&gt;
      &lt;text class="warn-text"&gt;⚠️ 免费邮票已用完，需购买邮票才能获得大师回信&lt;/text&gt;
      &lt;button class="buy-stamps-btn" bindtap="buyStamps"&gt;购买邮票&lt;/button&gt;
    &lt;/view&gt;

    &lt;view wx:if="{{userStamps === 1}}" class="warn-section tip-section"&gt;
      &lt;text class="warn-text"&gt;💡 邮票即将用完（剩余1张），建议提前购买&lt;/text&gt;
      &lt;button class="buy-stamps-btn" bindtap="buyStamps"&gt;购买邮票&lt;/button&gt;
    &lt;/view&gt;
  &lt;/view&gt;

  &lt;view wx:if="{{needReply}}" class="reply-info"&gt;
    &lt;text class="info-title"&gt;回信说明：&lt;/text&gt;
    &lt;text class="info-text"&gt;• 每个用户拥有2张免费邮票&lt;/text&gt;
    &lt;text class="info-text"&gt;• 请求回信后，需等待18小时才能收到&lt;/text&gt;
    &lt;text class="info-text"&gt;• 这个机制可帮助你深入思考和写作&lt;/text&gt;
  &lt;/view&gt;
&lt;/view&gt;
```

#### 2.3.4 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 邮票&gt;1张 | 购买选项隐藏 |
| 邮票&lt;=1张 | 购买选项显示 |
| 邮票=0 | 警告显示 |
| 邮票=1 | 提示显示 |
| 侧边菜单 | 仍显示邮票数量 |

---

### 2.4 任务2.4：默认免费邮票改为2张

**优先级**：🟢 低  
**预计周期**：0.5天  
**负责角色**：前端开发

#### 2.4.1 任务说明

新用户默认免费邮票改为2张（Phase 1已完成）。

#### 2.4.2 需要修改的文件

| 文件 | 修改内容 |
|-----|---------|
| index.js | 已修改（Phase 1） |
| write.js | 已修改（Phase 1） |

#### 2.4.3 验收标准

| 验收项 | 验收标准 |
|-------|---------|
| 新用户默认 | 2张邮票 |
| 老用户数据 | 不受影响 |
| 邮票逻辑 | 正常 |

---

## 三、Phase 2 时间规划

### 3.1 详细时间表

| 时间 | 任务 | 交付物 |
|------|------|-------|
| **Day 1** | 任务2.1：移除最小字数限制，添加空内容警告 | 任务2.1完成 |
| **Day 2** | 任务2.2：敏感词检测改为提交时检测 | 任务2.2完成 |
| **Day 3** | 任务2.3：邮票机制优化&lt;br&gt;任务2.4：默认免费邮票改为2张 | 任务2.3+2.4完成 |
| **Day 4** | Phase 2测试&lt;br&gt;Bug修复 | 测试通过 |
| **Day 5** | Phase 2验收&lt;br&gt;创建Git标签v1.0.0-phase2 | M2验收通过 |

---

## 四、Phase 2 验收标准

### 4.1 功能验收

| 验收项 | 验收标准 | 验收方法 |
|-------|---------|---------|
| 字数限制移除 | 无最小字数限制 | 边界测试 |
| 空内容警告 | &lt;10字弹窗警告 | 人工测试 |
| 敏感词检测 | 提交时检测正常 | 敏感词测试用例 |
| 邮票优化 | 条件显示正确 | 多场景测试 |
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

### 5.1 Phase 2 风险监控

| 风险 | 监控指标 | 预警阈值 | 应对措施 |
|------|---------|---------|---------|
| 空内容警告体验差 | 用户反馈负面 | 出现3次 | 优化文案或移除警告 |
| 邮票显示Bug | UI显示异常 | 出现2个 | 快速修复 |
| 功能完整性 | 核心功能不可用 | 出现1个 | 立即修复，必要时回滚 |

---

## 六、回滚方案

### 6.1 回滚触发条件

| 触发条件 | 回滚范围 |
|---------|---------|
| 严重Bug &gt; 3个 | Phase 2全部回滚 |
| 核心功能无法使用 | Phase 2全部回滚 |
| 数据兼容性问题 | Phase 2全部回滚 |

### 6.2 回滚标签

| 标签 | 说明 |
|------|------|
| `v1.0.0-phase1` | Phase 1完成后的稳定版本 |
| `v1.0.0-phase2` | Phase 2完成后的稳定版本（验收后创建） |

---

**执行计划结束**

**日期**：2026-03-02  
**版本**：v1.0
