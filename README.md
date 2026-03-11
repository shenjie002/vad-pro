# VAD-Pro (Visual Agentic Dev Pro)

> **下一代「点击即让 AI 修改代码」沉浸式开发工具**

VAD-Pro 是一款直观的开发辅助工具，允许开发者通过点击网页元素直接由 AI 修改对应的源码文件。

---

## 🔌 接入现有项目 (Vite)

如果你想在自己的项目中使用 VAD-Pro，只需完成以下两步：

### 1. 安装探针
在你的项目中安装 `injector` 插件：
```bash
pnpm add @vad-pro/injector -D
```

### 2. 配置 Vite
在 `vite.config.ts` 中引入并使用该插件。VAD-Pro 支持 React 和 Vue 项目：

#### React 项目
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vadInjector } from '@vad-pro/injector';

export default defineConfig({
  plugins: [
    // 1. 必须放在框架插件之前
    vadInjector(),
    react(),
  ],
});
```

#### Vue 项目
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { vadInjector } from '@vad-pro/injector';

export default defineConfig({
  plugins: [
    // 1. 必须放在框架插件之前
    vadInjector(),
    vue(),
  ],
});
```

> [!TIP]
> **Vue 支持**：VAD-Pro 同时支持 `.vue` 单文件组件 (SFC) 和 Vue 中的 JSX/TSX 开发方式。


> [!NOTE]
> 配置完成后，重启你的项目开发服务器。现在当你按下快捷键选中元素时，VAD-Pro 就能精准识别你项目中的源码位置了。

---

## 🚀 核心功能

- **元素级定位**：点击浏览器页面任意元素，即可直接定位到编辑器中对应的源码文件和行号。
- **AI 智能编辑**：一键唤起多种 AI 引擎（如 Gemini、OpenAI、Claude Code、Cursor、Kimi、Qwen 等）根据你的需求自动修改代码。
- **多引擎配置**：提供可视化的设置面板，支持在 Gemini CLI/API、OpenAI API 及其它多种本地 CLI 工具之间自由切换。
- **全自动闭环**：AI 生成修改方案后，自动应用 Patch、保存文件并触发项目热更新。
- **视觉验证**：支持截图上传，为 AI 提供视觉上下文，确保修改结果符合 UI 预期。

---

## �️ 使用方式

### 1. 准备环境
由于 VAD-Pro 需要与本地编辑器和 AI 引擎通信，请确保已安装 Node.js (v22+) 及 pnpm。

### 2. 初始化项目
在 `vad-pro` 根目录执行以下命令安装依赖：
```bash
pnpm install
```

### 3. 配置 AI 驱动
1. 创建或编辑 `.env` 文件。
2. 启动服务后，在插件设置页配置你偏好的 AI 提供商（如 API Key 或本地 CLI 路径）。

### 4. 启动开发模式
执行以下命令启动所有服务：
```bash
pnpm dev
```

### 5. 沉浸式开发
1. 打开浏览器并在你的项目页面按下 `Command + Shift + S` (Mac) 或 `Ctrl + Shift + S` (Windows)。
2. 移动鼠标选中想要修改的元素。
3. 在侧边面板输入修改指令（例如：“把这个标题改为红色”）。
4. 点击“发送”，观察 AI 自动完成代码修改。

---



在本地启动未发包 
## react
```bash
pnpm --filter @vad-pro/bridge dev先启动这个桥接打通插件和本地，然后启动插件
1. 安装包:
```bash
npm install @vad-pro/injector -D
```

2. vite.config.ts 配置:
```ts
import vadInjector from '@vad-pro/injector'
import react from '@vitejs/plugin-react'

plugins: [
      vadInjector.vite() as any, // 必须调用 .vite() 
      tailwindcss(),
      react(),
]
```
.env
# 选择一个即可（推荐 Gemini CLI）需要本地启动cli
# AI_PROVIDER=gemini-cli

# 或者 Cursor CLI
# AI_PROVIDER=cursor

# 或者纯 API（更快），自己走api
AI_PROVIDER=gemini-api
# AI_PROVIDER=openai
```

## vue
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vadInjector from '@vad-pro/injector'

export default defineConfig({
  plugins: [
    vadInjector.vite() as any, // 必须放在 vue() 之前，且必须调用 .vite()
    vue()
  ],
})
```