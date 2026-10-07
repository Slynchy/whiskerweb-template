import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

async function main(): Promise<void> {
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    minify: true,
    outfile: 'dist/index.js',
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
