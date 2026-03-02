// React Fiber 运行时定位（零配置，黑科技）
export function getFiberSource(element: HTMLElement | null): {
    fileName: string
    lineNumber: number
    columnNumber: number
} | null {
    if (!element) return null

    let fiber = element as any
    const fiberKey = Object.keys(fiber).find(key =>
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$')
    )

    if (!fiberKey) return null

    let node = fiber[fiberKey]

    while (node) {
        if (node._debugSource) {
            return {
                fileName: node._debugSource.fileName,
                lineNumber: node._debugSource.lineNumber,
                columnNumber: node._debugSource.columnNumber || 0,
            }
        }
        // 向上遍历 Fiber 树
        node = node._debugOwner || node.return || node.child
    }

    return null
}

// 暴露到全局，供 Content Script 调用
declare global {
    interface Window {
        __VAD_getFiberSource: typeof getFiberSource
    }
}

if (typeof window !== 'undefined') {
    window.__VAD_getFiberSource = getFiberSource
}