#!/usr/bin/env node

import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

async function buildCLI() {
  try {
    // Ensure bin directory exists
    const binDir = join(__dirname, 'bin');
    if (!existsSync(binDir)) {
      mkdirSync(binDir, { recursive: true });
    }

    const buildOptions = {
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      format: 'esm',
      outfile: 'bin/index.js',
      external: ['handlebars', 'commander'],

      sourcemap: false,
      minify: false,
    };

    if (isWatch) {
      const context = await build({
        ...buildOptions,
        watch: {
          onRebuild(error, result) {
            if (error) {
              console.error('❌ Build failed:', error);
            } else {
              console.log('✅ Rebuilt successfully');
            }
          },
        },
      });
      console.log('👀 Watching for changes...');
    } else {
      await build(buildOptions);

      // Add shebang to the output file
      const outputFile = join(__dirname, 'bin/index.js');
      const content = readFileSync(outputFile, 'utf8');
      // Remove any existing shebang and add our own
      const cleanContent = content.replace(/^#!.*\n?/gm, '');
      writeFileSync(outputFile, '#!/usr/bin/env node\n' + cleanContent);

      console.log('✅ Build completed successfully');
    }

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildCLI();
