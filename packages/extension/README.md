# @vad-pro/extension

> **VAD-Pro 的「沉浸式代理层」：Chrome 全屏交互扩展**

## 🛠️ 技术栈

- **开发框架**：[WXT](https://wxt.dev/) (现代 Web Extension 框架，支持 MV3 + HMR)。
- **UI 界面**：React 18 + TypeScript + shadcn/ui。
- **视觉能力**：利用 `chrome.tabs.captureVisibleTab` 实现毫秒级视觉反馈。

## ✨ 核心功能

- **沉浸式唤醒**：`Alt + Shift + S` (或自定义快捷键) 启动。
- **Shield 遮罩**：全屏透明 Shield 防止页面干扰，支持 AI 虚拟光标动画。
- **多模态提取**：同步提取源码行号、DOM 树信息及实时截图。
- **AI 侧栏**：集成 Side Panel，实时同步 AI 修改进度。

## 🚀 安装部署

### 1. 启动开发模式
```bash
cd packages/extension
pnpm dev
```

### 2. 加载到浏览器
1. 打开 Chrome 扩展管理页面：`chrome://extensions/`。
2. 开启顶部的 **“开发者模式”**。
3. 点击 **“加载已解压的扩展程序”**。
4. 选择路径：`packages/extension/.output/chrome-mv3`。

## 📦 打包
```bash
pnpm build
```
生成的产物位于 `.output` 目录下。