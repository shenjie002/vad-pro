import { createUnplugin } from 'unplugin'
import * as babel from '@babel/core'
import * as t from '@babel/types'
import traverse__default from '@babel/traverse'
import { parse as parseVue, compileTemplate } from '@vue/compiler-sfc'
import { spawn } from 'child_process'

const traverse = (traverse__default as any).default || traverse__default

let bridgeProcess: any = null

export default createUnplugin(() => ({
  name: 'vad-pro-injector',
  enforce: 'pre', // 必须放在 react() 之前

  vite: {
    configureServer(server) {
      if (bridgeProcess) return

      try {
        const bridgeEntry = require.resolve('@vad-pro/bridge')
        console.log('[VAD-Injector] 启动后台 Bridge 服务...')
        
        bridgeProcess = spawn('node', [bridgeEntry], {
          stdio: 'inherit',
          env: process.env,
          // detached: false (default), so child dies when parent dies (often)
        })

        bridgeProcess.on('error', (err: any) => {
          console.error('[VAD-Injector] 启动 Bridge 失败:', err.message)
        })

        server.httpServer?.on('close', () => {
          if (bridgeProcess) {
             bridgeProcess.kill()
             bridgeProcess = null
          }
        })
      } catch (e: any) {
         console.warn('[VAD-Injector] 无法找到 @vad-pro/bridge，请确保已安装依赖:', e.message)
      }
    }
  },

  transform(code, id) {
    const cleanId = id.split('?')[0]
    if (process.env.NODE_ENV === 'production') return null

    // 1. 处理 .vue 文件
    if (cleanId.endsWith('.vue')) {
      try {
        const { descriptor } = parseVue(code, { filename: cleanId })
        if (!descriptor.template) return null

        // 为模板中的每个标签注入 data-vdev-source
        const result = compileTemplate({
          source: descriptor.template.content,
          filename: cleanId,
          id: cleanId,
          compilerOptions: {
            nodeTransforms: [
              (node) => {
                if (node.type === 1) { // Element node
                  const { start } = node.loc
                    // 注入属性 (绕过 TS 类型检查以支持动态构建)
                    ; (node.props as any).push({
                      type: 6, // Attribute
                      name: 'data-vdev-source',
                      value: {
                        type: 2, // Text
                        content: `${cleanId}:${start.line}:${start.column}`,
                        loc: node.loc
                      },
                      loc: node.loc,
                      nameLoc: node.loc // 补全缺失的 nameLoc
                    })
                }
              }
            ]
          }
        })

        // 在 Vue SFC 中，我们通常需要替换整个 <template> 块的内容
        // 这里采用简单的字符串替换方案（开发模式下足够健壮）
        const templateContent = descriptor.template.content
        const transformedTemplate = result.code

        // 注意：compileTemplate 返回的是渲染函数代码，不是简单的 HTML
        // 因此对于 SFC，我们最好的做法是在源码级别对 template 字符串做简单的标签增强
        let newCode = code
        const regex = /<template>([\s\S]*?)<\/template>/
        const match = code.match(regex)
        if (match) {
          // 比较稳妥的办法是直接在 transform 阶段返回 null，
          // 让 Vue 官方插件去处理，我们只在 JSX 层级做拦截。
          // 或者，我们这里使用正则简单粗暴地在标签上加上属性。
          const enhancedTemplate = match[1].replace(/<([a-zA-Z0-9-]+)(?=[^>]*?(?:\s|>))/g, (m, tagName) => {
            // 排除闭合标签和一些特殊标签
            if (tagName.startsWith('/') || ['template', 'script', 'style'].includes(tagName)) return m
            return `${m} data-vdev-source="${cleanId}"`
          })
          newCode = code.replace(regex, `<template>${enhancedTemplate}</template>`)
          return { code: newCode, map: null }
        }
      } catch (e) {
        console.error('[VAD] Vue SFC 处理失败:', e)
      }
    }

    // 2. 处理 JSX / TSX 文件 (React 或 Vue JSX)
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
        JSXOpeningElement(path: any) {
          const loc = path.node.loc
          if (!loc) return
          const absolutePath = cleanId.replace(/\\/g, '/')
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('data-vdev-source'),
              t.stringLiteral(`${absolutePath}:${loc.start.line}:${loc.start.column}`)
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