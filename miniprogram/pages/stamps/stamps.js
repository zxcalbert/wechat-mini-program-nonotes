const cloudbaseUtil = require('../../utils/cloudbaseUtil');

Page({
  data: {
    userStamps: 3,
    history: [],
    openid: null
  },

  onLoad() {
    this.checkAuth();
  },

  onShow() {
    if (this.data.openid) {
      this.fetchUserStamps();
      this.fetchHistory();
    }
  },

  /**
   * 检查登录状态
   */
  checkAuth() {
    const openid = wx.getStorageSync('openid');
    
    if (!openid) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }
    
    this.setData({ openid });
    this.fetchUserStamps();
    this.fetchHistory();
  },

  /**
   * 获取用户邮票数
   */
  async fetchUserStamps() {
    try {
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        const stamps = result.data[0].stamps || 3;
        this.setData({ userStamps: stamps });
      }
    } catch (err) {
      console.error('获取邮票失败:', err);
    }
  },

  /**
   * 获取使用历史
   */
  async fetchHistory() {
    try {
      const result = await cloudbaseUtil.query('stampHistory', {
        where: { _openid: this.data.openid },
        orderBy: 'time',
        orderDirection: 'desc',
        limit: 20
      });

      if (result.success) {
        const history = result.data.map(item => ({
          ...item,
          time: cloudbaseUtil.formatDate(item.time)
        }));
        this.setData({ history });
      }
    } catch (err) {
      console.error('获取历史记录失败:', err);
    }
  },

  /**
   * 购买邮票
   */
  buyPackage(e) {
    const stamps = parseInt(e.currentTarget.dataset.stamps);
    const price = parseFloat(e.currentTarget.dataset.price);

    wx.showModal({
      title: '确认购买',
      content: `确定购买 ${stamps} 张邮票，价格 ¥${price}？`,
      success: (res) => {
        if (res.confirm) {
          this.processPay(stamps, price);
        }
      }
    });
  },

  /**
   * 处理支付
   */
  async processPay(stamps, price) {
    wx.showLoading({ title: '处理中...', mask: true });

    try {
      // 这里应该调用真实的支付接口
      // 暂时使用模拟支付
      const db = wx.cloud.database();

      // 获取或创建用户记录
      const result = await cloudbaseUtil.query('users', {
        where: { _openid: this.data.openid },
        limit: 1
      });

      let userDoc = result.data[0];
      if (!userDoc) {
        // 创建用户记录
        const addRes = await db.collection('users').add({
          data: {
            stamps: stamps,
            totalPurchased: stamps,
            createdAt: db.serverDate()
          }
        });
        userDoc = { _id: addRes._id };
      } else {
        // 更新邮票数
        await cloudbaseUtil.update('users', userDoc._id, {
          stamps: (userDoc.stamps || 0) + stamps,
          totalPurchased: (userDoc.totalPurchased || 0) + stamps
        });
      }

      // 记录历史
      await db.collection('stampHistory').add({
        data: {
          action: `购买 ${stamps} 张邮票`,
          change: stamps,
          price: price,
          time: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({
        title: '购买成功',
        icon: 'success'
      });

      // 刷新数据
      this.fetchUserStamps();
      this.fetchHistory();
    } catch (err) {
      wx.hideLoading();
      console.error('购买失败:', err);
      wx.showModal({
        title: '购买失败',
        content: err.message || '请重试',
        showCancel: false
      });
    }
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});
