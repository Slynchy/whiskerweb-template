import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

async function main(): Promise<void> {
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    minify: true,
    outfile: 'dist/index.js',
    // The framework (and pixi-filters/@pixi/sound under it) would otherwise resolve
    // lib/whiskerweb/node_modules/pixi.js, bundling a second, older copy of PIXI
    alias: { 'pixi.js': './node_modules/pixi.js' },
    plugins: [
      copy({
        assets: [
          {
            from: ['./assets/**/*'],
            to: ['assets'],
          },
          {
            from: ['./src/index.html'],
            to: ['./index.html'],
          },
        ],
      }),
    ],
  });
}

void main().catch(error => {
  console.error('Failed to build bundle:', error);
  process.exit(1);
});
