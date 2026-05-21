'use strict';

/**
 * 页面测试辅助工具
 * 模拟 WeChat Page() 构造器，提取页面对象用于测试
 */

let capturedPage = null;

function setupPageCapture() {
  capturedPage = null;
  global.Page = function (config) {
    capturedPage = config;
  };
}

function getPage(initialData) {
  if (!capturedPage) {
    throw new Error('Page() 未被调用，请先 setupPageCapture() 后 require 页面文件');
  }

  const page = Object.create(capturedPage);
  page.data = { ...capturedPage.data, ...initialData };
  page.setData = jest.fn(function (updates, callback) {
    Object.assign(this.data, updates);
    if (typeof callback === 'function') callback();
  });
  return page;
}

function loadPage(modulePath, initialData) {
  setupPageCapture();
  require(modulePath);
  return getPage(initialData);
}

/**
 * 从已加载的页面对象创建一个全新的实例
 * 直接拷贝方法为实例自身属性，避免原型链问题
 */
function createPageInstance(sourcePage, initialData) {
  const proto = Object.getPrototypeOf(sourcePage);
  const page = {};

  // 将 Page config 上的所有方法拷贝为自身属性
  for (const key of Object.keys(proto)) {
    if (typeof proto[key] === 'function') {
      page[key] = proto[key];
    }
  }

  page.data = { ...(proto.data || {}), ...initialData };
  page.setData = jest.fn(function (updates, callback) {
    Object.assign(this.data, updates);
    if (typeof callback === 'function') callback();
  });
  return page;
}

module.exports = { setupPageCapture, getPage, loadPage, createPageInstance };
