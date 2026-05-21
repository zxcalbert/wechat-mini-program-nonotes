const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 举报内容云函数
// 接收用户举报的 AI 生成内容，存入 reports 集合
exports.main = async (event, context) => {
  const { contentId, contentType, reason } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 参数校验
  if (!contentId || !contentType || !reason) {
    return {
      success: false,
      message: '缺少必要参数：contentId, contentType, reason'
    };
  }

  // 校验 contentType 合法值
  const validTypes = ['letter', 'roundtable', 'incubator', 'structure_analysis'];
  if (!validTypes.includes(contentType)) {
    return {
      success: false,
      message: 'contentType 不合法'
    };
  }

  // 校验 reason 长度
  if (reason.length > 500) {
    return {
      success: false,
      message: '举报原因不能超过500字'
    };
  }

  try {
    const report = {
      _openid: openid,
      contentId: contentId,
      contentType: contentType,
      reason: reason,
      status: 'pending',        // 待处理
      createTime: new Date()
    };

    const result = await db.collection('reports').add({ data: report });

    return {
      success: true,
      data: {
        reportId: result._id,
        message: '举报已提交，我们会尽快处理'
      }
    };
  } catch (err) {
    console.error('提交举报失败:', err);
    return {
      success: false,
      message: '提交举报失败，请稍后重试'
    };
  }
};
