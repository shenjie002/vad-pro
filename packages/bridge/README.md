# @vad-pro/bridge

> **本地中枢神经服务 —— VAD-Pro 的「中枢神经层 + 多模态大脑层」**

---

## 🛠️ 技术栈

- **运行时**：Node.js 20 + TypeScript
- **Web 框架**：Koa + @koa/router + ws（WebSocket）
- **终端模拟**：集成 `node-pty`（支持真实 Bash/Zsh 会话）
- **高性能层**：Rust + NAPI-RS（处理 AST 解析与 Diff Patch）
- **数据校验**：Zod

### 🤖 AI 执行双路径
- **路径 A**：通过 `node-pty` 调用命令行工具（如 Claude Code / Aider / Cursor CLI）。
- **路径 B**：原生 SDK 直连（Anthropic / OpenAI / Google Generative AI）。

---

## ✨ 功能说明

- **智能识别**：自动识别当前项目环境（通过 Tab URL 与 `package.json` 名称匹配）。
- **会话隔离**：多项目并行开发时保持会话上下文隔离。
- **多模态链路**：接收 Extension Payload → 组装多模态 Prompt（含源码 + 截图 + DOM）。
- **补丁应用**：自动应用 Unified Diff 补丁并触发相应框架的 Vite HMR。
- **视觉闭环**：代码修改后自动触发二次截图，由 AI 确认修改效果。

---

## 🚀 启动方式

### 生产环境 (推荐全局链接)
```bash
# 在任意前端项目根目录执行
npx vad-bridge
```

### 开发模式
```bash
# 启动本地开发服务
pnpm --filter @vad-pro/bridge dev
```

> **默认监听地址**：`ws://localhost:8787`