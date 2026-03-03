import { useState } from 'react';
import { Send } from 'lucide-react';

const App = () => {
    const [prompt, setPrompt] = useState('');
    const [logs, setLogs] = useState<string[]>(['等待用户输入...']);

    const sendPrompt = () => {
        if (!prompt.trim()) return;
        setLogs(prev => [...prev, `👤 用户: ${prompt}`]);
        // 这里后续可通过 chrome.runtime.sendMessage 发给 content 或直接 WS
        setPrompt('');
    };

    return (
        <div style={{ padding: 16, height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090b', color: '#fff' }}>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✨ VAD-Pro
            </h1>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }} id="log-container">
                {logs.map((log, i) => (
                    <div key={i} style={{ background: '#18181b', padding: 12, borderRadius: 8 }}>{log}</div>
                ))}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <input
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendPrompt()}
                    placeholder="描述你要的修改..."
                    style={{ flex: 1, background: '#27272a', borderRadius: 8, padding: '8px 16px', fontSize: 14, color: '#fff', border: 'none', outline: 'none' }}
                />
                <button
                    onClick={sendPrompt}
                    style={{ background: '#2563eb', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', color: '#fff' }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default App;
