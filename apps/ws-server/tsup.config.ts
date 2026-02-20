import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  // Bundle everything inline — @fio/shared is a workspace package
  // not available in node_modules on Render after build
  noExternal: [/@fio\/.*/, 'nanoid'],
  clean: true,
  sourcemap: false,
});
