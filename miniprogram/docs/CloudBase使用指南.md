# CloudBase 文档数据库在微信小程序中的使用指南

## 概述

本指南介绍如何在微信小程序中使用 CloudBase 文档数据库实现数据的查询、添加、更新和删除操作。

## 基础配置

### 1. 初始化云开发环境

在 `app.js` 中初始化云开发环境：

```javascript
App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'your-env-id', // 替换为你的环境 ID
      traceUser: true,
    });
  }
});
```

## 使用 CloudbaseUtil 工具类

### 导入工具类

```javascript
const cloudbaseUtil = require('../../utils/cloudbaseUtil');
```

## 常见操作

### 1. 查询数据

#### 基础查询 - 获取所有数据

```javascript
async fetchAllLetters() {
  const result = await cloudbaseUtil.query('letters');
  if (result.success) {
    console.log('查询成功:', result.data);
  } else {
    console.error('查询失败:', result.error);
  }
}
```

#### 带条件查询 - 获取当前用户的数据

```javascript
async fetchMyLetters() {
  const result = await cloudbaseUtil.query('letters', {
    where: {
      _openid: '{openid}' // 云数据库魔术变量，自动替换为当前用户ID
    },
    orderBy: 'createTime',
    orderDirection: 'desc',
    limit: 10
  });
  
  if (result.success) {
    this.setData({ letters: result.data });
  }
}
```

#### 带分页查询

```javascript
async fetchLettersWithPagination(pageIndex = 1) {
  const result = await cloudbaseUtil.queryWithPagination('letters', {
    where: { _openid: '{openid}' },
    orderBy: 'createTime',
    orderDirection: 'desc',
    pageIndex: pageIndex,
    pageSize: 10
  });
  
  if (result.success) {
    this.setData({
      letters: result.data,
      pageInfo: {
        current: result.pageIndex,
        total: result.total,
        pageCount: result.pageCount
      }
    });
  }
}
```

#### 查询单条记录

```javascript
async getLetterDetail(docId) {
  const result = await cloudbaseUtil.getById('letters', docId);
  
  if (result.success) {
    this.setData({ letter: result.data });
  } else {
    wx.showToast({
      title: '获取详情失败',
      icon: 'error'
    });
  }
}
```

### 2. 添加数据

```javascript
async saveLetter() {
  const letterData = {
    content: this.data.content,
    mentor: this.data.selectedMentor,
    mood: this.data.selectedMood,
    status: 'pending',
    // createTime 和 updateTime 会自动添加
  };

  wx.showLoading({ title: '保存中...' });
  
  const result = await cloudbaseUtil.add('letters', letterData);
  
  wx.hideLoading();
  
  if (result.success) {
    wx.showToast({
      title: '寄出成功！',
      icon: 'success'
    });
    
    // 保存文档ID供后续使用
    this.setData({ letterId: result.docId });
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  } else {
    wx.showToast({
      title: '保存失败，请重试',
      icon: 'error'
    });
  }
}
```

### 3. 更新数据

#### 更新单条记录

```javascript
async updateLetterStatus(docId, newStatus) {
  wx.showLoading({ title: '更新中...' });
  
  const result = await cloudbaseUtil.update('letters', docId, {
    status: newStatus,
    // updateTime 会自动更新
  });
  
  wx.hideLoading();
  
  if (result.success) {
    wx.showToast({ title: '更新成功', icon: 'success' });
    // 刷新列表
    this.fetchLetters();
  } else {
    wx.showToast({ title: '更新失败', icon: 'error' });
  }
}
```

#### 批量更新

```javascript
async markAllAsRead() {
  const result = await cloudbaseUtil.updateBatch('letters', 
    { _openid: '{openid}', status: 'pending' }, // 查询条件
    { status: 'read' } // 更新数据
  );
  
  if (result.success) {
    wx.showToast({ 
      title: `已标记 ${result.updated} 条为已读`,
      icon: 'success'
    });
  }
}
```

### 4. 删除数据

```javascript
async deleteLetter(docId) {
  wx.showModal({
    title: '确认删除？',
    content: '删除后无法恢复',
    success: async (res) => {
      if (res.confirm) {
        wx.showLoading({ title: '删除中...' });
        
        const result = await cloudbaseUtil.delete('letters', docId);
        
        wx.hideLoading();
        
        if (result.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.fetchLetters();
        } else {
          wx.showToast({ title: '删除失败', icon: 'error' });
        }
      }
    }
  });
}
```

## 数据库权限配置

在开始使用前，需要配置集合的安全规则。以 `letters` 集合为例：

### 推荐配置方案

```javascript
// 规则表达式（在云开发控制台配置）

// 权限模式：CUSTOM（自定义）

// 读权限规则
{
  "read": "auth.uid == doc.uid || auth.uid != null"
}

// 写权限规则
{
  "write": "auth.uid == doc.uid || doc.uid == null"
}
```

### 权限说明

| 权限类型 | 说明 |
|--------|------|
| `READONLY` | 所有人可读，仅创建者可写 |
| `PRIVATE` | 仅创建者可读写 |
| `ADMINWRITE` | 所有人可读，仅管理员可写 |
| `CUSTOM` | 自定义规则 |

## 最佳实践

### 1. 错误处理

总是检查操作是否成功：

```javascript
const result = await cloudbaseUtil.query('letters');
if (!result.success) {
  console.error('操作失败:', result.error);
  // 显示用户友好的错误提示
  wx.showToast({
    title: '数据加载失败，请重试',
    icon: 'error'
  });
}
```

### 2. 加载状态管理

在进行数据库操作时显示加载状态：

```javascript
async fetchLetters() {
  this.setData({ loading: true });
  
  try {
    const result = await cloudbaseUtil.query('letters', {
      where: { _openid: '{openid}' },
      limit: 20
    });
    
    if (result.success) {
      this.setData({ letters: result.data });
    }
  } finally {
    this.setData({ loading: false });
  }
}
```

### 3. 页面生命周期集成

```javascript
Page({
  data: {
    letters: [],
    loading: false
  },

  onShow: function() {
    // 页面显示时刷新数据
    this.fetchLetters();
  },

  onPullDownRefresh: function() {
    // 下拉刷新
    this.fetchLetters().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async fetchLetters() {
    // 实现数据加载逻辑
  }
});
```

### 4. 日期格式化

使用工具类提供的日期格式化方法：

```javascript
const letters = result.data.map(item => {
  return {
    ...item,
    displayDate: cloudbaseUtil.formatDate(item.createTime),
    displayDateTime: cloudbaseUtil.formatDateTime(item.createTime)
  };
});
```

### 5. 条件查询进阶

#### 相等查询

```javascript
// 查询所有已读的信件
await cloudbaseUtil.query('letters', {
  where: { status: 'read' }
});
```

#### 范围查询

```javascript
const db = wx.cloud.database();
const _ = db.command;

// 查询创建时间在最近7天内的信件
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
await cloudbaseUtil.query('letters', {
  where: {
    createTime: _.gte(sevenDaysAgo)
  }
});
```

#### 多条件查询

```javascript
const db = wx.cloud.database();
const _ = db.command;

// 查询特定用户的已读信件
await cloudbaseUtil.query('letters', {
  where: {
    _openid: '{openid}',
    status: _.in(['read', 'replied'])
  }
});
```

## 常见问题

### Q: 如何获取当前用户ID？

A: CloudBase 会自动在查询条件中识别 `{openid}` 魔术变量，无需手动获取。

```javascript
// 自动替换为当前用户ID
where: { _openid: '{openid}' }
```

### Q: 如何实现全文搜索？

A: 文档数据库不原生支持全文搜索，可以使用 `regex` 操作：

```javascript
const db = wx.cloud.database();
const _ = db.command;

await cloudbaseUtil.query('letters', {
  where: {
    content: _.regex('搜索关键词')
  }
});
```

### Q: 如何处理并发更新冲突？

A: 建议使用 `updateTime` 时间戳来检测冲突：

```javascript
// 更新前检查是否被修改过
const current = await cloudbaseUtil.getById('letters', docId);
if (current.updateTime.getTime() === this.data.originalUpdateTime) {
  // 安全更新
  await cloudbaseUtil.update('letters', docId, {...});
}
```

## 完整示例

查看以下页面的完整实现：

- `pages/index/index.js` - 信件列表页面
- `pages/write/write.js` - 写信页面
- `pages/detail/detail.js` - 信件详情页面

## 相关资源

- [CloudBase 文档](https://docs.cloudbase.net/)
- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
