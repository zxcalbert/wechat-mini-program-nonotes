const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 登录云函数
 * 返回用户的 openid，用于用户身份识别
 * @param {Object} event - 事件参数
 * @param {Object} context - 上下文信息
 * @returns {Object} 用户信息对象
 */
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 返回用户唯一标识
    return {
      code: 0,
      msg: '获取成功',
      data: {
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: -1,
      msg: '获取失败',
      error: error.message
    };
  }
};
