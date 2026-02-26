# 个人笔记 - 微信小程序

一个帮助用户记录个人思考并模拟AI助手回复的微信小程序。用户可以写下自己的感悟，选择不同的AI助手（查理·芒格、巴菲特、段永平、张小龙、乔布斯、马斯克），获取AI模拟的回复，帮助深入反思和思考。

## 项目预览

![个人笔记小程序](./flomo2.jpg)

## 功能特性

- **个人笔记记录** - 随时记录想法、观察、决策
- **AI助手回复** - 模拟查理·芒格、巴菲特、段永平、张小龙、乔布斯、马斯克的智慧回复
- **心境感知** - 记录写笔记时的心境（焦虑、贪婪、平和、困惑），影响回复语气
- **邮票机制** - 通过邮票控制回复次数，支持购买补充
- **回复延迟** - 18小时后可见回复，鼓励深入思考
- **笔记管理** - 支持搜索、删除、恢复、永久删除
- **热力图展示** - 可视化展示过去一年的笔记创作分布
- **数据安全** - 用户数据完全隔离，只能访问自己的笔记
- **主题切换** - 支持亮色/暗色/跟随系统模式
- **响应式布局** - 跨设备适配，动态胶囊按钮适配

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      微信小程序前端                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 登录页面 │  │ 首页列表 │  │ 写笔记   │  │ 详情页  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐                             │
│  │ 邮票购买 │  │ 回收站   │                             │
│  └──────────┘  └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    微信云开发平台                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    云函数层                         │  │
│  │  ┌──────────────┐      ┌──────────────────────┐  │  │
│  │  │ login        │      │ replyToLetter       │  │  │
│  │  │ - 获取openid │      │ - AI回复生成        │  │  │
│  │  │ - 用户认证   │      │ - DeepSeek API调用   │  │  │
│  │  └──────────────┘      └──────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    云数据库层                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │ users    │  │ letters  │  │ stampHistory │  │  │
│  │  └──────────┘  └──────────┘  └──────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   外部AI服务                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              DeepSeek API                          │  │
│  │  - AI模型调用                                      │  │
│  │  - 智能回复生成                                    │  │
│  │  - 多角色模拟                                      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 前端技术栈

- **微信小程序原生框架** - 基础框架和API
- **自定义组件开发** - 侧边菜单、热力图日历等
- **响应式数据绑定** - WXML + WXSS + JS
- **本地存储管理** - wx.storage API

### 后端技术栈

- **微信云开发** - Serverless云服务
- **云函数（Node.js）** - 业务逻辑处理
- **云数据库（MongoDB）** - 数据持久化
- **环境变量管理** - 安全配置管理

### AI服务

- **DeepSeek API** - AI模型调用
- **自定义提示词工程** - 角色模拟
- **失败降级机制** - 基于规则的备用回复

### 响应式设计

- **CSS变量主题系统** - CSS变量实现主题切换
- **动态布局** - `wx.getMenuButtonBoundingClientRect()` 胶囊按钮适配
- **安全区域适配** - `env(safe-area-inset-*)` 刘海屏适配
- **Grid布局** - 导航栏三栏均匀分布

## 开发进展

### 最新更新 (2026-02-26)

- **导航栏优化**: 实现 Grid 布局，标题完美居中
- **主题切换**: 侧边栏主题设置，组件间事件通信
- **跨设备适配**: iPhone/华为设备动态胶囊按钮适配
- **分页加载**: 笔记列表分页加载，滚动触发更多

### 技术方案

| 功能 | 技术方案 |
|-----|---------|
| 主题切换 | CSS变量 + 组件事件通信 |
| 动态胶囊 | `wx.getMenuButtonBoundingClientRect()` |
| 刘海屏适配 | `env(safe-area-inset-*)` |
| 分页加载 | `skip` + `limit` 云数据库分页 |

## 项目结构

```
invest-diary/
├── cloudfunctions/                    # 云函数目录
│   ├── login/                        # 登录云函数
│   │   ├── index.js                  # 云函数入口
│   │   ├── package.json              # 依赖配置
│   │   └── config.json              # 云函数配置
│   ├── replyToLetter/                # AI回复生成云函数
│   │   ├── index.js                  # 云函数入口
│   │   ├── package.json              # 依赖配置
│   │   ├── package-lock.json         # 依赖锁定
│   │   └── config.json              # 云函数配置
│   ├── package.json                  # 云函数依赖配置
│   └── package-lock.json             # 依赖锁定
├── miniprogram/                      # 小程序前端代码
│   ├── app.js                        # 小程序入口文件
│   ├── app.json                      # 小程序配置文件
│   ├── app.wxss                      # 全局样式文件
│   ├── pages/                        # 页面目录
│   │   ├── login/                    # 登录页面
│   │   │   ├── login.js              # 页面逻辑
│   │   │   ├── login.wxml            # 页面结构
│   │   │   ├── login.wxss            # 页面样式
│   │   │   └── login.json            # 页面配置
│   │   ├── index/                    # 首页（笔记列表）
│   │   │   ├── index.js              # 页面逻辑
│   │   │   ├── index.wxml            # 页面结构
│   │   │   ├── index.wxss            # 页面样式
│   │   │   └── index.json            # 页面配置
│   │   ├── write/                    # 写笔记页面
│   │   │   ├── write.js              # 页面逻辑
│   │   │   ├── write.wxml            # 页面结构
│   │   │   ├── write.wxss            # 页面样式
│   │   │   └── write.json            # 页面配置
│   │   ├── detail/                   # 笔记详情页面
│   │   │   ├── detail.js             # 页面逻辑
│   │   │   ├── detail.wxml           # 页面结构
│   │   │   ├── detail.wxss           # 页面样式
│   │   │   └── detail.json           # 页面配置
│   │   ├── stamps/                   # 邮票购买页面
│   │   │   ├── stamps.js             # 页面逻辑
│   │   │   ├── stamps.wxml           # 页面结构
│   │   │   ├── stamps.wxss           # 页面样式
│   │   │   └── stamps.json           # 页面配置
│   │   └── trash/                    # 回收站页面
│   │       ├── trash.js              # 页面逻辑
│   │       ├── trash.wxml            # 页面结构
│   │       ├── trash.wxss            # 页面样式
│   │       └── trash.json            # 页面配置
│   ├── components/                   # 组件目录
│   │   ├── sideMenu/                 # 侧边菜单组件
│   │   │   ├── index.js
│   │   │   ├── index.json
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   ├── cloudTipModal/            # 云提示模态框组件
│   │   │   ├── index.js
│   │   │   ├── index.json
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   └── heatmapCalendar/          # 热力图日历组件
│   │       ├── index.js
│   │       ├── index.json
│   │       ├── index.wxml
│   │       └── index.wxss
│   ├── utils/                        # 工具类目录
│   │   └── cloudbaseUtil.js          # 数据库操作工具类
│   ├── images/                       # 图片资源
│   │   └── icons/                   # 图标资源
│   ├── docs/                         # 文档目录
│   │   ├── CloudBase使用指南.md
│   │   ├── 技术架构分析文档.md
│   │   ├── 权限配置指南.md
│   │   ├── 登录和权限说明.md
│   │   └── 高级用法示例.md
│   ├── envList.js                    # 环境配置文件
│   └── sitemap.json                  # 站点地图配置
├── project.config.json               # 项目配置文件
├── project.private.config.json       # 项目私有配置文件
└── configure-database.js             # 腾讯云API配置脚本（备用）
```

## 快速开始

### 前置要求

1. **微信开发者工具** - 从 [微信公众平台](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 下载安装
2. **微信小程序账号** - 注册并登录 [微信公众平台](https://mp.weixin.qq.com/)
3. **微信云开发服务** - 开通云开发功能
4. **DeepSeek API Key** - 从 [DeepSeek](https://www.deepseek.com/) 获取
5. **Node.js 环境** - 用于本地调试云函数（可选）

### 环境配置

#### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账号并登录
3. 进入 API Key 管理页面
4. 创建新的 API Key，复制保存

#### 2. 修改项目配置

编辑 `project.config.json`，将 `appid` 修改为你自己的小程序 AppID：

```json
{
  "appid": "你的小程序AppID",
  "projectname": "invest-diary",
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  ...
}
```

### 初始化云开发环境

#### 1. 打开项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目目录（`/Users/bill/编程/invest-diary`）
4. 输入 AppID（使用测试号或你自己的 AppID）
5. 点击"导入"

#### 2. 创建云开发环境

1. 在微信开发者工具顶部菜单栏，点击"云开发"按钮
2. 如果是首次使用，会提示创建云开发环境
3. 填写环境信息：
   - 环境名称：`invest-diary-dev`（或其他你喜欢的名称）
   - 环境ID：系统自动生成，记录下来（如：`cloud1-xxxxx`）
4. 基础配置：
   - 地域：选择离你最近的区域（如：上海）
   - 套餐：免费版即可
5. 点击"开通"

#### 3. 初始化云数据库

1. 在云开发控制台中，点击"数据库"
2. 创建以下三个集合：

**users 集合（用户信息）**
```javascript
// 权限设置：仅创建者可读写
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid
  "nickName": String,      // 昵称
  "avatarUrl": String,     // 头像
  "gender": Number,        // 性别：0未知，1男，2女
  "city": String,          // 城市
  "province": String,      // 省份
  "country": String,       // 国家
  "language": String,      // 语言
  "stamps": Number,        // 邮票数量（默认3）
  "totalPurchased": Number,// 总购买邮票数
  "totalLetters": Number,  // 总笔记数
  "lastLoginTime": Date,   // 最后登录时间
  "createdAt": Date,       // 创建时间
  "updateTime": Date       // 更新时间
}
```

**letters 集合（笔记/信件）**
```javascript
// 权限设置：仅创建者可读写
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid
  "mentor": String,        // AI助手名称（查理·芒格/巴菲特/段永平/张小龙/乔布斯/马斯克）
  "mood": String,          // 心境（焦虑/贪婪/平和/困惑）
  "content": String,       // 笔记内容
  "status": String,        // 状态（pending/replied/read/archived）
  "needReply": Boolean,    // 是否需要回复
  "replyContent": String,  // 回复内容
  "replyTime": Date,       // 回复时间
  "replyExpectTime": Number,// 预期回复时间（18小时后）
  "createTime": Date,      // 创建时间
  "updateTime": Date,      // 更新时间
  "deleteTime": Date,      // 删除时间
  "deleted": Boolean       // 是否删除
}
```

**stampHistory 集合（邮票购买历史）**
```javascript
// 权限设置：仅创建者可读写
{
  "_id": String,           // 文档ID
  "_openid": String,       // 用户openid
  "action": String,        // 操作类型（购买/使用）
  "change": Number,        // 邮票变化数量
  "price": Number,         // 价格
  "time": Date             // 时间
}
```

#### 4. 配置数据库权限

在微信云开发控制台中手动配置数据库权限：

1. 进入云开发控制台
2. 点击"数据库"
3. 选择对应的集合
4. 点击"权限设置"
5. 设置权限规则为"仅创建者可读写"

**users 集合权限规则**：
```
读权限：doc._openid == auth.uid || doc._openid == ""
写权限：doc._openid == auth.uid
```

**letters 集合权限规则**：
```
读权限：doc._openid == auth.uid
写权限：doc._openid == auth.uid
```

**stampHistory 集合权限规则**：
```
读权限：doc._openid == auth.uid
写权限：doc._openid == auth.uid
```

这样配置可以确保用户只能访问自己的数据，保证数据安全。

#### 5. 部署云函数

**部署 login 云函数**

1. 在微信开发者工具左侧目录，找到 `cloudfunctions/login`
2. 右键点击 `login` 文件夹
3. 选择"上传并部署：云端安装依赖"
4. 等待部署完成

**部署 replyToLetter 云函数**

1. 找到 `cloudfunctions/replyToLetter`
2. 右键点击 `replyToLetter` 文件夹
3. 选择"上传并部署：云端安装依赖"
4. 等待部署完成

#### 6. 配置云函数环境变量

1. 进入云开发控制台
2. 点击"云函数" -> 选择 `replyToLetter`
3. 点击"配置" -> "环境变量"
4. 添加环境变量：
   - 键：`DEEPSEEK_API_KEY`
   - 值：你从 DeepSeek 获取的 API Key
5. 点击"保存"

#### 7. 更新环境ID

编辑 `miniprogram/envList.js`，将环境ID修改为你创建的环境ID：

```javascript
const envList = [
  {
    envId: 'cloud1-xxxxx',  // 替换为你的环境ID
    name: 'invest-diary-dev'
  }
];
```

### 运行项目

1. 在微信开发者工具中，点击"编译"按钮
2. 在模拟器或真机上预览
3. 首次运行会自动进入登录页面
4. 点击登录按钮进行授权

## 详细使用说明

### 登录页面

- 用户首次打开小程序，会进入登录页面
- 点击"登录"按钮，获取微信用户信息
- 授权成功后自动跳转到首页

### 首页（笔记列表）

- **笔记列表**：展示所有未删除的笔记
- **搜索功能**：输入关键词搜索笔记内容
- **删除笔记**：长按笔记卡片，删除到回收站
- **下拉刷新**：下拉页面刷新笔记列表
- **侧边菜单**：点击左上角菜单按钮，打开侧边菜单
  - 跳转到邮票购买页
  - 跳转到回收站
- **热力图**：展示过去一年的笔记创作分布

### 写笔记页面

- **选择AI助手**：查理·芒格 / 巴菲特 / 段永平 / 张小龙 / 乔布斯 / 马斯克
- **选择心境**：焦虑 / 贪婪 / 平和 / 困惑
- **输入内容**：最少需要输入100字
- **选择回复**：勾选"需要AI回复"
  - 检查邮票余额（至少1张）
  - 检查每日回复限制（最多2次/天）
  - 消耗1张邮票
  - 18小时后可查看回复

### 笔记详情页面

- **笔记内容**：展示完整的笔记内容
- **AI回复**：回复内容会在18小时后可见
- **编辑回复**：用户可以手动编辑并保存回复
- **删除笔记**：删除笔记到回收站

### 邮票购买页面

- **邮票余额**：展示当前邮票数量
- **购买套餐**：
  - 5张 - ¥5
  - 10张 - ¥9
  - 20张 - ¥16
  - 50张 - ¥35
- **购买历史**：展示邮票购买记录

### 回收站页面

- **已删除笔记**：展示所有已删除的笔记
- **恢复笔记**：恢复笔记到正常状态
- **永久删除**：永久删除笔记
- **清空回收站**：清空所有已删除笔记

## 数据库操作工具类

项目封装了一个数据库操作工具类 `miniprogram/utils/cloudbaseUtil.js`，提供以下方法：

```javascript
// 初始化数据库连接
init(envId)

// 获取集合引用
collection(collectionName)

// 添加文档
add(collectionName, data)

// 获取单个文档
get(collectionName, id)

// 查询文档
query(collectionName, conditions, options)

// 更新文档
update(collectionName, id, data)

// 删除文档
remove(collectionName, id)
```

## 云函数说明

### login 云函数

获取用户的 openid，用于标识用户身份。

**请求参数**：无

**返回结果**：
```javascript
{
  code: 0,
  msg: '获取成功',
  data: {
    openid: '用户openid',
    appid: '小程序appid',
    unionid: '用户unionid'
  }
}
```

### replyToLetter 云函数

调用 DeepSeek API 生成AI助手回复。

**请求参数**：
```javascript
{
  letterId: '笔记ID',
  mentor: 'AI助手名称',
  mood: '心境',
  content: '笔记内容'
}
```

**返回结果**：
```javascript
{
  code: 0,
  msg: '回复成功',
  data: {
    replyContent: '回复内容'
  }
}
```

## API接口文档

### 前端调用云函数

#### 调用 login 云函数

```javascript
wx.cloud.callFunction({
  name: 'login',
  data: {}
}).then(res => {
  console.log('登录成功', res.result);
  const openid = res.result.data.openid;
  wx.setStorageSync('openid', openid);
}).catch(err => {
  console.error('登录失败', err);
});
```

#### 调用 replyToLetter 云函数

```javascript
wx.cloud.callFunction({
  name: 'replyToLetter',
  data: {
    letterId: '笔记ID',
    mentor: '查理·芒格',
    mood: '平和',
    content: '笔记内容'
  }
}).then(res => {
  console.log('回复成功', res.result);
  const replyContent = res.result.data.replyContent;
}).catch(err => {
  console.error('回复失败', err);
});
```

### 数据库操作

#### 查询用户笔记

```javascript
const db = wx.cloud.database();
db.collection('letters')
  .where({
    _openid: '{openid}',  // 自动替换为当前用户openid
    deleted: false
  })
  .orderBy('createTime', 'desc')
  .get()
  .then(res => {
    console.log('查询成功', res.data);
  });
```

#### 添加新笔记

```javascript
const db = wx.cloud.database();
db.collection('letters').add({
  data: {
    mentor: '查理·芒格',
    mood: '平和',
    content: '笔记内容',
    needReply: true,
    status: 'pending',
    createTime: new Date(),
    updateTime: new Date(),
    deleted: false
  }
}).then(res => {
  console.log('添加成功', res._id);
});
```

#### 更新笔记回复

```javascript
const db = wx.cloud.database();
db.collection('letters').doc('笔记ID').update({
  data: {
    replyContent: '回复内容',
    replyTime: new Date(),
    status: 'replied',
    updateTime: new Date()
  }
}).then(res => {
  console.log('更新成功');
});
```

## 开发流程

### 本地开发环境搭建

1. **安装依赖**

```bash
# 进入云函数目录
cd cloudfunctions/login
npm install

cd ../replyToLetter
npm install
```

2. **配置环境变量**

在云函数目录下创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_api_key_here
```

3. **本地调试云函数**

在微信开发者工具中：
1. 右键点击云函数文件夹
2. 选择"本地调试"
3. 在本地调试窗口中测试云函数

### 代码提交规范

1. **分支管理**
   - `master` - 主分支，稳定版本
   - `develop` - 开发分支
   - `feature/*` - 功能分支
   - `bugfix/*` - 修复分支

2. **提交信息格式**

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(mentor): 添加张小龙、乔布斯、马斯克AI助手

- 在前端write.js中添加新AI助手
- 在云函数中添加AI助手配置
- 更新README文档

Closes #123
```

### 测试流程

1. **功能测试**
   - 测试所有页面跳转
   - 测试表单提交
   - 测试数据展示

2. **云函数测试**
   - 测试login云函数
   - 测试replyToLetter云函数
   - 测试错误处理

3. **数据库测试**
   - 测试数据增删改查
   - 测试权限控制
   - 测试数据一致性

### 部署流程

1. **代码审查**
   - 提交Pull Request
   - 代码审查
   - 合并到develop分支

2. **测试环境部署**
   - 部署到测试环境
   - 进行回归测试
   - 修复发现的问题

3. **生产环境部署**
   - 合并到master分支
   - 部署云函数
   - 更新小程序版本
   - 发布到微信平台

## 常见问题

### Q1: 云函数部署失败？

**A:** 检查以下几点：
1. 确认已开通云开发服务
2. 确认云开发环境状态正常
3. 检查网络连接
4. 尝试"右键 -> 上传并部署：云端安装依赖"
5. 查看云函数日志获取详细错误信息

### Q2: DeepSeek API 调用失败？

**A:** 检查以下几点：
1. 确认 DEEPSEEK_API_KEY 环境变量已正确配置
2. 确认 API Key 有效（未过期）
3. 检查 API 调用额度是否充足
4. 查看云函数日志获取详细错误信息
5. 检查网络连接是否正常

### Q3: 回复内容显示为空？

**A:** 可能的原因：
1. 回复还未生成（等待18小时）
2. DeepSeek API 调用失败，查看云函数日志
3. 数据库中未正确保存回复内容
4. 前端未正确获取和显示回复数据

### Q4: 邮票扣减失败？

**A:** 检查以下几点：
1. 确认用户有足够的邮票余额
2. 确认未超过每日回复限制（2次/天）
3. 查看数据库 users 集合，确认 stamps 字段存在
4. 检查云函数中的邮票扣减逻辑
5. 查看云函数日志获取详细错误信息

### Q5: 如何清空测试数据？

**A:** 在云开发控制台中：
1. 进入数据库
2. 选择对应的集合
3. 点击"清空"按钮
4. 确认清空操作

### Q6: 小程序编译报错？

**A:** 检查以下几点：
1. 确认微信开发者工具版本是否为最新
2. 检查基础库版本是否符合要求（>= 2.2.3）
3. 清除缓存后重新编译
4. 检查代码语法错误
5. 查看控制台错误信息

### Q7: 如何添加新的AI助手？

**A:** 需要修改以下文件：
1. `miniprogram/pages/write/write.js` - 在 mentors 数组中添加新AI助手名称
2. `cloudfunctions/replyToLetter/index.js` - 在 getMentorPrompt 函数中添加AI助手配置
3. `cloudfunctions/replyToLetter/index.js` - 在 generateSmartReply 函数中添加AI助手配置
4. 重新部署 replyToLetter 云函数

## 开发建议

### 本地调试云函数

1. 在云函数目录下右键
2. 选择"本地调试"
3. 需要本地安装 Node.js 环境
4. 配置本地环境变量
5. 在调试窗口中测试云函数

### 查看云函数日志

1. 进入云开发控制台
2. 点击"云函数" -> 选择对应的云函数
3. 点击"日志"查看运行日志
4. 可以按时间、错误级别筛选日志
5. 下载日志进行离线分析

### 性能优化建议

1. **数据库优化**
   - 为常用查询字段添加索引
   - 使用分页查询减少数据量
   - 避免深层次的嵌套查询
   - 合理使用缓存

2. **云函数优化**
   - 减少不必要的数据库查询
   - 使用缓存减少重复计算
   - 优化算法复杂度
   - 合理设置超时时间

3. **前端优化**
   - 使用分包加载优化启动速度
   - 图片资源压缩和懒加载
   - 合理使用本地缓存
   - 减少不必要的页面渲染

### 安全建议

1. **数据安全**
   - 使用云数据库权限控制
   - 敏感信息加密存储
   - 定期备份数据
   - 避免在前端暴露密钥

2. **API安全**
   - 使用环境变量管理密钥
   - 实施请求频率限制
   - 验证用户身份和权限
   - 记录操作日志

3. **代码安全**
   - 定期更新依赖包
   - 使用代码审查
   - 进行安全测试
   - 及时修复安全漏洞

## 版本历史

### v1.1.0 (2026-02-09)
- 新增AI助手：张小龙、乔布斯、马斯克
- 优化AI回复生成逻辑
- 更新文档说明
- 完善项目配置

### v1.0.0 (2026-02-03)
- 初始版本发布
- 支持查理·芒格、巴菲特、段永平三位AI助手
- 实现笔记记录、搜索、删除功能
- 实现邮票系统和AI回复功能
- 实现回收站功能
- 实现热力图展示功能

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

## 致谢

感谢以下开源项目和工具：

- 微信小程序开发框架
- 微信云开发平台
- DeepSeek AI API
- 所有贡献者和支持者
