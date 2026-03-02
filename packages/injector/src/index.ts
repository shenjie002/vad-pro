// TODO: 后面实现 unplugin + AST + Fiber


import { createUnplugin } from 'unplugin'
import * as babel from '@babel/core'
import * as t from '@babel/types'
import traverse from '@babel/traverse'
import { getFiberSource } from './runtime'

export const visualAgenticInjector = createUnplugin(() => {
  return {
    name: 'vad-pro-injector',
    enforce: 'pre', // 必须在 react()/vue() 等之前执行

    transform(code, id) {
      // 1. 生产环境自动关闭
      if (process.env.NODE_ENV === 'production') {
        return null
      }

      // 2. 只处理 JSX/TSX 文件（可扩展 .vue 等）
      if (!/\.(jsx|tsx)$/.test(id)) {
        return null
      }

      try {
        const ast = babel.parseSync(code, {
          filename: id,
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        })

        if (!ast) return null

        traverse(ast, {
          JSXOpeningElement(path: babel.NodePath<t.JSXOpeningElement>) {
            const loc = path.node.loc
            if (!loc) return

            const fileName = id.replace(process.cwd(), '').replace(/\\/g, '/')

            // 注入 data-vdev-source（通用方案）
            const dataAttr = t.jsxAttribute(
              t.jsxIdentifier('data-vdev-source'),
              t.stringLiteral(`${fileName}:${loc.start.line}:${loc.start.column}`)
            )

            path.node.attributes.push(dataAttr)

            // React 专属：注入 __source（让 React 19 也生成 _debugSource）
            const sourceAttr = t.jsxAttribute(
              t.jsxIdentifier('__source'),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(t.identifier('fileName'), t.stringLiteral(fileName)),
                  t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(loc.start.line)),
                  t.objectProperty(t.identifier('columnNumber'), t.numericLiteral(loc.start.column)),
                ])
              )
            )
            path.node.attributes.push(sourceAttr)
          },
        })

        const result = babel.transformFromAstSync(ast, code, {
          filename: id,
          plugins: ['@babel/plugin-syntax-jsx'],
        })

        return {
          code: result?.code || code,
          map: result?.map,
        }
      } catch (err) {
        console.warn(`[VAD-Injector] 解析失败 ${id}:`, err)
        return null
      }
    },

    // 额外暴露 runtime（Vite 用户可 import）
    resolveId(id) {
      if (id === 'vad-pro/runtime') {
        return '\0vad-pro/runtime'
      }
    },
    load(id) {
      if (id === '\0vad-pro/runtime') {
        return `export * from '${require.resolve('./runtime')}'`
      }
    },
  }
})

// 默认导出（用户直接 import visualAgenticInjector）
export default visualAgenticInjector