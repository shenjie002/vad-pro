# @vad-pro/injector

> **VAD-Pro 的「探针与注入层」：构建时源码定位插件**

## 🛠️ 技术选型

- **核心架构**：基于 `unplugin`，完美兼容 Vite / Webpack / Rspack / Rsbuild。
- **AST 处理**：依赖 `Babel` 进行深度代码分析与属性注入。
- **框架优化**：针对 React 优化，优先读取 `Fiber` 节点信息（相比传统 AST 更精准）。

## ✨ 核心功能

- **零侵入注入**：开发环境下自动为 JSX/Vue 元素注入 `data-vdev-source`。
- **生产环境隔离**：生产环境代码自动剔除，保证 100% 性能。
- **多模式支持**：通用属性定位 + React Fiber `_debugSource` 双保险。

## 🚀 使用方式

在你的前端项目配置文件中引入：

### Vite 项目
```typescript
// vite.config.ts
import { visualAgenticInjector } from '@vad-pro/injector'

export default {
  plugins: [
    visualAgenticInjector(), // 注意：通常需要放在 React/Vue 插件之前
    react(),
  ]
}
```

### Webpack 项目
```javascript
// webpack.config.js
const { visualAgenticInjector } = require('@vad-pro/injector')

module.exports = {
  plugins: [
    visualAgenticInjector.webpack(),
  ]
}
```

## 💻 开发命令

```bash
# 进入监听模式
pnpm --filter @vad-pro/injector dev

# 执行构建
pnpm --filter @vad-pro/injector build
```