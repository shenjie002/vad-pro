import { defineConfig } from 'wxt';

export default defineConfig({
    manifest: {
        name: "VAD-Pro",
        description: "点击即让 AI 修改代码 · 沉浸式 Agentic Dev",
        version: "0.1.0",
        permissions: ["sidePanel", "storage", "activeTab", "scripting"],
        commands: {
            toggle: {
                suggested_key: { default: "Ctrl+Shift+S", mac: "Command+Shift+S" },
                description: "唤醒 VAD-Pro"
            }
        },
        side_panel: {
            default_path: "sidepanel.html"
        }
    },
    modules: ['react'],
});
