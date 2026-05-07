/**
 * 专业脑图渲染组件
 * 设计标准：麦肯锡级别的知识结构可视化
 * 特性：章节分组、多行文本、专业配色、自动布局
 */
Component({
  properties: {
    nodeData: {
      type: Object,
      value: null
    }
  },

  data: {
    selectedNode: null,
    mindmapImage: '',
    showCanvas: true
  },

  lifetimes: {
    attached() {
      this._layoutNodes = [];
    },
    ready() {
      if (this.data.nodeData) {
        this.initCanvas();
      }
    }
  },

  observers: {
    'nodeData': function(val) {
      if (val) {
        this.setData({ showCanvas: true, mindmapImage: '' });
        this.initCanvas();
      }
    }
  },

  methods: {
    initCanvas() {
      var self = this;
      var query = this.createSelectorQuery();
      query.select('#mindmapCanvas')
        .fields({ node: true, size: true })
        .exec(function(res) {
          if (!res || !res[0] || !res[0].node) {
            // canvas 节点未就绪，延迟重试
            setTimeout(function() { self.initCanvas(); }, 200);
            return;
          }
          var canvas = res[0].node;
          var ctx = canvas.getContext('2d');
          var dpr = wx.getWindowInfo().pixelRatio || 2;
          var displayWidth = res[0].width || 300;
          // 动态高度：根据内容量计算
          var sections = self.data.nodeData.sections || [];
          var totalPoints = 0;
          sections.forEach(function(s) {
            totalPoints += (s.points || []).length;
          });
          var contentHeight = Math.max(300, sections.length * 110 + totalPoints * 40 + 120);
          var displayHeight = Math.min(contentHeight, 600);

          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          ctx.scale(dpr, dpr);
          self._canvas = canvas;
          self._ctx = ctx;
          self._canvasWidth = displayWidth;
          self._canvasHeight = displayHeight;
          self._dpr = dpr;
          self._draw();
          // 延迟转换，确保绘制完成
          setTimeout(function() { self._convertToImage(); }, 500);
        });
    },

    _convertToImage() {
      if (!this._canvas) return;
      var self = this;
      wx.canvasToTempFilePath({
        canvas: this._canvas,
        quality: 1,
        success: function(res) {
          if (res.tempFilePath) {
            self.setData({ mindmapImage: res.tempFilePath, showCanvas: false });
          }
        },
        fail: function(err) {
          console.error('canvas转图片失败:', err);
          // 转换失败时保留 canvas 显示，避免黑屏
        }
      });
    },

    /**
     * 核心绘制方法 — 专业知识地图布局
     */
    _draw() {
      var ctx = this._ctx;
      var data = this.data.nodeData;
      if (!ctx || !data) return;

      var W = this._canvasWidth;
      var H = this._canvasHeight;

      // 背景
      ctx.fillStyle = '#FAFBFC';
      ctx.fillRect(0, 0, W, H);

      // 标题区
      var title = data.title || '分析脑图';
      var summary = data.summary || '';
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 16, 24);
      if (summary) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText(summary.substring(0, 30), 16, 46);
      }

      // 绘制 sections
      var sections = data.sections || [];
      var layoutNodes = [];
      var y = 76;
      var cardX = 12;
      var cardWidth = W - 24;
      var contentAreaWidth = cardWidth - 24; // 减去内边距

      for (var si = 0; si < sections.length; si++) {
        var section = sections[si];
        var points = section.points || [];
        var sectionColor = section.color || '#4A90D9';

        // section 卡片高度：标题行 + summary + points
        var cardInnerHeight = 36; // 标题行
        if (section.summary) cardInnerHeight += 22;
        cardInnerHeight += points.length * 28;
        var cardHeight = cardInnerHeight + 20; // 上下内边距

        // 检查是否超出画布，如果超出则停止绘制
        if (y + cardHeight > H - 10) break;

        // 卡片背景
        this._drawCard(ctx, cardX, y, cardWidth, cardHeight, sectionColor);

        // 左侧色条
        ctx.fillStyle = sectionColor;
        this._fillRoundRect(ctx, cardX, y, 4, cardHeight, 2);

        // section 标题
        var textX = cardX + 16;
        var textY = y + 22;
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.textBaseline = 'middle';
        var sectionTitle = this._truncateText(ctx, section.title, contentAreaWidth - 16);
        ctx.fillText(sectionTitle, textX, textY);

        // section summary
        var currentY = textY + 14;
        if (section.summary) {
          ctx.fillStyle = '#666';
          ctx.font = '11px -apple-system, sans-serif';
          var summaryLines = this._wrapText(ctx, section.summary, contentAreaWidth - 16);
          for (var sl = 0; sl < summaryLines.length; sl++) {
            ctx.fillText(summaryLines[sl], textX, currentY);
            currentY += 18;
          }
          currentY += 2;
        }

        // points
        layoutNodes.push({
          sectionId: section.id,
          title: section.title,
          color: sectionColor,
          cardY: y,
          cardHeight: cardHeight,
          points: []
        });

        for (var pi = 0; pi < points.length; pi++) {
          var point = points[pi];
          var pointY = currentY + pi * 28;

          // point 圆点
          ctx.beginPath();
          ctx.arc(textX + 4, pointY, 3, 0, Math.PI * 2);
          ctx.fillStyle = sectionColor;
          ctx.fill();

          // point 标题（加粗）
          ctx.fillStyle = '#333';
          ctx.font = '12px -apple-system, sans-serif';
          var pointTitle = point.title || '';
          var titleWidth = ctx.measureText(pointTitle).width;
          ctx.fillText(pointTitle, textX + 14, pointY + 1);

          // point detail（灰色跟随）
          if (point.detail) {
            ctx.fillStyle = '#999';
            ctx.font = '11px -apple-system, sans-serif';
            var detailText = point.detail;
            var availableWidth = contentAreaWidth - 16 - titleWidth - 30;
            if (availableWidth > 40) {
              var truncated = this._truncateText(ctx, detailText, availableWidth);
              ctx.fillText(truncated, textX + 14 + titleWidth + 8, pointY + 1);
            }
          }

          layoutNodes[layoutNodes.length - 1].points.push({
            id: point.id,
            title: pointTitle,
            detail: point.detail || '',
            y: pointY
          });
        }

        y += cardHeight + 8;
      }

      this._layoutNodes = layoutNodes;

      // 底部方法标注
      ctx.fillStyle = '#ccc';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textBaseline = 'bottom';
      var methodName = data.method_name || '';
      if (methodName) {
        ctx.fillText(methodName + ' | AI 生成', 12, H - 6);
      }
    },

    /**
     * 绘制卡片（白色背景+阴影+圆角）
     */
    _drawCard(ctx, x, y, w, h, accentColor) {
      // 阴影
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#ffffff';
      this._fillRoundRect(ctx, x, y, w, h, 8);
      ctx.restore();

      // 顶部 accent 线
      ctx.fillStyle = accentColor;
      ctx.fillRect(x + 8, y, Math.min(40, w * 0.15), 2);
    },

    _fillRoundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    },

    _truncateText(ctx, text, maxWidth) {
      if (!text) return '';
      var width = ctx.measureText(text).width;
      if (width <= maxWidth) return text;
      for (var i = text.length - 1; i > 0; i--) {
        var truncated = text.substring(0, i) + '…';
        if (ctx.measureText(truncated).width <= maxWidth) return truncated;
      }
      return text.substring(0, 1) + '…';
    },

    _wrapText(ctx, text, maxWidth) {
      if (!text) return [];
      var lines = [];
      var current = '';
      for (var i = 0; i < text.length; i++) {
        var testLine = current + text[i];
        if (ctx.measureText(testLine).width > maxWidth) {
          lines.push(current);
          current = text[i];
        } else {
          current = testLine;
        }
      }
      if (current) lines.push(current);
      return lines.slice(0, 2); // 最多2行
    },

    onImageTap(e) {
      // 图片模式下的点击处理（预留）
    },

    closePopup() {
      this.setData({ selectedNode: null });
    },

    /**
     * 导出高质量完整图片
     */
    exportImage() {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._canvas || !self._ctx) {
          reject(new Error('canvas not ready'));
          return;
        }

        var data = self.data.nodeData;
        if (!data) {
          reject(new Error('no data'));
          return;
        }

        // 如果已有图片，直接导出
        if (self.data.mindmapImage) {
          resolve(self.data.mindmapImage);
          return;
        }

        var sections = data.sections || [];
        var totalPoints = 0;
        sections.forEach(function(s) {
          totalPoints += (s.points || []).length;
        });
        var fullHeight = Math.max(300, sections.length * 110 + totalPoints * 40 + 120);

        var origWidth = self._canvasWidth;
        var origHeight = self._canvasHeight;
        var dpr = self._dpr || 2;

        self._canvasWidth = origWidth;
        self._canvasHeight = fullHeight;
        self._canvas.width = origWidth * dpr;
        self._canvas.height = fullHeight * dpr;
        self._ctx.scale(dpr, dpr);

        self._draw();

        setTimeout(function() {
          wx.canvasToTempFilePath({
            canvas: self._canvas,
            quality: 1,
            success: function(res) {
              self._canvasWidth = origWidth;
              self._canvasHeight = origHeight;
              self._canvas.width = origWidth * dpr;
              self._canvas.height = origHeight * dpr;
              self._ctx.scale(dpr, dpr);
              self._draw();
              self._convertToImage();
              resolve(res.tempFilePath);
            },
            fail: function(err) {
              self._canvasWidth = origWidth;
              self._canvasHeight = origHeight;
              self._canvas.width = origWidth * dpr;
              self._canvas.height = origHeight * dpr;
              self._ctx.scale(dpr, dpr);
              self._draw();
              reject(err);
            }
          });
        }, 300);
      });
    }
  }
});
