# 敏感词功能全面测试方案

## 📋 测试对象
1. **前端工具类**：`miniprogram/utils/sensitiveWordUtil.js`
2. **后端检测器**：`cloudfunctions/replyToLetter/sensitiveWordDetector.js`
3. **敏感词库**：`cloudfunctions/replyToLetter/sensitiveWords.json`
4. **云函数**：`cloudfunctions/detectSensitiveWords/index.js`

## 🔍 测试分类

### 1. 单元测试 - 后端检测器

#### 测试用例 1.1：基本检测功能
```javascript
// 测试正常文本
const result1 = detector.detect("这是一段正常的文本");
// 预期：{ hasSensitive: false, isHighSensitive: false, isInvestment: false, words: [], categories: [] }

// 测试暴力敏感词
const result2 = detector.detect("这是一段包含杀人的暴力文本");
// 预期：{ hasSensitive: true, isHighSensitive: true, isInvestment: false, words: ["杀人"], categories: ["violence"] }

// 测试色情敏感词
const result3 = detector.detect("这是一段包含色情的低俗文本");
// 预期：{ hasSensitive: true, isHighSensitive: true, isInvestment: false, words: ["色情"], categories: ["porn"] }

// 测试投资敏感词
const result4 = detector.detect("这是一段包含投资建议的理财文本");
// 预期：{ hasSensitive: true, isHighSensitive: false, isInvestment: true, words: ["投资建议"], categories: ["investment"] }

// 测试混合敏感词
const result5 = detector.detect("暴力杀人色情投资建议");
// 预期：{ hasSensitive: true, isHighSensitive: true, isInvestment: true, words: ["暴力", "杀人", "色情", "投资建议"], categories: ["violence", "porn", "investment"] }
```

#### 测试用例 1.2：边界条件
```javascript
// 空文本
const result1 = detector.detect("");
// 预期：无敏感词

// null/undefined
const result2 = detector.detect(null);
const result3 = detector.detect(undefined);
// 预期：无敏感词

// 特殊字符
const result4 = detector.detect("杀@#$人 色!!!情");
// 预期：检测到"杀人"和"色情"

// 重复敏感词
const result5 = detector.detect("杀人杀人杀人");
// 预期：words 去重后只有 ["杀人"]

// 大小写不敏感（中文字符无影响）
const result6 = detector.detect("杀人暴力");
// 预期：正常检测
```

#### 测试用例 1.3：过滤功能
```javascript
// 正常过滤
const result1 = detector.filter("这是一段包含杀人的暴力文本");
// 预期："这是一段包含***的***文本"

// 多敏感词过滤
const result2 = detector.filter("暴力杀人色情投资建议");
// 预期："******" 或 "*** *** *** ***"

// 空文本过滤
const result3 = detector.filter("");
// 预期：""
```

#### 测试用例 1.4：快速检测功能
```javascript
// 有敏感词
const result1 = detector.hasSensitiveWord("这是一段包含杀人的文本");
// 预期：true

// 无敏感词
const result2 = detector.hasSensitiveWord("这是一段正常的文本");
// 预期：false

// 空文本
const result3 = detector.hasSensitiveWord("");
// 预期：false
```

---

### 2. 集成测试 - 云函数
```javascript
// 测试正常调用
const result = await wx.cloud.callFunction({
  name: 'detectSensitiveWords',
  data: { text: "包含杀人的暴力文本" }
});
// 预期：{ success: true, data: { hasSensitive: true, ... } }

// 测试空文本
const result2 = await wx.cloud.callFunction({
  name: 'detectSensitiveWords',
  data: { text: "" }
});
// 预期：{ success: true, data: { hasSensitive: false } }

// 测试无text参数
const result3 = await wx.cloud.callFunction({
  name: 'detectSensitiveWords',
  data: {}
});
// 预期：{ success: true, data: { hasSensitive: false } }
```

---

### 3. 性能测试
```javascript
// 短文本（100字）- 1000次调用
const shortText = "这是一段包含杀人、色情、投资建议的测试文本";
console.time("shortText");
for (let i = 0; i < 1000; i++) {
  detector.detect(shortText);
}
console.timeEnd("shortText");
// 预期：< 100ms

// 长文本（1000字）- 100次调用
const longText = "测试文本".repeat(100) + "杀人" + "测试文本".repeat(100);
console.time("longText");
for (let i = 0; i < 100; i++) {
  detector.detect(longText);
}
console.timeEnd("longText");
// 预期：< 50ms

// 过滤性能 - 1000次短文本
console.time("filter");
for (let i = 0; i < 1000; i++) {
  detector.filter(shortText);
}
console.timeEnd("filter");
// 预期：< 200ms
```

---

### 4. 端到端测试（前端）
```javascript
// 前端调用检测
const result = await sensitiveWordUtil.detect("包含杀人的暴力文本");
// 预期：返回检测结果

// 前端调用过滤
const filtered = await sensitiveWordUtil.filter("包含杀人的暴力文本");
// 预期：返回过滤后文本

// 前端快速检测
const hasSensitive = await sensitiveWordUtil.hasSensitiveWord("包含杀人的暴力文本");
// 预期：true
```
