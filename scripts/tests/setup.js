'use strict';

// 全局 wx mock
const storage = {};
const mockCloudCallFunction = jest.fn();

const wx = {
  setStorageSync: jest.fn((key, val) => { storage[key] = val; }),
  getStorageSync: jest.fn((key) => storage[key] !== undefined ? storage[key] : ''),
  removeStorageSync: jest.fn((key) => { delete storage[key]; }),
  getStorageInfoSync: jest.fn(() => ({ keys: Object.keys(storage) })),
  clearStorageSync: jest.fn(() => {
    Object.keys(storage).forEach(k => delete storage[k]);
  }),
  cloud: {
    callFunction: mockCloudCallFunction,
    database: jest.fn(() => ({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: [] })),
          count: jest.fn(() => Promise.resolve({ total: 0 }))
        })),
        add: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
        doc: jest.fn(() => ({
          update: jest.fn(() => Promise.resolve({ stats: { updated: 1 } })),
          remove: jest.fn(() => Promise.resolve({ stats: { removed: 1 } })),
          get: jest.fn(() => Promise.resolve({ data: {} }))
        })),
        orderBy: jest.fn(() => ({
          desc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ data: [] })),
            limit: jest.fn(() => ({
              get: jest.fn(() => Promise.resolve({ data: [] }))
            }))
          }))
        })),
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: [] }))
        })),
        skip: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: [] }))
        }))
      })),
      command: {
        gte: jest.fn((val) => ({ _gte: val })),
        neq: jest.fn((val) => ({ _neq: val }))
      },
      serverDate: jest.fn(() => new Date())
    }))
  },
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  navigateBack: jest.fn(),
  reLaunch: jest.fn(),
  getWindowInfo: jest.fn(() => ({ statusBarHeight: 44, screenWidth: 375 })),
  getMenuButtonBoundingClientRect: jest.fn(() => ({ right: 350, width: 87 }))
};

global.wx = wx;
global.__wxStorage = storage;

// getApp mock
const mockApp = {
  getThemeClass: jest.fn(() => 'theme-light'),
  getFontSizeClass: jest.fn(() => ''),
  getTheme: jest.fn(() => 'system'),
  toggleTheme: jest.fn(),
  globalData: { themeMode: 'system' }
};
global.getApp = jest.fn(() => mockApp);
global.__mockApp = mockApp;

// getCurrentPages mock
global.getCurrentPages = jest.fn(() => [{ route: 'pages/index/index' }]);

// 清理辅助
global.__clearWxMocks = function () {
  Object.keys(storage).forEach(k => delete storage[k]);
  mockCloudCallFunction.mockReset();
  wx.showToast.mockClear();
  wx.showModal.mockClear();
  wx.showLoading.mockClear();
  wx.hideLoading.mockClear();
  wx.navigateTo.mockClear();
  wx.redirectTo.mockClear();
  wx.navigateBack.mockClear();
};

module.exports = { wx, mockApp };
