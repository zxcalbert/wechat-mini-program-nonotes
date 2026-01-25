# 快速参考指南

## 🎯 你做的所有改动一览

### 1️⃣ 移除了过时的导航
- ✅ 移除了"我的信箱"和"给导师写信"按钮
- ✅ 移除了 TabBar 底部导航栏
- ✅ 移除了"首页"和"写信"选项

### 2️⃣ 新增导航菜单（汉堡菜单）
```
左上角三条横线 ☰
    ↓
  侧边菜单打开
    ↓
包含内容：
  • 写作热力图（日期点阵）
  • 回收站（删除的笔记）
  • 字体设置
  • 邮票管理（查看 + 购买）
  • 关于应用
  • 退出登录（红色）
```

### 3️⃣ 新增浮动写笔记按钮
```
首页下方中间
    ↓
  圆形绿色 + 按钮
    ↓
  点击进入写笔记页面
```

### 4️⃣ 邮票系统（核心功能）
```
新用户 → 获得 3 张免费邮票

写笔记时：
  ├─ 无需回信 → 不消耗邮票
  └─ 需要回信 → 消耗 1 张邮票

等待回复：
  └─ 18 小时后收到大师回复

邮票用完：
  └─ 需要购买邮票套餐

每日限制：
  └─ 每人每天只能寄信一次
```

### 5️⃣ 邮票购买套餐
```
基础包：3 张 - ¥9.99
优享包：10 张 - ¥24.99 （热销）
畅享包：30 张 - ¥59.99
```

---

## 📱 用户使用流程

### 场景 1：首次使用应用

```
用户登录
  ↓
进入首页（笔记列表）
  ├─ 显示空列表 + 提示信息
  └─ 显示浮动 + 按钮
  ↓
点击 + 按钮
  ↓
进入写笔记页面
  ├─ 选择导师
  ├─ 选择心境
  ├─ 输入笔记（≥100字）
  ├─ 选择是否需要回信
  │  └─ 如果选"需要"，显示邮票消耗说明
  └─ 点击"寄出"
  ↓
笔记保存 + 邮票消耗（如果选了回信）
  ↓
返回首页
  └─ 笔记出现在列表中
```

### 场景 2：邮票用完了

```
写笔记页面
  ↓
选择"需要回信"
  ↓
显示警告："邮票不足"
  ↓
点击"购买邮票"
  ↓
进入邮票管理页面
  ├─ 显示当前邮票数：0
  └─ 显示购买套餐
  ↓
选择套餐
  ↓
确认购买（模拟支付）
  ↓
邮票数增加
  ↓
返回写笔记页面
  └─ 继续操作
```

### 场景 3：打开侧边菜单

```
首页
  ↓
点击左上角 ☰
  ↓
侧边菜单打开
  ├─ 显示热力图
  ├─ 菜单选项
  │  ├─ 🗑️ 回收站
  │  ├─ 🔤 字体设置
  │  ├─ 🎫 邮票(3/3)
  │  ├─ ℹ️ 关于
  │  └─ ↪️ 退出登录
  ├─ 再次点击菜单项
  │  └─ 导航到对应页面
  └─ 点击背景
      └─ 菜单关闭
```

---

## 🛠️ 开发人员指南

### 关键文件修改清单

#### 页面文件
| 文件 | 修改内容 | 状态 |
|------|--------|------|
| `pages/index/index.wxml` | 移除旧按钮，添加菜单+浮动按钮 | ✅ |
| `pages/index/index.js` | 添加侧边菜单逻辑 | ✅ |
| `pages/index/index.wxss` | 重新设计样式 | ✅ |
| `pages/write/write.wxml` | 添加邮票选择界面 | ✅ |
| `pages/write/write.js` | 添加邮票消耗逻辑 | ✅ |
| `pages/write/write.wxss` | 完整重设计 | ✅ |
| `app.json` | 移除 tabBar | ✅ |

#### 新增文件
| 文件 | 说明 |
|------|------|
| `components/sideMenu/` | 侧边菜单组件 |
| `components/heatmapCalendar/` | 热力日历组件 |
| `pages/stamps/stamps.*` | 邮票管理页面 |

#### 文档文件
| 文件 | 说明 |
|------|------|
| `DATABASE_SCHEMA.md` | 数据库设计文档 |
| `IMPLEMENTATION_GUIDE.md` | 完整实现指南 |
| `CHECKLIST.md` | 项目完成检查清单 |
| `QUICKSTART.md` | 本文件 |

---

## 💾 数据库集合结构概览

### letters（笔记集合）
```javascript
{
  _openid,        // 用户ID
  mentor,         // 导师名字
  mood,          // 心境
  content,       // 笔记内容
  status,        // pending | replied | saved
  needReply,     // 是否需要回信
  reply,         // 大师回复内容
  createTime,    // 创建时间
  replyExpectTime, // 预计回复时间
  deleted        // 是否已删除
}
```

### users（用户集合）
```javascript
{
  _openid,       // 用户ID
  stamps,        // 当前邮票数
  totalPurchased, // 总购买邮票数
  lastWriteDate, // 最后写信日期（用于每日限制）
  createdAt      // 账户创建时间
}
```

### stampHistory（邮票历史集合）
```javascript
{
  _openid,       // 用户ID
  action,        // 操作描述
  change,        // 邮票变化数（+3 或 -1）
  price,         // 价格（可选）
  time           // 时间戳
}
```

---

## ⚙️ 配置待办事项

### 立即完成
- [ ] 在 CloudBase 创建 `users` 集合
- [ ] 在 CloudBase 创建 `stampHistory` 集合
- [ ] 配置数据库安全规则

### 在 48 小时内完成
- [ ] 更新 `replyToLetter` 云函数
- [ ] 集成 DeepSeek API
- [ ] 完整功能测试

### 发布前完成
- [ ] 集成微信支付
- [ ] 线上环境测试
- [ ] 代码审查

---

## 🐛 常见问题快速解答

### Q: 如何测试邮票消耗？
```javascript
// 在 write.js 中看到这段代码：
if (needReply) {
  // 扣除邮票
  await cloudbaseUtil.update('users', userDoc._id, {
    stamps: Math.max(0, (userDoc.stamps || 3) - 1)
  });
}
```

### Q: 18小时延迟在哪儿处理？
```javascript
// 在 write.js 的 submitLetter 方法中：
replyExpectTime: needReply ? 
  new Date(Date.now() + 18 * 60 * 60 * 1000).getTime() : null
```

### Q: 每日限制如何实现？
```javascript
// 在 write.js 的 checkDailyLimit 方法中：
// 查询今天是否已有笔记
const today = new Date();
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
// 如果找到则阻止用户继续
```

### Q: 热力图数据从哪里来？
```javascript
// 目前在 index.js 的 generateHeatmapData 方法中
// 是随机生成的，需要改为从 letters 集合统计
// 按日期分组：SELECT DATE(createTime), COUNT(*) FROM letters WHERE _openid=?
```

---

## 📞 需要帮助？

### 查看文件
1. **完整实现细节** → `IMPLEMENTATION_GUIDE.md`
2. **数据库设计** → `DATABASE_SCHEMA.md`
3. **项目进度** → `CHECKLIST.md`

### 常见代码位置
| 功能 | 文件位置 |
|------|--------|
| 侧边菜单 | `components/sideMenu/index.js` |
| 邮票逻辑 | `pages/write/write.js` line 97-120 |
| 每日限制 | `pages/write/write.js` line 54-73 |
| 热力图 | `components/heatmapCalendar/index.js` |

---

## 🎉 总结

你的应用现在具备：
1. ✅ 现代化的导航菜单系统
2. ✅ 邮票购买和管理机制
3. ✅ 18小时延迟回复系统
4. ✅ 每日写信限制
5. ✅ 写作强度可视化
6. ✅ 更好的用户体验

下一步只需要：
1. 配置数据库
2. 部署云函数
3. 完整测试
4. 发布上线

祝你成功！🚀
