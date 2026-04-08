# 智慧笔记项目 Code Wiki

## 1. 项目概述

### 1.1 项目定位
智慧笔记是一款基于微信小程序的个人思考记录工具，用户可以记录自己的感悟，选择不同的AI人生导师（查理·芒格、巴菲特、段永平、张小龙、乔布斯、马斯克），获取模拟的智慧回复，帮助用户深入反思和思考。同时支持圆桌会议功能，可同时邀请多位导师进行跨领域讨论。

### 1.2 核心功能
- ✅ 用户登录（支持游客模式，头像昵称可选）
- ✅ 笔记创建（支持选择导师和心境）
- ✅ AI回复生成（调用DeepSeek API模拟导师回复）
- ✅ 笔记列表（分页加载，滚动触发更多）
- ✅ 本地缓存（1小时缓存策略，后台更新）
- ✅ 笔记搜索（关键词搜索功能）
- ✅ 笔记删除（支持删除到回收站）
- ✅ 笔记恢复（从回收站恢复）
- ✅ 永久删除（彻底删除笔记）
- ✅ 邮票系统（邮票余额管理）
- ✅ 邮票购买（支持多种套餐购买）
- ✅ 邮票历史（购买记录查看）
- ✅ 热力图展示（年度笔记创作分布）
- ✅ 主题切换（亮色/暗色/跟随系统）
- ✅ 响应式布局（跨设备适配）
- ✅ 圆桌会议（同时邀请多位导师讨论，消耗3张邮票）
- ✅ 首页混合显示（导师回信和圆桌会议按时间混合排列）

### 1.3 项目状态
| 状态 | 说明 |
|------|------|
| 🟢 开发中 | 核心功能已完成，持续迭代优化 |
| 📅 最后更新 | 2026-04-08 |
| 🏷️ 当前版本 | v1.3.0 |

---

## 2. 整体架构

### 2.1 三层架构设计
```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序前端                        │
│  页面层 + 组件层 + 工具层，负责用户交互和界面渲染            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    微信云开发平台                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    云函数层                         │  │
│  │  业务逻辑处理、AI API调用、敏感词检测、数据库操作   │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    云数据库层                       │  │
│  │  数据持久化存储，用户、笔记、圆桌会议、邮票数据隔离存储  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   外部AI服务                              │
│  DeepSeek API：AI模型调用、智能回复生成、多角色模拟        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

#### 前端技术栈
| 技术 | 说明 |
|------|------|
| 微信小程序原生框架 | 基础框架和API |
| 自定义组件开发 | 侧边菜单、热力图日历等 |
| 响应式数据绑定 | WXML + WXSS + JS |
| 本地存储管理 | wx.storage API |
| CSS变量主题系统 | 主题切换支持 |

#### 后端技术栈
| 技术 | 说明 |
|------|------|
| 微信云开发 | Serverless云服务 |
| 云函数（Node.js） | 业务逻辑处理 |
| 云数据库（MongoDB） | 数据持久化 |
| 环境变量管理 | 安全配置管理 |

#### AI服务
| 技术 | 说明 |
|------|------|
| DeepSeek API | AI模型调用 |
| 自定义提示词工程 | 导师角色模拟 |
| 失败降级机制 | 基于规则的备用回复 |

#### 扩展技能
| 技能 | 说明 |
|------|------|
| web-access | 基于Chrome CDP的浏览器自动化，支持动态内容抓取 |

---

## 3. 主要模块职责

### 3.1 前端模块（miniprogram/）

#### 页面模块 (pages/)
| 页面 | 路径 | 职责 |
|------|------|------|
| 登录页 | `/pages/login/` | 用户登录、头像昵称设置、隐私协议确认 |
| 首页 | `/pages/index/` | 笔记和圆桌会议混合列表展示、搜索、分页加载、侧边菜单 |
| 写笔记页 | `/pages/write/` | 创建新笔记、选择导师、设置心境 |
| 笔记详情页 | `/pages/detail/` | 笔记内容展示、AI回复展示、分享功能 |
| 圆桌会议页 | `/pages/roundtable/` | 创建圆桌会议、选择3-5位导师、输入讨论内容 |
| 圆桌会议结果页 | `/pages/roundtableResult/` | 展示多位导师的讨论结果、导出文本 |
| 邮票页 | `/pages/stamps/` | 邮票余额显示、邮票套餐购买、购买历史 |
| 回收站页 | `/pages/trash/` | 已删除笔记展示、恢复、永久删除 |
| 个人中心页 | `/pages/profile/` | 用户信息展示、主题切换、热力图展示 |
| 隐私协议页 | `/pages/privacy/` | 隐私政策展示、用户协议展示 |

#### 组件模块 (components/)
| 组件 | 路径 | 职责 |
|------|------|------|
| 侧边菜单 | `/components/sideMenu/` | 全局导航菜单、功能入口 |
| 云提示模态框 | `/components/cloudTipModal/` | 操作提示、通知展示 |
| 热力图日历 | `/components/heatmapCalendar/` | 年度笔记创作分布热力图展示 |

#### 工具模块 (utils/)
| 工具 | 路径 | 职责 |
|------|------|------|
| 云数据库工具 | `/utils/cloudbaseUtil.js` | 封装数据库CRUD、分页、聚合等操作 |
| 缓存工具 | `/utils/cacheUtil.js` | 本地缓存管理、过期策略 |
| 敏感词工具 | `/utils/sensitiveWordUtil.js` | 前端敏感词预检测 |

### 3.2 云函数模块（cloudfunctions/）
| 云函数 | 路径 | 职责 |
|------|------|------|
| 登录 | `/cloudfunctions/login/` | 用户认证、获取openid、用户初始化 |
| AI回复生成 | `/cloudfunctions/replyToLetter/` | 调用DeepSeek API生成导师回复、敏感词检测、圆桌会议处理 |
| 敏感词检测 | `/cloudfunctions/detectSensitiveWords/` | 敏感词内容检测服务 |
| 过滤敏感词 | `/cloudfunctions/filterSensitiveWords/` | 敏感词内容替换服务 |
| 获取导师规则 | `/cloudfunctions/getMentorRules/` | 导师角色配置、规则获取 |
| 获取导师列表 | `/cloudfunctions/getMentors/` | 可用导师列表查询 |
| 敏感词存在检测 | `/cloudfunctions/hasSensitiveWord/` | 敏感词快速检测接口 |

### 3.3 工具脚本模块（scripts/）
| 脚本 | 路径 | 职责 |
|------|------|------|
| 项目规则检查 | `/scripts/checks/project-rules-check.js` | 代码提交前规范检查 |
| 单元测试 | `/scripts/tests/` | 各模块单元测试用例 |
| 导师数据导入 | `/scripts/import_mentors.js` | 导师规则数据批量导入 |

### 3.4 扩展技能模块（.trae/skills/）
| 技能 | 路径 | 职责 |
|------|------|------|
| web-access | `/.trae/skills/web-access/` | 基于Chrome CDP的浏览器自动化，支持动态内容抓取、交互模拟 |

---

## 4. 关键类与函数说明

### 4.1 首页核心逻辑
**路径**：`/miniprogram/pages/index/index.js`

首页负责混合显示导师回信和圆桌会议记录：

#### 核心方法
| 方法 | 功能 |
|------|------|
| `fetchLetters()` | 获取导师回信列表，支持缓存和分页 |
| `fetchRoundtables()` | 获取圆桌会议列表，带诊断日志 |
| `mergeAndSortItems()` | 合并两类数据，按createTime降序排序 |
| `refreshDisplayItems()` | 刷新合并后的显示列表，支持搜索过滤 |
| `filterLetters(keyword)` | 同时过滤两类数据的搜索功能 |
| `goToDetail(event)` | 根据类型跳转到对应详情页（回信跳detail，圆桌跳结果页） |

### 4.2 核心类：CloudbaseUtil
**路径**：`/miniprogram/utils/cloudbaseUtil.js`

云数据库操作工具类，封装了所有数据库操作：

#### 核心方法
| 方法 | 参数 | 返回值 | 功能 |
|------|------|--------|------|
| `query(collectionName, options)` | 集合名、查询选项（where, orderBy, limit, skip） | Promise&lt;查询结果&gt; | 通用数据查询 |
| `getById(collectionName, docId)` | 集合名、文档ID | Promise&lt;文档数据&gt; | 根据ID查询单条记录 |
| `add(collectionName, data)` | 集合名、文档数据 | Promise&lt;添加结果&gt; | 添加新文档，自动添加时间戳 |
| `update(collectionName, docId, data)` | 集合名、文档ID、更新数据 | Promise&lt;更新结果&gt; | 更新文档，自动更新时间戳 |
| `delete(collectionName, docId)` | 集合名、文档ID | Promise&lt;删除结果&gt; | 删除文档 |
| `queryWithPagination(collectionName, options)` | 集合名、分页选项 | Promise&lt;分页结果&gt; | 分页查询，返回总数和总页数 |
| `aggregate(collectionName, pipeline)` | 集合名、聚合管道 | Promise&lt;聚合结果&gt; | 聚合查询，用于统计分组 |

### 4.3 核心云函数：replyToLetter
**路径**：`/cloudfunctions/replyToLetter/index.js`

AI回复生成核心云函数，支持单导师回信和多导师圆桌会议：

#### 核心函数
| 函数 | 功能 |
|------|------|
| `processReply(replyContent)` | 回复内容敏感词检测和处理，高敏感内容返回合规提示 |
| `addAIDisclaimer(replyContent, mentorName)` | 添加AI回复免责声明 |
| `estimateComplexity(userContent)` | 根据用户输入内容长度估算复杂度（简单/中等/复杂） |
| `getWordCountConfig(userContent)` | 根据复杂度获取回复字数配置 |
| `countChineseWords(text)` | 计算中文文本字数 |
| `truncateByChineseWords(text, maxWords)` | 按中文字数截断文本，保持语句完整 |
| `getAIDeducedPrompt(mentorData, content, mentorName)` | 生成AI提示词，包含导师角色设定和回复规则 |

### 4.4 全局APP类
**路径**：`/miniprogram/app.js`

小程序全局入口类：

#### 核心方法
| 方法 | 功能 |
|------|------|
| `onLaunch()` | 小程序启动初始化，云开发初始化，主题初始化 |
| `initTheme()` | 初始化主题设置，从本地存储读取用户配置 |
| `setTheme(mode)` | 设置主题模式（light/dark/system） |
| `getTheme()` | 获取当前主题模式 |
| `getThemeClass()` | 获取主题对应的CSS类名 |
| `toggleTheme()` | 切换主题模式 |

---

## 5. 依赖关系

### 5.1 前端依赖
无第三方NPM依赖，全部使用微信小程序原生API和自定义实现。

### 5.2 云函数依赖
| 云函数 | 依赖包 | 版本 | 用途 |
|------|--------|------|------|
| replyToLetter | axios | ^1.6.0 | HTTP请求调用DeepSeek API |
| 所有云函数 | wx-server-sdk | ^2.6.0 | 微信云服务SDK |

### 5.3 外部服务依赖
| 服务 | 用途 | 访问方式 |
|------|------|----------|
| DeepSeek API | AI回复生成 | HTTPS POST请求，需配置API Key |
| 微信云开发 | 云函数、数据库、存储 | 内部SDK调用 |

### 5.4 web-access技能依赖
| 依赖 | 用途 |
|------|------|
| Chrome浏览器 | 提供真实浏览器环境，需开启远程调试 |
| Node.js | CDP代理服务运行环境 |

---

## 6. 项目运行方式

### 6.1 前置要求
1. 微信开发者工具（v1.06+）
2. 微信小程序账号并开通云开发服务
3. DeepSeek API Key

### 6.2 环境配置
1. 导入项目到微信开发者工具，输入小程序AppID
2. 创建云开发环境，记录环境ID
3. 在云开发控制台创建集合：`users`、`letters`、`roundtable_discussions`、`stampHistory`，权限均设置为"仅创建者可读写"
4. 部署所有云函数：右键云函数目录 → "上传并部署：云端安装依赖"
5. 为`replyToLetter`云函数配置环境变量`DEEPSEEK_API_KEY`
6. 更新`miniprogram/envList.js`中的环境ID为你的云开发环境ID

### 6.3 运行项目
1. 点击微信开发者工具"编译"按钮
2. 在模拟器或真机上预览

### 6.4 部署发布
1. 测试所有功能正常
2. 在微信开发者工具点击"上传"
3. 登录微信公众平台提交审核
4. 审核通过后发布上线

---

## 7. 数据模型

### 7.1 users 集合（用户表）
```javascript
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid（系统自动生成）
  "nickName": String,      // 用户昵称
  "avatarUrl": String,     // 用户头像URL
  "stamps": Number,        // 邮票数量（默认初始10张）
  "totalPurchased": Number,// 总购买邮票数
  "totalLetters": Number,  // 总创建笔记数
  "lastLoginTime": Date,   // 最后登录时间
  "createdAt": Date        // 用户创建时间
}
```

### 7.2 letters 集合（笔记表）
```javascript
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid
  "mentor": String,        // 导师名称（如："查理·芒格"）
  "mood": String,          // 心境（如："困惑"、"开心"）
  "content": String,       // 笔记内容
  "status": String,        // 状态："pending"/"replied"/"failed"
  "needReply": Boolean,    // 是否需要AI回复
  "replyContent": String,  // AI回复内容
  "replyTime": Date,       // 回复时间
  "createTime": Date,      // 笔记创建时间
  "deleted": Boolean       // 是否删除（默认false）
}
```

### 7.3 roundtable_discussions 集合（圆桌会议表）
```javascript
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid
  "mentors": Array,        // 导师名称数组（如：["查理·芒格", "巴菲特", "段永平"]）
  "content": String,       // 讨论内容
  "discussions": Array,    // 讨论结果数组，每个元素包含mentor、field、reply
  "createTime": Date,      // 创建时间
  "status": String         // 状态："pending"/"completed"/"failed"
}
```

### 7.4 stampHistory 集合（邮票历史表）
```javascript
{
  "_id": String,
  "_openid": String,
  "action": String,        // 动作："purchase"/"use"
  "change": Number,        // 邮票变化数量（正数为增加，负数为减少）
  "price": Number,         // 购买价格（单位：分，使用时为0）
  "time": Date            // 操作时间
}
```

---

## 8. 开发规范

### 8.1 核心原则
- 保护现有原型，渐进式升级，禁止一次性大规模重构
- 单次修改文件数≤5个，代码行数≤200行，影响模块≤1个
- 禁止迁移到TypeScript，禁止更换状态管理方案

### 8.2 代码风格
- 缩进：2空格
- 分号：必须
- 引号：单引号
- 函数必须有完整中文docstring
- 复杂逻辑必须有中文行内注释

### 8.3 Git工作流
```
main (生产)
  └── develop (开发)
        ├── feature/xxx  # 新功能分支
        ├── fix/xxx      # 修复分支
        └── docs/xxx     # 文档分支
```

提交格式：`&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;`
- type: feat/fix/docs/style/refactor/test/chore

### 8.4 安全规范
- 敏感数据加密存储
- 所有数据库查询强制用户ID过滤
- 用户输入必须经过敏感词检测
- API Key等敏感信息必须使用环境变量存储，禁止硬编码

---

## 9. 常见问题

### Q1: AI回复生成失败怎么办？
A: 首先检查`replyToLetter`云函数的环境变量`DEEPSEEK_API_KEY`是否正确配置，其次检查API调用额度是否充足，最后查看云函数日志排查具体错误。

### Q2: 如何添加新的AI导师？
A: 编辑`cloudfunctions/replyToLetter/mentorRules_expanded.json`文件，添加新导师的角色设定和核心原则，重新部署云函数即可。

### Q3: 邮票机制是怎样的？
A: 新用户默认赠送10张邮票，每生成一次AI导师回信消耗1张邮票，圆桌会议消耗3张邮票。用户可以在邮票页面购买更多邮票套餐。

### Q4: 圆桌会议功能如何使用？
A: 在首页点击浮动菜单选择"圆桌会议"，选择3-5位导师，输入讨论内容，提交后消耗3张邮票，即可获得多位导师的跨领域讨论结果。

### Q5: 首页为什么看不到圆桌会议记录？
A: 首先检查`roundtable_discussions`集合是否存在，其次确认数据的`_openid`字段是否匹配当前用户，可查看控制台日志中的诊断信息。

### Q6: 用户数据是如何隔离的？
A: 云数据库权限设置为"仅创建者可读写"，每个用户只能访问自己创建的笔记、圆桌会议和数据，云函数操作也会自动校验用户openid。
