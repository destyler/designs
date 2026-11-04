import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin'
import esbuild from 'rollup-plugin-esbuild'
export default {
  input: 'packages/vanilla-extract/src/index.ts',
  output: { dir: 'packages/vanilla-extract/dist', format: 'es', entryFileNames: 'index.js', assetFileNames: '[name][extname]' },
  plugins: [vanillaExtractPlugin({ identifiers: 'short', extract: { name: 'styles.css' } }), esbuild()],
}
