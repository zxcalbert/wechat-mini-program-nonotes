const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const mentorRules = require('./mentorRules.json');
  return {
    success: true,
    data: mentorRules
  };
};
