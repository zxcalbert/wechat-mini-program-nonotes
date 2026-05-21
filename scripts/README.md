# 项目规则检查清单 - 自动化工具

## 概述

本目录包含项目规则检查清单的工具化实现，依据 [project_rules.md](../.trae/rules/project_rules.md) 中定义的检查标准开发。

## 目录结构

```
scripts/
├── README.md                    # 本文档
├── package.json                 # Node.js 包配置
├── pre-commit-check.sh          # Bash 版本提交前检查脚本
├── checks/
│   ├── config.json              # 检查配置文件
│   └── project-rules-check.js  # Node.js 版本检查脚本
├── e2e/
│   └── rc-smoke.js              # 微信开发者工具自动化 RC 冒烟
├── tests/
│   ├── unit-tests.js            # 单元测试
│   └── integration-tests.js     # 集成测试
└── .github/
    └── workflows/
        └── project-rules-check.yml  # GitHub Actions CI 配置
```

## 功能特性

### 检查项

| 检查项 | 说明 | 优先级 |
|--------|------|--------|
| 敏感信息检查 | 检测 appid、secret、password、token 等 | 🔴 高 |
| 调试日志检查 | 统计 console.log/error/warn 数量 | 🟡 中 |
| 废弃API检查 | 检测 wx.getUserProfile 等已废弃API | 🔴 高 |
| 文件大小检查 | 检查图片和 JS 文件大小 | 🟡 中 |
| 代码风格检查 | 检查缩进、分号等风格 | 🟢 低 |
| 项目结构检查 | 验证必要目录是否存在 | 🟡 中 |

## 快速开始

### 1. 运行 Bash 脚本

```bash
cd /Users/bill/编程/invest-diary
chmod +x scripts/pre-commit-check.sh  # 首次使用需要
./scripts/pre-commit-check.sh
```

### 2. 运行 Node.js 脚本

```bash
cd scripts
node checks/project-rules-check.js
```

### 3. 运行测试

```bash
cd scripts
npm run test:jest          # Jest 单元/页面逻辑测试
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test               # 全部测试
```

### 4. 运行微信开发者工具自动化冒烟

微信小程序可通过微信开发者工具 CLI + `miniprogram-automator` 做本地自动化测试。它适合 RC 冒烟，例如打开首页、输入搜索词、跳转详情、返回后确认搜索结果仍保持过滤。

前置条件：

1. 安装微信开发者工具。
2. 在开发者工具中开启服务端口/自动化能力。
3. 本机已有可用登录态或测试数据。
4. 如 CLI 不在默认路径，设置 `WECHAT_DEVTOOLS_CLI`。

```bash
cd scripts
npm run test:e2e:rc
```

可选环境变量：

```bash
WECHAT_DEVTOOLS_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
WECHAT_AUTOMATOR_PORT=9420 \
npm run test:e2e:rc
```

截图会写入：`tmp/e2e-screenshots/`。

注意：E2E 冒烟依赖本机开发者工具、登录态和云端数据，不纳入默认 `npm test`。云函数部署、真机权限、微信授权弹窗仍需人工确认。

## 配置说明

编辑 `checks/config.json` 可以自定义检查规则：

```json
{
  "checks": {
    "sensitive_info": {
      "enabled": true,
      "patterns": ["appid", "secret", "password", "token"]
    },
    "console_log": {
      "enabled": true,
      "max_count": 50
    }
  }
}
```

## Git Pre-commit Hook 集成

### 手动设置

```bash
cd /Users/bill/编程/invest-diary
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 使用 husky (推荐)

```bash
npm install husky --save-dev
npx husky install
npx husky add .husky/pre-commit "bash scripts/pre-commit-check.sh"
```

## CI/CD 集成

项目已配置 GitHub Actions，在 push 和 PR 时自动运行检查。

配置文件位置：`.github/workflows/project-rules-check.yml`

### 触发条件

- push 到 main/develop 分支
- PR 到 main/develop 分支
- 手动触发 (workflow_dispatch)

### CI 任务

1. **项目规则检查**：运行完整的检查清单
2. **安全审计**：专门的敏感信息扫描
3. **代码质量**：代码统计和质量检查

## 检查结果解读

```
========================================
  项目规则检查清单 - 提交前检查
========================================

检查 1/6: 敏感信息检查...
[✓] 敏感信息检查
检查 2/6: 调试日志检查...
[!] 调试日志检查
...

检查结果汇总:
通过: 5
警告: 1
失败: 0
========================================

✓ 所有检查通过，可以提交
```

- **✓ 绿色**：检查通过
- **! 黄色**：警告（不阻止提交，但建议修复）
- **✗ 红色**：失败（阻止提交，必须修复）

## Jest 自动化测试

```bash
npm run test:jest           # 174 用例，12 套件
npm run test:jest:coverage  # 带覆盖率报告
```

| 测试文件 | 覆盖范围 | 用例数 |
|---------|---------|--------|
| apiKeyUtil.test.js | API Key 生成/校验/脱敏 | 11 |
| exportUtil.test.js | Markdown 导出（analysis/roundtable/incubator/autoExport） | ~15 |
| markdownUtil.test.js | Markdown 解析器（标题/列表/粗体/代码/表格） | ~20 |
| mindmap.test.js | 脑图组件布局 + 渲染逻辑 | ~15 |
| sensitiveWordDetector.test.js | 三级敏感词检测 | ~12 |
| wordCountUtil.test.js | 中文/英文混合字数计算 | ~10 |
| indexPage.test.js | 首页逻辑（状态映射/数据加载） | ~15 |
| writePage.test.js | 分析请求页（方法选择/提交） | ~15 |
| roundtablePage.test.js | 多维度分析页 | ~15 |
| incubatorPage.test.js | 孵化器页 | ~15 |

辅助文件：`setup.js`（全局配置）、`pageTestHelper.js`（模拟 Page/Component/getApp）

## Legacy 测试

### 单元测试 (`tests/unit-tests.js`)

- 脚本文件存在性检查
- 配置文件有效性检查
- 敏感信息检测功能
- 废弃API检测功能
- Console日志统计功能

### 集成测试 (`tests/integration-tests.js`)

- 项目结构完整性检查
- Bash脚本执行测试
- CI配置结构检查

## 故障排查

### 问题：脚本没有执行权限

```bash
chmod 755 scripts/pre-commit-check.sh
```

### 问题：Node.js 脚本报错

确保 Node.js 版本 >= 14.0.0

```bash
node --version
```

### 问题：CI 构建失败

查看 Actions 日志，定位具体失败的检查项并修复。

## 贡献指南

1. 修改前请阅读 [project_rules.md](../.trae/rules/project_rules.md)
2. 添加新检查项时更新配置文件
3. 确保所有测试通过
4. 更新本文档

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2026-02-25 | 初始版本，实现完整的检查清单工具化 |

## 许可证

与项目主仓库保持一致。
