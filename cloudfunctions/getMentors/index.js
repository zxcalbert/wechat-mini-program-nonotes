// 云函数：getMentors
// 功能：获取分析方法列表，支持按领域筛选
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { field } = event
    
    let query = db.collection('mentors').where({
      isActive: true
    })
    
    if (field) {
      query = query.where({
        field: field,
        isActive: true
      })
    }
    
    const result = await query
      .orderBy('sortOrder', 'asc')
      .get()
    
    return {
      success: true,
      data: result.data,
      total: result.data.length,
      message: '获取分析方法列表成功'
    }
    
  } catch (e) {
    console.error('获取分析方法列表失败：', e)
    return {
      success: false,
      error: e.message,
      errorCode: 'GET_MENTORS_FAILED',
      message: '获取分析方法列表失败，请稍后重试'
    }
  }
}
