var markdownUtil = require('../../utils/markdownUtil');

Component({
  properties: {
    // markdown 原始文本
    content: {
      type: String,
      value: ''
    }
  },

  data: {
    htmlNodes: '',
    themeClass: ''
  },

  lifetimes: {
    attached: function() {
      var app = getApp();
      this.setData({
        themeClass: app.getThemeClass ? app.getThemeClass() : ''
      });
    }
  },

  observers: {
    'content': function(val) {
      if (!val) {
        this.setData({ htmlNodes: '' });
        return;
      }
      var html = markdownUtil.parse(val);
      this.setData({ htmlNodes: html });
    }
  }
});
