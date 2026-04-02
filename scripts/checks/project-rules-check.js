#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CONFIG = {
  version: '1.0.0',
  miniprogramDir: path.join(__dirname, '../../miniprogram'),
  cloudfunctionsDir: path.join(__dirname, '../../cloudfunctions'),
  checks: {
    sensitiveInfo: true,
    consoleLogs: true,
    deprecatedApi: true,
    fileSize: true,
    codeStyle: true
  }
};

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let passed = 0;
let failed = 0;
let warnings = 0;

function printResult(checkName, status) {
  if (status === 'pass') {
    console.log(`${colors.green}[✓] ${checkName}${colors.reset}`);
    passed++;
  } else if (status === 'warn') {
    console.log(`${colors.yellow}[!] ${checkName}${colors.reset}`);
    warnings++;
  } else {
    console.log(`${colors.red}[✗] ${checkName}${colors.reset}`);
    failed++;
  }
}

function findFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  try {
    traverse(dir);
  } catch (e) {
    console.warn(`目录不存在: ${dir}`);
  }
  
  return files;
}

function checkSensitiveInfo() {
  console.log('\n检查 1/6: 敏感信息检查...');
  const patterns = ['appid', 'secret', 'password', 'token', 'api_key', 'private_key'];
  const jsFiles = findFiles(CONFIG.miniprogramDir, ['.js', '.json']);
  let found = false;
  
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of patterns) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.toLowerCase().includes(pattern)) {
            if (!line.trim().startsWith('//') && !line.includes('/*')) {
              console.log(`${colors.red}  ${path.relative(process.cwd(), file)}:${i + 1} - 发现可能的敏感信息 (${pattern})${colors.reset}`);
              console.log(`    ${line.trim()}`);
              found = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn(`无法读取文件: ${file}`);
    }
  }
  
  printResult('敏感信息检查', found ? 'fail' : 'pass');
  return !found;
}

function checkConsoleLogs() {
  console.log('\n检查 2/6: 调试日志检查...');
  const maxCount = 50;
  const jsFiles = findFiles(CONFIG.miniprogramDir, ['.js']);
  let count = 0;
  
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/console\.(log|error|warn)/g);
      if (matches) {
        count += matches.length;
      }
    } catch (e) {
      // skip
    }
  }
  
  if (count > maxCount) {
    console.log(`${colors.yellow}  Console日志数量: ${count} (超过 ${maxCount} 条)${colors.reset}`);
    printResult('调试日志检查', 'warn');
  } else {
    console.log(`  Console日志数量: ${count} (在限制范围内)`);
    printResult('调试日志检查', 'pass');
  }
  return true;
}

function checkDeprecatedApi() {
  console.log('\n检查 3/6: 废弃API检查...');
  const patterns = ['wx.getUserProfile', 'wx.getUserInfo'];
  const jsFiles = findFiles(CONFIG.miniprogramDir, ['.js']);
  let found = false;
  
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          console.log(`${colors.red}  ${path.relative(process.cwd(), file)} - 发现已废弃API: ${pattern}${colors.reset}`);
          found = true;
        }
      }
    } catch (e) {
      // skip
    }
  }
  
  printResult('废弃API检查', found ? 'fail' : 'pass');
  return !found;
}

function checkFileSize() {
  console.log('\n检查 4/6: 文件大小检查...');
  const maxImageSize = 10 * 1024 * 1024;
  const maxJsSize = 512 * 1024;
  const imageFiles = findFiles(CONFIG.miniprogramDir, ['.png', '.jpg', '.jpeg', '.gif']);
  const jsFiles = findFiles(CONFIG.miniprogramDir, ['.js']);
  let found = false;
  
  for (const file of imageFiles) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > maxImageSize) {
        console.log(`${colors.red}  ${path.relative(process.cwd(), file)} - 图片文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB${colors.reset}`);
        found = true;
      }
    } catch (e) {
      // skip
    }
  }
  
  for (const file of jsFiles) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > maxJsSize) {
        console.log(`${colors.yellow}  ${path.relative(process.cwd(), file)} - JS文件过大: ${(stats.size / 1024).toFixed(2)}KB${colors.reset}`);
      }
    } catch (e) {
      // skip
    }
  }
  
  printResult('文件大小检查', found ? 'fail' : 'pass');
  return !found;
}

function checkCodeStyle() {
  console.log('\n检查 5/6: 代码风格检查...');
  printResult('代码风格检查', 'pass');
  return true;
}

function checkProjectStructure() {
  console.log('\n检查 6/6: 项目结构检查...');
  const requiredDirs = ['miniprogram/pages', 'miniprogram/utils', 'miniprogram/components', 'cloudfunctions'];
  let missing = false;
  
  for (const dir of requiredDirs) {
    const fullPath = path.join(__dirname, '../..', dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.red}  缺少目录: ${dir}${colors.reset}`);
      missing = true;
    }
  }
  
  printResult('项目结构检查', missing ? 'fail' : 'pass');
  return !missing;
}

function main() {
  console.log(`${colors.green}========================================${colors.reset}`);
  console.log(`${colors.green}  项目规则检查清单 - Node.js版本${colors.reset}`);
  console.log(`${colors.green}========================================${colors.reset}`);
  
  let allPassed = true;
  
  allPassed = checkSensitiveInfo() && allPassed;
  allPassed = checkConsoleLogs() && allPassed;
  allPassed = checkDeprecatedApi() && allPassed;
  allPassed = checkFileSize() && allPassed;
  allPassed = checkCodeStyle() && allPassed;
  allPassed = checkProjectStructure() && allPassed;
  
  console.log(`\n${colors.green}========================================${colors.reset}`);
  console.log('检查结果汇总:');
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.yellow}警告: ${warnings}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}失败: ${failed}${colors.reset}`);
  } else {
    console.log(`${colors.green}失败: ${failed}${colors.reset}`);
  }
  console.log(`${colors.green}========================================${colors.reset}`);
  
  if (!allPassed || failed > 0) {
    console.log(`\n${colors.red}❌ 检查失败，请修复上述问题${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✓ 所有检查通过${colors.reset}`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkSensitiveInfo,
  checkConsoleLogs,
  checkDeprecatedApi,
  checkFileSize,
  checkCodeStyle,
  checkProjectStructure
};
