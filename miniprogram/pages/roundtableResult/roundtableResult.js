const db = wx.cloud.database();
const app = getApp();

Page({
  data: {
    data: null,
    statusBarHeight: 0,
    fieldColors: {
      '价值思维': '#8b4513',
      '创业创新': '#2ecc71',
      '心理学': '#9b59b6',
      '哲学': '#34495e'
    },
    loading: true
  },

  async onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: systemInfo.statusBarHeight 
    });

    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.setData({ data: data, loading: false });
      } catch (err) {
        console.error('解析数据失败:', err);
        this.setData({ loading: false });
      }
    } else if (options.id) {
      await this.fetchRoundtableById(options.id);
    }
  },

  async fetchRoundtableById(id) {
    try {
      const result = await db.collection('roundtable_discussions').doc(id).get();
      if (result.data) {
        this.setData({ data: result.data, loading: false });
      }
    } catch (err) {
      console.error('获取圆桌会议数据失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  exportText() {
    if (!this.data.data) return;

    let text = `【圆桌讨论】\n\n`;
    text += `问题：${this.data.data.content}\n\n`;
    text += `=` .repeat(40) + `\n\n`;

    if (this.data.data.structure) {
      text += `【讨论摘要】\n\n`;
      
      if (this.data.data.structure.summary) {
        text += `核心观点：${this.data.data.structure.summary}\n\n`;
      }
      
      if (this.data.data.structure.keyInsights && this.data.data.structure.keyInsights.length > 0) {
        text += `关键词：${this.data.data.structure.keyInsights.join('、')}\n\n`;
      }
      
      if (this.data.data.structure.consensusPoints && this.data.data.structure.consensusPoints.length > 0) {
        text += `共识点：\n`;
        this.data.data.structure.consensusPoints.forEach(point => {
          text += `✓ ${point}\n`;
        });
        text += `\n`;
      }
      
      if (this.data.data.structure.disagreementPoints && this.data.data.structure.disagreementPoints.length > 0) {
        text += `多元视角：\n`;
        this.data.data.structure.disagreementPoints.forEach(point => {
          text += `◇ ${point}\n`;
        });
        text += `\n`;
      }
      
      text += `=` .repeat(40) + `\n\n`;
    }

    text += `【导师回复】\n\n`;
    for (const d of this.data.data.discussions) {
      text += `【${d.mentor} - ${d.field}】\n`;
      text += d.reply + `\n\n`;
      text += `-`.repeat(40) + `\n\n`;
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  async shareImage() {
    if (!this.data.data) {
      wx.showToast({
        title: '数据未加载',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '生成中...',
      mask: true
    });

    try {
      const query = wx.createSelectorQuery();
      const canvasRes = await new Promise((resolve) => {
        query.select('#shareCanvas')
          .fields({ node: true, size: true })
          .exec((res) => resolve(res[0]));
      });

      if (!canvasRes) {
        throw new Error('获取canvas失败');
      }

      const canvas = canvasRes.node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      canvas.width = 750 * dpr;
      canvas.height = 1200 * dpr;
      ctx.scale(dpr, dpr);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1200);
      bgGradient.addColorStop(0, '#667eea');
      bgGradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 750, 1200);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.roundRect(ctx, 30, 30, 690, 1140, 20);
      ctx.fill();

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('📋 圆桌讨论', 375, 100);

      ctx.fillStyle = '#666666';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      const mentorsText = this.data.data.mentors ? this.data.data.mentors.join(' · ') : '';
      ctx.fillText(mentorsText, 375, 140);

      ctx.fillStyle = '#f8f9fa';
      this.roundRect(ctx, 50, 170, 650, 150, 12);
      ctx.fill();

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'left';
      ctx.fillText('你的问题', 70, 210);

      ctx.fillStyle = '#555555';
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      const questionText = this.data.data.content || '';
      this.wrapText(ctx, questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''), 70, 240, 610, 20);

      let yOffset = 350;

      if (this.data.data.structure) {
        ctx.fillStyle = '#f0f7ff';
        this.roundRect(ctx, 50, yOffset, 650, 200, 12);
        ctx.fill();

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillText('讨论摘要', 70, yOffset + 40);

        if (this.data.data.structure.keyInsights && this.data.data.structure.keyInsights.length > 0) {
          ctx.fillStyle = '#666666';
          ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
          const keywords = this.data.data.structure.keyInsights.slice(0, 5).join(' · ');
          ctx.fillText('关键词: ' + keywords, 70, yOffset + 75);
        }

        if (this.data.data.structure.consensusPoints && this.data.data.structure.consensusPoints.length > 0) {
          ctx.fillStyle = '#27ae60';
          ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
          const consensus = this.data.data.structure.consensusPoints[0];
          ctx.fillText('✓ ' + consensus, 70, yOffset + 110);
        }

        yOffset += 230;
      }

      const discussions = this.data.data.discussions || [];
      const showDiscussions = discussions.slice(0, 2);

      for (let i = 0; i < showDiscussions.length; i++) {
        const d = showDiscussions[i];
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        this.roundRect(ctx, 50, yOffset, 650, 180, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.fillText(d.mentor, 70, yOffset + 45);

        if (d.field) {
          const fieldColors = {
            '价值思维': '#8b4513',
            '创业创新': '#2ecc71',
            '心理学': '#9b59b6',
            '哲学': '#34495e'
          };
          ctx.fillStyle = fieldColors[d.field] || '#666666';
          this.roundRect(ctx, 70, yOffset + 55, 80, 24, 12);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
          ctx.textAlign = 'center';
          ctx.fillText(d.field, 110, yOffset + 72);
          ctx.textAlign = 'left';
        }

        ctx.fillStyle = '#555555';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        const replyText = d.reply || '';
        this.wrapText(ctx, replyText.substring(0, 80) + (replyText.length > 80 ? '...' : ''), 70, yOffset + 110, 610, 22);

        yOffset += 200;
      }

      ctx.fillStyle = '#666666';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('长按扫码查看完整讨论', 375, 1120);

      ctx.fillStyle = '#999999';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('投资日记 · 圆桌会议', 375, 1150);

      const tempFilePath = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvas: canvas,
          width: 750,
          height: 1200,
          destWidth: 750 * 2,
          destHeight: 1200 * 2,
          fileType: 'jpg',
          quality: 0.9,
          success: (res) => resolve(res.tempFilePath),
          fail: (err) => reject(err)
        });
      });

      wx.hideLoading();

      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          wx.showToast({
            title: '已保存到相册',
            icon: 'success'
          });
        },
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存相册',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting();
                }
              }
            });
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        }
      });

    } catch (err) {
      wx.hideLoading();
      console.error('生成分享图失败:', err);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    }
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 3;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        if (lineCount >= maxLines - 1) {
          ctx.fillText(line + '...', x, y);
          return;
        }
        ctx.fillText(line, x, y);
        line = words[n];
        y += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, y);
  }
});
