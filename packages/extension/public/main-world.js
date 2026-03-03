// 主世界脚本：检测 React Fiber 信息
// 此文件通过 web_accessible_resources 注入到页面主世界
(function () {
    if (window.__VAD_MAIN_INJECTED) return;
    window.__VAD_MAIN_INJECTED = true;

    // 根据坐标查找元素的 React Fiber 信息
    window.__VAD_queryFiber = function (x, y) {
        var el = document.elementFromPoint(x, y);
        if (!el) return null;

        var fiberKey = Object.keys(el).find(function (k) {
            return k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$');
        });
        if (!fiberKey) return null;

        var node = el[fiberKey];
        var componentName = null;
        var source = null;

        while (node) {
            if (!componentName && node.type && typeof node.type === 'function') {
                componentName = node.type.displayName || node.type.name || null;
            }
            if (!source && node._debugSource) {
                source = node._debugSource.fileName + ':' + node._debugSource.lineNumber;
            }
            if (componentName && source) break;
            node = node._debugOwner || node.return;
        }

        return (componentName || source) ? { componentName: componentName, source: source } : null;
    };

    // 监听来自 content script 的查询请求
    window.addEventListener('__vad_query_fiber', function (e) {
        var detail = e.detail || {};
        var result = window.__VAD_queryFiber(detail.x, detail.y);
        window.dispatchEvent(new CustomEvent('__vad_fiber_result', { detail: result }));
    });

    console.log('🧬 VAD-Pro 主世界脚本已注入（Fiber 检测就绪）');
})();
