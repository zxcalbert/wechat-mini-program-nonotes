App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true
      });

      console.log('✅ 云开发已初始化');
      console.log('📌 AI 回复使用 DeepSeek API');
      console.log('📌 云函数: replyToLetter');
      console.log('📌 环境变量: DEEPSEEK_API_KEY');
    }
  }
});