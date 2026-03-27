import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'build/index.js',
  external: [
    'playwright-core',
    'pixelmatch',
    'pngjs',
  ],
  banner: {
    js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
  },
});

console.log('Build complete: build/index.js');
