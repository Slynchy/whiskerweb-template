import { context } from 'esbuild';
import { copy } from "esbuild-plugin-copy";

async function main(): Promise<void> {
  const esbuildContext = await context({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'browser',
    minify: false,
    logLevel: 'info',
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

  await esbuildContext.watch();
  const { hosts, port } = await esbuildContext.serve({
    servedir: "dist",
    port: 8080,
  });
}

void main().catch(e => {
  process.exit(1);
});
