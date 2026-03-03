import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';

const App = () => {
    const [prompt, setPrompt] = useState('');
    const [logs, setLogs] = useState<string[]>(['等待用户输入...']);
    const [currentContext, setCurrentContext] = useState<any>(null);

    // 接收来自 Content Script 的选中事件
    useEffect(() => {
        const listener = (message: any) => {
            if (message.type === 'vad-selected') {
                setCurrentContext(message.payload);
                setLogs(prev => [...prev, `🎯 已选中元素 → ${message.payload.context?.target?.file || '未知文件'}`]);
            }
            if (message.type === 'vad-bridge-status') {
                setLogs(prev => [...prev, `🤖 Bridge: ${message.payload.message || JSON.stringify(message.payload)}`]);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const sendToBridge = () => {
        if (!prompt.trim()) return;
        if (!currentContext) {
            alert('请先在页面上 Cmd+Shift+S 选中一个元素');
            return;
        }

        const fullPayload = {
            ...currentContext,
            userPrompt: prompt,
            action: 'visual_agent_edit'
        };

        chrome.runtime.sendMessage({ type: 'vad-send-prompt', payload: fullPayload });
        setLogs(prev => [...prev, `👤 用户: ${prompt}`]);
        setPrompt('');
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>✨ VAD-Pro</h1>
                {currentContext && <div style={styles.badge}>已选中元素 ✓</div>}
            </div>

            {/* 日志区域 */}
            <div style={styles.logContainer} id="log-container">
                {logs.map((log, i) => (
                    <div key={i} style={styles.logItem}>{log}</div>
                ))}
            </div>

            {/* 底部操作区 */}
            <div style={styles.bottom}>
                {currentContext && (
                    <div style={styles.contextInfo}>
                        📍 当前元素：{currentContext.context?.target?.file?.split('/').pop() || '未知'}
                        {currentContext.context?.target?.line && ` :${currentContext.context.target.line}`}
                        {currentContext.context?.target?.componentName && ` (${currentContext.context.target.componentName})`}
                    </div>
                )}
                <div style={styles.inputRow}>
                    <input
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendToBridge()}
                        placeholder="描述你要的修改..."
                        style={styles.input}
                    />
                    <button onClick={sendToBridge} style={styles.sendBtn}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: 16, height: '100vh', display: 'flex', flexDirection: 'column',
        background: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
    },
    title: {
        fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0,
    },
    badge: {
        fontSize: 11, color: '#34d399', background: '#022c22', padding: '4px 10px', borderRadius: 20,
    },
    logContainer: {
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 12,
    },
    logItem: {
        background: '#18181b', padding: '10px 14px', borderRadius: 10, border: '1px solid #27272a', lineHeight: 1.5,
    },
    bottom: {
        display: 'flex', flexDirection: 'column', gap: 10,
    },
    contextInfo: {
        fontSize: 12, background: '#1c1c1e', padding: '8px 12px', borderRadius: 10,
        color: '#a1a1aa', border: '1px solid #27272a',
    },
    inputRow: {
        display: 'flex', gap: 8,
    },
    input: {
        flex: 1, background: '#27272a', borderRadius: 10, padding: '10px 14px', fontSize: 13,
        color: '#e4e4e7', border: '1px solid #3f3f46', outline: 'none',
    },
    sendBtn: {
        background: '#2563eb', padding: '10px 18px', borderRadius: 10, border: 'none',
        cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
};

export default App;
