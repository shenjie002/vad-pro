export default defineBackground(() => {
    console.log('🚀 VAD-Pro Background 已启动');

    // 监听快捷键 toggle 命令
    browser.commands.onCommand.addListener(async (command: string) => {
        if (command === 'toggle') {
            // 发消息给当前活动 tab 的 content script
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                browser.tabs.sendMessage(tab.id, { type: 'toggle-inspect' });
            }
        }
    });
});
