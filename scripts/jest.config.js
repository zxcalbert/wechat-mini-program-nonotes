'use strict';

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    // 前端工具模块映射
    '^@utils/markdownUtil$': '<rootDir>/../miniprogram/utils/markdownUtil',
    '^@utils/exportUtil$': '<rootDir>/../miniprogram/utils/exportUtil',
    '^@utils/cacheUtil$': '<rootDir>/../miniprogram/utils/cacheUtil',
    '^@utils/sensitiveWordUtil$': '<rootDir>/../miniprogram/utils/sensitiveWordUtil',
    '^@utils/apiKeyUtil$': '<rootDir>/../miniprogram/utils/apiKeyUtil',
    // 云函数模块映射
    '^@cloud/sensitiveWordDetector$': '<rootDir>/../cloudfunctions/replyToLetter/sensitiveWordDetector',
    // 脚本工具模块
    '^@scripts/wordCountUtil$': '<rootDir>/tests/wordCountUtil'
  },
  collectCoverageFrom: [
    '../miniprogram/utils/markdownUtil.js',
    '../miniprogram/utils/exportUtil.js',
    '../miniprogram/utils/apiKeyUtil.js',
    '../cloudfunctions/replyToLetter/sensitiveWordDetector.js',
    'tests/wordCountUtil.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov']
};
