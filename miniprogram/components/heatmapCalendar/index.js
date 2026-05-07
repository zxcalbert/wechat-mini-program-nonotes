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
    generateWeeks() {
      const data = this.properties.data;
      if (!data || data.length === 0) {
        this.setData({ weeks: [] });
        return;
      }

      const weeks = [];
      let currentWeek = [];

      data.forEach((item) => {
        const count = item.count || 0;
        let intensity = 'intensity-0';
        if (count >= 3) intensity = 'intensity-3';
        else if (count === 2) intensity = 'intensity-2';
        else if (count === 1) intensity = 'intensity-1';

        currentWeek.push({ intensity });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }

      this.setData({ weeks });
    }
  }
});
