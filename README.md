# VAD-Pro (Visual Agentic Dev Pro)

> **下一代「点击即让 AI 修改代码」沉浸式开发工具**

基于 `visual-agentic-dev` + `code-inspector` + `Antigravity` 融合架构，完全开源、可本地部署。

---

## 🚀 核心特性

- **精准定位**：点击页面任意元素 → 直接定位源码（支持 React Fiber + 通用 AST）。
- **AI 自动编辑**：一键唤起 Claude Code / Cursor / Gemini 等 AI 引擎自动修改代码。
- **沉浸式体验**：全屏 Shield 遮罩 + 虚拟光标 + 截图视觉验证闭环。
- **多框架支持**：兼容 React、Vue、Svelte 及纯 HTML 项目。
- **高效开发**：支持多项目并行、热更新 HMR 即时预览。

## 📁 项目结构

```text
vad-pro/
├── packages/
│   ├── injector/     # 构建时源码映射插件（探针注入）
│   ├── extension/    # Chrome 浏览器扩展（WXT 架构）
│   └── bridge/       # 本地中枢服务（Node + Rust/NAPI-RS）
├── turbo.json        # Turborepo 配置
└── pnpm-workspace.yaml
```

## 🛠️ 快速开始

### 1. 安装依赖
在项目根目录执行：
```bash
pnpm install
```

### 2. 启动开发模式
一键启动所有相关服务（Bridge + Injector + Extension）：
```bash
pnpm dev
```

> [!TIP]
> 也可以单独启动特定子包，例如 `pnpm extension:dev`。

## 📖 详细文档

- [Injector 说明 (探针注入)](file:///Users/shenjie/cursorIDE/vad-pro/packages/injector/README.md)
- [Extension 说明 (浏览器插件)](file:///Users/shenjie/cursorIDE/vad-pro/packages/extension/README.md)
- [Bridge 说明 (中枢服务)](file:///Users/shenjie/cursorIDE/vad-pro/packages/bridge/README.md)

---

**技术栈总览**：Turborepo + pnpm + TypeScript + WXT + unplugin + Koa + node-pty + NAPI-RS
