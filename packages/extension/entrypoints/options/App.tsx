import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';

export interface AIConfig {
    provider: string;
    apiKey: string;
    customModel: string;
}

const DEFAULT_CONFIG: AIConfig = {
    provider: 'gemini-cli',
    apiKey: '',
    customModel: '',
};

const App = () => {
    const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // 加载配置
        chrome.storage.local.get(['vadAiConfig'], (result) => {
            if (result.vadAiConfig) {
                setConfig(result.vadAiConfig);
            }
        });
    }, []);

    const handleSave = () => {
        chrome.storage.local.set({ vadAiConfig: config }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Settings size={24} style={{ marginRight: 8 }} />
                <h1 style={styles.title}>VAD-Pro 驱动源配置</h1>
            </div>

            <div style={styles.card}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>AI 提供商 / CLI 工具</label>
                    <select
                        value={config.provider}
                        onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                        style={styles.select}
                    >
                        <option value="gemini-cli">Gemini CLI (本地)</option>
                        <option value="gemini-api">Gemini API (直连)</option>
                        <option value="openai">OpenAI API</option>
                        <option value="cursor">Cursor CLI</option>
                        <option value="claude-code">Claude Code CLI</option>
                        <option value="open-claude">Open Claude</option>
                        <option value="kimi-cli">Kimi CLI</option>
                        <option value="qwen-cli">Qwen CLI</option>
                    </select>
                </div>

                {/* 只有 API 模式才需要 API Key，CLI 通常自带认证 */}
                {(config.provider.includes('-api') || config.provider === 'openai' || config.provider === 'open-claude') && (
                    <div style={styles.formGroup}>
                        <label style={styles.label}>API Key</label>
                        <input
                            type="password"
                            value={config.apiKey}
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            placeholder={`输入 ${config.provider} 的 API Key`}
                            style={styles.input}
                        />
                    </div>
                )}

                <div style={styles.formGroup}>
                    <label style={styles.label}>自定义模型 (可选)</label>
                    <input
                        type="text"
                        value={config.customModel}
                        onChange={(e) => setConfig({ ...config, customModel: e.target.value })}
                        placeholder="例如: gemini-2.5-pro"
                        style={styles.input}
                    />
                    <div style={styles.hint}>如果支持，将优先使用此模型。留空则使用默认模型。</div>
                </div>

                <button onClick={handleSave} style={styles.button}>
                    <Save size={16} style={{ marginRight: 6 }} />
                    {saved ? '已保存!' : '保存配置'}
                </button>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: '#09090b',
        color: '#e4e4e7',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
        maxWidth: 500,
    },
    title: {
        fontSize: 24,
        fontWeight: 600,
        margin: 0,
    },
    card: {
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        display: 'block',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 8,
        color: '#a1a1aa',
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        background: '#27272a',
        border: '1px solid #3f3f46',
        color: '#fff',
        fontSize: 14,
        outline: 'none',
        appearance: 'none', // For custom exact styling if needed
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        background: '#27272a',
        border: '1px solid #3f3f46',
        color: '#fff',
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box'
    },
    hint: {
        fontSize: 12,
        color: '#71717a',
        marginTop: 6,
    },
    button: {
        marginTop: 10,
        width: '100%',
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '12px 0',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
    }
};

export default App;
