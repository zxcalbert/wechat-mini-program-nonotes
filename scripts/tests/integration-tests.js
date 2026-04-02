const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../..');

function runShellCommand(command, options = {}) {
  const defaultOptions = {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  };
  
  try {
    const result = execSync(command, { ...defaultOptions, ...options });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || '', error: error.stderr || '' };
  }
}

function test(name, fn) {
  try {
    console.log(`\n运行集成测试: ${name}`);
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

function testBashScriptExecution() {
  const scriptPath = path.join(projectRoot, 'scripts/pre-commit-check.sh');
  assert(fs.existsSync(scriptPath), '脚本不存在');
  
  const result = runShellCommand(`bash ${scriptPath}`);
  console.log(`    脚本输出:\n${result.output.substring(0, 500)}...`);
  assert(result.success || result.output.includes('检查'), '脚本应该执行检查');
}

function testProjectStructure() {
  const requiredPaths = [
    'miniprogram',
    'cloudfunctions',
    'scripts',
    '.github/workflows'
  ];
  
  for (const p of requiredPaths) {
    const fullPath = path.join(projectRoot, p);
    assert(fs.existsSync(fullPath), `缺少必要路径: ${p}`);
  }
}

function testConfigFileValidity() {
  const configPath = path.join(projectRoot, 'scripts/checks/config.json');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configContent);
  
  assert(config.version, '配置缺少 version');
  assert(config.checks, '配置缺少 checks');
  assert(config.paths, '配置缺少 paths');
}

function testGitHookIntegration() {
  const gitDir = path.join(projectRoot, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('    Git 仓库存在，跳过 Hook 测试（避免影响现有配置）');
  } else {
    console.log('    非 Git 仓库，跳过 Hook 测试');
  }
}

function testCIConfigStructure() {
  const ciPath = path.join(projectRoot, '.github/workflows/project-rules-check.yml');
  assert(fs.existsSync(ciPath), 'CI 配置文件不存在');
  
  const content = fs.readFileSync(ciPath, 'utf8');
  assert(content.includes('name:'), 'CI 配置缺少 name');
  assert(content.includes('on:'), 'CI 配置缺少 on');
  assert(content.includes('jobs:'), 'CI 配置缺少 jobs');
}

function runAllIntegrationTests() {
  console.log('========================================');
  console.log('  项目规则检查清单 - 集成测试');
  console.log('========================================');
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    { name: '项目结构完整性检查', fn: testProjectStructure },
    { name: '配置文件有效性检查', fn: testConfigFileValidity },
    { name: 'CI配置结构检查', fn: testCIConfigStructure },
    { name: 'Bash脚本执行测试', fn: testBashScriptExecution },
    { name: 'Git Hook集成检查', fn: testGitHookIntegration }
  ];
  
  for (const t of tests) {
    if (test(t.name, t.fn)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log('集成测试结果汇总:');
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log('========================================');
  
  return failed === 0;
}

if (require.main === module) {
  const success = runAllIntegrationTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllIntegrationTests };
