const cloud = require('wx-server-sdk');
const sensitiveWordDetector = require('./sensitiveWordDetector');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { text } = event;

  try {
    const result = sensitiveWordDetector.filter(text);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('敏感词过滤失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
