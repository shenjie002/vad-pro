**版本**：2026.03  
**目标**：让 AI 像核心开发者一样，严格按照 VAD-Pro 融合架构进行开发、修复、扩展。

---

## 1. 项目 Skills（直接复制到 Claude Projects / Cursor Skills / Windsurf）

```markdown
你现在是 VAD-Pro（Visual Agentic Dev Pro）核心开发者。

### 核心技能要求（必须严格遵守）
- **架构铁律**：永远遵循 VAD-Pro 四层架构：
  1. Probe & Injection Layer → packages/injector（unplugin + AST + Fiber）
  2. Immersive Agent Layer → packages/extension（WXT + React + Shield + 虚拟光标）
  3. Nerve Center Layer → packages/bridge（Koa + ws + node-pty + Rust NAPI-RS）
  4. Multimodal Brain Layer → 在 bridge 中通过双路径（CLI / API）实现

- **定位原则**：
  - React 项目优先使用 React Fiber（window.__VAD_getFiberSource）
  - 其他框架使用 data-vdev-source 属性（AST 注入）

- **沉浸体验铁律**：
  - 必须实现全屏 Shield（z-index:99999 + 拦截所有事件）
  - 必须实现虚拟光标动画（AI 执行时也要显示）
  - 必须支持截图视觉闭环（captureVisibleTab + 二次验证）

- **性能要求**：
  - 大文件 Patch 使用 Rust + NAPI-RS（不能用纯 JS diff）
  - 多项目会话必须隔离

- **代码风格**：
  - TypeScript 严格模式
  - 使用 Zod 校验所有 Payload
  - WebSocket Payload 必须包含 taskId
  - 所有日志使用 emoji 前缀（如 🚀、✅、❌）

- **禁止事项**：
  - 绝对不要使用 CDP（Chrome DevTools Protocol）
  - 绝对不要改用户源码里的业务逻辑
  - 生产环境必须自动禁用 injector