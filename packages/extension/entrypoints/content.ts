export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        console.log('🎯 VAD-Pro Content Script 已注入');

        // ── 注入主世界脚本（通过外部文件，绕过 CSP） ──
        const script = document.createElement('script');
        script.src = browser.runtime.getURL('/main-world.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);

        let isActive = false;
        let highlightBox: HTMLDivElement | null = null;
        let infoPanel: HTMLDivElement | null = null;
        let currentTarget: HTMLElement | null = null;

        // ── 创建 UI 元素 ──
        const initUI = () => {
            if (highlightBox) return;

            highlightBox = document.createElement('div');
            highlightBox.id = 'vad-highlight';
            highlightBox.style.cssText = `
                position: fixed; z-index: 99999; pointer-events: none;
                border: 2px solid #3b82f6; background: rgba(59,130,246,0.08);
                border-radius: 4px; display: none;
                transition: all 0.05s ease-out;
                box-shadow: 0 0 0 1px rgba(59,130,246,0.3);
            `;
            document.body.appendChild(highlightBox);

            infoPanel = document.createElement('div');
            infoPanel.id = 'vad-info';
            infoPanel.style.cssText = `
                position: fixed; z-index: 100000; pointer-events: none;
                background: #1e1e2e; color: #cdd6f4; font-family: 'SF Mono', Menlo, monospace;
                font-size: 12px; padding: 8px 12px; border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5); display: none;
                max-width: 420px; line-height: 1.5; border: 1px solid #45475a;
            `;
            document.body.appendChild(infoPanel);
        };

        // ── 方式一：检测 data-vdev-source 属性（向上冒泡查找） ──
        const getVdevSource = (el: HTMLElement): string | null => {
            let node: HTMLElement | null = el;
            while (node && node !== document.body) {
                const src = node.getAttribute('data-vdev-source');
                if (src) return src;
                node = node.parentElement;
            }
            return null;
        };

        // ── 方式二：通过主世界查询 React Fiber ──
        const queryFiber = (x: number, y: number): Promise<{ componentName?: string; source?: string } | null> => {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    window.removeEventListener('__vad_fiber_result', handler);
                    resolve(null);
                }, 100); // 100ms 超时

                const handler = (e: Event) => {
                    clearTimeout(timeout);
                    window.removeEventListener('__vad_fiber_result', handler);
                    resolve((e as CustomEvent).detail || null);
                };

                window.addEventListener('__vad_fiber_result', handler);
                window.dispatchEvent(new CustomEvent('__vad_query_fiber', { detail: { x, y } }));
            });
        };

        // ── 构建信息面板 HTML ──
        const buildInfo = (el: HTMLElement, vdevSource: string | null, fiber: { componentName?: string; source?: string } | null): string => {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const classes = el.className && typeof el.className === 'string'
                ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
                : '';
            const text = el.textContent?.trim().slice(0, 50) || '';
            const size = `${el.offsetWidth}×${el.offsetHeight}`;

            let html = `<span style="color:#89b4fa;font-weight:bold">&lt;${tag}${id}${classes}&gt;</span>`;
            html += `<span style="color:#6c7086; margin-left:8px">${size}</span>`;

            if (text) {
                html += `<br/><span style="color:#a6adc8">📝 "${text.length > 40 ? text.slice(0, 40) + '…' : text}"</span>`;
            }

            // data-vdev-source（injector 插件注入的）
            if (vdevSource) {
                html += `<br/><span style="color:#f38ba8">🏷 ${vdevSource}</span>`;
            }

            // React Fiber 信息
            if (fiber) {
                if (fiber.componentName) {
                    html += `<br/><span style="color:#a6e3a1">⚛ ${fiber.componentName}</span>`;
                }
                if (fiber.source) {
                    html += `<br/><span style="color:#f9e2af">📄 ${fiber.source}</span>`;
                }
            }

            // 源码定位状态
            if (!vdevSource && !fiber?.source) {
                html += `<br/><span style="color:#6c7086">⚠ 未检测到源码映射</span>`;
            }

            return html;
        };

        // ── 鼠标移动：高亮 + 显示信息 ──
        let lastMoveTime = 0;
        const onMouseMove = async (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastMoveTime < 30) return; // 节流 30ms
            lastMoveTime = now;

            const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            if (!target || target.id?.startsWith('vad-')) return;

            currentTarget = target;
            const rect = target.getBoundingClientRect();

            // 更新高亮框
            if (highlightBox) {
                highlightBox.style.display = 'block';
                highlightBox.style.left = `${rect.left}px`;
                highlightBox.style.top = `${rect.top}px`;
                highlightBox.style.width = `${rect.width}px`;
                highlightBox.style.height = `${rect.height}px`;
            }

            // 检测源码信息（两种方式并行）
            const vdevSource = getVdevSource(target);
            const fiber = await queryFiber(e.clientX, e.clientY);

            // 确保在异步等待期间目标没有变
            if (currentTarget !== target) return;

            if (infoPanel) {
                infoPanel.style.display = 'block';
                infoPanel.innerHTML = buildInfo(target, vdevSource, fiber);

                const panelHeight = infoPanel.offsetHeight;
                let top = rect.top - panelHeight - 8;
                if (top < 8) top = rect.bottom + 8;

                let left = rect.left;
                if (left + 420 > window.innerWidth) left = window.innerWidth - 430;
                if (left < 8) left = 8;

                infoPanel.style.left = `${left}px`;
                infoPanel.style.top = `${top}px`;
            }
        };

        // ── 点击：选中元素 ──
        const onClick = async (e: MouseEvent) => {
            if (!isActive) return;
            e.preventDefault();
            e.stopImmediatePropagation();

            if (!currentTarget) return;

            const tag = currentTarget.tagName.toLowerCase();
            const vdevSource = getVdevSource(currentTarget);
            const fiber = await queryFiber(e.clientX, e.clientY);

            const info = {
                tag,
                id: currentTarget.id || undefined,
                classes: currentTarget.className || undefined,
                text: currentTarget.textContent?.trim().slice(0, 100) || undefined,
                rect: currentTarget.getBoundingClientRect().toJSON(),
                // 源码信息（两种方式）
                vdevSource,
                reactComponent: fiber?.componentName,
                reactSource: fiber?.source,
                // 最终源码（优先 vdevSource，回退 fiber）
                resolvedSource: vdevSource || fiber?.source || null,
                domSnippet: currentTarget.outerHTML.slice(0, 300),
            };

            console.log('🔍 VAD-Pro 选中元素:', info);

            // Toast 提示
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
                background: #1e1e2e; color: #cdd6f4; padding: 12px 24px; border-radius: 12px;
                z-index: 100001; font-size: 13px; font-family: system-ui;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5); border: 1px solid #45475a;
            `;

            const source = info.resolvedSource;
            let toastContent = `✅ <b>&lt;${tag}&gt;</b>`;
            if (fiber?.componentName) toastContent += ` → <span style="color:#a6e3a1">⚛ ${fiber.componentName}</span>`;
            if (source) toastContent += `<br/><span style="color:#f9e2af">📄 ${source}</span>`;
            else toastContent += `<br/><span style="color:#6c7086">未检测到源码映射（目标页面需 React 开发模式或安装 injector 插件）</span>`;

            toast.innerHTML = toastContent;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);


            // === 新增：把选中信息发送给 Background → Side Panel ===
            chrome.runtime.sendMessage({
                type: 'vad-selected',
                payload: {
                    taskId: 'task_' + Date.now(),
                    context: {
                        target: {
                            file: info.resolvedSource ? info.resolvedSource.split(':')[0] : null,
                            line: info.resolvedSource ? parseInt(info.resolvedSource.split(':')[1] || '0') : null,
                            componentName: info.reactComponent,
                        },
                        dom: {
                            snippet: info.domSnippet,
                            tag: info.tag,
                            text: info.text,
                        },
                        vision: {
                            screenshotBase64: null // 后面可补截图
                        }
                    }
                }
            })
            deactivate();
        };

        // ── 激活 / 退出 ──
        const activate = () => {
            isActive = true;
            initUI();
            document.addEventListener('mousemove', onMouseMove, true);
            document.addEventListener('click', onClick, true);
            document.addEventListener('keydown', onEscape, true);
            document.body.style.cursor = 'crosshair';
            console.log('🟢 VAD-Pro 检查模式已激活 — 悬浮查看元素信息，点击选中，ESC 退出');
        };

        const deactivate = () => {
            isActive = false;
            if (highlightBox) highlightBox.style.display = 'none';
            if (infoPanel) infoPanel.style.display = 'none';
            document.removeEventListener('mousemove', onMouseMove, true);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('keydown', onEscape, true);
            document.body.style.cursor = '';
            currentTarget = null;
        };

        const toggle = () => isActive ? deactivate() : activate();

        const onEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); deactivate(); }
        };

        // ── 监听快捷键 Cmd+Shift+S ──
        document.addEventListener('keydown', (e) => {
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                toggle();
            }
        });

        // ── 监听来自 background 的消息 ──
        browser.runtime.onMessage.addListener((msg: any) => {
            if (msg?.type === 'toggle-inspect') toggle();
        });
    },
});
