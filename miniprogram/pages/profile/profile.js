const app = getApp();
const apiKeyUtil = require('../../utils/apiKeyUtil');
const exportUtil = require('../../utils/exportUtil');
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
    fixRoundtableLoading: false,
    apiKey: '',
    apiKeyMasked: ''
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
    this.loadApiKey();
  },

  loadApiKey() {
    const apiKey = wx.getStorageSync('wisdomNotesApiKey') || '';
    this.setData({
      apiKey: apiKey,
      apiKeyMasked: apiKey ? apiKeyUtil.maskApiKey(apiKey) : ''
    });
  },

  generateApiKey() {
    wx.showModal({
      title: '生成 API Key',
      content: '将生成新的 API Key，旧 Key 将失效。确定继续？',
      success: (res) => {
        if (!res.confirm) return;
        var key = apiKeyUtil.generateApiKey();
        wx.setStorageSync('wisdomNotesApiKey', key);
        this.setData({
          apiKey: key,
          apiKeyMasked: apiKeyUtil.maskApiKey(key)
        });
        wx.showToast({ title: 'API Key 已生成', icon: 'success' });
      }
    });
  },

  copyApiKey() {
    wx.setClipboardData({
      data: this.data.apiKey,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  regenerateApiKey() {
    this.generateApiKey();
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
      const exportText = exportUtil.exportAllToMarkdown({
        letters: letterData,
        roundtables: roundtableData,
        incubators: incubatorData,
        structures: structureData,
        exportedAt: now
      });

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

          const incubators = await cloudbaseUtil.query('incubator_reports', {
            where: { _openid: openid },
            limit: 100
          });
          if (incubators.success) {
            for (const item of incubators.data) {
              await cloudbaseUtil.delete('incubator_reports', item._id);
            }
          }

          const structures = await cloudbaseUtil.query('structure_analysis_reports', {
            where: { _openid: openid },
            limit: 100
          });
          if (structures.success) {
            for (const item of structures.data) {
              await cloudbaseUtil.delete('structure_analysis_reports', item._id);
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
