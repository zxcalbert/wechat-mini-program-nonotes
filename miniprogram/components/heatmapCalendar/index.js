Component({
  properties: {
    data: {
      type: Array,
      value: []
    }
  },

  data: {
    weeks: []
  },

  lifetimes: {
    attached() {
      this.generateWeeks();
    }
  },

  observers: {
    'data': function(newData) {
      this.generateWeeks();
    }
  },

  methods: {
    /**
     * 将数据按周分组
     */
    generateWeeks() {
      const data = this.properties.data;
      if (!data || data.length === 0) {
        this.setData({ weeks: [] });
        return;
      }

      // 按周分组
      const weeks = [];
      let currentWeek = [];

      data.forEach((item, index) => {
        currentWeek.push(item);
        
        // 每7天为一周
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      // 最后一周
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      this.setData({ weeks });
    },

    /**
     * 根据数据强度返回样式类
     */
    getIntensity(item) {
      const count = item.count;
      if (count === 0) return 'intensity-0';
      if (count === 1) return 'intensity-1';
      if (count === 2) return 'intensity-2';
      if (count >= 3) return 'intensity-3';
      return 'intensity-0';
    }
  }
});
