# VAD-Pro (Visual Agentic Dev Pro)

> **下一代「点击即让 AI 修改代码」沉浸式开发工具**

VAD-Pro 是一款直观的开发辅助工具，允许开发者通过点击网页元素直接由 AI 修改对应的源码文件。

---

## 📦 1. 安装 Chrome 扩展 (用户端)

VAD-Pro 需要搭配浏览器扩展才能行使完整功能。请按照以下步骤加载离线扩展包：

1. 将获取到的 `vad-pro-extension.zip` 文件解压缩到本地的一个固定目录（如果你收到的直接是解压好的文件夹，请忽略此步）。
2. 打开浏览器的扩展程序管理页面：
   - 在地址栏输入 `chrome://extensions/` (Chrome) 或 `edge://extensions/` (Edge) 访问。
3. 在页面右上角，开启 **开发者模式** (Developer mode)。
4. 点击左上角的 **加载已解压的扩展程序** (Load unpacked) 按钮，并选择你刚才解压出来的扩展目录。
5. （可选）为后续方便随时呼出和进行 AI 配置，建议在浏览器工具栏将 VAD-Pro 扩展固定（Pin）。

---

## 🔌 2. 接入现有项目 (Vite)

接下来为你的项目安装配套探针，只需完成下面两步：

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
3. 在侧边面板输入修改指令（例如：“把这个标题改为红色”）根据页面直接将源码修改了。
4. 点击“发送”，观察 AI 自动完成代码修改。

---



---

## 🛠 开发者指南 (本地未发包调试)

如果你想要参与 VAD-Pro 的开发，或者想在本地调试插件和 Bridge 的源码，请按下述方式配置你的宿主项目：

### 1. 启动本地 Bridge 服务
在 `vad-pro` 根目录下，手动启动桥接服务打通插件和本地：
```bash
pnpm --filter @vad-pro/bridge dev
```

### 2. React 宿主项目本地引入
修改宿主项目的 `vite.config.ts`，直接引用本地打包产物：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// 指向你的本地 build 产物
import visualAgenticInjector from '../../vad-pro/packages/injector/dist/index.mjs';

export default defineConfig({
  plugins: [
    visualAgenticInjector.vite() as any, // 必须调用 .vite()
    tailwindcss(),
    react(),
  ],
});
```

### 3. Vue 宿主项目本地引入
修改宿主项目的 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// 指向你的本地 build 产物
import visualAgenticInjector from '../../vad-pro/packages/injector/dist/index.mjs';

export default defineConfig({
  plugins: [
    visualAgenticInjector.vite() as any, // 必须放在 vue() 之前
    vue()
  ],
});
```

### 4. 环境变量降级配置
在宿主项目的根目录创建 `.env` 文件（作为兜底配置）：
```bash
# 选择一个即可（推荐 Gemini CLI）需要本地启动cli
# AI_PROVIDER=gemini-cli

# 或者 Cursor CLI
# AI_PROVIDER=cursor

# 或者纯 API（更快），需配置对应的 API Key
AI_PROVIDER=gemini-api
# AI_PROVIDER=openai
```