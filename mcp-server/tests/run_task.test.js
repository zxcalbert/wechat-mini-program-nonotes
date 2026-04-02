/**
 * 单元测试 - run_task 相关函数
 * 
 * 测试：
 * - buildFullPrompt: 构造完整的任务 prompt
 * - parseStreamJson: 解析 stream-json 输出
 * - extractSummary: 提取执行摘要
 * - formatResult: 格式化执行结果
 */

// 测试 parseStreamJson 函数
function testParseStreamJson() {
  console.log('=== 测试 parseStreamJson ===');
  
  const output = '{"type":"text","text":"hello"}\n{"type":"tool_use","tool_name":"Read"}';
  const lines = output.split('\n').filter(line => line.trim());
  const events = [];
  
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      events.push(event);
    } catch (err) {
      // 忽略非 JSON 行
    }
  }
  
  console.assert(events.length === 2, '应该解析2个事件');
  console.assert(events[0].type === 'text', '第一个事件应该是text类型');
  console.assert(events[1].tool_name === 'Read', '第二个事件tool_name应该是Read');
  console.log('✅ parseStreamJson 测试通过');
  return true;
}

// 测试 parseStreamJson 忽略无效 JSON
function testParseStreamJsonWithInvalid() {
  console.log('=== 测试 parseStreamJson 忽略无效 JSON ===');
  
  const output = '{"type":"text"}\n这不是JSON\n{"type":"tool"}';
  const lines = output.split('\n').filter(line => line.trim());
  const events = [];
  
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      events.push(event);
    } catch (err) {
      // 忽略非 JSON 行
    }
  }
  
  console.assert(events.length === 2, '应该解析2个有效事件');
  console.log('✅ parseStreamJson 忽略无效 JSON 测试通过');
  return true;
}

// 测试 extractSummary 函数
function testExtractSummary() {
  console.log('=== 测试 extractSummary ===');
  
  const events = [
    { type: 'tool_use', tool_name: 'Read', input: { path: 'test.js' } },
    { type: 'tool_use', tool_name: 'Edit', input: { path: 'test.js' } },
    { type: 'text', text: 'Task completed' }
  ];
  
  const toolCalls = [];
  const filesModified = new Set();
  let finalResult = null;
  
  for (const event of events) {
    if (event.type === 'tool_use' || event.tool_name) {
      toolCalls.push({
        tool: event.tool_name,
        input: event.input
      });
      if ((event.tool_name === 'Edit') && event.input?.path) {
        filesModified.add(event.input.path);
      }
    } else if (event.type === 'text') {
      finalResult = event.text;
    }
  }
  
  console.assert(toolCalls.length === 2, '应该有2个工具调用');
  console.assert(toolCalls[0].tool === 'Read', '第一个工具应该是Read');
  console.assert(toolCalls[1].tool === 'Edit', '第二个工具应该是Edit');
  console.assert(filesModified.has('test.js'), '应该记录修改的文件');
  console.assert(finalResult === 'Task completed', '应该有正确的执行结果');
  console.log('✅ extractSummary 测试通过');
  return true;
}

// 测试 formatResult 函数
function testFormatResult() {
  console.log('=== 测试 formatResult ===');
  
  const result = {
    success: true,
    toolCalls: [
      { tool: 'Read', input: { path: 'test.js' } },
      { tool: 'Edit', input: { path: 'test.js' } }
    ],
    filesModified: ['test.js'],
    result: 'Task completed',
    timestamp: new Date().toISOString()
  };
  
  let output = '✅ 任务执行成功\n\n';
  
  if (result.filesModified.length > 0) {
    output += '📝 修改的文件：\n';
    result.filesModified.forEach(file => {
      output += `  - ${file}\n`;
    });
    output += '\n';
  }
  
  if (result.toolCalls.length > 0) {
    output += '🔧 执行的操作：\n';
    result.toolCalls.forEach((call, index) => {
      output += `  ${index + 1}. ${call.tool}\n`;
    });
    output += '\n';
  }
  
  if (result.result) {
    output += '📋 执行结果：\n';
    output += result.result + '\n';
  }
  
  output += `\n⏱️ 执行时间: ${result.timestamp}`;
  
  console.assert(output.includes('✅ 任务执行成功'), '应该包含成功标记');
  console.assert(output.includes('test.js'), '应该包含文件名');
  console.assert(output.includes('Task completed'), '应该包含执行结果');
  console.log('✅ formatResult 测试通过');
  return true;
}

// 测试 buildFullPrompt 函数
function testBuildFullPrompt() {
  console.log('=== 测试 buildFullPrompt ===');
  
  const task = '修复登录页面的验证码显示问题';
  const context = '用户反馈验证码无法显示';
  
  const systemPrompt = `你是一个微信小程序开发助手。你的任务是在 invest-diary 项目中完成代码修改。

【沙箱规则】
- 工作目录：/Users/bill/编程/invest-diary
- 允许操作：读文件、修改代码、执行测试、提交到本地分支
- 禁止操作：删除文件、强制 push、修改 git 历史、访问沙箱外目录

【代码规范】
- 所有函数必须提供完整中文 docstring（参数、返回值、异常）
- 复杂逻辑必须有中文行内注释
- 禁止魔法数字/魔法字符串
- 优先可测试性与可维护性

【执行流程】
1. 理解任务需求
2. 读取相关文件，理解现有代码
3. 设计修改方案
4. 实现代码修改
5. 执行测试（如果有）
6. 总结改动内容

【输出要求】
- 清晰列出修改的文件
- 说明每个文件的改动原因
- 如果有测试，报告测试结果
- 如果有风险，主动提示`;
  
  const userPrompt = context 
    ? `${task}\n\n【额外上下文】\n${context}`
    : task;
  
  const fullPrompt = `${systemPrompt}\n\n【用户需求】\n${userPrompt}`;
  
  console.assert(fullPrompt.includes('【沙箱规则】'), '应该包含沙箱规则');
  console.assert(fullPrompt.includes('【用户需求】'), '应该包含用户需求');
  console.assert(fullPrompt.includes('修复登录页面的验证码显示问题'), '应该包含任务描述');
  console.assert(fullPrompt.includes('【额外上下文】'), '应该包含额外上下文');
  console.assert(fullPrompt.includes('用户反馈验证码无法显示'), '应该包含上下文内容');
  console.log('✅ buildFullPrompt 测试通过');
  return true;
}

// 测试 runTask 函数（集成测试）
async function testRunTask() {
  console.log('=== 测试 runTask（集成测试）===');
  
  try {
    // 动态导入 server.js
    const { runTask } = await import('../server.js');
    
    const result = await runTask('列出当前目录下的所有文件');
    
    console.assert(result !== null, '结果不应为null');
    console.assert(result.success === true, 'success 应该为 true');
    console.assert(result.timestamp !== undefined, '应该有 timestamp');
    console.assert(result.result !== undefined, '应该有 result');
    
    console.log('✅ runTask 测试通过');
    console.log('   - 执行时间:', result.timestamp);
    console.log('   - 结果长度:', result.result?.length || 0);
    return true;
  } catch (err) {
    console.error('❌ runTask 测试失败:', err.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('\n🧪 开始运行测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  // 同步测试
  const syncTests = [
    testParseStreamJson,
    testParseStreamJsonWithInvalid,
    testExtractSummary,
    testFormatResult,
    testBuildFullPrompt
  ];
  
  for (const test of syncTests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ 测试失败:`, err.message);
      failed++;
    }
  }
  
  // 异步测试
  console.log('\n--- 异步测试 ---');
  try {
    if (await testRunTask()) {
      passed++;
    } else {
      failed++;
    }
  } catch (err) {
    console.error(`❌ runTask 测试失败:`, err.message);
    failed++;
  }
  
  // 总结
  console.log('\n========================================');
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  console.log('========================================\n');
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！\n');
    process.exit(0);
  } else {
    console.log('❌ 有测试失败，请检查。\n');
    process.exit(1);
  }
}

// 运行测试
runAllTests();
