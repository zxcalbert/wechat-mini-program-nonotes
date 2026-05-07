const app = getApp();
const ROUND_TABLE_FIX_STORAGE_KEY = 'roundtableOwnershipFixed_v1';
const ROUND_TABLE_FIX_IDS = [
  'dde8ef4869d88bba03a293ce59345060',
  'c25002a969da3da503d81df908307dd2',
  '69d4baf669da687403d8985006f45df1',
  'f6fcfb9c69da6d0703d86bd34f09d13d'
];

Page({
  data: {
    avatarUrl: '/images/avatar.png',
    nickname: '思考者',
    themeClass: '',
    loading: false,
    showRoundtableFixButton: false,
    fixRoundtableLoading: false
  },

  onLoad: function() {
    this.setData({ themeClass: app.getThemeClass() });
    this.loadUserProfile();
    this.loadFixState();
  },

  onShow: function() {
    this.setData({ themeClass: app.getThemeClass() });
  },

  loadUserProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
      nickname: userInfo.nickName || userInfo.nickname || '思考者'
    });
  },

  loadFixState() {
    const fixed = wx.getStorageSync(ROUND_TABLE_FIX_STORAGE_KEY) === true;
    this.setData({
      showRoundtableFixButton: !fixed
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
  },

  onNicknameInput(e) {
    let nickname = e.detail.value.trim();
    if (nickname.length > 20) {
      nickname = nickname.substring(0, 20);
    }
    this.setData({ nickname });
  },

  async saveProfile() {
    if (!this.data.nickname || this.data.nickname.trim() === '') {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const userInfo = {
        nickName: this.data.nickname,
        nickname: this.data.nickname,
        avatarUrl: this.data.avatarUrl,
        gender: 0,
        city: '',
        province: '',
        country: ''
      };

      const oldUserInfo = wx.getStorageSync('userInfo') || {};
      if (oldUserInfo.stamps !== undefined) {
        userInfo.stamps = oldUserInfo.stamps;
      }
      if (oldUserInfo.totalLetters !== undefined) {
        userInfo.totalLetters = oldUserInfo.totalLetters;
      }

      wx.setStorageSync('userInfo', userInfo);

      const openid = wx.getStorageSync('openid');
      if (openid) {
        await this.syncUserToDatabase(openid, userInfo);
      }

      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      this.setData({ loading: false });
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async syncUserToDatabase(openid, userInfo) {
    try {
      const cloudbaseUtil = require('../../utils/cloudbaseUtil');
      const userResult = await cloudbaseUtil.query('users', {
        where: { _openid: openid }
      });
      if (userResult.success && userResult.data.length === 0) {
        await cloudbaseUtil.add('users', { ...userInfo, lastLoginTime: new Date() });
      } else if (userResult.success && userResult.data.length > 0) {
        await cloudbaseUtil.update('users', userResult.data[0]._id, { ...userInfo, lastLoginTime: new Date() });
      }
    } catch (dbErr) {
      console.warn('数据库同步忽略:', dbErr);
    }
  },

  async repairRoundtableOwnership() {
    if (this.data.fixRoundtableLoading) return;

    this.setData({ fixRoundtableLoading: true });

    try {
      const result = await wx.cloud.callFunction({
        name: 'replyToLetter',
        data: {
          type: 'repairRoundtableOwnership',
          roundtableIds: ROUND_TABLE_FIX_IDS
        }
      });

      const repairedIds = result?.result?.data?.repairedIds || [];
      wx.setStorageSync(ROUND_TABLE_FIX_STORAGE_KEY, true);
      this.setData({
        showRoundtableFixButton: false
      });

      wx.showModal({
        title: '修复完成',
        content: repairedIds.length > 0
          ? `已修复 ${repairedIds.length} 条多维度分析记录归属，返回首页后会显示。`
          : '这 4 条记录已经具备归属信息，或当前无需修复。',
        showCancel: false
      });
    } catch (err) {
      console.error('修复记录归属失败:', err);
      wx.showToast({
        title: '修复失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ fixRoundtableLoading: false });
    }
  },

  async exportAllData() {
    wx.showLoading({ title: '导出中...', mask: true });
    try {
      const cloudbaseUtil = require('../../utils/cloudbaseUtil');
      const openid = wx.getStorageSync('openid');
      const now = new Date();
      const dateStr = now.toLocaleString('zh-CN', { hour12: false });

      const [letters, roundtables, incubators, structures] = await Promise.all([
        cloudbaseUtil.query('letters', { where: { _openid: openid }, limit: 100 }),
        cloudbaseUtil.query('roundtable_discussions', { where: { _openid: openid }, limit: 100 }),
        cloudbaseUtil.query('incubator_reports', { where: { _openid: openid }, limit: 100 }),
        cloudbaseUtil.query('structure_analysis_reports', { where: { _openid: openid }, limit: 100 })
      ]);

      const letterData = letters.success ? letters.data : [];
      const roundtableData = roundtables.success ? roundtables.data : [];
      const incubatorData = incubators.success ? incubators.data : [];
      const structureData = structures.success ? structures.data : [];
      const totalCount = letterData.length + roundtableData.length + incubatorData.length + structureData.length;

      let exportText = '# 智慧笔记 - 数据导出\n\n';
      exportText += '导出时间：' + dateStr + '\n';
      exportText += '总记录数：' + totalCount + ' 条\n\n';
      exportText += '---\n\n';

      exportText += '## 目录\n\n';
      const tocItems = [];
      if (letterData.length > 0) {
        tocItems.push('- [分析记录](#分析记录)（' + letterData.length + '条）');
      }
      if (roundtableData.length > 0) {
        tocItems.push('- [多维度分析](#多维度分析)（' + roundtableData.length + '条）');
      }
      if (incubatorData.length > 0) {
        tocItems.push('- [孵化报告](#孵化报告)（' + incubatorData.length + '条）');
      }
      if (structureData.length > 0) {
        tocItems.push('- [结构分析](#结构分析)（' + structureData.length + '条）');
      }
      exportText += tocItems.join('\n') + '\n\n---\n\n';

      if (letterData.length > 0) {
        exportText += '## 分析记录\n\n';
        letterData.forEach(function(letter, i) {
          var time = letter.createTime
            ? new Date(letter.createTime).toLocaleString('zh-CN', { hour12: false })
            : '未知';
          exportText += '### ' + (i + 1) + '. ' + (letter.displayMethod || letter.mentor || '分析') + '\n\n';
          exportText += '> ' + time + '\n\n';
          exportText += '**问题：**\n' + (letter.content || '') + '\n\n';
          exportText += '**分析结果：**\n' + (letter.replyContent || '无') + '\n\n';
        });
      }

      if (roundtableData.length > 0) {
        exportText += '## 多维度分析\n\n';
        roundtableData.forEach(function(rt, i) {
          var time = rt.createTime
            ? new Date(rt.createTime).toLocaleString('zh-CN', { hour12: false })
            : '未知';
          exportText += '### ' + (i + 1) + '. ' + (rt.content || '未命名') + '\n\n';
          exportText += '> ' + time + '\n\n';
          if (rt.selectedMethods && rt.selectedMethods.length > 0) {
            var methodNames = rt.selectedMethods.map(function(m) {
              return typeof m === 'string' ? m : (m.displayName || m.mentor || '');
            }).filter(Boolean);
            if (methodNames.length > 0) {
              exportText += '**分析方法：** ' + methodNames.join('、') + '\n\n';
            }
          }
          if (rt.discussions) {
            rt.discussions.forEach(function(d) {
              var mentorName = d.displayName || d.mentor || '未知方法';
              exportText += '#### ' + mentorName + '\n' + (d.reply || d.content || '无') + '\n\n';
            });
          }
        });
      }

      if (incubatorData.length > 0) {
        exportText += '## 孵化报告\n\n';
        incubatorData.forEach(function(inc, i) {
          var time = inc.createTime
            ? new Date(inc.createTime).toLocaleString('zh-CN', { hour12: false })
            : '未知';
          exportText += '### ' + (i + 1) + '. ' + (inc.content || '未命名') + '\n\n';
          exportText += '> ' + time + '\n\n';
          if (inc.selectedMethods && inc.selectedMethods.length > 0) {
            var methodNames = inc.selectedMethods.map(function(m) {
              return typeof m === 'string' ? m : (m.displayName || m.mentor || '');
            }).filter(Boolean);
            if (methodNames.length > 0) {
              exportText += '**分析方法：** ' + methodNames.join('、') + '\n\n';
            }
          }
          exportText += '**报告内容：**\n' + (inc.report || inc.replyContent || '无') + '\n\n';
          if (inc.actionPlan && inc.actionPlan.length > 0) {
            exportText += '**行动清单：**\n\n';
            inc.actionPlan.forEach(function(item, ai) {
              if (typeof item === 'string') {
                exportText += (ai + 1) + '. ' + item + '\n';
              } else if (item && typeof item === 'object') {
                exportText += (ai + 1) + '. ' + (item.action || item.content || '') + '\n';
                if (item.detail) {
                  exportText += '   - ' + item.detail + '\n';
                }
              }
            });
            exportText += '\n';
          }
        });
      }

      if (structureData.length > 0) {
        exportText += '## 结构分析\n\n';
        structureData.forEach(function(st, i) {
          var time = st.createTime
            ? new Date(st.createTime).toLocaleString('zh-CN', { hour12: false })
            : '未知';
          exportText += '### ' + (i + 1) + '. ' + (st.content || '未命名') + '\n\n';
          exportText += '> ' + time + '\n\n';
          exportText += '**分析结果：**\n' + (st.replyContent || st.report || '无') + '\n\n';
        });
      }

      wx.hideLoading();
      wx.showModal({
        title: '导出完成',
        content: '共导出 ' + totalCount + ' 条记录',
        confirmText: '保存文件',
        cancelText: '复制文本',
        success: function(modalRes) {
          if (modalRes.confirm) {
            var fs = wx.getFileSystemManager();
            var fileName = '智慧笔记_' + now.toISOString().split('T')[0] + '.md';
            var tempPath = wx.env.USER_DATA_PATH + '/' + fileName;
            fs.writeFile({
              filePath: tempPath,
              data: exportText,
              encoding: 'utf8',
              success: function() {
                // 优先使用 saveFileToDisk 让用户选择保存位置
                if (wx.saveFileToDisk) {
                  wx.saveFileToDisk({
                    filePath: tempPath,
                    fileName: fileName,
                    success: function() {
                      wx.showToast({ title: '文件已保存', icon: 'success' });
                    },
                    fail: function() {
                      // saveFileToDisk 失败则回退到分享
                      wx.shareFileMessage({
                        filePath: tempPath,
                        fileName: fileName,
                        success: function() { wx.showToast({ title: '文件已分享', icon: 'success' }); },
                        fail: function() { wx.showToast({ title: '请尝试复制文本方式', icon: 'none' }); }
                      });
                    }
                  });
                } else {
                  // 低版本基础库回退到分享
                  wx.shareFileMessage({
                    filePath: tempPath,
                    fileName: fileName,
                    success: function() { wx.showToast({ title: '文件已分享', icon: 'success' }); },
                    fail: function() { wx.showToast({ title: '请尝试复制文本方式', icon: 'none' }); }
                  });
                }
              },
              fail: function() {
                wx.showToast({ title: '保存失败', icon: 'none' });
              }
            });
          } else {
            wx.setClipboardData({
              data: exportText,
              success: function() {
                wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
              }
            });
          }
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('导出失败:', err);
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  async deleteAllData() {
    wx.showModal({
      title: '确认删除',
      content: '此操作将删除您的所有分析记录，且无法恢复。确定继续吗？',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '删除中...', mask: true });
        try {
          const cloudbaseUtil = require('../../utils/cloudbaseUtil');
          const openid = wx.getStorageSync('openid');

          const letters = await cloudbaseUtil.query('letters', {
            where: { _openid: openid },
            limit: 100
          });
          if (letters.success) {
            for (const letter of letters.data) {
              await cloudbaseUtil.delete('letters', letter._id);
            }
          }

          const roundtables = await cloudbaseUtil.query('roundtable_discussions', {
            where: { _openid: openid },
            limit: 100
          });
          if (roundtables.success) {
            for (const rt of roundtables.data) {
              await cloudbaseUtil.delete('roundtable_discussions', rt._id);
            }
          }

          wx.hideLoading();
          wx.showToast({ title: '已删除全部数据', icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('删除失败:', err);
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
