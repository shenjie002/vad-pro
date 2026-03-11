import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { applyPatch } from 'diff';
// node-pty 需要原生编译，仅在 CLI 模式下动态加载
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Gemini API
import OpenAI from 'openai';
import fsSync from 'fs';
import dotenv from 'dotenv';

console.log('🔧 Bridge 进程启动中...');

// 测试当前执行目录的 .env
const cwdEnv = path.join(process.cwd(), '.env');
const rootEnv = path.join(process.cwd(), '../../.env');
if (fsSync.existsSync(cwdEnv)) {
    dotenv.config({ path: cwdEnv });
} else {
    dotenv.config({ path: rootEnv });
}

const PORT = 8787;
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini-cli';

process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

const PayloadSchema = z.object({
    taskId: z.string(),
    context: z.object({
        target: z.object({ file: z.string(), line: z.number().optional() }),
        dom: z.object({ snippet: z.string() }),
        vision: z.object({ screenshotBase64: z.string().nullable().optional() }).optional(),
    }),
    userPrompt: z.string(),
    aiConfig: z.object({
        provider: z.string().optional(),
        apiKey: z.string().optional(),
        customModel: z.string().optional(),
    }).optional(),
});

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });
wss.on('listening', () => {
    console.log(`🚀 Bridge 已启动 (AI_PROVIDER=${AI_PROVIDER})`);
    console.log(`📡 正在监听: ws://0.0.0.0:${PORT}`);
});

wss.on('connection', (ws: WebSocket) => {
    console.log('✅ Extension 已连接');

    ws.on('message', async (raw: Buffer) => {
        const rawStr = raw.toString();
        process.stdout.write('📥 收到来自 Extension 的消息... ');

        try {
            const json = JSON.parse(rawStr);
            const payload = PayloadSchema.parse(json);
            console.log('✅ Payload 校验通过:', payload.taskId);

            const { taskId, context, userPrompt, aiConfig } = payload;
            let filePath = context.target.file;

            // 确定当前使用的 AI Provider (优先使用扩展传来的，否则环境变量，否则默认)
            const currentProvider = aiConfig?.provider || AI_PROVIDER || 'gemini-cli';

            console.log(`🔍 收到路径请求: ${filePath}`);

            // 智能路径修复逻辑
            // 判断是否是真正的磁盘绝对路径（/Users/..., /home/..., /tmp/... 等）
            // 注意：/src/pages/... 虽然以 / 开头，但不是真正的绝对路径！
            const isRealAbsolutePath = filePath.startsWith('/Users/')
                || filePath.startsWith('/home/')
                || filePath.startsWith('/tmp/')
                || filePath.startsWith('/var/');

            if (!isRealAbsolutePath) {
                console.log('💡 收到项目相对路径，尝试基于项目根目录解析...');
                // 优先使用环境变量指定的项目根目录
                const envRoot = process.env.VAD_PROJECT_ROOT;
                const currentDir = process.cwd();
                const projectRoot = envRoot
                    || (currentDir.includes('packages/bridge') ? path.resolve(currentDir, '../../') : currentDir);

                console.log(`📍 项目根目录: ${projectRoot}`);
                const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
                filePath = path.resolve(projectRoot, relativePath);
                console.log(`📍 解析后的绝对路径: ${filePath}`);
            }

            if (!filePath) {
                throw new Error('Payload 中缺失文件路径');
            }

            // 验证文件可访问性
            try {
                await fs.access(filePath);
                console.log(`✅ 文件校验成功 (绝对路径): ${filePath}`);
            } catch {
                console.error(`❌ 文件不存在或不可访问: ${filePath}`);
                throw new Error(`找不到文件: ${filePath}。请确保 Bridge 在正确的项目根目录启动，或使用最新版 Injector。`);
            }

            console.log(`📂 目标文件已锁定: ${filePath} (行号: ${context.target.line || '未知'})`);

            // 读取代码上下文
            let fullCode: string;
            fullCode = await fs.readFile(filePath, 'utf-8');
            const lines = fullCode.split('\n');
            const start = Math.max(0, (context.target.line || 1) - 40);
            const codeContext = lines.slice(start, start + 80).join('\n');

            const fullPrompt = `文件: ${filePath}
行号附近代码:
\`\`\`tsx
${codeContext}
\`\`\`

DOM 片段: ${context.dom.snippet}

用户需求: ${userPrompt}

请直接输出 Unified Diff（以 \`\`\`diff 开头），只需修改必要部分，不要解释。`;

            let diffText = '';
            console.log(`🤖 正在调用 AI (Provider: ${currentProvider})...`);
            const startTime = Date.now();

            const isCliProvider = ['gemini-cli', 'cursor', 'claude-code', 'open-claude', 'kimi-cli', 'qwen-cli'].includes(currentProvider);

            if (isCliProvider) {
                const { spawn: cpSpawn } = await import('child_process');
                const { writeFile, unlink, mkdir } = await import('fs/promises');

                // 将 prompt 写入项目内的临时目录，避免留在系统 /tmp 中
                const promptDir = path.join(process.cwd(), '.vad-prompts');
                try { await mkdir(promptDir, { recursive: true }); } catch { }

                const tmpFile = path.join(promptDir, `task-${taskId}.txt`);
                await writeFile(tmpFile, fullPrompt, 'utf-8');
                console.log(`📝 Prompt 已写入临时文件: ${tmpFile}`);

                let cliCmd = 'agent';
                switch (currentProvider) {
                    case 'gemini-cli': cliCmd = 'gemini'; break;
                    case 'claude-code': cliCmd = 'claude -p'; break;
                    case 'open-claude': cliCmd = 'open-claude'; break;
                    case 'kimi-cli': cliCmd = 'kimi'; break;
                    case 'qwen-cli': cliCmd = 'qwen'; break;
                    case 'cursor': cliCmd = 'agent'; break;
                }

                console.log(`🛠 执行: ${cliCmd} (prompt 长度: ${fullPrompt.length} 字符)`);

                // 使用 shell 重定向从文件读取 prompt
                const child = cpSpawn('bash', ['-c', `cat "${tmpFile}" | ${cliCmd}`], {
                    cwd: process.cwd(),
                    env: process.env as Record<string, string>,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });

                let stdout = '';
                let stderr = '';

                child.stdout.on('data', (data: Buffer) => {
                    const chunk = data.toString();
                    stdout += chunk;
                    if (chunk.includes('```diff')) console.log('✨ 检测到 Diff 开始生成...');
                });

                child.stderr.on('data', (data: Buffer) => {
                    stderr += data.toString();
                });

                child.on('close', async (exitCode: number | null) => {
                    // 清理临时文件并打印日志
                    try {
                        await unlink(tmpFile);
                        console.log(`🧹 临时文件已清理: ${tmpFile}`);
                    } catch (e: any) {
                        console.log(`⚠️ 临时文件清理失败: ${e.message}`);
                    }
                    console.log(`⌛ AI 命令结束 (退出码: ${exitCode}, 耗时: ${Date.now() - startTime}ms)`);
                    if (stderr) console.log('⚠️ stderr:', stderr.slice(0, 500));

                    const match = stdout.match(/```diff\s*([\s\S]*?)```/);
                    diffText = match ? match[1] : stdout;

                    if (!diffText || diffText.trim().length < 5) {
                        console.error('❌ 未能提取到有效的 Diff 内容');
                        console.log('📜 原始输出 (前 500 字符):', stdout.slice(0, 500));
                        ws.send(JSON.stringify({ type: 'error', message: 'AI 未返回有效的 Diff 代码块' }));
                        return;
                    }

                    await applyAndSave(diffText, filePath, taskId, ws);
                });

                child.on('error', (err: Error) => {
                    console.error('❌ CLI 进程启动失败:', err.message);
                    ws.send(JSON.stringify({ type: 'error', message: `CLI 启动失败: ${err.message}` }));
                });

            } else {
                // API 模式
                let responseText = '';
                try {
                    if (currentProvider === 'gemini-api') {
                        const apiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY!;
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const modelName = aiConfig?.customModel || "gemini-1.5-pro";
                        console.log(`📡 [gemini-api] Model: ${modelName}`);
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent(fullPrompt);
                        responseText = result.response.text();
                    } else if (currentProvider === 'openai') {
                        const apiKey = aiConfig?.apiKey || process.env.OPENAI_API_KEY!;
                        const openai = new OpenAI({ apiKey });
                        const modelName = aiConfig?.customModel || "gpt-4o";
                        console.log(`📡 [openai] Model: ${modelName}`);
                        const res = await openai.chat.completions.create({
                            model: modelName,
                            messages: [{ role: "user", content: fullPrompt }],
                        });
                        responseText = res.choices[0].message.content || '';
                    } else {
                        throw new Error(`不支持的 API Provider: ${currentProvider}`);
                    }
                } catch (aiErr: any) {
                    console.error('❌ AI API 调用失败:', aiErr);
                    throw aiErr;
                }

                console.log(`⌛ AI 响应成功 (耗时: ${Date.now() - startTime}ms)`);
                const match = responseText.match(/```diff\s*([\s\S]*?)```/);
                diffText = match ? match[1] : responseText;

                await applyAndSave(diffText, filePath, taskId, ws);
            }

        } catch (err: any) {
            console.error('🔥 消息处理逻辑出错:', err);
            ws.send(JSON.stringify({ type: 'error', message: err.message || '内部处理错误' }));
        }
    });
});

async function applyAndSave(diffText: string, filePath: string, taskId: string, ws: WebSocket) {
    console.log(`📝 正在应用 Patch 到文件: ${filePath}`);
    try {
        const original = await fs.readFile(filePath, 'utf-8');
        const patched = applyPatch(original, diffText);

        if (patched && patched !== original) {
            await fs.writeFile(filePath, patched, 'utf-8');
            console.log(`✅ 文件保存成功: ${filePath}`);
            ws.send(JSON.stringify({
                type: 'status',
                taskId,
                message: `✅ 修改成功！${path.basename(filePath)} 已更新`,
                success: true
            }));
        } else {
            console.error('❌ Patch 应用后代码无变化或应用失败');
            ws.send(JSON.stringify({ type: 'error', message: 'Patch 应用失败：代码无变化或格式不匹配' }));
        }
    } catch (fsErr: any) {
        console.error('❌ 文件操作失败:', fsErr);
        ws.send(JSON.stringify({ type: 'error', message: '文件应用失败: ' + fsErr.message }));
    }
}