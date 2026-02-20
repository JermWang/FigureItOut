import { defineConfig } from 'tsup';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  // Inline @fio/shared and nanoid so the output is fully self-contained
  noExternal: [/@fio\/.*/, 'nanoid'],
  clean: true,
  sourcemap: false,
  esbuildOptions(options) {
    // Resolve @fio/shared directly from source so tsup doesn't need
    // packages/shared/dist to exist before this build runs
    options.alias = {
      '@fio/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
  },
});
