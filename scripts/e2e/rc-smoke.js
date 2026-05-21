'use strict';

/**
 * 微信开发者工具自动化 RC 冒烟测试。
 *
 * 运行前请确认：
 * 1. 微信开发者工具已安装，并已开启服务端口/自动化能力。
 * 2. 当前项目可在开发者工具中正常打开。
 * 3. 当前本机已有可用登录态或测试数据。
 */

const path = require('path');
const fs = require('fs');
const automator = require('miniprogram-automator');

const projectRoot = path.resolve(__dirname, '../..');
const screenshotsDir = path.join(projectRoot, 'tmp', 'e2e-screenshots');
const cliPath = process.env.WECHAT_DEVTOOLS_CLI || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const port = Number(process.env.WECHAT_AUTOMATOR_PORT || 9420);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForPageData(page, predicate, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const data = await page.data();
    if (predicate(data)) return data;
    await page.waitFor(500);
  }
  throw new Error('等待页面数据超时');
}

async function run() {
  ensureDir(screenshotsDir);

  const miniProgram = await automator.launch({
    projectPath: projectRoot,
    cliPath,
    port,
    timeout: 60000,
    trustProject: true
  });

  miniProgram.on('console', (msg) => {
    const args = msg.args || [];
    console.log('[miniprogram]', args.map((item) => item.value || item).join(' '));
  });

  try {
    let page = await miniProgram.reLaunch('/pages/index/index');
    await page.waitFor(3000);

    const indexData = await page.data();
    assert(page.path === 'pages/index/index', '未进入首页');
    assert(Array.isArray(indexData.displayItems), '首页 displayItems 不是数组');

    await miniProgram.screenshot({
      path: path.join(screenshotsDir, '01-index.png')
    });

    await page.callMethod('showSearchInput');
    await page.callMethod('onSearchInput', { detail: { value: '芒格' } });
    let searchedData = await waitForPageData(
      page,
      (data) => data.searchKeyword === '芒格' && Array.isArray(data.displayItems),
      5000
    );
    const firstSearchCount = searchedData.displayItems.length;
    assert(searchedData.searchKeyword === '芒格', '搜索关键词未写入页面状态');

    await miniProgram.screenshot({
      path: path.join(screenshotsDir, '02-search.png')
    });

    if (firstSearchCount > 0) {
      await page.callMethod('goToDetail', {
        currentTarget: {
          dataset: {
            id: searchedData.displayItems[0]._id,
            type: searchedData.displayItems[0].type
          }
        }
      });
      await page.waitFor(1000);
      await miniProgram.navigateBack();
      await page.waitFor(3000);
      page = await miniProgram.currentPage();

      const restoredData = await waitForPageData(
        page,
        (data) => data.searchKeyword === '芒格' && Array.isArray(data.displayItems),
        5000
      );
      assert(restoredData.displayItems.length === firstSearchCount, '从详情页返回后搜索结果数量不一致');
      assert(
        restoredData.displayItems.every((item) => (item.content || '').includes('芒格')),
        '从详情页返回后搜索结果未保持关键词过滤'
      );
    } else {
      console.log('[skip] 当前账号没有匹配“芒格”的记录，跳过详情返回搜索恢复断言。');
    }

    await miniProgram.screenshot({
      path: path.join(screenshotsDir, '03-search-return.png')
    });

    console.log('RC smoke passed');
  } finally {
    await miniProgram.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
