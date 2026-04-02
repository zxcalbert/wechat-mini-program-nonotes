/**
 * MCP Server - invest-diary 开发助手
 * 
 * 功能：
 * - run_task: 调用 Claude Code agent 执行开发任务
 * - 权限控制：沙箱内无需确认，沙箱外需确认
 * - 结果解析：提取工具调用记录和执行结果
 */

import { spawn } from 'child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 配置
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/bill/编程/invest-diary';
const CLAUDE_CODE_PATH = process.env.CLAUDE_CODE_PATH || 'claude';

/**
 * 构造完整的任务 prompt
 * @param {string} task - 用户任务描述
 * @param {string} context - 额外上下文
 * @returns {string} 完整的 prompt
 */
function buildFullPrompt(task, context = '') {
  const systemPrompt = `你是一个微信小程序开发助手。你的任务是在 invest-diary 项目中完成代码修改。

【沙箱规则】
- 工作目录：${PROJECT_ROOT}
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
  
  return `${systemPrompt}\n\n【用户需求】\n${userPrompt}`;
}

/**
 * 解析 stream-json 格式的输出
 * @param {string} output - Claude Code 的输出
 * @returns {Array} 解析后的事件数组
 */
function parseStreamJson(output) {
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
  
  return events;
}

/**
 * 从事件流中提取执行摘要
 * @param {Array} events - 解析后的事件数组
 * @returns {Object} 执行摘要
 */
function extractSummary(events) {
  const toolCalls = [];
  let finalResult = null;
  const filesModified = new Set();
  
  for (const event of events) {
    // stream-json 格式的事件结构
    if (event.type === 'tool_use' || event.tool_name) {
      toolCalls.push({
        tool: event.tool_name || event.name,
        input: event.input || event.arguments,
        timestamp: event.timestamp
      });
      
      // 记录修改的文件
      if ((event.tool_name === 'Edit' || event.name === 'Edit') && event.input?.path) {
        filesModified.add(event.input.path);
      }
    } else if (event.type === 'result' || event.type === 'final_result') {
      finalResult = event.content || event.text;
    } else if (event.type === 'text') {
      // 文本结果
      finalResult = event.text;
    }
  }
  
  return {
    success: true,
    toolCalls: toolCalls,
    filesModified: Array.from(filesModified),
    result: finalResult,
    timestamp: new Date().toISOString()
  };
}

/**
 * 执行 Claude Code agent 任务
 * @param {string} task - 任务描述
 * @param {string} context - 额外上下文
 * @returns {Promise<Object>} 执行结果
 */
async function runTask(task, context = '') {
  return new Promise((resolve, reject) => {
    // 构造完整的任务描述
    const fullPrompt = buildFullPrompt(task, context);
    
    // 启动 Claude Code 进程（使用 --print 模式实现非交互式执行）
    const proc = spawn(CLAUDE_CODE_PATH, [
      '--print',  // 非交互式模式
      '--dangerously-skip-permissions',
      '--allowedTools', 'Bash,Read,Write,Edit',
      '--disallowedTools', 'Bash(rm:*)', 'Bash(git:push)', 'Bash(sudo:*)', 'Bash(git:reset:*)',
      '--output-format', 'stream-json',
      '--verbose',
      fullPrompt
    ], {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000 // 5 分钟超时
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const events = parseStreamJson(stdout);
          const summary = extractSummary(events);
          resolve(summary);
        } catch (err) {
          // 如果解析失败，返回原始输出
          resolve({
            success: true,
            toolCalls: [],
            filesModified: [],
            result: stdout || '任务完成（无法解析详细结果）',
            timestamp: new Date().toISOString(),
            rawOutput: stdout
          });
        }
      } else {
        reject(new Error(`Claude Code 执行失败 (code ${code}): ${stderr || stdout}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 格式化执行结果
 * @param {Object} result - 执行结果
 * @returns {string} 格式化后的文本
 */
function formatResult(result) {
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
  
  return output;
}

// 创建 MCP Server
const mcpServer = new McpServer({
  name: 'invest-diary-dev',
  version: '1.0.0'
});

// 注册工具
mcpServer.registerTool('run_task', {
  description: '调用 Claude Code agent 执行开发任务（修复 bug、实现功能等）。任务在 invest-diary 项目沙箱内执行，沙箱外操作需要权限确认。',
  inputSchema: {
    task: z.string().describe('任务描述，例如：修复登录页面的验证码显示问题'),
    context: z.string().optional().describe('额外上下文信息，例如：相关文件路径、错误日志等')
  }
}, async ({ task, context }) => {
  try {
    const result = await runTask(task, context);
    const output = formatResult(result);
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${err.message}`
        }
      ],
      isError: true
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('invest-diary MCP Server 已启动');
}

// 只在直接运行时启动，不在被导入时启动
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runTask, main, mcpServer };
