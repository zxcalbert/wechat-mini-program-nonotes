# 投资笔记 - 微信小程序

一个帮助用户记录投资思考并模拟投资大师回复的微信小程序。用户可以写下自己的投资感悟，选择不同的投资导师（查理·芒格、巴菲特、段永平），获取AI模拟的大师回复，帮助深入反思投资决策。

## 项目预览

![投资笔记小程序](./flomo2.jpg)

## 功能特性

- **投资笔记记录** - 随时记录投资想法、市场观察、交易决策
- **AI大师回复** - 模拟查理·芒格、巴菲特、段永平的投资智慧回复
- **心境感知** - 记录写笔记时的心境（焦虑、贪婪、平和、困惑），影响回复语气
- **邮票机制** - 通过邮票控制回复次数，支持购买补充
- **回复延迟** - 18小时后可见回复，鼓励深入思考
- **笔记管理** - 支持搜索、删除、恢复、永久删除
- **热力图展示** - 可视化展示过去一年的笔记创作分布
- **数据安全** - 用户数据完全隔离，只能访问自己的笔记

## 技术架构

### 前端
- 微信小程序原生框架
- 自定义组件开发（侧边菜单、热力图日历等）
- 响应式数据绑定
- 本地存储管理

### 后端
- 微信云开发
- 云函数（Node.js）
- 云数据库（MongoDB）
- 环境变量管理

### AI服务
- DeepSeek API
- 自定义提示词工程
- 失败降级机制

## 项目结构

```
invest-diary/
├── cloudfunctions/                    # 云函数目录
│   ├── login/                        # 登录云函数
│   │   ├── index.js                  # 云函数入口
│   │   └── package.json              # 依赖配置
│   ├── replyToLetter/                # AI回复生成云函数
│   │   ├── index.js                  # 云函数入口
│   │   └── package.json              # 依赖配置
│   ├── node_modules/                 # 云函数依赖
│   ├── package-lock.json             # 依赖锁定
│   └── package.json                  # 云函数依赖配置
├── miniprogram/                      # 小程序前端代码
│   ├── app.js                        # 小程序入口文件
│   ├── app.json                      # 小程序配置文件
│   ├── app.wxss                      # 全局样式文件
│   ├── pages/                        # 页面目录
│   │   ├── login/                    # 登录页面
│   │   │   ├── login.js
│   │   │   ├── login.wxml
│   │   │   ├── login.wxss
│   │   │   └── login.json
│   │   ├── index/                    # 首页（笔记列表）
│   │   │   ├── index.js
│   │   │   ├── index.wxml
│   │   │   ├── index.wxss
│   │   │   └── index.json
│   │   ├── write/                    # 写笔记页面
│   │   │   ├── write.js
│   │   │   ├── write.wxml
│   │   │   ├── write.wxss
│   │   │   └── write.json
│   │   ├── detail/                   # 笔记详情页面
│   │   │   ├── detail.js
│   │   │   ├── detail.wxml
│   │   │   ├── detail.wxss
│   │   │   └── detail.json
│   │   ├── stamps/                   # 邮票购买页面
│   │   │   ├── stamps.js
│   │   │   ├── stamps.wxml
│   │   │   ├── stamps.wxss
│   │   │   └── stamps.json
│   │   └── trash/                    # 回收站页面
│   │       ├── trash.js
│   │       ├── trash.wxml
│   │       ├── trash.wxss
│   │       └── trash.json
│   ├── components/                   # 组件目录
│   │   ├── sideMenu/                 # 侧边菜单组件
│   │   ├── cloudTipModal/            # 云提示模态框组件
│   │   └── heatmapCalendar/          # 热力图日历组件
│   ├── utils/                        # 工具类目录
│   │   └── cloudbaseUtil.js          # 数据库操作工具类
│   ├── images/                       # 图片资源
│   ├── envList.js                    # 环境配置文件
│   └── sitemap.json                  # 站点地图配置
├── project.config.json               # 项目配置文件
├── project.private.config.json       # 项目私有配置文件
└── configure-database.js             # 数据库权限配置脚本
```

## 快速开始

### 前置要求

1. **微信开发者工具** - 从 [微信公众平台](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 下载安装
2. **微信小程序账号** - 注册并登录 [微信公众平台](https://mp.weixin.qq.com/)
3. **微信云开发服务** - 开通云开发功能
4. **DeepSeek API Key** - 从 [DeepSeek](https://www.deepseek.com/) 获取

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
  "mentor": String,        // 导师名称（查理·芒格/巴菲特/段永平）
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

#### 4. 部署云函数

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

#### 5. 配置云函数环境变量

1. 进入云开发控制台
2. 点击"云函数" -> 选择 `replyToLetter`
3. 点击"配置" -> "环境变量"
4. 添加环境变量：
   - 键：`DEEPSEEK_API_KEY`
   - 值：你从 DeepSeek 获取的 API Key
5. 点击"保存"

#### 6. 更新环境ID

编辑 `miniprogram/envList.js`，将环境ID修改为你创建的环境ID：

```javascript
const envList = [
  {
    envId: 'cloud1-xxxxx',  // 替换为你的环境ID
    name: 'invest-diary-dev'
  }
];
```

同时更新 `configure-database.js` 中的环境ID：

```javascript
const ENV_ID = 'cloud1-xxxxx';  // 替换为你的环境ID
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

- **选择导师**：查理·芒格 / 巴菲特 / 段永平
- **选择心境**：焦虑 / 贪婪 / 平和 / 困惑
- **输入内容**：最少需要输入100字
- **选择回复**：勾选"需要大师回复"
  - 检查邮票余额（至少1张）
  - 检查每日回复限制（最多2次/天）
  - 消耗1张邮票
  - 18小时后可查看回复

### 笔记详情页面

- **笔记内容**：展示完整的笔记内容
- **大师回复**：回复内容会在18小时后可见
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

调用 DeepSeek API 生成投资大师回复。

**请求参数**：
```javascript
{
  letterId: '笔记ID',
  mentor: '导师名称',
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

## 常见问题

### Q1: 云函数部署失败？

**A:** 检查以下几点：
1. 确认已开通云开发服务
2. 确认云开发环境状态正常
3. 检查网络连接
4. 尝试"右键 -> 上传并部署：云端安装依赖"

### Q2: DeepSeek API 调用失败？

**A:** 检查以下几点：
1. 确认 DEEPSEEK_API_KEY 环境变量已正确配置
2. 确认 API Key 有效（未过期）
3. 检查 API 调用额度是否充足
4. 查看云函数日志获取详细错误信息



### Q3: 回复内容显示为空？

**A:** 可能的原因：
1. 回复还未生成（等待18小时）
2. DeepSeek API 调用失败，查看云函数日志
3. 数据库中未正确保存回复内容

### Q4: 邮票扣减失败？

**A:** 检查以下几点：
1. 确认用户有足够的邮票余额
2. 确认未超过每日回复限制（2次/天）
3. 查看数据库 users 集合，确认 stamps 字段存在

### Q5: 如何清空测试数据？

**A:** 在云开发控制台中：
1. 进入数据库
2. 选择对应的集合
3. 点击"清空"按钮

## 开发建议

### 本地调试云函数

1. 在云函数目录下右键
2. 选择"本地调试"
3. 需要本地安装 Node.js 环境

### 查看云函数日志

1. 进入云开发控制台
2. 点击"云函数" -> 选择对应的云函数
3. 点击"日志"查看运行日志

### 性能优化建议

1. 使用数据库索引提升查询性能
2. 云函数中使用缓存减少重复计算
3. 前端使用分包加载优化启动速度

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。
