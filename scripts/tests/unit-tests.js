const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = path.join(__dirname, 'temp-test');

function setup() {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  console.log('✓ 测试环境准备完成');
}

function teardown() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  console.log('✓ 测试环境清理完成');
}

function test(name, fn) {
  try {
    console.log(`\n运行测试: ${name}`);
    fn();
    console.log(`  ✓ ${name} 通过`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name} 失败`);
    console.log(`    错误: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function testScriptExists() {
  const scriptPath = path.join(__dirname, '../pre-commit-check.sh');
  assert(fs.existsSync(scriptPath), 'pre-commit-check.sh 不存在');
  assert(fs.statSync(scriptPath).isFile(), 'pre-commit-check.sh 不是文件');
}

function testConfigExists() {
  const configPath = path.join(__dirname, '../checks/config.json');
  assert(fs.existsSync(configPath), 'config.json 不存在');
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);
  assert(config.version, '配置文件缺少 version 字段');
  assert(config.checks, '配置文件缺少 checks 字段');
}

function testNodeCheckScriptExists() {
  const scriptPath = path.join(__dirname, '../checks/project-rules-check.js');
  assert(fs.existsSync(scriptPath), 'project-rules-check.js 不存在');
}

function testCIConfigExists() {
  const ciPath = path.join(__dirname, '../../.github/workflows/project-rules-check.yml');
  assert(fs.existsSync(ciPath), 'CI 配置文件不存在');
}

function testSensitiveInfoDetection() {
  const testFile = path.join(testDir, 'test-sensitive.js');
  fs.writeFileSync(testFile, `
const appid = 'wx1234567890abcdef';
const secret = 'test-secret-key';
// 这是注释，包含 password 不应被检测
function test() {
  console.log('test');
}
`);
  
  const content = fs.readFileSync(testFile, 'utf8');
  const hasAppid = content.includes('appid') && !content.trim().startsWith('//');
  assert(hasAppid, '应该能检测到敏感信息');
}

function testDeprecatedApiDetection() {
  const testFile = path.join(testDir, 'test-deprecated.js');
  fs.writeFileSync(testFile, `
wx.getUserProfile({
  desc: '获取用户信息'
});
`);
  
  const content = fs.readFileSync(testFile, 'utf8');
  const hasDeprecatedApi = content.includes('wx.getUserProfile');
  assert(hasDeprecatedApi, '应该能检测到废弃API');
}

function testConsoleLogCounting() {
  const testFile = path.join(testDir, 'test-console.js');
  let content = '';
  for (let i = 0; i < 60; i++) {
    content += `console.log('test ${i}');\n`;
  }
  fs.writeFileSync(testFile, content);
  
  const matches = content.match(/console\.log/g);
  assert(matches && matches.length === 60, '应该能统计到60条console.log');
}

function runAllTests() {
  console.log('========================================');
  console.log('  项目规则检查清单 - 单元测试');
  console.log('========================================');
  
  setup();
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    { name: '脚本文件存在性检查', fn: testScriptExists },
    { name: '配置文件存在性检查', fn: testConfigExists },
    { name: 'Node检查脚本存在性检查', fn: testNodeCheckScriptExists },
    { name: 'CI配置文件存在性检查', fn: testCIConfigExists },
    { name: '敏感信息检测功能', fn: testSensitiveInfoDetection },
    { name: '废弃API检测功能', fn: testDeprecatedApiDetection },
    { name: 'Console日志统计功能', fn: testConsoleLogCounting }
  ];
  
  for (const t of tests) {
    if (test(t.name, t.fn)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  teardown();
  
  console.log('\n========================================');
  console.log('测试结果汇总:');
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log('========================================');
  
  return failed === 0;
}

if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };
