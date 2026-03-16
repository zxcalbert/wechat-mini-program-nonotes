/**
 * CloudBase 文档数据库工具类
 * 封装了常见的数据库操作，支持查询、添加、更新、删除等操作
 */

class CloudbaseUtil {
  constructor() {
    this.db = wx.cloud.database();
  }

  /**
   * 查询集合数据
   * @param {string} collectionName - 集合名称
   * @param {object} options - 查询选项
   * @param {object} options.where - 查询条件
   * @param {string} options.orderBy - 排序字段
   * @param {string} options.orderDirection - 排序方向 'asc' 或 'desc'
   * @param {number} options.limit - 返回记录数限制
   * @param {number} options.skip - 跳过记录数（用于分页）
   * @returns {Promise}
   */
  async query(collectionName, options = {}) {
    try {
      let query = this.db.collection(collectionName);

      // 构建查询条件
      if (options.where && Object.keys(options.where).length > 0) {
        query = query.where(options.where);
      }

      // 排序
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
      }

      // 分页
      if (options.skip) {
        query = query.skip(options.skip);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const res = await query.get();
      return {
        success: true,
        data: res.data,
        count: res.data.length
      };
    } catch (err) {
      console.error(`查询 ${collectionName} 失败:`, err);
      return {
        success: false,
        error: err.message,
        data: []
      };
    }
  }

  /**
   * 查询单条记录
   * @param {string} collectionName - 集合名称
   * @param {string} docId - 文档 ID
   * @returns {Promise}
   */
  async getById(collectionName, docId) {
    try {
      const res = await this.db.collection(collectionName).doc(docId).get();
      return {
        success: true,
        data: res.data
      };
    } catch (err) {
      console.error(`查询文档 ${docId} 失败:`, err);
      return {
        success: false,
        error: err.message,
        data: null
      };
    }
  }

  /**
   * 添加新文档
   * @param {string} collectionName - 集合名称
   * @param {object} data - 文档数据
   * @returns {Promise}
   */
  async add(collectionName, data) {
    try {
      // 自动添加创建时间和更新时间
      const docData = {
        ...data,
        createTime: new Date(),
        updateTime: new Date()
      };

      const res = await this.db.collection(collectionName).add({
        data: docData
      });

      return {
        success: true,
        docId: res._id,
        message: '添加成功'
      };
    } catch (err) {
      console.error(`添加到 ${collectionName} 失败:`, err);
      return {
        success: false,
        error: err.message,
        docId: null
      };
    }
  }

  /**
   * 更新文档
   * @param {string} collectionName - 集合名称
   * @param {string} docId - 文档 ID
   * @param {object} data - 更新的数据
   * @returns {Promise}
   */
  async update(collectionName, docId, data) {
    try {
      // 自动更新时间戳
      const updateData = {
        ...data,
        updateTime: new Date()
      };

      await this.db.collection(collectionName).doc(docId).update({
        data: updateData
      });

      return {
        success: true,
        message: '更新成功'
      };
    } catch (err) {
      console.error(`更新 ${collectionName} 文档失败:`, err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * 删除文档
   * @param {string} collectionName - 集合名称
   * @param {string} docId - 文档 ID
   * @returns {Promise}
   */
  async delete(collectionName, docId) {
    try {
      await this.db.collection(collectionName).doc(docId).remove();
      return {
        success: true,
        message: '删除成功'
      };
    } catch (err) {
      console.error(`删除 ${collectionName} 文档失败:`, err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * 批量更新
   * @param {string} collectionName - 集合名称
   * @param {object} where - 查询条件
   * @param {object} data - 更新的数据
   * @returns {Promise}
   */
  async updateBatch(collectionName, where, data) {
    try {
      // 先查询符合条件的所有文档
      const queryRes = await this.query(collectionName, { where });

      if (!queryRes.success || queryRes.data.length === 0) {
        return {
          success: false,
          error: '未找到匹配的文档',
          updated: 0
        };
      }

      // 逐个更新
      let updated = 0;
      for (const doc of queryRes.data) {
        const updateRes = await this.update(collectionName, doc._id, data);
        if (updateRes.success) {
          updated++;
        }
      }

      return {
        success: true,
        updated: updated,
        message: `共更新 ${updated} 条记录`
      };
    } catch (err) {
      console.error(`批量更新失败:`, err);
      return {
        success: false,
        error: err.message,
        updated: 0
      };
    }
  }

  /**
   * 聚合查询（用于统计、分组等）
   * @param {string} collectionName - 集合名称
   * @param {array} pipeline - 聚合管道
   * @returns {Promise}
   */
  async aggregate(collectionName, pipeline) {
    try {
      const res = await this.db.collection(collectionName).aggregate(pipeline).end();
      return {
        success: true,
        data: res.list
      };
    } catch (err) {
      console.error(`聚合查询失败:`, err);
      return {
        success: false,
        error: err.message,
        data: []
      };
    }
  }

  /**
   * 增量查询（用于分页加载）
   * @param {string} collectionName - 集合名称
   * @param {object} options - 查询选项
   * @returns {Promise}
   */
  async queryWithPagination(collectionName, options = {}) {
    const pageSize = options.pageSize || 10;
    const pageIndex = options.pageIndex || 1;
    const skip = (pageIndex - 1) * pageSize;

    try {
      // 先查询总数
      const countRes = await this.db.collection(collectionName).where(options.where || {}).count();
      const total = countRes.total;

      // 再查询当前页数据
      const dataRes = await this.query(collectionName, {
        where: options.where,
        orderBy: options.orderBy,
        orderDirection: options.orderDirection,
        skip: skip,
        limit: pageSize
      });

      return {
        success: dataRes.success,
        data: dataRes.data,
        pageIndex: pageIndex,
        pageSize: pageSize,
        total: total,
        pageCount: Math.ceil(total / pageSize)
      };
    } catch (err) {
      console.error(`分页查询失败:`, err);
      return {
        success: false,
        error: err.message,
        data: []
      };
    }
  }

  /**
   * 导出辅助方法：将数据库日期对象转为显示格式
   * @param {Date} date - 日期对象
   * @returns {string}
   */
  formatDate(date) {
    if (!date) return '未知';
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化为完整时间
   * @param {Date} date - 日期对象
   * @returns {string}
   */
  formatDateTime(date) {
    if (!date) return '未知';
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

// 导出单例
module.exports = new CloudbaseUtil();
