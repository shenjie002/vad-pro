import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'path',
    'fs',
    'process',
    '@vue/compiler-sfc',
    'vue',
    'url',
    'unplugin',
    /^@babel\//,
    // ... 其他可选依赖
  ],
  bundle: true,
  treeshake: true,
  shims: true, // 关键：为 ESM 提供 __dirname 等 shim
  platform: 'node',
})