const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '../..');

// ==================== 测试框架 ====================

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

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望 ${expected}，实际 ${actual}`);
  }
}

// ==================== 辅助函数 ====================

function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function grepFile(filePath, pattern) {
  const content = readFile(filePath);
  const regex = new RegExp(pattern, 'g');
  return (content.match(regex) || []).length;
}

function grepInDir(dirPath, pattern, include) {
  // 返回匹配的文件行列表
  const results = [];
  const files = walkDir(dirPath, include);
  for (const file of files) {
    const content = readFile(file);
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({ file, line: i + 1, content: lines[i].trim() });
      }
    }
  }
  return results;
}

function walkDir(dirPath, extensions) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...walkDir(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!extensions || extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function grepContentAcrossFiles(dirPath, pattern, include) {
  // 使用子进程grep，返回匹配行数组
  let cmd;
  if (include) {
    cmd = `grep -rn '${pattern}' --include='${include}' ${dirPath} 2>/dev/null || true`;
  } else {
    cmd = `grep -rn '${pattern}' ${dirPath} 2>/dev/null || true`;
  }
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
  if (!out) return [];
  return out.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

// ==================== 测试组 1: 页面标题合规 ====================

const PAGE_JSON_FILES = [
  { path: 'miniprogram/pages/detail/detail.json', expectedTitle: '分析详情' },
  { path: 'miniprogram/pages/roundtable/roundtable.json', expectedTitle: '多维度分析' },
  { path: 'miniprogram/pages/roundtableResult/roundtableResult.json', expectedTitle: '多维度分析' },
  { path: 'miniprogram/pages/write/write.json', expectedTitle: '分析方法' }
];

const FORBIDDEN_TITLE_TERMS = ['信件', '圆桌会议', '圆桌讨论', '写笔记'];

function testDetailPageTitle() {
  const json = readJSON(path.join(projectRoot, PAGE_JSON_FILES[0].path));
  assertEqual(json.navigationBarTitleText, '分析详情', 'detail页面标题应为"分析详情"');
}

function testRoundtablePageTitle() {
  const json = readJSON(path.join(projectRoot, PAGE_JSON_FILES[1].path));
  assertEqual(json.navigationBarTitleText, '多维度分析', 'roundtable页面标题应为"多维度分析"');
}

function testRoundtableResultPageTitle() {
  const json = readJSON(path.join(projectRoot, PAGE_JSON_FILES[2].path));
  assertEqual(json.navigationBarTitleText, '多维度分析', 'roundtableResult页面标题应为"多维度分析"');
}

function testWritePageTitle() {
  const json = readJSON(path.join(projectRoot, PAGE_JSON_FILES[3].path));
  assertEqual(json.navigationBarTitleText, '分析方法', 'write页面标题应为"分析方法"');
}

function testNoForbiddenTermsInAnyPageTitle() {
  // 扫描所有页面JSON文件，确保标题不含禁用词
  const pagesDir = path.join(projectRoot, 'miniprogram', 'pages');
  const jsonFiles = walkDir(pagesDir, ['.json']);
  const violations = [];

  for (const file of jsonFiles) {
    try {
      const json = JSON.parse(readFile(file));
      const title = json.navigationBarTitleText;
      if (title) {
        for (const term of FORBIDDEN_TITLE_TERMS) {
          if (title.includes(term)) {
            violations.push({ file: path.relative(projectRoot, file), title, term });
          }
        }
      }
    } catch (e) {
      // 跳过无效JSON
    }
  }

  assert(violations.length === 0,
    `发现 ${violations.length} 个页面标题包含禁用词:\n${violations.map(v => `  ${v.file}: "${v.title}" 包含 "${v.term}"`).join('\n')}`);
}

// ==================== 测试组 2: 云函数描述合规 ====================

const ANTHROPOMORPHIC_DESC_TERMS = ['导师', '大师', '人生导师'];

function testReplyToLetterDescription() {
  const json = readJSON(path.join(projectRoot, 'cloudfunctions/replyToLetter/config.json'));
  assertEqual(json.description, 'AI 分析引擎', 'replyToLetter描述应为"AI 分析引擎"');
}

function testGetMentorRulesConfigDescription() {
  const json = readJSON(path.join(projectRoot, 'cloudfunctions/getMentorRules/config.json'));
  assertEqual(json.description, '获取分析方法规则库', 'getMentorRules config描述应为"获取分析方法规则库"');
}

function testGetMentorRulesPackageDescription() {
  const json = readJSON(path.join(projectRoot, 'cloudfunctions/getMentorRules/package.json'));
  assertEqual(json.description, '获取分析方法规则库', 'getMentorRules package描述应为"获取分析方法规则库"');
}

function testNoAnthropomorphicInAllCloudDescriptions() {
  // 扫描所有云函数的 config.json 和 package.json
  const cloudDir = path.join(projectRoot, 'cloudfunctions');
  const configFiles = walkDir(cloudDir, ['.json']).filter(f =>
    f.endsWith('config.json') || f.endsWith('package.json')
  );
  const violations = [];

  for (const file of configFiles) {
    try {
      const json = JSON.parse(readFile(file));
      const desc = json.description;
      if (desc) {
        for (const term of ANTHROPOMORPHIC_DESC_TERMS) {
          if (desc.includes(term)) {
            violations.push({ file: path.relative(projectRoot, file), description: desc, term });
          }
        }
      }
    } catch (e) {
      // 跳过无效JSON
    }
  }

  assert(violations.length === 0,
    `发现 ${violations.length} 个云函数描述包含拟人化词汇:\n${violations.map(v => `  ${v.file}: "${v.description}" 包含 "${v.term}"`).join('\n')}`);
}

// ==================== 测试组 3: mentorRules.json 合规 ====================

const VALID_FIELDS = ['价值思维', '创新创业', '心理学', '哲学'];
let mentorRulesData = null;
function getMentorRules() {
  if (!mentorRulesData) {
    const filePath = path.join(projectRoot, 'cloudfunctions/replyToLetter/mentorRules.json');
    mentorRulesData = JSON.parse(readFile(filePath));
  }
  return mentorRulesData;
}

function testMentorRulesIsValidJSON() {
  const data = getMentorRules();
  assert(data !== null && typeof data === 'object', 'mentorRules.json不是有效JSON对象');
  assert(data.mentors && typeof data.mentors === 'object', 'mentorRules.json缺少mentors字段');
}

function testMentorRulesHas21Methods() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  assertEqual(keys.length, 21, `期望21种分析方法，实际${keys.length}种`);
}

function testAllKeysAreMethodNamesNotPersonNames() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  const METHODOLOGY_SUFFIXES = ['分析', '模型', '提问', '框架', '理论', '伦理', '哲学', '经营', '设计'];
  const violations = keys.filter(key => {
    const hasMethodologySuffix = METHODOLOGY_SUFFIXES.some(suffix => key.includes(suffix));
    return !hasMethodologySuffix;
  });

  assert(violations.length === 0,
    `发现 ${violations.length} 个key不是方法论名称: ${violations.join(', ')}`);
}

function testNoPersonaFieldInAnyEntry() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  const violations = [];

  for (const key of keys) {
    const entry = data.mentors[key];
    if (entry && entry.persona !== undefined) {
      violations.push(key);
    }
  }

  assert(violations.length === 0,
    `发现 ${violations.length} 个条目包含persona字段: ${violations.join(', ')}`);
}

function testAllEntriesHaveMethodologyField() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  const violations = [];

  for (const key of keys) {
    const entry = data.mentors[key];
    if (!entry || !entry.methodology) {
      violations.push(key);
    }
  }

  assert(violations.length === 0,
    `发现 ${violations.length} 个条目缺少methodology字段: ${violations.join(', ')}`);
}

function testFieldValuesAreValid() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  const violations = [];

  for (const key of keys) {
    const entry = data.mentors[key];
    const field = entry && entry.field;
    if (!field || !VALID_FIELDS.includes(field)) {
      violations.push(`${key}: field="${field}"`);
    }
  }

  assert(violations.length === 0,
    `发现 ${violations.length} 个条目field值不合法:\n${violations.join('\n')}`);
}

function testFieldDistribution() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);
  const distribution = {};

  for (const key of keys) {
    const field = data.mentors[key].field;
    distribution[field] = (distribution[field] || 0) + 1;
  }

  const expectedDistribution = { '价值思维': 3, '创新创业': 6, '心理学': 5, '哲学': 7 };
  const violations = [];

  for (const field of Object.keys(expectedDistribution)) {
    if (distribution[field] !== expectedDistribution[field]) {
      violations.push(`${field}: 期望${expectedDistribution[field]}个，实际${distribution[field] || 0}个`);
    }
  }
  // 也检查是否有预期之外的field
  for (const field of Object.keys(distribution)) {
    if (!expectedDistribution[field]) {
      violations.push(`${field}: 意外的field分类`);
    }
  }

  assert(violations.length === 0,
    `field分配不符合预期:\n${violations.join('\n')}`);
}

// 边界情况：验证特定方法名称（方法论名称格式，非人称）
function testEdgeCaseMethodNamesAreDescriptive() {
  const data = getMentorRules();
  const keys = Object.keys(data.mentors);

  // 所有key应该以"分析"、"框架"、"提问"等结尾，而非人名
  const personLikeKeys = keys.filter(key => {
    // 短名称（≤3字）且不含分析/框架/提问等后缀可能是人名
    if (key.length <= 3 && !key.includes('分析') && !key.includes('框架') && !key.includes('提问')) {
      return true;
    }
    return false;
  });

  assert(personLikeKeys.length === 0,
    `发现 ${personLikeKeys.length} 个可疑的人名格式key: ${personLikeKeys.join(', ')}`);
}

// ==================== 测试组 4: mentorRules_expanded.json 已删除 ====================

function testExpandedFileDeletedFromCloudFunction() {
  const filePath = path.join(projectRoot, 'cloudfunctions/replyToLetter/mentorRules_expanded.json');
  assert(!fileExists(filePath),
    'mentorRules_expanded.json 在cloudfunctions/replyToLetter/中仍然存在，应已删除');
}

// ==================== 测试组 5: 云函数回退值去拟人化 ====================

function testNoCharlieMungerInIndex() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/replyToLetter/index.js'));
  const count = (content.match(/查理·芒格/g) || []).length;
  assertEqual(count, 0, `index.js中发现"查理·芒格"出现${count}次，应全部替换`);
}

function testMultipleThinkingModelIsFallback() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/replyToLetter/index.js'));
  assert(content.includes('多元思维模型分析'),
    'index.js中未找到"多元思维模型分析"回退值');
  assert(content.includes("mentorRules.mentors['多元思维模型分析']") ||
         content.includes('mentorRules.mentors[mentor] || mentorRules.mentors[\'多元思维模型分析\']'),
    '回退逻辑未使用"多元思维模型分析"');
}

// ==================== 测试组 6: 云函数加载逻辑简化 ====================

function testExpandedFileNotReferencedInIndex() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/replyToLetter/index.js'));
  assert(!content.includes('mentorRules_expanded'),
    'index.js中仍包含过期文件引用 mentorRules_expanded');
}

function testSimpleRequireUsed() {
  const lines = readFile(path.join(projectRoot, 'cloudfunctions/replyToLetter/index.js'))
    .split('\n')
    .slice(0, 10);

  const hasSimpleRequire = lines.some(line =>
    line.includes("require('./mentorRules.json')")
  );
  assert(hasSimpleRequire,
    '前10行未找到简单的 require(\'./mentorRules.json\') 加载语句');
}

function testNoTryCatchForExpandedLoading() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/replyToLetter/index.js'));
  // 确保没有 try/catch 包裹 mentorRules 加载（旧逻辑特征）
  const lines = content.split('\n');
  let inTryBlock = false;
  let mentorLoadInTryBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('try {') && i < 10) {
      inTryBlock = true;
    }
    if (inTryBlock && line.includes('mentorRules')) {
      mentorLoadInTryBlock = true;
    }
    if (line === '} catch' || line.startsWith('} catch')) {
      break;
    }
  }

  assert(!mentorLoadInTryBlock,
    'mentorRules 加载语句不应在 try/catch 块中（旧逻辑特征）');
}

// ==================== 测试组 7: sideMenu 便捷退出 ====================

function testQuickExitUsesReLaunch() {
  const content = readFile(path.join(projectRoot, 'miniprogram/components/sideMenu/index.js'));
  assert(content.includes('wx.reLaunch'),
    'quickExit 方法应使用 wx.reLaunch');
  assert(content.includes("url: '/pages/index/index'"),
    'quickExit 应跳转到首页 /pages/index/index');
}

function testQuickExitNoExitMiniProgram() {
  const content = readFile(path.join(projectRoot, 'miniprogram/components/sideMenu/index.js'));
  assert(!content.includes('wx.exitMiniProgram'),
    'quickExit 不应调用 wx.exitMiniProgram');
}

function testQuickExitButtonText() {
  const content = readFile(path.join(projectRoot, 'miniprogram/components/sideMenu/index.wxml'));
  assert(content.includes('退出AI分析'),
    '退出按钮文案应为"退出AI分析"');
  assert(!content.includes('一键退出'),
    '退出按钮不应包含旧文案"一键退出"');
}

function testQuickExitIcon() {
  const content = readFile(path.join(projectRoot, 'miniprogram/components/sideMenu/index.wxml'));
  assert(content.includes('🛑'),
    '退出功能图标应为🛑');
  assert(!content.includes('🚪'),
    '退出功能不应使用旧图标🚪');
}

// ==================== 测试组 8: reportContent 云函数 ====================

function testReportContentExists() {
  const indexPath = path.join(projectRoot, 'cloudfunctions/reportContent/index.js');
  assert(fileExists(indexPath), 'reportContent/index.js 不存在');
  const configPath = path.join(projectRoot, 'cloudfunctions/reportContent/config.json');
  assert(fileExists(configPath), 'reportContent/config.json 不存在');
}

function testReportContentValidatesRequiredParams() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/reportContent/index.js'));
  assert(content.includes('!contentId') || content.includes('contentId'),
    'reportContent 应校验 contentId 参数');
  assert(content.includes('!contentType') || content.includes('contentType'),
    'reportContent 应校验 contentType 参数');
  assert(content.includes('!reason') || content.includes('reason'),
    'reportContent 应校验 reason 参数');
  assert(content.includes('缺少必要参数'),
    'reportContent 缺少参数时应返回中文错误提示');
}

function testReportContentValidTypes() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/reportContent/index.js'));
  const validTypesLine = content.match(/validTypes\s*=\s*\[([^\]]+)\]/);
  assert(validTypesLine, '未找到 validTypes 定义');

  const typesStr = validTypesLine[1];
  const requiredTypes = ['letter', 'roundtable', 'incubator', 'structure_analysis'];
  for (const type of requiredTypes) {
    assert(typesStr.includes(type),
      `validTypes 应包含 "${type}"`);
  }
}

function testReportContentReasonLength() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/reportContent/index.js'));
  assert(content.includes('reason.length') && content.includes('500'),
    'reportContent 应校验 reason 长度限制（500字）');
}

function testReportContentWritesToReportsCollection() {
  const content = readFile(path.join(projectRoot, 'cloudfunctions/reportContent/index.js'));
  assert(content.includes("collection('reports')") ||
         content.includes('collection("reports")'),
    'reportContent 应向 reports 集合写入数据');
}

// ==================== 测试组 9: 全量拟人化词汇扫描 ====================

const ANTHRO_TERMS_WXML = ['导师', '写信', '回信', '大师', '邮票', '圆桌会议', '信件详情'];
const ANTHRO_TERMS_JS = ['导师', '写信', '回信', '大师', '邮票', '圆桌会议', '信件详情'];

function testNoAnthropomorphicInWxml() {
  const pagesDir = path.join(projectRoot, 'miniprogram/pages');
  const componentsDir = path.join(projectRoot, 'miniprogram/components');
  const allWxmlFiles = [
    ...walkDir(pagesDir, ['.wxml']),
    ...walkDir(componentsDir, ['.wxml'])
  ];

  const violations = [];
  for (const file of allWxmlFiles) {
    const content = readFile(file);
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const term of ANTHRO_TERMS_WXML) {
        if (lines[i].includes(term)) {
          // 排除注释行
          const trimmed = lines[i].trim();
          if (!trimmed.startsWith('<!--')) {
            violations.push({
              file: path.relative(projectRoot, file),
              line: i + 1,
              term,
              snippet: trimmed.substring(0, 100)
            });
          }
        }
      }
    }
  }

  assert(violations.length === 0,
    `WXML文件中发现 ${violations.length} 处拟人化词汇:\n${violations.map(v => `  ${v.file}:${v.line} 包含"${v.term}": ${v.snippet}`).join('\n')}`);
}

function testNoAnthropomorphicInJsPages() {
  const pagesDir = path.join(projectRoot, 'miniprogram/pages');
  const componentsDir = path.join(projectRoot, 'miniprogram/components');
  const allJsFiles = [
    ...walkDir(pagesDir, ['.js']),
    ...walkDir(componentsDir, ['.js'])
  ];

  const violations = [];
  for (const file of allJsFiles) {
    const content = readFile(file);
    const lines = content.split('\n');
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // 处理块注释
      if (trimmed.startsWith('/*')) inBlockComment = true;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
        continue;
      }
      if (inBlockComment) continue;

      // 排除单行注释
      if (trimmed.startsWith('//')) continue;

      // 检查目标词汇（排除注释部分之后的内容）
      const codePart = trimmed.split('//')[0]; // 取注释前的代码部分
      for (const term of ANTHRO_TERMS_JS) {
        if (codePart.includes(term)) {
          violations.push({
            file: path.relative(projectRoot, file),
            line: i + 1,
            term,
            snippet: trimmed.substring(0, 120)
          });
          break; // 每行只报告一次
        }
      }
    }
  }

  // 汇总报告（即使有violations也先收集完整，让开发者看到全部问题）
  if (violations.length > 0) {
    const summary = violations.map(v =>
      `  ${v.file}:${v.line} 包含"${v.term}": ${v.snippet}`
    ).join('\n');
    // 使用console.warn输出详情，断言失败但信息完整
    console.log(`\n  [检查详情] 前端JS文件发现 ${violations.length} 处拟人化词汇:`);
    console.log(summary);
    assert(false, `前端JS文件发现 ${violations.length} 处拟人化词汇（详见上方输出）`);
  }
}

function testNoAnthropomorphicInCloudConfigs() {
  const cloudDir = path.join(projectRoot, 'cloudfunctions');
  const configFiles = walkDir(cloudDir, ['.json']).filter(f =>
    f.endsWith('config.json') || f.endsWith('package.json')
  );
  const violations = [];

  for (const file of configFiles) {
    const content = readFile(file);
    const json = JSON.parse(content);
    // 检查所有字符串值
    function checkStrings(obj, path) {
      if (typeof obj === 'string') {
        for (const term of ANTHRO_TERMS_WXML) {
          if (obj.includes(term)) {
            violations.push({ file: path.relative(projectRoot, file), term, value: obj });
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
          checkStrings(obj[key], `${path}.${key}`);
        }
      }
    }
    checkStrings(json, '');
  }

  assert(violations.length === 0,
    `云函数配置文件中发现 ${violations.length} 处拟人化词汇:\n${violations.map(v => `  ${v.file}: "${v.value}" 包含"${v.term}"`).join('\n')}`);
}

// ==================== 测试执行 ====================

function runAllTests() {
  console.log('========================================');
  console.log('  Stage A 合规改造验证测试');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  const testGroups = [
    // 测试组 1: 页面标题合规
    { name: 'A1.1 detail页面标题: "分析详情"', fn: testDetailPageTitle },
    { name: 'A1.2 roundtable页面标题: "多维度分析"', fn: testRoundtablePageTitle },
    { name: 'A1.3 roundtableResult页面标题: "多维度分析"', fn: testRoundtableResultPageTitle },
    { name: 'A1.4 write页面标题: "分析方法"', fn: testWritePageTitle },
    { name: 'A1.5 所有页面标题不含禁用词', fn: testNoForbiddenTermsInAnyPageTitle },

    // 测试组 2: 云函数描述合规
    { name: 'A2.1 replyToLetter描述: "AI 分析引擎"', fn: testReplyToLetterDescription },
    { name: 'A2.2 getMentorRules config描述: "获取分析方法规则库"', fn: testGetMentorRulesConfigDescription },
    { name: 'A2.3 getMentorRules package描述: "获取分析方法规则库"', fn: testGetMentorRulesPackageDescription },
    { name: 'A2.4 所有云函数描述不含拟人化词汇', fn: testNoAnthropomorphicInAllCloudDescriptions },

    // 测试组 3: mentorRules.json 合规
    { name: 'A3.1 mentorRules.json 是有效JSON', fn: testMentorRulesIsValidJSON },
    { name: 'A3.2 恰好21种分析方法', fn: testMentorRulesHas21Methods },
    { name: 'A3.3 所有key是方法论名称非人名', fn: testAllKeysAreMethodNamesNotPersonNames },
    { name: 'A3.4 所有条目无persona字段', fn: testNoPersonaFieldInAnyEntry },
    { name: 'A3.5 所有条目有methodology字段', fn: testAllEntriesHaveMethodologyField },
    { name: 'A3.6 field值均为合法值', fn: testFieldValuesAreValid },
    { name: 'A3.7 field分配符合预期 (3:6:5:7)', fn: testFieldDistribution },
    { name: 'A3.8 边界情况: 无短名称/人名格式key', fn: testEdgeCaseMethodNamesAreDescriptive },

    // 测试组 4: 过期文件已删除
    { name: 'A4.1 mentorRules_expanded.json 已从云函数目录删除', fn: testExpandedFileDeletedFromCloudFunction },

    // 测试组 5: 云函数回退值去拟人化
    { name: 'A5.1 index.js中不含"查理·芒格"', fn: testNoCharlieMungerInIndex },
    { name: 'A5.2 回退值使用"多元思维模型分析"', fn: testMultipleThinkingModelIsFallback },

    // 测试组 6: 云函数加载逻辑简化
    { name: 'A6.1 无expanded文件引用', fn: testExpandedFileNotReferencedInIndex },
    { name: 'A6.2 使用简单require加载', fn: testSimpleRequireUsed },
    { name: 'A6.3 无try/catch包裹加载', fn: testNoTryCatchForExpandedLoading },

    // 测试组 7: sideMenu 便捷退出
    { name: 'A7.1 quickExit使用wx.reLaunch', fn: testQuickExitUsesReLaunch },
    { name: 'A7.2 quickExit不调用wx.exitMiniProgram', fn: testQuickExitNoExitMiniProgram },
    { name: 'A7.3 按钮文案为"退出AI分析"', fn: testQuickExitButtonText },
    { name: 'A7.4 退出图标为🛑', fn: testQuickExitIcon },

    // 测试组 8: reportContent 云函数
    { name: 'A8.1 reportContent云函数存在', fn: testReportContentExists },
    { name: 'A8.2 校验contentId/contentType/reason', fn: testReportContentValidatesRequiredParams },
    { name: 'A8.3 validTypes包含四种类型', fn: testReportContentValidTypes },
    { name: 'A8.4 reason长度限制500字', fn: testReportContentReasonLength },
    { name: 'A8.5 写入reports集合', fn: testReportContentWritesToReportsCollection },

    // 测试组 9: 全量拟人化词汇扫描
    { name: 'A9.1 WXML文件无拟人化词汇', fn: testNoAnthropomorphicInWxml },
    { name: 'A9.2 前端JS文件无拟人化词汇', fn: testNoAnthropomorphicInJsPages },
    { name: 'A9.3 云函数配置文件无拟人化词汇', fn: testNoAnthropomorphicInCloudConfigs }
  ];

  for (const t of testGroups) {
    if (test(t.name, t.fn)) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('测试结果汇总:');
  console.log(`通过: ${passed}/${testGroups.length}`);
  console.log(`失败: ${failed}/${testGroups.length}`);
  console.log(`成功率: ${Math.round(passed / testGroups.length * 100)}%`);
  console.log('========================================');

  return failed === 0;
}

if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests };
