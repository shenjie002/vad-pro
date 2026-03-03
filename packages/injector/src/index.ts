import { createUnplugin } from 'unplugin'
import * as babel from '@babel/core'
import * as t from '@babel/types'
import traverse from '@babel/traverse'

// 纯 default export（unplugin 官方推荐写法，彻底解决 TS 调用问题）
export default createUnplugin(() => ({
  name: 'vad-pro-injector',
  enforce: 'pre', // 必须放在 react() 之前

  transform(code, id) {
    // 生产环境自动关闭
    // 先去掉路径后面的 ?xxx 参数
    const cleanId = id.split('?')[0]
    console.log(`[VAD Injector] 正在处理: ${cleanId}`)
    // 生产环境自动关闭
    if (process.env.NODE_ENV === 'production') return null

    // 用干净的路径做判断
    if (!/\.(jsx|tsx)$/.test(cleanId)) return null

    try {
      const ast = babel.parse(code, {
        filename: id,
        sourceType: 'module',
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        }
      })

      if (!ast) return null

      traverse(ast, {
        JSXOpeningElement(path) {
          const loc = path.node.loc
          if (!loc) return

          const relativePath = id
            .replace(process.cwd(), '')
            .replace(/\\/g, '/')

          // 通用方案：注入 data-vdev-source
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-vdev-source'),
              t.stringLiteral(`${relativePath}:${loc.start.line}:${loc.start.column}`)
            )
          )

          // React 专属：注入 __source（兼容 React 19 _debugSource）
          // path.node.attributes.push(
          //   t.jsxAttribute(
          //     t.jsxIdentifier('__source'),
          //     t.jsxExpressionContainer(
          //       t.objectExpression([
          //         t.objectProperty(t.identifier('fileName'), t.stringLiteral(relativePath)),
          //         t.objectProperty(t.identifier('lineNumber'), t.numericLiteral(loc.start.line)),
          //         t.objectProperty(t.identifier('columnNumber'), t.numericLiteral(loc.start.column)),
          //       ])
          //     )
          //   )
          // )
        },
      })

      const result = babel.transformFromAstSync(ast, code, {
        filename: id,
        sourceMaps: true,
        configFile: false, // ✅ 防止被 copilot-toolbox 的 babel.config.js 干扰
        babelrc: false,    // ✅ 禁用 babelrc
        // plugins: ['@babel/plugin-syntax-jsx'],
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
}))