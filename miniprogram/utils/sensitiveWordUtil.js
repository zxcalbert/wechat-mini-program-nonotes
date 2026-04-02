class SensitiveWordUtil {
  async detect(text) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'detectSensitiveWords',
        data: { text }
      });
      return result.result.data;
    } catch (error) {
      console.error('敏感词检测失败:', error);
      return {
        hasSensitive: false,
        isHighSensitive: false,
        isInvestment: false,
        words: [],
        categories: []
      };
    }
  }

  async filter(text) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'filterSensitiveWords',
        data: { text }
      });
      return result.result.data;
    } catch (error) {
      console.error('敏感词过滤失败:', error);
      return text;
    }
  }

  async hasSensitiveWord(text) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'hasSensitiveWord',
        data: { text }
      });
      return result.result.data;
    } catch (error) {
      console.error('敏感词检测失败:', error);
      return false;
    }
  }
}

module.exports = new SensitiveWordUtil();
