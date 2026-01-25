# 投资笔记数据库模型

## 集合结构

### 1. letters（笔记/信件集合）
存储用户的所有笔记和信件。

```
{
  _id: String,                      // 文档ID（自动生成）
  _openid: String,                  // 用户OpenID（自动生成）
  mentor: String,                   // 指引导师（"查理·芒格"、"巴菲特"、"段永平"）
  mood: String,                     // 当前心境（"焦虑"、"贪婪"、"平和"、"困惑"）
  content: String,                  // 笔记内容（最长5000字）
  status: String,                   // 状态（"pending"待回复、"replied"已回复、"saved"已保存）
  needReply: Boolean,               // 是否需要大师回信
  reply: String,                    // 大师的回复内容（可选）
  createTime: Number,               // 创建时间戳
  replyTime: Number,                // 回复时间戳（可选）
  replyExpectTime: Number,          // 预计回复时间（可选）
  deleted: Boolean,                 // 是否已删除（软删除）
  deleteTime: Number,               // 删除时间戳（可选）
  wordCount: Number,                // 字数统计
  labels: Array,                    // 标签数组（可选）
  attachments: Array                // 附件信息（可选）
}
```

### 2. users（用户集合）
存储用户账户信息。

```
{
  _id: String,                      // 文档ID（自动生成）
  _openid: String,                  // 用户OpenID（自动生成）
  userInfo: Object,                 // 用户信息
  stamps: Number,                   // 当前邮票数（默认3）
  totalPurchased: Number,           // 总购买邮票数
  lastWriteDate: Number,            // 最后一次写信的日期（用于每日限制）
  createdAt: Number,                // 账户创建时间
  updatedAt: Number                 // 最后更新时间
}
```

### 3. stampHistory（邮票使用历史）
记录邮票的所有操作。

```
{
  _id: String,                      // 文档ID（自动生成）
  _openid: String,                  // 用户OpenID（自动生成）
  action: String,                   // 操作描述（"购买3张邮票"、"使用1张邮票请求回信"）
  change: Number,                   // 邮票数量变化（正数为增加，负数为减少）
  price: Number,                    // 购买价格（可选）
  transactionId: String,            // 交易ID（可选）
  time: Number                      // 操作时间戳
}
```

## 关键字段说明

### letters 集合的状态字段
- `pending`: 待大师回复（需要回信且未收到回复）
- `replied`: 已回复（已收到大师回复）
- `saved`: 已保存（不需要回信的笔记）

### 每日限制规则
- 用户每天只能寄信一次
- 检查逻辑：`lastWriteDate` 是否是今天
- 实现位置：`write.js` 的 `checkDailyLimit()` 方法

### 邮票机制
- 新用户初始：3张免费邮票
- 消耗条件：请求大师回信时消耗1张
- 回复延迟：18小时后可收到回复
- 可购买套餐：3张(¥9.99)、10张(¥24.99)、30张(¥59.99)

## 数据库安全规则

### letters 集合
- 用户只能读写自己的笔记（`_openid` 过滤）
- 支持软删除（`deleted` 字段）

### users 集合
- 用户只能访问自己的账户信息
- 邮票数字段需要服务端验证

### stampHistory 集合
- 用户只能读取自己的历史记录
- 只能由云函数添加记录（防止篡改）

## 索引建议
- `letters`: `_openid` + `createTime`
- `users`: `_openid`
- `stampHistory`: `_openid` + `time`
