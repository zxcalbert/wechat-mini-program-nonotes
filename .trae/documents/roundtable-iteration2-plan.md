# 圆桌会议迭代2实施计划

**计划日期**: 2026-04-04  
**执行周期**: Week 7-8 (2026-04-17 ~ 2026-04-30)  
**目标版本**: v2.0.0-alpha.2

---

## 一、当前状态分析

### 迭代1已完成
- ✅ 前端页面 `/pages/roundtable/` 完整实现
- ✅ 导师多选组件（3-5位，按领域分组）
- ✅ 内容输入和基础验证
- ✅ 功能开关配置

### 当前问题
- ❌ 提交后仅显示"功能开发中"弹窗，无实际功能
- ❌ 未实现多导师回复逻辑
- ❌ 未实现上下文传递
- ❌ 未实现邮票扣除

---

## 二、迭代2目标

### 核心目标
扩展 `replyToLetter` 云函数，支持多导师圆桌会议模式。

### 具体任务
1. **云函数扩展**: 新增 `type=roundtable` 参数支持
2. **上下文机制**: 开发上下文摘要，压缩前文关键信息
3. **回复顺序**: 实现按领域顺序回复（价值思维 → 创业创新 → 心理学 → 哲学）
4. **邮票规则**: 圆桌会议消耗3张邮票（单导师消耗1张）

---

## 三、技术方案

### 3.1 云函数接口扩展

**现有接口**:
```javascript
// 单导师模式
{
  mentor: "查理·芒格",
  content: "用户信件内容",
  mood: "confused"  // 可选
}
```

**新增圆桌会议模式**:
```javascript
// 多导师模式
{
  type: "roundtable",
  mentors: ["查理·芒格", "巴菲特", "段永平"],  // 3-5位
  content: "用户问题内容",
  previousContext: null  // 第一轮为null，后续为摘要
}

// 返回格式
{
  success: true,
  data: {
    roundtableId: "unique-id",
    discussions: [
      {
        mentor: "查理·芒格",
        field: "investment",
        reply: "导师回复内容",
        timestamp: 1234567890,
        contextSummary: "本轮讨论摘要"
      }
    ],
    totalCost: 3,  // 消耗邮票数
    remainingStamps: 5  // 剩余邮票
  }
}
```

### 3.2 上下文摘要机制

**摘要内容**:
```javascript
{
  // 用户原始问题
  userQuestion: "用户问题摘要（前100字）",
  
  // 已讨论导师的核心观点
  discussedMentors: [
    {
      mentor: "查理·芒格",
      coreViewpoint: "核心观点摘要（50字内）",
      stance: "agree" | "disagree" | "neutral"  // 与用户立场关系
    }
  ],
  
  // 已形成的共识点
  consensusPoints: ["共识点1", "共识点2"],
  
  // 已出现的分歧点
  disagreementPoints: ["分歧点1", "分歧点2"],
  
  // 建议下一位导师关注的重点
  focusForNext: "下一位导师应重点回应的问题"
}
```

**摘要生成方式**:
1. 第一轮：用户问题原文（无需摘要）
2. 后续轮次：从上一轮导师回复中提取关键信息
3. 使用规则提取 + 轻量级NLP（可选）

### 3.3 回复顺序逻辑

**领域顺序定义**:
```javascript
const fieldOrder = [
  { field: "investment", name: "价值思维", color: "#8b4513" },
  { field: "entrepreneurship", name: "创业创新", color: "#2ecc71" },
  { field: "psychology", name: "心理学", color: "#9b59b6" },
  { field: "philosophy", name: "哲学", color: "#34495e" }
];
```

**排序逻辑**:
1. 根据用户选择的导师，按领域分组
2. 按 `fieldOrder` 定义的顺序依次回复
3. 同一领域内有多个导师时，按默认顺序或随机顺序

**示例**:
用户选择：查理·芒格（investment）、段永平（entrepreneurship）、荣格（psychology）
回复顺序：
1. 查理·芒格（investment）
2. 段永平（entrepreneurship）
3. 荣格（psychology）

### 3.4 邮票消耗逻辑

**现有逻辑**:
- 单导师回复：消耗1张邮票

**新增圆桌会议逻辑**:
- 圆桌会议：消耗3张邮票（固定）

**实现位置**:
1. 前端验证：`roundtable.js` 中检查 `userStamps >= 3`
2. 后端扣减：`replyToLetter` 云函数中扣除邮票

**代码示例**:
```javascript
// 扣减邮票
async function deductStamps(openid, amount) {
  const db = cloud.database();
  await db.collection('users').where({
    _openid: openid
  }).update({
    data: {
      stamps: db.command.inc(-amount)
    }
  });
}
```

---

## 四、修改范围

### 4.1 修改文件清单（符合≤5个文件限制）

| 序号 | 文件路径 | 修改类型 | 修改内容 |
|------|----------|----------|----------|
| 1 | `cloudfunctions/replyToLetter/index.js` | 修改 | 新增 `type=roundtable` 参数支持，实现多导师顺序回复逻辑 |
| 2 | `miniprogram/pages/roundtable/roundtable.js` | 修改 | 替换"功能开发中"弹窗，实现实际提交逻辑，调用新版云函数 |
| 3 | `cloudfunctions/replyToLetter/config.json` | 修改 | 更新超时时间为60秒（圆桌会议需要更长时间） |

**总修改文件数**：3个（符合≤5个文件限制）

### 4.2 新增文件清单

| 序号 | 文件路径 | 用途 |
|------|----------|------|
| 1 | `miniprogram/pages/roundtableResult/roundtableResult.js` | 圆桌会议结果展示页面逻辑 |
| 2 | `miniprogram/pages/roundtableResult/roundtableResult.wxml` | 圆桌会议结果展示页面结构 |
| 3 | `miniprogram/pages/roundtableResult/roundtableResult.wxss` | 圆桌会议结果展示页面样式 |
| 4 | `miniprogram/pages/roundtableResult/roundtableResult.json` | 圆桌会议结果展示页面配置 |

**总新增文件数**：4个（符合渐进式开发原则）

---

## 五、实施计划

### 5.1 开发步骤

#### 步骤1：云函数扩展（2天）
1. 修改 `replyToLetter/index.js`，新增 `type=roundtable` 参数解析
2. 实现多导师顺序回复逻辑
3. 实现上下文摘要机制
4. 实现邮票扣减逻辑
5. 更新 `config.json` 超时时间

#### 步骤2：前端页面修改（2天）
1. 修改 `roundtable.js`，替换"功能开发中"逻辑
2. 实现实际提交逻辑，调用新版云函数
3. 添加加载状态提示
4. 处理错误情况

#### 步骤3：结果展示页面（2天）
1. 创建 `roundtableResult` 页面
2. 实现多导师回复展示
3. 实现讨论稿生成UI
4. 实现导出分享功能UI

#### 步骤4：测试验证（2天）
1. 单导师模式回归测试
2. 多导师模式功能测试
3. 邮票扣减测试
4. 边界情况测试

### 5.2 时间安排

| 阶段 | 时间 | 产出 |
|------|------|------|
| 云函数开发 | Day 1-2 | 支持roundtable参数的云函数 |
| 前端修改 | Day 3-4 | 调用新版云函数的前端页面 |
| 结果页面 | Day 5-6 | roundtableResult展示页面 |
| 测试验证 | Day 7-8 | 测试报告，bug修复 |

---

## 六、风险与回滚方案

### 6.1 风险识别

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 云函数超时 | 中 | 圆桌会议调用时间较长，可能超过30秒 | 增加超时时间到60秒，优化代码性能 |
| 邮票扣减异常 | 低 | 可能导致邮票被重复扣减 | 使用数据库事务，确保原子性操作 |
| 单导师模式受影响 | 低 | 修改replyToLetter可能影响现有功能 | 保持参数兼容，充分回归测试 |
| 上下文摘要不准确 | 中 | 影响后续导师回复质量 | 预留优化空间，后续迭代改进 |

### 6.2 回滚方案

**情况1：云函数出现严重bug**
- 回滚操作：从云开发控制台回滚 `replyToLetter` 云函数到上一版本
- 回滚时间：< 5分钟
- 影响范围：仅圆桌会议功能不可用，单导师功能正常

**情况2：前端页面出现问题**
- 回滚操作：修改 `roundtable.js` 中的 `featureEnabled` 为 `false`，隐藏入口
- 回滚时间：< 1分钟
- 影响范围：圆桌会议入口隐藏，用户无法访问

---

## 七、验收标准

### 7.1 功能验收

| 验收项 | 验收标准 | 状态 |
|--------|----------|------|
| 云函数扩展 | 支持 `type=roundtable` 参数，返回正确格式 | 待开发 |
| 多导师回复 | 按领域顺序依次生成回复（投资→创业→心理→哲学） | 待开发 |
| 上下文传递 | 每位导师回复基于前文内容，上下文摘要准确 | 待开发 |
| 邮票扣减 | 圆桌会议扣除3张邮票，余额更新正确 | 待开发 |
| 单导师兼容 | 现有单导师功能100%正常，无回归问题 | 待验证 |

### 7.2 性能验收

| 验收项 | 验收标准 |
|--------|----------|
| 云函数响应时间 | ≤ 60秒（3-5位导师总时间） |
| 单导师回复时间 | ≤ 15秒（保持现有水平） |
| 数据库操作 | 邮票扣减使用事务，原子性保证 |

### 7.3 安全验收

| 验收项 | 验收标准 |
|--------|----------|
| 敏感词过滤 | 云函数端进行敏感词检测 |
| 数据隔离 | 用户只能访问自己的圆桌会议数据 |
| 邮票安全 | 扣减操作使用数据库事务，防止超扣 |

---

## 八、下一步行动

等待用户确认后，开始以下工作：

1. **Day 1**: 修改 `replyToLetter/index.js`，实现 `type=roundtable` 参数支持
2. **Day 2**: 实现多导师顺序回复和上下文摘要机制
3. **Day 3**: 修改 `roundtable.js`，替换"功能开发中"逻辑
4. **Day 4-5**: 测试验证，确保单导师模式不受影响

---

**计划制定完成，等待用户确认后开始执行。**
