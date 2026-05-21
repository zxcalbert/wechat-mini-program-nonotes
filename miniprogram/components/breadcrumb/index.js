Component({
  properties: {
    // 路径数组 [{ name: '首页', url: '' }, { name: '价值思维', url: '' }]
    paths: {
      type: Array,
      value: []
    }
  },

  data: {
    // 处理后的显示路径（超出3级时中间省略）
    displayPaths: []
  },

  observers: {
    'paths': function (paths) {
      if (!paths || paths.length === 0) {
        this.setData({ displayPaths: [] });
        return;
      }

      // 超过3级时，中间部分省略
      if (paths.length > 3) {
        var display = [
          paths[0],
          { name: '...', url: '', isEllipsis: true },
          paths[paths.length - 1]
        ];
        this.setData({ displayPaths: display });
      } else {
        this.setData({
          displayPaths: paths.map(function (p, i) {
            return Object.assign({}, p, { isLast: i === paths.length - 1 });
          })
        });
      }
    }
  },

  methods: {
    onItemTap: function (e) {
      var index = e.currentTarget.dataset.index;
      var path = this.data.displayPaths[index];
      if (!path || path.isEllipsis || path.isLast) return;
      this.triggerEvent('navigate', { index: index, item: path });
    }
  }
});
