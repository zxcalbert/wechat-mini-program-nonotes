# AI Agent 接口设计方案

**文档日期**：2026-05-05
**定位**：面向 AI Agent 的通信接口设计与产品战略思考
**状态**：概念设计阶段

---

## 1. 背景与动机

智慧笔记当前是纯面向人类用户的微信小程序。但随着 AI Agent 生态的发展，未来的应用应该同时为人类和 AI Agent 服务：

- **人类端**：微信小程序（现有）+ Web 端（远期）
- **Agent 端**：REST API + CLI + MCP Server

### 为什么需要 Agent 接口

1. **自动化工作流**：AI Agent 可以定时触发分析、批量处理问题、自动归档
2. **数据管道**：Agent 可以读写分析结果，与其他工具（Obsidian、Notion）打通
3. **程序化思考**：将"分析方法论"能力嵌入 Agent 的工具链中
4. **双向协作**：人类在小程序中写问题，Agent 补充分析或追问

---

## 2. 接口设计原则

| 原则 | 说明 |
|------|------|
| Markdown First | 所有输入输出以 Markdown 为核心格式，AI Agent 的通用语言 |
| REST + CLI 双模式 | API 供程序调用，CLI 供开发者/Agent 直接操作 |
| 最小权限 | Agent 只能访问用户授权的数据，操作需 OAuth 验证 |
| 与前端解耦 | Agent 接口不依赖微信小程序运行时，独立部署 |

---

## 3. 核心接口设计（REST API）

### 3.1 认证

```
POST /api/v1/auth/token
  Body: { "code": "wx_login_code" } 或 { "api_key": "agent_xxx" }
  Response: { "access_token": "jwt_xxx", "expires_in": 7200 }
```

Agent 认证流程：
1. 用户在小程序中生成 API Key（profile 页面）
2. Agent 使用 API Key 换取 access_token
3. 后续请求携带 Bearer Token

### 3.2 分析方法管理

```
GET  /api/v1/methods                    # 列出所有分析方法
GET  /api/v1/methods/:method_id         # 获取单个方法详情
```

Response 示例：
```json
{
  "methods": [
    {
      "id": "multi-model-thinking",
      "name": "多元思维模型分析",
      "field": "价值思维",
      "description": "运用逆向思维、多学科思维模型分析问题",
      "suitable_for": ["决策分析", "风险评估", "问题诊断"]
    }
  ]
}
```

### 3.3 提交分析

```
POST /api/v1/analyses
  Body: {
    "content": "如何评估一个创业机会？",
    "method_ids": ["multi-model-thinking", "first-principles"],
    "options": {
      "skip_delay": false,    # 是否跳过 18 小时延迟
      "generate_mindmap": true # 自动生成脑图
    }
  }
  Response: {
    "id": "anlys_20260505_001",
    "status": "analyzing",
    "estimated_completion": "2026-05-06T10:00:00Z"
  }
```

### 3.4 获取分析结果

```
GET  /api/v1/analyses                    # 列出分析记录
GET  /api/v1/analyses/:id                # 获取单个分析详情
GET  /api/v1/analyses/:id/mindmap        # 获取脑图 JSON
GET  /api/v1/analyses/:id/export?format=markdown  # 导出 Markdown
```

Response 示例（Markdown 导出）：
```markdown
# 多元思维模型分析：如何评估一个创业机会？

## 分析结果

基于逆向思维模型的分析显示...

### 核心观点

- **避免失败比追求成功更重要**
- 用多学科模型评估机会

---

*分析时间：2026-05-05 | 方法：多元思维模型分析*
```

### 3.5 知识图谱

```
GET  /api/v1/knowledge-graph             # 获取用户知识图谱
GET  /api/v1/knowledge-graph/search?q=XX # 搜索相关分析
POST /api/v1/knowledge-graph/link        # 手动关联两条分析
```

---

## 4. CLI 设计

### 4.1 安装

```bash
npm install -g wisdom-notes-cli
# 或
npx wisdom-notes --help
```

### 4.2 核心命令

```bash
# 认证
wn auth login --api-key agent_xxx

# 提交分析
wn analyze "如何评估创业机会" --method multi-model-thinking
wn analyze "如何评估创业机会" --methods first-principles,long-termism

# 查看结果
wn list                              # 列出最近分析
wn show anlys_20260505_001           # 查看详情（Markdown 输出）
wn show anlys_20260505_001 --mindmap # 输出脑图 JSON

# 导出
wn export --format markdown --output ./notes/
wn export --format json --since 2026-04-01

# 搜索
wn search "决策"

# 方法列表
wn methods                           # 列出所有分析方法
```

### 4.3 Agent 集成模式

```bash
# 与其他 CLI 工具管道化
wn show anlys_001 | obsidian-import --vault "My Notes"
wn analyze "问题" --method first-principles | llm summarize

# MCP Server 模式（供 Claude/其他 Agent 调用）
wn mcp-server --port 3000
```

---

## 5. MCP Server 设计

智慧笔记可以作为 MCP Server，嵌入 AI Agent 的工作流中：

### 5.1 提供的 Tools

| Tool | 描述 |
|------|------|
| `list_methods` | 列出可用的分析方法 |
| `analyze` | 提交分析请求 |
| `get_analysis` | 获取分析结果（Markdown） |
| `get_mindmap` | 获取脑图 JSON 数据 |
| `search_analyses` | 搜索历史分析记录 |
| `export_analysis` | 导出分析为指定格式 |

### 5.2 提供的 Resources

| Resource | 描述 |
|----------|------|
| `wn://methods/{id}` | 单个分析方法的完整规则 |
| `wn://analyses/{id}` | 单条分析记录 |
| `wn://knowledge-graph` | 用户的知识图谱 |

### 5.3 配置示例

```json
{
  "mcpServers": {
    "wisdom-notes": {
      "command": "npx",
      "args": ["wisdom-notes", "mcp-server"],
      "env": {
        "WN_API_KEY": "agent_xxx"
      }
    }
  }
}
```

---

## 6. 技术架构

### 6.1 当前架构（微信小程序）

```
[用户] → [微信小程序] → [微信云函数] → [DeepSeek API]
                ↓
           [微信云数据库]
```

### 6.2 目标架构（双端 + API）

```
[人类用户] → [微信小程序] ─┐
                           ├→ [API Gateway] → [业务逻辑层] → [DeepSeek API]
[人类用户] → [Web 前端] ───┤         ↑                          ↓
                           │     [OAuth 2.0]              [AI 分析引擎]
[AI Agent] → [REST API] ───┤         ↑                          ↓
                           │    [微信云数据库] ←→ [数据同步层]
[AI Agent] → [CLI/MCP] ───┘
```

### 6.3 关键技术决策

| 决策项 | 方案 | 理由 |
|--------|------|------|
| API 框架 | Express.js / Hono | 轻量、与现有 Node.js 生态一致 |
| 认证 | JWT + API Key | 支持人类和 Agent 两种模式 |
| 数据库 | 保持微信云数据库 + 新增索引 | 避免迁移，API 层做适配 |
| 部署 | **微信云托管**（首选） | 支持公网 REST API，按量付费 |
| CLI 分发 | npm 包 | 标准化分发，Agent 可 npx 调用 |

### 6.4 微信云托管调研结论（2026-05-06）

**结论：微信云托管完全可行，推荐作为 API 层的首选部署方案。**

#### 支持公网 REST API
- 在服务设置中开启「允许公网访问」即可
- 分配默认公网域名，支持绑定自定义域名
- 仅支持 HTTP 协议，通过域名访问（不支持 IP 直连）
- 小程序内部可通过 `callContainer` 走微信私密链路调用

#### 定价
| 资源 | 价格 |
|------|------|
| CPU | 0.055 元/（核·小时） |
| 内存 | 0.032 元/（GB·小时） |
| 公网流量 | 0.8 元/GB |
| 构建时长 | 0.05 元/分钟 |

#### 免费额度
- 首个环境赠送 3 个月免费额度：720 核·小时 CPU + 1440 GB·小时内存 + 5GB 流量
- **用户当前免费期到 2026 年 6 月末**，需要在此日期前评估成本或续费

#### 两种调用形态
| 方式 | 适用场景 |
|------|---------|
| `callContainer`（微信专线） | 小程序/公众号内部调用，免配置域名，自带防护 |
| 公网域名 REST API | 外部 App/Web/Agent 调用，需开启公网访问 |

#### 推荐方案
1. 在微信云托管创建一个 API 服务（Express.js 容器）
2. 小程序继续用 `callContainer` 调用
3. 外部 Agent 通过公网域名 REST API 调用
4. 两套入口共享同一份业务逻辑代码

### 6.5 独立 App 技术选型调研（2026-05-06）

**结论：短期不开发独立 App，但推荐 uni-app 作为远期技术储备。**

| 框架 | 核心优势 | 与智慧笔记匹配度 |
|------|---------|----------------|
| **uni-app / uni-app X** | 小程序+App 一套代码，国内生态最完善 | ⭐⭐⭐⭐⭐ 最高 |
| Flutter | 自绘引擎、高性能渲染 | ⭐⭐⭐ 需重写全部 UI |
| React Native | React 生态、New Architecture | ⭐⭐⭐ 需重写 |
| 原生开发 | AI 辅助编程降低成本 | ⭐⭐ 双端成本翻倍 |

**推荐路径**：
- 当前：微信小程序 + API 层
- 远期（如需独立 App）：用 uni-app 重写前端，复用已有 API
- 核心优势：uni-app 可以直接编译微信小程序 + iOS + Android，代码复用率最高

---

## 7. 与 Obsidian / Flomo 的差异化竞争

### 7.1 竞品对比

| 维度 | Obsidian | Flomo | 智慧笔记 |
|------|----------|-------|---------|
| 核心定位 | 知识管理工具 | 轻量笔记工具 | AI 方法论分析工具 |
| 记录方式 | 自由编辑 | 快速记录 | 结构化提问 |
| AI 能力 | 插件扩展 | 无 | 内置 22 种分析方法 |
| 可视化 | 关系图谱 | 无 | 脑图 + 知识全景图（规划中） |
| 目标用户 | 知识工作者 | 所有用户 | 深度思考者 |
| 平台 | 桌面+移动 | 移动 | 微信小程序（+ API/CLI） |
| 数据格式 | Markdown | 私有 | Markdown + JSON |
| Agent 兼容 | 社区插件 | 无 | 原生 API + MCP |
| 特色机制 | 无 | 无 | 18 小时延迟思考 |

### 7.2 差异化核心

**不是更好的笔记工具，而是 AI 驱动的思考伙伴**

1. **方法论驱动**：不是自由记录，而是用结构化的分析方法引导思考
2. **AI 作为伙伴**：不是辅助写作，而是独立的思考视角
3. **延迟机制**：强制深度思考，而非即时满足
4. **Agent 原生**：未来应用同时服务人类和 AI Agent

### 7.3 是否需要独立 App

**结论：短期不需要，中期考虑双端架构**

| 方案 | 优点 | 缺点 | 建议 |
|------|------|------|------|
| 仅小程序 | 开发成本低、微信生态红利 | 受限于微信平台、无 API 能力 | 当前阶段 |
| 小程序 + API | Agent 可接入、数据可导出 | 需独立后端部署 | **推荐优先做** |
| 独立 App (React Native) | 完全自主、体验更好 | 开发成本极高、需应用商店审核 | 中期（用户量 > 1万） |
| Web 前端 | 跨平台、脑图体验好 | 需要额外开发和部署 | 远期（与 API 同步） |

### 7.4 推荐路线

```
现在（Phase 1-2）
  → 微信小程序继续迭代
  → 同步开发 REST API 层（复用云函数逻辑）

短期（Phase 3）
  → CLI 工具发布（npm 包）
  → MCP Server 发布
  → 用户可在 profile 页生成 API Key

中期（用户增长后）
  → Web 前端（Next.js，复用 API）
  → 独立 App 评估（基于用户数据决策）
```

---

## 8. Markdown 作为通用交换格式

Markdown 是人类和 AI Agent 的共同语言。优化 Markdown 能力是连接两端的桥梁：

### 8.1 当前状态

- `markdownUtil.js`：轻量解析器，支持标题/列表/粗体/代码/表格/任务列表
- `markdown-renderer` 组件：rich-text 渲染，4 个结果页面已集成
- AI 分析输出为纯文本/Markdown 混合格式

### 8.2 优化方向

| 方向 | 说明 | 优先级 |
|------|------|--------|
| 标准化输出 | 要求 AI 严格输出规范 Markdown | 高 |
| 导出功能 | 分析结果 → Markdown 文件下载 | 高 |
| Agent 消费 | API 返回 Markdown 格式（不是 HTML） | 高 |
| LaTeX 支持 | 数学公式渲染（rich-text 限制，需评估） | 低 |
| Mermaid 支持 | 流程图渲染（复杂，远期考虑） | 低 |

### 8.3 Markdown 输出规范

所有分析结果应遵循以下 Markdown 结构：

```markdown
# {分析方法名}：{用户问题摘要}

## 分析结果

{核心分析内容，可包含列表、表格、引用}

---

*分析方法：{方法名} | 分析时间：{时间} | AI 生成，仅供参考*
```

---

## 9. 实施路线

### Phase A（当前，与 Phase 2 并行）

1. 完成 `markdownUtil.js` 增强 ✅
2. AI 输出 Markdown 规范化（修改 prompts.js） 🔄
3. 在 profile 页增加 "API Key" 管理入口（UI 占位）

### Phase B（Phase 3 期间）

1. 搭建 REST API 网关（Express.js / Hono）
2. 复用云函数中的分析逻辑
3. 实现 API Key 认证
4. CLI 工具开发（Node.js，Commander.js）

### Phase C（用户增长后）

1. MCP Server 发布
2. Web 前端开发
3. 独立 App 评估

---

## 10. 风险与待确认项

| 风险 | 说明 | 应对 |
|------|------|------|
| 微信云函数无法直接暴露 HTTP API | 需要微信云托管或独立服务器 | 评估微信云托管 HTTP 触发能力 |
| API Key 安全性 | 用户可能泄露 API Key | 速率限制 + 权限分级 |
| 数据一致性 | 小程序和 API 访问同一数据 | 统一数据访问层 |
| 成本 | API 调用增加服务器成本 | 速率限制 + 按量计费 |
| 合规 | Agent 接口是否需要额外备案 | 需确认法规要求 |

---

## 11. 与 FLIPBOOK_INTEGRATION_REPORT 的关系

Flipbook 报告的"路径 D：小程序+Web 双端"与本设计直接关联：

- Flipbook 关注的是**可视化演进路径**
- 本设计关注的是**通信接口和 Agent 集成**
- 两者在 Web 前端处交汇：Web 端同时提供人类可视化浏览和 Agent API 访问

建议将 Flipbook 的 Phase 3（全可视化）与本设计的 Phase B（API 层）同步推进。
