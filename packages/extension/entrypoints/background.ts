export default defineBackground(() => {
    console.log('🚀 VAD-Pro Background 已启动');

    let ws: WebSocket | null = null;

    const connectWS = () => {
        ws = new WebSocket('ws://localhost:8787');
        ws.onopen = () => console.log('✅ Bridge WebSocket 已连接');
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            // 把 Bridge 的日志/状态转发给 Side Panel
            chrome.runtime.sendMessage({ type: 'vad-bridge-status', payload: data });
        };
        ws.onclose = () => setTimeout(connectWS, 1500);
    };

    connectWS();

    // 监听快捷键命令（manifest 注册的 Cmd+Shift+S）
    browser.commands.onCommand.addListener(async (command: string) => {
        if (command === 'toggle') {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                browser.tabs.sendMessage(tab.id, { type: 'toggle-inspect' });
            }
        }
    });

    // 监听来自 Content Script 和 Side Panel 的消息
    browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
        if (msg.type === 'vad-selected') {
            // 收到选中元素，转发给 Side Panel（所有打开的 sidepanel）
            chrome.runtime.sendMessage({ type: 'vad-selected', payload: msg.payload });
        }

        if (msg.type === 'vad-send-prompt') {
            // Side Panel 发送 Prompt → 转发给 Bridge
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg.payload));
                console.log('📤 已发送任务给 Bridge:', msg.payload.taskId);
            } else {
                console.error('❌ WS 未连接');
            }
        }

        if (msg.type === 'toggle-inspect') {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) browser.tabs.sendMessage(tab.id, { type: 'toggle-inspect' });
        }
    });
});