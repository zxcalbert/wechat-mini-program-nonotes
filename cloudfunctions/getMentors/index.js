// 云函数：getMentors
// 功能：获取导师列表，支持按领域筛选
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { field } = event // 可选参数：investment/entrepreneurship/psychology/philosophy
    
    let query = db.collection('mentors').where({
      isActive: true
    })
    
    // 如果指定了领域，按领域筛选
    if (field) {
      query = query.where({
        field: field,
        isActive: true
      })
    }
    
    // 按sortOrder升序排列
    const result = await query
      .orderBy('sortOrder', 'asc')
      .get()
    
    return {
      success: true,
      data: result.data,
      total: result.data.length,
      message: '获取导师列表成功'
    }
    
  } catch (e) {
    console.error('获取导师列表失败：', e)
    return {
      success: false,
      error: e.message,
      errorCode: 'GET_MENTORS_FAILED',
      message: '获取导师列表失败，请稍后重试'
    }
  }
}
