
# 项目开发规范 - 渐进式版本

&gt; 📌 **核心原则**：保护现有原型成果，渐进式升级到生产标准
&gt;
&gt; 本规范采用**三层递进策略**，避免一次性重构导致的风险。

---

## 目录

- [1. 项目现状概览](#1-项目现状概览)
- [2. 风险评估与应对策略](#2-风险评估与应对策略)
- [3. 规范分层策略](#3-规范分层策略)
- [4. 立即执行规范](#4-立即执行规范)
- [5. 规则稳定性与防崩溃机制](#5-规则稳定性与防崩溃机制)
- [6. 新功能适用规范](#6-新功能适用规范)
- [7. 未来目标规范](#7-未来目标规范)
- [8. 关键模块迁移指南](#8-关键模块迁移指南)
- [9. 重构安全预防与应对](#9-重构安全预防与应对)
- [10. 回滚策略与版本兼容](#10-回滚策略与版本兼容)
- [11. 项目结构规范](#11-项目结构规范)
- [12. 代码风格指南](#12-代码风格指南)
- [13. Git 工作流](#13-git-工作流)
- [14. 测试标准](#14-测试标准)
- [15. 安全规则增强](#15-安全规则增强)
- [16. 文档编写要求](#16-文档编写要求)
- [17. 团队协作规范](#17-团队协作规范)
- [附录](#附录)

---

## 1. 项目现状概览

### 1.1 当前技术栈

| 类别 | 现状 | 说明 |
|------|------|------|
| 开发语言 | JavaScript | 原生 JS，无 TypeScript |
| 小程序框架 | 微信原生 | 非 uni-app/Taro |
| 基础库版本 | 3.7.1+ | 符合 2.28.3+ 要求 |
| 状态管理 | app.globalData | 主题模式等全局状态 |
| 后端 | 微信云开发 | 云函数 + 云数据库 |
| 组件库 | 自定义组件 | 无第三方 UI 库 |

### 1.2 项目当前状态

- ✅ **原型阶段已完成**：核心功能稳定运行
- ⚠️ **生产化待升级**：合规性、性能、安全性需逐步完善
- 📋 **重构风险高**：禁止一次性大规模重构

### 1.3 已知问题清单

| 问题 | 严重程度 | 影响范围 | 状态 |
|------|----------|----------|------|
| 使用已失效的 `wx.getUserProfile` | 🔴 极高 | 登录模块 | 待修复 |
| 未实现隐私授权接口 | 🟡 中 | 隐私相关功能 | 待实现 |
| 未调用微信内容安全审核 | 🟡 中 | 内容提交 | 待实现 |
| 长列表未使用虚拟列表 | 🟢 低 | 笔记列表 | 可延后 |

---

## 2. 风险评估与应对策略

### 2.1 风险等级总览

| 风险类别 | 风险等级 | 影响范围 | 紧急程度 | 应对策略 |
|----------|----------|----------|----------|----------|
| 合规性风险 | 🔴 极高 | 登录模块 | 立即处理 | 重构登录页面 |
| 功能失效风险 | 🟡 中等 | 核心功能 | 3个月内 | 渐进式迁移 |
| 样式兼容风险 | 🟢 低 | UI 层 | 可延后 | 保持现状 |
| 性能优化风险 | 🟢 低 | 长列表页面 | 可延后 | 按需优化 |
| 技术栈升级风险 | 🔴 极高 | 全项目 | 6个月+ | 禁止一次性重构 |

### 2.2 合规性风险详解

#### 2.2.1 登录模块风险（🔴 极高）

**问题描述**：项目使用已失效的 `wx.getUserProfile` API

**代码位置**：`miniprogram/pages/login/login.js`

**风险表现**：
| 表现 | 说明 |
|------|------|
| ❌ 审核不通过 | 微信审核会直接拒绝 |
| ❌ 功能失效 | 新用户无法完成登录 |
| ❌ 用户流失 | 无法获取头像昵称，用户体验差 |

**应对措施**：
1. 立即重构登录页面
2. 使用新的头像昵称填写能力
3. 保留游客模式作为降级方案

#### 2.2.2 隐私授权风险（🟡 中等）

**问题描述**：未实现 `wx.onNeedPrivacyAuthorization` 接口

**风险表现**：
- 调用隐私接口时触发系统默认弹窗，体验不一致
- 可能影响审核通过率

**应对措施**：
1. 新功能适用：在需要调用隐私接口时实现
2. 渐进式添加：优先处理高频使用的隐私接口

### 2.3 技术栈升级风险详解

#### 2.3.1 TypeScript 迁移风险（🔴 极高）

**风险表现**：
| 风险类型 | 具体表现 |
|----------|----------|
| 编译失败 | 类型定义错误导致编译不通过 |
| 功能异常 | 类型断言错误导致运行时错误 |
| 时间成本 | 预计需要 3-6 个月全职开发 |

**应对措施**：
1. **禁止一次性重构**
2. 新功能使用 JSDoc 提供类型提示
3. 选择非核心模块试点 TypeScript

#### 2.3.2 状态管理迁移风险（🟡 中等）

**风险表现**：
- 数据流混乱导致状态不同步
- 组件间通信异常

**应对措施**：
1. 继续使用 app.globalData，保持一致性
2. 新功能遵循现有模式

### 2.4 功能模块风险矩阵

| 模块 | 合规性 | 性能 | 样式 | 技术栈 | 综合风险 |
|------|--------|------|------|--------|----------|
| 登录模块 | 🔴 极高 | 🟢 低 | 🟢 低 | 🔴 高 | 🔴 **极高** |
| 写笔记 | 🟡 中 | 🟢 低 | 🟢 低 | 🟡 中 | 🟡 **中** |
| 笔记列表 | 🟢 低 | 🟡 中 | 🟢 低 | 🟡 中 | 🟡 **中** |
| 笔记详情 | 🟢 低 | 🟢 低 | 🟢 低 | 🟡 中 | 🟢 **低** |
| 邮票购买 | 🟢 低 | 🟢 低 | 🟢 低 | 🟡 中 | 🟢 **低** |
| 回收站 | 🟢 低 | 🟢 低 | 🟢 低 | 🟡 中 | 🟢 **低** |
| 云函数 | 🟢 低 | 🟢 低 | - | 🟡 中 | 🟢 **低** |

---

## 3. 规范分层策略

### 3.1 三层定义

| 层级 | 适用范围 | 强制执行 | 说明 |
|------|----------|----------|------|
| 🔴 **立即执行** | 所有代码（新 + 旧） | ✅ 是 | 低风险，立即应用 |
| 🟡 **新功能适用** | 仅新开发功能 | ⚠️ 建议 | 中等风险，试点应用 |
| 🟢 **未来目标** | 长期规划 | ❌ 否 | 高风险，暂不应用 |

### 3.2 迁移路线图

```
阶段一：规则文档化（当前）
├─ 记录现状
├─ 建立规范框架
├─ 立即执行低风险规范
└─ 修复合规性问题

阶段二：新功能试点（1-2个月）
├─ 新功能遵循新规范
├─ 积累 TypeScript 经验
└─ 选择 1-2 个模块试点

阶段三：核心模块重构（3-6个月）
├─ 重构核心页面
├─ 充分测试验证
└─ 保持回滚能力

阶段四：全面生产化（6个月+）
├─ 全面应用生产规范
├─ 性能优化完成
└─ 合规性审核通过
```

---

## 4. 立即执行规范

### 4.1 合规性规范（🔴 最高优先级）

#### 4.1.1 用户信息获取规范

**禁止使用**：
```javascript
// ❌ 已失效，禁止使用
const profileRes = await wx.getUserProfile({
  desc: '展示个人头像昵称'
});
```

**必须使用**：
```xml
<!-- ✅ 头像选择 -->
<button class="avatar-wrapper" open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
  <image class="avatar" src="{{avatarUrl || '/images/default-avatar.png'}}"></image>
</button>

<!-- ✅ 昵称填写 -->
<input type="nickname" class="nickname-input" placeholder="请输入昵称" bind:blur="onNicknameInput"/>
```

```javascript
// ✅ 对应的处理逻辑
Page({
  data: {
    avatarUrl: '',
    nickname: ''
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
  },

  onNicknameInput(e) {
    const nickname = e.detail.value;
    this.setData({ nickname });
  }
});
```

#### 4.1.2 隐私授权规范

**必须实现**：
```javascript
// app.js
App({
  onLaunch() {
    // 注册隐私授权回调
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization(resolve => {
        this.privacyResolve = resolve;
      });
    }
  },

  // 隐私授权同意
  agreePrivacy() {
    if (this.privacyResolve) {
      this.privacyResolve({ event: 'agree', buttonId: 'agree-btn' });
      this.privacyResolve = null;
    }
  },

  // 隐私授权拒绝
  disagreePrivacy() {
    if (this.privacyResolve) {
      this.privacyResolve({ event: 'disagree' });
      this.privacyResolve = null;
    }
  }
});
```

#### 4.1.3 内容安全规范

**文本内容审核**：
```javascript
// ✅ 推荐封装
async function checkTextSecurity(content) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'securityCheck',
      data: { content, type: 'text' }
    });
    return result.result.isSafe;
  } catch (err) {
    console.error('内容审核失败:', err);
    return false;
  }
}
```

### 4.2 代码提交规范

#### 4.2.1 提交信息格式

```
&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;

&lt;body&gt;

&lt;footer&gt;
```

**Type 类型**：
- `feat`：新功能
- `fix`：修复 bug
- `docs`：文档更新
- `style`：代码格式调整
- `refactor`：重构（非功能变更）
- `test`：测试相关
- `chore`：构建/工具相关

**示例**：
```
feat(write): 添加敏感词实时检测功能

- 在输入时实时监测敏感词
- 触发时显示警告提示
- 阻止包含敏感词的提交

Closes #123
```

#### 4.2.2 分支管理策略

```
main (生产环境)
 └── develop (开发环境)
       ├── feature/login-optimize (功能分支)
       ├── fix/stamp-button (修复分支)
       └── docs/update-readme (文档分支)
```

**分支命名规则**：
- 功能分支：`feature/&lt;功能描述&gt;`
- 修复分支：`fix/&lt;问题描述&gt;`
- 文档分支：`docs/&lt;文档描述&gt;`
- 发布分支：`release/v&lt;版本号&gt;`

### 4.3 代码风格规范

#### 4.3.1 JavaScript 规范

**缩进**：2 空格

**分号**：必须使用分号

**引号**：优先使用单引号

```javascript
// ✅ 推荐
const name = '投资笔记';
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// ❌ 避免
const name = "投资笔记";
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000
}
```

#### 4.3.2 注释规范

**文件头部注释**：
```javascript
/**
 * CloudBase 文档数据库工具类
 * 封装了常见的数据库操作，支持查询、添加、更新、删除等操作
 */
```

**函数注释**（JSDoc）：
```javascript
/**
 * 查询集合数据
 * @param {string} collectionName - 集合名称
 * @param {object} options - 查询选项
 * @param {object} options.where - 查询条件
 * @param {string} options.orderBy - 排序字段
 * @param {string} options.orderDirection - 排序方向 'asc' 或 'desc'
 * @param {number} options.limit - 返回记录数限制
 * @param {number} options.skip - 跳过记录数（用于分页）
 * @returns {Promise}
 */
async query(collectionName, options = {}) {
  // 实现
}
```

### 4.4 项目结构规范（保持现状）

```
invest-diary/
├── .trae/
│   └── rules/
│       └── project_rules.md      # 本规范文件
├── cloudfunctions/                 # 云函数目录
│   ├── login/                     # 登录云函数
│   └── replyToLetter/             # AI回复生成云函数
├── miniprogram/                    # 小程序前端代码
│   ├── pages/                     # 页面目录
│   │   ├── login/
│   │   ├── index/
│   │   ├── write/
│   │   ├── detail/
│   │   ├── stamps/
│   │   └── trash/
│   ├── components/                # 组件目录
│   │   ├── sideMenu/
│   │   ├── cloudTipModal/
│   │   └── heatmapCalendar/
│   ├── utils/                     # 工具类目录
│   │   ├── cloudbaseUtil.js
│   │   └── sensitiveWordUtil.js
│   ├── docs/                      # 项目文档
│   ├── images/                    # 图片资源
│   ├── app.js
│   ├── app.json
│   └── app.wxss
├── project.config.json
└── README.md
```

---

## 5. 规则稳定性与防崩溃机制

> 📌 **核心目标**：确保在极端场景和异常输入下仍能保持核心功能正常运行

### 5.1 异常处理规范

#### 5.1.1 全局异常捕获

**App 层异常捕获**：
```javascript
App({
  onLaunch() {
    this.initGlobalErrorHandler();
  },

  initGlobalErrorHandler() {
    // 捕获未处理的 Promise 异常
    wx.onUnhandledRejection((res) => {
      console.error('[未处理的Promise异常]', res.reason);
      this.reportError('unhandledRejection', res.reason);
    });

    // 捕获小程序错误
    wx.onError((error) => {
      console.error('[小程序错误]', error);
      this.reportError('appError', error);
    });
  },

  reportError(type, error) {
    const logger = wx.getRealtimeLogManager();
    logger.error(`[${type}]`, error);
    
    // 可选：上报到监控系统
    // wx.reportAnalytics('error_report', { type, message: String(error) });
  }
});
```

#### 5.1.2 页面级异常处理

**页面生命周期异常处理**：
```javascript
Page({
  onLoad(options) {
    this.safeExecute(() => this.initPage(options), '页面初始化');
  },

  onShow() {
    this.safeExecute(() => this.refreshData(), '页面显示');
  },

  onPullDownRefresh() {
    this.safeExecute(async () => {
      await this.loadData();
      wx.stopPullDownRefresh();
    }, '下拉刷新');
  },

  safeExecute(fn, operationName) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.catch(err => {
          this.handleError(operationName, err);
          return null;
        });
      }
      return result;
    } catch (err) {
      this.handleError(operationName, err);
      return null;
    }
  },

  handleError(operation, error) {
    console.error(`[${operation}失败]`, error);
    wx.showToast({
      title: `${operation}失败`,
      icon: 'none'
    });
  }
});
```

#### 5.1.3 云函数异常处理

**云函数统一异常处理**：
```javascript
// 云函数入口
exports.main = async (event, context) => {
  try {
    const result = await handleRequest(event, context);
    return { code: 0, data: result, message: 'success' };
  } catch (error) {
    console.error('[云函数异常]', error);
    
    // 区分错误类型
    if (error.code === 'DATABASE_ERROR') {
      return { code: 500, data: null, message: '数据库操作失败' };
    }
    if (error.code === 'PERMISSION_DENIED') {
      return { code: 403, data: null, message: '权限不足' };
    }
    
    return { code: 500, data: null, message: '服务器内部错误' };
  }
};
```

### 5.2 边界条件处理

#### 5.2.1 空值/空数据处理

**安全访问工具函数**：
```javascript
/**
 * 安全获取嵌套对象属性
 * @param {Object} obj - 目标对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
function safeGet(obj, path, defaultValue = null) {
  if (!obj || typeof path !== 'string') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

// 使用示例
const userName = safeGet(userInfo, 'profile.nickName', '用户');
const avatar = safeGet(userInfo, 'profile.avatarUrl', '/images/default-avatar.png');
```

**数组安全操作**：
```javascript
// 安全获取数组元素
function safeArrayGet(arr, index, defaultValue = null) {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue;
  }
  return arr[index];
}

// 安全数组遍历
function safeForEach(arr, callback) {
  if (!Array.isArray(arr)) return;
  arr.forEach((item, index) => {
    if (item !== undefined && item !== null) {
      callback(item, index);
    }
  });
}
```

#### 5.2.2 类型检查与转换

**类型检查工具函数**：
```javascript
const TypeChecker = {
  isString: (val) => typeof val === 'string',
  isNumber: (val) => typeof val === 'number' && !isNaN(val),
  isBoolean: (val) => typeof val === 'boolean',
  isObject: (val) => val !== null && typeof val === 'object' && !Array.isArray(val),
  isArray: (val) => Array.isArray(val),
  isFunction: (val) => typeof val === 'function',
  isEmpty: (val) => {
    if (val === null || val === undefined) return true;
    if (TypeChecker.isString(val)) return val.trim() === '';
    if (TypeChecker.isArray(val)) return val.length === 0;
    if (TypeChecker.isObject(val)) return Object.keys(val).length === 0;
    return false;
  }
};

// 安全转换
function safeToNumber(val, defaultValue = 0) {
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
}

function safeToString(val, defaultValue = '') {
  if (val === null || val === undefined) return defaultValue;
  return String(val);
}
```

#### 5.2.3 参数验证

**函数参数验证**：
```javascript
/**
 * 验证必需参数
 * @param {Object} params - 参数对象
 * @param {string[]} requiredFields - 必需字段列表
 * @throws {Error} 缺少必需参数时抛出错误
 */
function validateRequired(params, requiredFields) {
  if (!params || typeof params !== 'object') {
    throw new Error('参数必须是一个对象');
  }
  
  const missing = requiredFields.filter(field => {
    const value = params[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new Error(`缺少必需参数: ${missing.join(', ')}`);
  }
}

// 使用示例
async function createLetter(params) {
  validateRequired(params, ['content', 'mentor']);
  
  // 参数验证通过，执行业务逻辑
  // ...
}
```

### 5.3 网络异常处理

#### 5.3.1 请求重试机制

**带重试的网络请求**：
```javascript
/**
 * 带重试的网络请求
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 配置选项
 * @param {number} options.maxRetries - 最大重试次数
 * @param {number} options.retryDelay - 重试延迟(ms)
 * @returns {Promise} 请求结果
 */
async function requestWithRetry(requestFn, options = {}) {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let lastError = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await requestFn();
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[请求失败] 第${i + 1}次重试`, error.message);
      
      // 非网络错误不重试
      if (error.errMsg && !error.errMsg.includes('network')) {
        throw error;
      }
      
      // 等待后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// 使用示例
const result = await requestWithRetry(
  () => wx.cloud.callFunction({ name: 'login' }),
  { maxRetries: 3, retryDelay: 1000 }
);
```

#### 5.3.2 网络状态检测

**网络状态监控**：
```javascript
const NetworkMonitor = {
  isConnected: true,
  listeners: [],

  init() {
    wx.onNetworkStatusChange((res) => {
      this.isConnected = res.isConnected;
      this.notifyListeners(res.isConnected);
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none'
        });
      }
    });
  },

  addListener(callback) {
    this.listeners.push(callback);
  },

  notifyListeners(isConnected) {
    this.listeners.forEach(cb => cb(isConnected));
  },

  checkConnection() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          this.isConnected = res.networkType !== 'none';
          resolve(this.isConnected);
        },
        fail: () => resolve(false)
      });
    });
  }
};
```

### 5.4 内存保护机制

#### 5.4.1 内存泄漏防护

**页面卸载时清理资源**：
```javascript
Page({
  data: {
    timer: null,
    interval: null
  },

  onLoad() {
    // 设置定时器
    this.setData({
      timer: setTimeout(() => this.doSomething(), 5000),
      interval: setInterval(() => this.pollData(), 10000)
    });
  },

  onUnload() {
    // 清理定时器
    if (this.data.timer) {
      clearTimeout(this.data.timer);
    }
    if (this.data.interval) {
      clearInterval(this.data.interval);
    }
    
    // 清理其他资源
    this.cleanupResources();
  },

  cleanupResources() {
    // 清理事件监听
    // 清理缓存数据
    // 清理动画实例
  }
});
```

#### 5.4.2 大数据量处理

**分批处理大数据**：
```javascript
/**
 * 分批处理大量数据
 * @param {Array} data - 数据数组
 * @param {Function} processFn - 处理函数
 * @param {number} batchSize - 每批数量
 * @returns {Promise} 处理结果
 */
async function processBatch(data, processFn, batchSize = 50) {
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
    
    // 让出执行权，避免阻塞
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
}
```

### 5.5 自动检查清单机制

#### 5.5.1 代码提交前检查清单

**提交前自动检查项**：

| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 编译检查 | 微信开发者工具编译 | 无错误、无警告 |
| 代码规范 | ESLint / 手动检查 | 符合规范要求 |
| 功能测试 | 模拟器测试 | 核心功能可用 |
| 控制台日志 | 检查控制台输出 | 无错误日志 |
| 敏感信息 | 搜索关键词 | 无敏感信息泄露 |

**提交前检查脚本**：
```bash
#!/bin/bash
# pre-commit-check.sh

echo "=== 开始提交前检查 ==="

# 1. 检查敏感信息
echo "1. 检查敏感信息..."
if grep -r "appid\|secret\|password\|token" miniprogram/ --include="*.js" | grep -v "// "; then
  echo "❌ 发现可能的敏感信息，请检查"
  exit 1
fi
echo "✅ 敏感信息检查通过"

# 2. 检查console.log
echo "2. 检查调试日志..."
if grep -r "console.log\|console.error" miniprogram/ --include="*.js" | wc -l | awk '{if($1>50) exit 1}'; then
  echo "❌ console日志过多，请清理"
  exit 1
fi
echo "✅ 日志检查通过"

echo "=== 检查完成 ==="
```

#### 5.5.2 功能模块检查清单

**登录模块检查清单**：
```markdown
## 登录模块检查清单

### 功能检查
- [ ] 新用户可以正常选择头像
- [ ] 新用户可以正常输入昵称
- [ ] 登录成功后跳转正常
- [ ] 老用户自动跳转正常
- [ ] 数据库同步正常

### 异常处理检查
- [ ] 网络断开时有友好提示
- [ ] 云函数超时有重试机制
- [ ] 头像选择失败有降级方案
- [ ] 昵称为空时有验证提示

### 安全检查
- [ ] 无敏感信息泄露
- [ ] 数据传输使用HTTPS
- [ ] 用户数据隔离正确
```

**写笔记模块检查清单**：
```markdown
## 写笔记模块检查清单

### 功能检查
- [ ] 笔记创建成功
- [ ] 笔记保存成功
- [ ] AI回复生成正常
- [ ] 笔记列表显示正常

### 异常处理检查
- [ ] 内容为空时有验证提示
- [ ] 内容过长时有截断处理
- [ ] 网络异常时有保存提示
- [ ] AI回复失败时有降级方案

### 安全检查
- [ ] 内容安全审核通过
- [ ] 敏感词检测正常
- [ ] XSS攻击防护正常
```

#### 5.5.3 发布前检查清单

**发布前完整检查清单**：

| 类别 | 检查项 | 检查方法 | 负责人 |
|------|--------|----------|--------|
| 功能 | 核心功能验证 | 真机测试 | 开发者 |
| 功能 | 边界条件测试 | 测试用例 | 测试人员 |
| 性能 | 启动时间 < 3秒 | 性能分析 | 开发者 |
| 性能 | 内存占用 < 200MB | 内存分析 | 开发者 |
| 兼容 | iOS 13+ 正常 | 真机测试 | 测试人员 |
| 兼容 | Android 8+ 正常 | 真机测试 | 测试人员 |
| 安全 | 敏感信息检查 | 代码审查 | 审查者 |
| 安全 | 数据隔离验证 | 多账号测试 | 测试人员 |
| 合规 | 隐私授权正常 | 功能测试 | 测试人员 |
| 合规 | 内容审核正常 | 功能测试 | 测试人员 |

### 5.6 重构触发条件与流程

#### 5.6.1 重构触发条件

**必须触发重构的场景**：

| 触发条件 | 风险等级 | 触发时机 | 审批要求 |
|----------|----------|----------|----------|
| 使用已废弃API | 🔴 极高 | 发现后立即 | 无需审批 |
| 安全漏洞发现 | 🔴 极高 | 发现后立即 | 无需审批 |
| 审核不通过 | 🔴 高 | 收到通知后 | 团队讨论 |
| 性能指标不达标 | 🟡 中 | 监控告警后 | 技术负责人 |
| 代码可维护性差 | 🟢 低 | 代码审查时 | 团队讨论 |

**重构决策流程**：
```
发现问题
    ↓
评估风险等级
    ↓
┌─────────────────────────────────┐
│ 🔴 极高风险：立即启动重构        │
│ 🟡 中等风险：排期重构            │
│ 🟢 低风险：纳入技术债务清单      │
└─────────────────────────────────┘
    ↓
制定重构方案
    ↓
执行重构流程
```

#### 5.6.2 重构执行流程

**标准重构流程**：

```
阶段一：准备阶段
├─ 1. 创建备份分支
├─ 2. 导出云开发资源
├─ 3. 执行基线测试
├─ 4. 阅读相关规范
└─ 5. 制定详细计划

阶段二：实施阶段
├─ 1. 创建功能分支
├─ 2. 按最小化变更原则修改
├─ 3. 频繁提交验证
├─ 4. 添加必要日志
└─ 5. 完成单元测试

阶段三：验证阶段
├─ 1. 本地验证
├─ 2. 真机验证
├─ 3. 兼容性验证
├─ 4. 云端验证
└─ 5. 回归测试

阶段四：发布阶段
├─ 1. 代码审查
├─ 2. 合并到develop
├─ 3. 灰度发布
├─ 4. 监控观察
└─ 5. 全量发布
```

#### 5.6.3 重构风险评估

**重构风险评分表**：

| 评估维度 | 评分标准 | 分值 |
|----------|----------|------|
| 影响范围 | 单模块/多模块/全项目 | 1/3/5 |
| 代码变更量 | <100行/100-500行/>500行 | 1/3/5 |
| 依赖复杂度 | 低/中/高 | 1/3/5 |
| 测试覆盖度 | 高/中/低 | 1/3/5 |
| 回滚难度 | 低/中/高 | 1/3/5 |

**风险等级判定**：
- 总分 5-8 分：🟢 低风险，可直接执行
- 总分 9-12 分：🟡 中风险，需要技术负责人审批
- 总分 13-25 分：🔴 高风险，需要团队讨论并制定详细方案

---

## 6. 新功能适用规范

### 6.1 基础技术栈规范

#### 6.1.1 类型安全（渐进式）

**新功能**：建议使用 JSDoc 提供类型提示

```javascript
/**
 * @typedef {Object} Letter
 * @property {string} _id - 文档ID
 * @property {string} content - 笔记内容
 * @property {string} mentor - AI助手名称
 * @property {string} mood - 心境
 * @property {Date} createTime - 创建时间
 */

/**
 * 获取笔记列表
 * @param {string} openid - 用户openid
 * @returns {Promise<Letter[]>}
 */
async fetchLetters(openid) {
  // 实现
}
```

#### 6.1.2 状态管理（新功能）

**新功能**：继续使用 app.globalData，保持一致性

```javascript
// ✅ 推荐 - 保持现状
const app = getApp();

Page({
  data: {
    themeClass: ''
  },

  onLoad() {
    this.setData({
      themeClass: app.getThemeClass()
    });
  }
});
```

### 6.2 性能优化规范

#### 6.2.1 setData 优化

```javascript
// ✅ 推荐 - 只更新变化的数据
this.setData({
  'userInfo.nickName': newName
});

// ❌ 避免 - 一次性更新大量数据
this.setData({
  userInfo: { ...this.data.userInfo, nickName: newName }
});
```

#### 6.2.2 图片资源管理

```
miniprogram/images/
├── icons/          # tabbar 图标（可本地）
└── ...             # 其他图片建议上传 CDN
```

### 6.3 安全与合规规范

#### 6.3.1 网络请求封装

**新功能**：统一使用 cloudbaseUtil，保持一致性

```javascript
// ✅ 推荐
const cloudbaseUtil = require('../../utils/cloudbaseUtil');

const result = await cloudbaseUtil.query('letters', {
  where: { _openid: openid },
  orderBy: 'createTime',
  orderDirection: 'desc'
});
```

#### 6.3.2 异常监控

**新功能**：添加实时日志

```javascript
const logger = wx.getRealtimeLogManager();

try {
  // 业务逻辑
} catch (error) {
  logger.error('操作失败:', error);
  console.error('操作失败:', error);
}
```

### 6.4 交互体验规范

#### 6.4.1 iPhone X 安全区域适配

```css
/* ✅ 推荐 */
.bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

#### 6.4.2 加载状态

```javascript
// ✅ 推荐 - 显示加载状态
this.setData({ loading: true });
try {
  await this.fetchData();
} finally {
  this.setData({ loading: false });
}
```

---

## 7. 未来目标规范

### 7.1 技术栈升级（高风险，暂不执行）

| 项 | 目标 | 优先级 | 预计时间 | 前置条件 |
|----|------|--------|----------|----------|
| TypeScript | 强制使用 TypeScript | 🔴 高 | 3-6个月 | 团队培训完成 |
| 状态管理 | MobX-miniprogram / Pinia | 🟡 中 | 3-6个月 | TypeScript 完成 |
| 组件库 | TDesign / Vant Weapp | 🟡 中 | 2-3个月 | 设计规范确定 |
| Skyline | 长列表页面启用 | 🟡 中 | 2-3个月 | 性能测试通过 |

### 7.2 性能优化硬性指标

| 指标 | 目标 | 当前状态 | 触发条件 |
|------|------|----------|----------|
| 主包体积 | < 1.5M | ✅ 已满足 | - |
| 长列表 | recycler-view 虚拟列表 | ⚠️ 待优化 | 列表超过 100 条 |
| 内存管理 | onUnload 清理资源 | ⚠️ 部分实现 | 发现内存泄漏 |
| 图片策略 | 大图 CDN | ⚠️ 待优化 | 图片超过 50KB |

### 7.3 合规性审核红线

| 项 | 目标 | 当前状态 | 截止时间 |
|----|------|----------|----------|
| 隐私授权 | wx.onNeedPrivacyAuthorization | ⚠️ 待实现 | 新功能必须 |
| 头像昵称 | <button open-type="chooseAvatar"> | ⚠️ 待更新 | 立即 |
| 内容安全 | security.mediaCheckAsync | ⚠️ 待实现 | 发布前 |

### 7.4 安全与监控

| 项 | 目标 | 当前状态 | 优先级 |
|----|------|----------|--------|
| Request 封装 | 统一拦截器、Request ID | ⚠️ 待实现 | 🟡 中 |
| 异常监控 | wx.getRealtimeLogManager | ⚠️ 部分实现 | 🟡 中 |

---

## 8. 关键模块迁移指南

### 8.1 登录模块迁移

#### 8.1.1 迁移目标

将已失效的 `wx.getUserProfile` 替换为新的头像昵称填写能力。

#### 8.1.2 迁移步骤

**步骤一：创建新的登录页面 UI**

```xml
<!-- login.wxml -->
<view class="login-container {{themeClass}}">
  <view class="login-header">
    <text class="login-title">投资笔记</text>
    <text class="login-subtitle">记录思考，与大师对话</text>
  </view>

  <view class="login-form">
    <!-- 头像选择 -->
    <button class="avatar-wrapper" open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
      <image class="avatar" src="{{avatarUrl || '/images/default-avatar.png'}}"></image>
      <text class="avatar-tip">点击选择头像</text>
    </button>

    <!-- 昵称填写 -->
    <input 
      type="nickname" 
      class="nickname-input" 
      placeholder="请输入昵称" 
      value="{{nickname}}"
      bind:blur="onNicknameInput"
    />

    <!-- 开始使用按钮 -->
    &lt;button class="start-btn" bindtap="handleStart" disabled="{{!canStart}}"&gt;
      开始使用
    &lt;/button&gt;
  &lt;/view&gt;
&lt;/view&gt;
```

**步骤二：实现新的登录逻辑**

```javascript
// login.js
const cloudbaseUtil = require('../../utils/cloudbaseUtil');
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    canStart: false,
    themeClass: ''
  },

  onLoad() {
    this.setData({ themeClass: app.getThemeClass() });
    this.checkLoginStatus();
  },

  onShow() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('openid');
    const isFirstLogin = wx.getStorageSync('isFirstLogin');
    
    if (userInfo &amp;&amp; openid &amp;&amp; !isFirstLogin) {
      this.goToIndex();
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ 
      avatarUrl,
      canStart: this.data.nickname.length &gt; 0
    });
  },

  onNicknameInput(e) {
    const nickname = e.detail.value;
    this.setData({ 
      nickname,
      canStart: nickname.length &gt; 0 &amp;&amp; this.data.avatarUrl
    });
  },

  async handleStart() {
    if (!this.data.canStart) return;

    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' });
      const openid = (result.code === 0 &amp;&amp; result.data) ? result.data.openid : result.openid;
      
      if (!openid) throw new Error('未能获取到用户唯一标识');

      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickname
      };

      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('isFirstLogin', true);

      await this.syncUserToDatabase(openid, userInfo);

      wx.hideLoading();
      this.setData({ canStart: false });
      
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  async syncUserToDatabase(openid, userInfo) {
    try {
      const userResult = await cloudbaseUtil.query('users', {
        where: { _openid: openid }
      });
      
      if (userResult.success &amp;&amp; userResult.data.length === 0) {
        await cloudbaseUtil.add('users', { 
          ...userInfo, 
          lastLoginTime: new Date() 
        });
      } else if (userResult.success &amp;&amp; userResult.data.length &gt; 0) {
        await cloudbaseUtil.update('users', userResult.data[0]._id, { 
          ...userInfo, 
          lastLoginTime: new Date() 
        });
      }
    } catch (dbErr) {
      console.warn('数据库同步忽略:', dbErr);
    }
  },

  goToIndex() {
    wx.removeStorageSync('isFirstLogin');
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
```

#### 7.1.3 验证清单

- [ ] 新用户可以正常选择头像
- [ ] 新用户可以正常输入昵称
- [ ] 登录成功后跳转正常
- [ ] 老用户自动跳转正常
- [ ] 数据库同步正常

### 7.2 隐私授权迁移

#### 7.2.1 迁移目标

实现 `wx.onNeedPrivacyAuthorization` 接口，确保隐私接口调用前有授权弹窗。

#### 7.2.2 迁移步骤

**步骤一：在 app.js 中注册隐私授权回调**

```javascript
App({
  globalData: {
    themeMode: 'system',
    privacyResolve: null
  },

  onLaunch() {
    wx.cloud.init({ traceUser: true });
    this.initTheme();
    this.initPrivacy();
  },

  initPrivacy() {
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization(resolve =&gt; {
        this.globalData.privacyResolve = resolve;
        // 触发全局事件，通知页面显示隐私弹窗
        wx.eventChannel &amp;&amp; wx.eventChannel.emit('needPrivacyAuthorization');
      });
    }
  },

  agreePrivacy() {
    if (this.globalData.privacyResolve) {
      this.globalData.privacyResolve({ event: 'agree', buttonId: 'agree-btn' });
      this.globalData.privacyResolve = null;
    }
  },

  disagreePrivacy() {
    if (this.globalData.privacyResolve) {
      this.globalData.privacyResolve({ event: 'disagree' });
      this.globalData.privacyResolve = null;
    }
  }
});
```

**步骤二：创建隐私授权弹窗组件**

```xml
<!-- components/privacyModal/index.wxml -->
&lt;view class="privacy-modal" wx:if="{{show}}"&gt;
  &lt;view class="privacy-content"&gt;
    &lt;text class="privacy-title"&gt;用户隐私保护提示&lt;/text&gt;
    &lt;text class="privacy-desc"&gt;我们需要获取您的头像和昵称，用于展示您的个人信息。&lt;/text&gt;
    &lt;view class="privacy-actions"&gt;
      &lt;button class="privacy-btn disagree" bindtap="disagree"&gt;拒绝&lt;/button&gt;
      &lt;button class="privacy-btn agree" id="agree-btn" open-type="agreePrivacyAuthorization" bindagreeprivacyauthorization="agree"&gt;同意&lt;/button&gt;
    &lt;/view&gt;
  &lt;/view&gt;
&lt;/view&gt;
```

---

## 8. 重构安全预防与应对

> 📌 **核心目标**：确保即使操作失误也能安全回滚

### 8.1 重构前准备工作

#### 8.1.1 三层备份策略

| 备份层 | 操作方法 | 必要性 | 执行时机 |
|--------|----------|--------|----------|
| Git分支备份 | `git checkout -b backup/功能名-日期` | ✅ 必须 | 重构前立即执行 |
| 云开发资源导出 | 云开发控制台 → 数据库导出 | ✅ 必须 | 重大变更前执行 |
| 选择性本地备份 | 压缩 miniprogram/ 和 cloudfunctions/ | ⚠️ 可选 | 大规模重构时执行 |

**Git 分支备份操作**：
```bash
# 创建备份分支
git checkout -b backup/login-refactor-20260225

# 推送到远程
git push origin backup/login-refactor-20260225

# 切回工作分支
git checkout develop
```

**云开发资源导出操作**：
1. 登录微信云开发控制台
2. 选择对应环境
3. 数据库 → 选择集合 → 导出
4. 云函数 → 下载代码包
5. 云存储 → 下载重要文件

#### 8.1.2 基线测试清单

**重构前必须验证的功能**：

| 功能模块 | 测试项 | 验证方法 | 通过标准 |
|----------|--------|----------|----------|
| 登录模块 | 老用户自动登录 | 清除缓存后重新打开 | 自动跳转首页 |
| 登录模块 | 新用户注册流程 | 使用新微信号测试 | 可选择头像昵称 |
| 写笔记 | 笔记创建 | 创建新笔记并保存 | 列表中可见 |
| 写笔记 | AI回复生成 | 创建笔记后等待 | 收到AI回复 |
| 笔记列表 | 列表加载 | 进入首页 | 正常显示 |
| 笔记列表 | 搜索功能 | 输入关键词搜索 | 结果正确 |
| 笔记详情 | 详情查看 | 点击笔记卡片 | 内容完整 |
| 删除恢复 | 删除笔记 | 删除后查看回收站 | 显示在回收站 |
| 删除恢复 | 恢复笔记 | 从回收站恢复 | 列表中恢复 |
| 数据隔离 | 多账号测试 | 切换账号查看数据 | 仅显示自己数据 |

#### 8.1.3 环境隔离措施

**Git 分支隔离**：
```bash
# 禁止在 main 分支直接开发
# 禁止在 develop 分支直接开发

# 正确做法：创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

**测试环境配置**：
- 开发环境：使用测试云开发环境 ID
- 生产环境：使用正式云开发环境 ID
- 通过 `project.config.json` 切换

**IDE 设置规范**：
1. 关闭"自动编译"（避免误操作）
2. 启用"代码压缩"（模拟生产环境）
3. 开发环境设置"不校验合法域名"

#### 8.1.4 重构前必读清单

- [ ] 第2节：风险评估与应对策略 - 了解风险等级
- [ ] 第7节：关键模块迁移指南 - 了解迁移步骤
- [ ] 第8节：重构安全预防与应对 - 了解安全措施
- [ ] 第9节：回滚策略与版本兼容 - 了解回滚方法
- [ ] 第13节：测试标准 - 了解验证标准

### 8.2 重构过程中安全措施

#### 8.2.1 最小化变更原则

**单次变更限制**：
| 限制项 | 上限 | 理由 |
|--------|------|------|
| 修改文件数 | ≤ 5 个 | 便于定位问题 |
| 代码行数 | ≤ 200 行 | 降低出错概率 |
| 影响模块数 | ≤ 1 个 | 限制影响范围 |

**变更顺序建议**：
```
1. 先修改工具类/公共方法
   ↓
2. 再修改页面逻辑
   ↓
3. 最后修改 UI 样式
```

**禁止事项**：
- ❌ 禁止同时修改多个模块
- ❌ 禁止同时修改前端和云函数
- ❌ 禁止重构的同时添加新功能
- ❌ 禁止跳过测试直接合并

#### 8.2.2 频繁验证机制

**提交前验证**：
```bash
# 每次提交前执行
1. 编译检查：确保无编译错误
2. 模拟器测试：核心功能可用
3. 控制台检查：无错误日志
```

**提交频率建议**：
- 每 30 分钟提交一次
- 每完成一个小功能点提交
- 每次提交前确保可运行

**验证检查点**：
```javascript
// 在关键位置添加日志
console.log('[DEBUG] 函数入口:', params);
console.log('[DEBUG] 中间结果:', result);
console.log('[DEBUG] 函数出口:', output);
```

#### 8.2.3 运行时防护措施

**安全执行函数模板**：

```javascript
/**
 * 安全执行异步操作
 * @param {Function} fn - 异步函数
 * @param {string} operationName - 操作名称
 * @param {Object} fallbackValue - 失败时的降级值
 * @returns {Promise<Object>} 执行结果
 */
async function safeExecute(fn, operationName, fallbackValue = null) {
  const logger = wx.getRealtimeLogManager();
  
  try {
    const result = await fn();
    logger.info(`[${operationName}] 成功`);
    return { success: true, data: result };
  } catch (error) {
    logger.error(`[${operationName}] 失败:`, error);
    console.error(`[${operationName}] 失败:`, error);
    
    wx.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
    
    return { success: false, error: error.message, data: fallbackValue };
  }
}

// 使用示例
const result = await safeExecute(
  () => cloudbaseUtil.query('letters', { where: { _openid } }),
  '获取笔记列表',
  []
);

if (result.success) {
  this.setData({ letters: result.data });
}
```

**用户交互控制**：
```javascript
// 防止重复点击
Page({
  data: {
    submitting: false
  },

  async handleSubmit() {
    if (this.data.submitting) return;
    
    this.setData({ submitting: true });
    
    try {
      await this.doSubmit();
    } finally {
      this.setData({ submitting: false });
    }
  }
});
```

#### 8.2.4 隐私/合规同步处理

**内容安全审核时机**：

| 场景 | 审核内容 | 审核方式 |
|------|----------|----------|
| 用户提交笔记 | 笔记内容 | security.msgSecCheck |
| AI回复返回 | 回复内容 | security.msgSecCheck |
| 用户上传图片 | 图片内容 | security.mediaCheckAsync |

**审核失败处理流程**：
```
1. 阻止内容提交
   ↓
2. 显示友好提示："内容包含敏感信息，请修改后重试"
   ↓
3. 记录审核日志（不记录具体内容）
   ↓
4. 允许用户修改后重新提交
```

### 8.3 重构后验证方法

#### 8.3.1 验证阶段与标准

| 验证阶段 | 执行环境 | 通过标准 | 负责人 |
|----------|----------|----------|--------|
| 本地验证 | 开发者工具模拟器 | 编译无错误，功能可用 | 开发者 |
| 真机验证 | iOS + Android 真机 | 核心功能正常，无崩溃 | 开发者 |
| 兼容性验证 | 多机型/多系统版本 | 显示正常，交互正常 | 测试人员 |
| 云端验证 | 云开发控制台 | 云函数正常，数据正确 | 开发者 |

#### 8.3.2 本地验证通过标准

- [ ] 编译无错误、无警告
- [ ] 模拟器运行无崩溃
- [ ] 核心功能可正常使用
- [ ] 控制台无错误日志
- [ ] 主题切换正常
- [ ] 页面跳转正常

#### 8.3.3 真机验证通过标准

- [ ] iOS 设备运行正常
- [ ] Android 设备运行正常
- [ ] 网络请求响应时间 < 3秒
- [ ] 页面加载时间 < 2秒
- [ ] 内存占用 < 200MB
- [ ] 无白屏、无闪退

#### 8.3.4 兼容性验证通过标准

| 验证项 | 覆盖范围 | 通过标准 |
|--------|----------|----------|
| iOS 系统 | iOS 13+ | 功能正常，UI 正常 |
| Android 系统 | Android 8+ | 功能正常，UI 正常 |
| 微信版本 | 8.0+ | 功能正常，无兼容警告 |
| 屏幕适配 | 全面屏/刘海屏/普通屏 | 布局正常，无遮挡 |

#### 8.3.5 云端验证通过标准

- [ ] 云函数调用成功率 > 99%
- [ ] 数据库读写正常
- [ ] 文件上传下载正常
- [ ] 实时日志无错误
- [ ] 监控告警无触发

### 8.4 合并流程规范

#### 8.4.1 合并到 develop 后

```
1. 拉取最新代码
   ↓
2. 执行本地验证
   ↓
3. 执行真机验证
   ↓
4. 确认无问题后通知团队
   ↓
5. 更新相关文档
```

#### 8.4.2 合并到 main 后

```
1. 创建版本标签
   ↓
2. 执行完整验证（本地 + 真机 + 云端）
   ↓
3. 配置灰度发布
   ↓
4. 监控灰度期间数据
   ↓
5. 确认无问题后全量发布
```

---

## 9. 回滚策略与版本兼容

### 9.1 回滚策略

#### 9.1.1 代码回滚

**Git 回滚**：
```bash
# 方式一：安全回滚（推荐）
git revert HEAD                    # 回滚上一个提交
git revert <commit-hash>           # 回滚指定提交

# 方式二：强制回滚（谨慎使用）
git reset --hard <commit-hash>     # 重置到指定版本
git push origin develop --force    # 强制推送（需要权限）

# 方式三：从备份分支恢复
git checkout backup/login-refactor-20260225
git checkout -b hotfix/restore-login
```

**云函数回滚**：
```
1. 登录微信云开发控制台
2. 选择云函数 → 查看版本历史
3. 选择上一个稳定版本
4. 点击"回滚到此版本"
5. 验证功能正常
```

**回滚时间预估**：
| 回滚类型 | 预计时间 | 影响范围 |
|----------|----------|----------|
| 代码回滚 | 5-10分钟 | 无 |
| 云函数回滚 | 10-20分钟 | 部分功能 |
| 数据库回滚 | 30-60分钟 | 全部用户 |

#### 9.1.2 数据库回滚

**数据备份策略**：
| 备份时机 | 备份内容 | 保留期限 |
|----------|----------|----------|
| 重大变更前 | 全量数据 | 30天 |
| 每周定期 | 全量数据 | 90天 |
| 每日增量 | 变更数据 | 7天 |

**数据库回滚安全策略**：

```
回滚前准备：
├─ 1. 导出当前数据（必须）
├─ 2. 记录当前数据统计（用户数、笔记数等）
├─ 3. 通知用户可能的短暂不可用
└─ 4. 设置维护模式

回滚操作步骤：
├─ 1. 暂停用户写入（设置维护模式）
├─ 2. 导出当前数据
├─ 3. 导入备份数据
├─ 4. 验证数据完整性
└─ 5. 恢复用户写入

回滚后验证：
├─ 1. 检查用户数据完整性
├─ 2. 检查关联数据一致性
├─ 3. 执行功能测试
└─ 4. 监控错误日志
```

**数据库回滚命令**：
```bash
# 导出当前数据
wxcloud db:export -e <env-id> -c <collection> -o ./backup/current/

# 导入备份数据
wxcloud db:import -e <env-id> -c <collection> -f ./backup/20260225/
```

### 9.2 降级策略

#### 9.2.1 游客模式降级

**适用场景**：登录功能异常

**降级行为**：
```javascript
// 登录失败时的降级处理
async function handleLoginFailure() {
  wx.showToast({
    title: '登录功能暂时不可用',
    icon: 'none'
  });

  // 允许游客模式浏览
  wx.setStorageSync('isGuest', true);
  
  // 跳转到首页（仅浏览模式）
  wx.reLaunch({ url: '/pages/index/index' });
}
```

**用户提示**：
> "登录功能暂时不可用，您可以先浏览内容。请稍后再试。"

#### 9.2.2 功能降级

**AI回复功能降级**：
```javascript
// AI回复失败时的降级处理
async function handleAIReplyFailure(letterId) {
  // 保存笔记，但不生成AI回复
  await cloudbaseUtil.update('letters', letterId, {
    status: 'saved',
    replyError: 'AI服务暂时不可用'
  });

  wx.showToast({
    title: '笔记已保存，AI回复稍后生成',
    icon: 'none'
  });
}
```

**用户提示**：
> "AI回复功能暂时不可用，您的笔记已保存，我们会稍后为您生成回复。"

#### 9.2.3 服务降级

**适用场景**：云服务整体异常

**降级行为**：
```javascript
// 服务降级处理
async function handleServiceDegradation() {
  // 显示维护页面
  wx.redirectTo({ url: '/pages/maintenance/maintenance' });
}
```

**用户提示**：
> "系统维护中，请稍后再试。给您带来不便，敬请谅解。"

### 9.3 版本兼容性

#### 9.3.1 基础库版本兼容

| 功能 | 最低版本 | 当前版本 | 兼容性处理 |
|------|----------|----------|------------|
| 云开发 | 2.2.3 | 3.7.1 | ✅ 无需处理 |
| 隐私授权 | 2.32.3 | 3.7.1 | ✅ 无需处理 |
| 头像昵称填写 | 2.21.2 | 3.7.1 | ✅ 无需处理 |

#### 9.3.2 数据结构兼容

**用户表（users）兼容性**：
```javascript
// ✅ 兼容新旧数据结构
async function getUserInfo(openid) {
  const result = await cloudbaseUtil.query('users', {
    where: { _openid: openid },
    limit: 1
  });

  if (result.success && result.data.length > 0) {
    const user = result.data[0];
    return {
      // 兼容旧字段
      nickName: user.nickName || user.nickname || '用户',
      avatarUrl: user.avatarUrl || user.avatar || '/images/default-avatar.png',
      // 兼容新字段
      stamps: user.stamps !== undefined ? user.stamps : 3
    };
  }
  return null;
}
```

**信件表（letters）兼容性**：
```javascript
// ✅ 兼容新旧数据结构
async function getLetterDetail(letterId) {
  const result = await cloudbaseUtil.getById('letters', letterId);
  
  if (result.success) {
    const letter = result.data;
    return {
      ...letter,
      // 兼容旧数据（没有 replyExpectTime）
      canShowReply: letter.replyContent && 
        (!letter.replyExpectTime || Date.now() >= letter.replyExpectTime)
    };
  }
  return null;
}
```

### 9.4 灰度发布策略

#### 9.4.1 发布流程

```
开发环境 → 测试环境 → 灰度环境 → 生产环境
    │          │          │          │
    └─ 内部测试 └─ QA测试  └─ 10%用户 └─ 全量发布
```

#### 9.4.2 灰度规则

| 阶段 | 用户比例 | 持续时间 | 回滚条件 |
|------|----------|----------|----------|
| 灰度 1 | 10% | 24小时 | 错误率 > 1% |
| 灰度 2 | 30% | 24小时 | 错误率 > 0.5% |
| 灰度 3 | 50% | 24小时 | 错误率 > 0.2% |
| 全量 | 100% | - | - |

---

## 10. 项目结构规范

### 10.1 目录命名规范

- 使用小写字母
- 使用连字符 `-` 分隔单词
- 避免使用中文和特殊字符

```
✅  good-practice
❌  GoodPractice
❌  goodPractice
❌  good_practice
```

### 10.2 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面 | 目录名与文件名一致 | `pages/login/login.js` |
| 组件 | index.js / index.json / index.wxml / index.wxss | `components/sideMenu/index.js` |
| 工具类 | 驼峰命名 | `cloudbaseUtil.js` |
| 文档 | 小写 + 连字符 | `cloudbase-guide.md` |

---

## 11. 代码风格指南

### 11.1 JavaScript 风格

#### 11.1.1 变量声明

```javascript
// ✅ 推荐
const PI = 3.14;
let count = 0;

// ❌ 避免
var oldStyle = 'deprecated';
```

#### 11.1.2 函数命名

```javascript
// ✅ 推荐 - 动词开头
function fetchLetters() {}
function updateUserInfo() {}
function validateContent() {}

// ❌ 避免
function letters() {}
function info() {}
```

#### 11.1.3 条件判断

```javascript
// ✅ 推荐
if (letters.length > 0) {
  // 处理
}

// ✅ 推荐 - 使用严格相等
if (status === 'replied') {
  // 处理
}
```

### 11.2 WXSS 风格

#### 11.2.1 类名命名

```css
/* ✅ 推荐 - BEM 风格 */
.letter-card {}
.letter-card__title {}
.letter-card--active {}

/* ✅ 推荐 - 简洁风格 */
.letter-card {}
.letter-card-title {}
```

#### 11.2.2 样式顺序

```css
/* ✅ 推荐 - 按布局、盒模型、排版、视觉顺序 */
.selector {
  /* 布局 */
  display: flex;
  position: relative;

  /* 盒模型 */
  width: 100%;
  padding: 16px;
  margin: 0;

  /* 排版 */
  font-size: 14px;
  line-height: 1.5;

  /* 视觉 */
  color: #333;
  background: #fff;
  border-radius: 8px;
}
```

### 11.3 WXML 风格

#### 11.3.1 标签缩进

```xml
<!-- ✅ 推荐 -->
<view class="container">
  <view class="card">
    <text>{{title}}</text>
  </view>
</view>
```

#### 11.3.2 事件绑定

```xml
<!-- ✅ 推荐 -->
<view bindtap="onTap" data-id="{{item._id}}">
  {{item.content}}
</view>
```

---

## 12. Git 工作流

### 12.1 分支管理

```
main (生产)
  │
  └── develop (开发)
        │
        ├── feature/login-optimize
        ├── fix/stamp-button
        └── docs/update-readme
```

### 12.2 分支保护规则

**main 分支保护**：
| 保护规则 | 说明 |
|----------|------|
| 禁止直接推送 | 必须通过 PR 合并 |
| 需要 PR 审查 | 至少 1 人审查通过 |
| 需要通过测试 | CI 检查通过（如有） |
| 禁止强制推送 | 保护历史记录 |

**develop 分支保护**：
| 保护规则 | 说明 |
|----------|------|
| 禁止强制推送 | 保护历史记录 |
| 建议通过 PR 合并 | 推荐使用 PR 流程 |
| 建议通过测试 | CI 检查通过（如有） |

**功能分支规范**：
| 规范项 | 要求 |
|--------|------|
| 命名规范 | `feature/模块-功能描述` |
| 来源分支 | 必须从 develop 创建 |
| 生命周期 | 完成合并后删除 |
| 更新频率 | 定期从 develop 同步 |

### 12.3 开发流程

1. **从 develop 创建分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **开发并提交**
   ```bash
   git add .
   git commit -m "feat: 描述你的变更"
   ```

3. **推送到远程**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - 目标分支：develop
   - 填写描述和相关 issue

5. **代码审查**
   - 至少一人审查通过
   - 修复审查意见

6. **合并到 develop**
   - Squash 合并，保持历史整洁

### 12.4 发布流程

1. **从 develop 创建 release 分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. **版本号更新、测试、bug 修复**

3. **合并到 main 并打标签**
   ```bash
   git checkout main
   git merge --no-ff release/v1.0.0
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin main --tags
   ```

4. **合并回 develop**
   ```bash
   git checkout develop
   git merge --no-ff release/v1.0.0
   git push origin develop
   ```

---

## 13. 测试标准

### 13.1 测试类型

| 类型 | 说明 | 优先级 |
|------|------|--------|
| 功能测试 | 核心功能验证 | 🔴 高 |
| 兼容性测试 | 不同机型、系统版本 | 🟡 中 |
| 性能测试 | 启动速度、内存占用 | 🟡 中 |
| 安全测试 | 数据隔离、权限验证 | 🔴 高 |

### 13.2 测试检查清单

- [ ] 登录流程正常
- [ ] 写笔记功能正常
- [ ] AI 回复生成正常
- [ ] 笔记列表加载正常
- [ ] 搜索功能正常
- [ ] 删除/恢复功能正常
- [ ] 邮票购买流程正常
- [ ] 主题切换正常
- [ ] 数据隔离正常（只能查看自己的数据）

### 13.3 回归测试清单

**登录模块变更后必须测试**：
- [ ] 新用户注册流程
- [ ] 老用户登录流程
- [ ] 头像显示正常
- [ ] 昵称显示正常
- [ ] 数据库同步正常

---

## 14. 安全规则增强

> 📌 **核心目标**：构建多层次安全防护体系，确保数据安全、访问可控、输入可信

### 14.1 数据安全规范

#### 14.1.1 敏感数据存储规范

**禁止明文存储**：
```javascript
// ❌ 禁止：明文存储敏感信息
const userData = {
  phone: '13800138000',
  idCard: '110101199001011234',
  password: 'user123456'
};

// ✅ 正确：敏感数据加密存储
const CryptoUtil = {
  encrypt(data, key) {
    // 使用微信小程序加密API或云函数加密
    return wx.cloud.callFunction({
      name: 'crypto',
      data: { action: 'encrypt', data, key }
    });
  },

  decrypt(encryptedData, key) {
    return wx.cloud.callFunction({
      name: 'crypto',
      data: { action: 'decrypt', data: encryptedData, key }
    });
  }
};
```

**数据脱敏显示**：
```javascript
const DataMask = {
  phone(phone) {
    if (!phone || phone.length !== 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  idCard(idCard) {
    if (!idCard || idCard.length < 15) return idCard;
    return idCard.replace(/(.{6}).*(.{4})/, '$1********$2');
  },

  name(name) {
    if (!name) return name;
    if (name.length <= 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }
};
```

#### 14.1.2 数据库安全规范

**数据库权限规则**：
```json
// database_rules.json
{
  "letters": {
    ".read": "auth.uid != null && data.userId == auth.uid",
    ".write": "auth.uid != null && data.userId == auth.uid"
  },
  "users": {
    ".read": "auth.uid != null && data._id == auth.uid",
    ".write": "auth.uid != null && data._id == auth.uid"
  }
}
```

**查询安全检查**：
```javascript
// ✅ 安全查询：始终添加用户ID过滤
async function getLetters(userId) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }
  
  return await db.collection('letters')
    .where({
      userId: userId  // 强制数据隔离
    })
    .get();
}

// ❌ 危险查询：可能泄露其他用户数据
async function getLettersUnsafe() {
  return await db.collection('letters').get();
}
```

#### 14.1.3 数据备份与恢复

**自动备份策略**：
```javascript
// 云函数：定时数据备份
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const backupDate = new Date().toISOString().split('T')[0];
  
  // 备份关键数据
  const collections = ['letters', 'users', 'stamps'];
  const backupResults = {};
  
  for (const collection of collections) {
    const result = await db.collection(collection)
      .limit(1000)
      .get();
    
    backupResults[collection] = result.data;
  }
  
  // 存储到云存储
  await cloud.uploadFile({
    cloudPath: `backups/${backupDate}/data.json`,
    fileContent: JSON.stringify(backupResults)
  });
  
  return { success: true, date: backupDate };
};
```

### 14.2 访问控制规范

#### 14.2.1 用户身份验证

**登录状态检查**：
```javascript
const AuthGuard = {
  // 检查登录状态
  checkLogin() {
    const app = getApp();
    if (!app.globalData.userInfo || !app.globalData.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.navigateTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },

  // 获取当前用户ID
  getCurrentUserId() {
    const app = getApp();
    return app.globalData.userInfo?._id || null;
  },

  // 验证用户权限
  async verifyPermission(resourceId, resourceType) {
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    
    // 调用云函数验证权限
    const result = await wx.cloud.callFunction({
      name: 'authCheck',
      data: { userId, resourceId, resourceType }
    });
    
    return result.result.hasPermission;
  }
};
```

#### 14.2.2 功能权限控制

**权限级别定义**：
```javascript
const PermissionLevels = {
  GUEST: 0,      // 游客：仅可浏览公开内容
  USER: 1,       // 普通用户：可使用基础功能
  VIP: 2,        // VIP用户：可使用高级功能
  ADMIN: 99      // 管理员：全部权限
};

const FeaturePermissions = {
  writeLetter: PermissionLevels.USER,
  aiReply: PermissionLevels.USER,
  exportData: PermissionLevels.VIP,
  advancedAnalysis: PermissionLevels.VIP
};

function checkFeatureAccess(feature, userLevel) {
  const requiredLevel = FeaturePermissions[feature];
  if (requiredLevel === undefined) return false;
  return userLevel >= requiredLevel;
}
```

**功能访问拦截**：
```javascript
Page({
  onWriteLetter() {
    if (!AuthGuard.checkLogin()) return;
    
    const userLevel = this.getUserLevel();
    if (!checkFeatureAccess('writeLetter', userLevel)) {
      wx.showModal({
        title: '权限不足',
        content: '该功能需要登录后使用',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }
    
    wx.navigateTo({ url: '/pages/write/write' });
  }
});
```

#### 14.2.3 接口访问频率限制

**请求频率控制**：
```javascript
const RateLimiter = {
  limits: {},
  
  // 检查是否超过限制
  checkLimit(key, maxCount, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.limits[key]) {
      this.limits[key] = [];
    }
    
    // 清理过期记录
    this.limits[key] = this.limits[key].filter(time => time > windowStart);
    
    // 检查是否超限
    if (this.limits[key].length >= maxCount) {
      return false;
    }
    
    // 记录本次请求
    this.limits[key].push(now);
    return true;
  },

  // 清理所有记录
  clear() {
    this.limits = {};
  }
};

// 使用示例：限制每分钟最多10次请求
if (!RateLimiter.checkLimit('api_call', 10, 60000)) {
  wx.showToast({
    title: '请求过于频繁',
    icon: 'none'
  });
  return;
}
```

### 14.3 输入验证规范

#### 14.3.1 输入内容验证

**文本输入验证**：
```javascript
const InputValidator = {
  // 验证字符串长度
  validateLength(str, min, max, fieldName = '内容') {
    if (!str) return { valid: false, message: `${fieldName}不能为空` };
    if (str.length < min) return { valid: false, message: `${fieldName}不能少于${min}个字符` };
    if (str.length > max) return { valid: false, message: `${fieldName}不能超过${max}个字符` };
    return { valid: true };
  },

  // 验证特殊字符
  validateNoSpecialChars(str, fieldName = '内容') {
    const dangerousPattern = /[<>\"'&]/;
    if (dangerousPattern.test(str)) {
      return { valid: false, message: `${fieldName}包含非法字符` };
    }
    return { valid: true };
  },

  // 验证手机号
  validatePhone(phone) {
    const phonePattern = /^1[3-9]\d{9}$/;
    if (!phone) return { valid: false, message: '手机号不能为空' };
    if (!phonePattern.test(phone)) return { valid: false, message: '手机号格式不正确' };
    return { valid: true };
  },

  // 验证昵称
  validateNickname(nickname) {
    if (!nickname) return { valid: false, message: '昵称不能为空' };
    if (nickname.length > 20) return { valid: false, message: '昵称不能超过20个字符' };
    if (/[^\u4e00-\u9fa5a-zA-Z0-9_]/.test(nickname)) {
      return { valid: false, message: '昵称只能包含中文、英文、数字和下划线' };
    }
    return { valid: true };
  }
};
```

#### 14.3.2 XSS 防护

**HTML 实体编码**：
```javascript
const XSSGuard = {
  // HTML实体编码
  escapeHtml(str) {
    if (!str) return '';
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, char => escapeMap[char]);
  },

  // HTML实体解码
  unescapeHtml(str) {
    if (!str) return '';
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/'
    };
    return String(str).replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, entity => unescapeMap[entity] || entity);
  },

  // 富文本过滤
  sanitizeRichText(html) {
    // 仅允许安全标签
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'span'];
    // 实际项目中建议使用专业库或云函数处理
    return html;
  }
};
```

#### 14.3.3 SQL 注入防护

**数据库查询安全**：
```javascript
// ✅ 安全：使用参数化查询
async function searchLetters(userId, keyword) {
  return await db.collection('letters')
    .where({
      userId: userId,
      content: db.RegExp({
        regexp: escapeRegExp(keyword),
        options: 'i'
      })
    })
    .get();
}

// 转义正则特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ❌ 危险：拼接查询字符串（云数据库不直接支持，但需注意类似场景）
```

#### 14.3.4 文件上传安全

**图片上传验证**：
```javascript
const UploadValidator = {
  // 允许的图片类型
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // 最大文件大小（字节）
  maxFileSize: 10 * 1024 * 1024, // 10MB

  // 验证图片文件
  validateImage(filePath) {
    return new Promise((resolve) => {
      wx.getFileInfo({
        filePath,
        success: (res) => {
          if (res.size > this.maxFileSize) {
            resolve({ valid: false, message: '图片大小不能超过10MB' });
            return;
          }
          resolve({ valid: true });
        },
        fail: () => {
          resolve({ valid: false, message: '无法获取文件信息' });
        }
      });
    });
  },

  // 安全上传图片
  async uploadImageSafely(filePath, cloudPath) {
    const validation = await this.validateImage(filePath);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    return await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });
  }
};
```

### 14.4 安全检查清单

#### 14.4.1 开发阶段检查

| 检查项 | 检查方法 | 通过标准 |
|--------|----------|----------|
| 敏感数据加密 | 代码审查 | 无明文存储敏感信息 |
| 权限验证 | 功能测试 | 未授权访问被拒绝 |
| 输入验证 | 边界测试 | 非法输入被拦截 |
| XSS防护 | 安全扫描 | 无XSS漏洞 |
| SQL注入防护 | 安全扫描 | 无注入漏洞 |

#### 14.4.2 上线前检查

```markdown
- [ ] 所有API接口都有权限验证
- [ ] 用户数据隔离正确实现
- [ ] 敏感数据已加密存储
- [ ] 输入验证覆盖所有用户输入点
- [ ] 文件上传有类型和大小限制
- [ ] 无敏感信息泄露（日志、错误信息）
- [ ] 隐私政策已更新并用户同意
- [ ] 内容安全审核接口已接入
```

---

## 15. 文档编写要求

### 15.1 文档类型

| 类型 | 位置 | 说明 |
|------|------|------|
| 项目文档 | 根目录 | README.md、项目规范等 |
| 技术文档 | miniprogram/docs/ | 架构设计、API 文档等 |
| 代码注释 | 代码文件内 | JSDoc 格式 |

### 15.2 Markdown 规范

- 使用标题层级（#、##、###）
- 代码块指定语言
- 列表使用有序或无序列表
- 链接使用完整路径
- 表格对齐整齐

---

## 16. 团队协作规范

### 16.1 沟通原则

- **重大变更先讨论**：涉及架构、技术栈变更，先在团队讨论
- **问题及时反馈**：遇到阻塞及时反馈，不要拖延
- **文档优先**：决策和方案记录到文档

### 16.2 代码审查清单

审查者检查：
- [ ] 代码符合规范
- [ ] 逻辑正确，无明显 bug
- [ ] 注释清晰
- [ ] 无敏感信息泄露
- [ ] 测试覆盖充分

作者确保：
- [ ] 代码自测试通过
- [ ] 提交信息规范
- [ ] 变更描述清晰
- [ ] 相关文档已更新

### 16.3 问题跟踪

- 使用 Issue 跟踪 bug 和功能需求
- Issue 标签：`bug`、`feature`、`enhancement`、`documentation`
- 关联 PR：Closes #123

---

## 附录

### A. 参考资料

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [JavaScript 风格指南](https://github.com/airbnb/javascript)
- [用户隐私保护指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/)

### B. 规范变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0 | 2026-02-25 | 初始版本，建立渐进式规范框架 | - |
| v1.1 | 2026-02-25 | 添加风险评估章节、迁移指南、回滚策略 | - |
| v1.2 | 2026-02-25 | 添加重构安全预防与应对章节、完善降级策略、补充分支保护规则 | - |
| v1.3 | 2026-02-25 | 添加规则稳定性与防崩溃机制（第5章）、自动检查清单、重构流程规范、安全规则增强（第14章） | - |

---

> 📌 **最后更新**：2026-02-25
>
> 如有疑问，请联系项目负责人。

