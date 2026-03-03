import { getFiberSource } from 'vad-pro/runtime'; // 后面会 link injector

export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        console.log('🎯 VAD-Pro Content Script 已注入');

        let ws: WebSocket | null = null;
        let overlay: HTMLDivElement | null = null;
        let virtualCursor: HTMLDivElement | null = null;
        let isActive = false;

        const initOverlay = () => {
            if (overlay) return;

            overlay = document.createElement('div');
            overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999; pointer-events: none;
    background: rgba(0,0,0,0.05); display: none;
  `;
            document.body.appendChild(overlay);

            virtualCursor = document.createElement('div');
            virtualCursor.style.cssText = `
    position: fixed; width: 24px; height: 24px; border: 3px solid #3b82f6;
    border-radius: 50%; pointer-events: none; z-index: 100000;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.3); display: none;
    transition: transform 0.1s ease;
  `;
            virtualCursor.innerHTML = '✨';
            document.body.appendChild(virtualCursor);
        };

        const connectWS = () => {
            ws = new WebSocket('ws://localhost:8787');
            ws.onopen = () => console.log('✅ WS 已连接 Bridge');
            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'status') {
                    // 可以在这里显示 toast 或更新 Side Panel
                    console.log('AI 状态：', data.message);
                }
            };
            ws.onclose = () => setTimeout(connectWS, 1000); // 自动重连
        };

        const toggleAgentMode = () => {
            isActive = !isActive;
            initOverlay();

            if (isActive) {
                if (overlay) overlay.style.display = 'block';
                document.body.style.cursor = 'none';
                if (virtualCursor) virtualCursor.style.display = 'block';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('click', onClick, true); // capture phase 拦截
            } else {
                cleanup();
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (virtualCursor) {
                virtualCursor.style.left = `${e.clientX - 12}px`;
                virtualCursor.style.top = `${e.clientY - 12}px`;
            }
        };

        const onClick = async (e: MouseEvent) => {
            if (!isActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();

            const target = e.target as HTMLElement;
            const source = (window as any).__VAD_getFiberSource?.(target);

            if (!source) {
                alert('未找到源码映射，请确保已注入 @vad-pro/injector');
                return;
            }

            const screenshot = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
            const domSnippet = target.outerHTML.slice(0, 400);

            const payload = {
                taskId: 'task_' + Date.now(),
                action: 'visual_agent_edit',
                context: {
                    target: typeof source === 'string' ? { file: source.split(':')[0], line: parseInt(source.split(':')[1]) } : source,
                    dom: { snippet: domSnippet },
                    vision: { screenshotBase64: screenshot }
                },
                userPrompt: '' // Side Panel 会补充
            };

            ws?.send(JSON.stringify(payload));

            // 临时显示成功提示
            const toast = document.createElement('div');
            toast.textContent = '✅ 已发送给 AI，正在思考...';
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:12px 24px;border-radius:9999px;z-index:100001;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);

            cleanup(); // 单次操作后关闭模式
        };

        const cleanup = () => {
            isActive = false;
            if (overlay) overlay.style.display = 'none';
            if (virtualCursor) virtualCursor.style.display = 'none';
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('click', onClick, true);
        };

        document.addEventListener('keydown', (e) => {
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                toggleAgentMode();
            }
        });

        // 初始化
        connectWS();
    },
});