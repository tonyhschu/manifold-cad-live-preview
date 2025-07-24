import { build } from 'vite';

async function testBuildSpeed() {
  console.log('🔄 Testing Vite build API speed...');
  const start = Date.now();
  
  try {
    await build({
      root: process.cwd(),
      build: {
        lib: {
          entry: './temp/user-pipeline-entry.ts',
          name: 'UserPipeline',
          fileName: 'pipeline-speed-test',
          formats: ['es']
        },
        rollupOptions: {
          external: ['manifold-3d', '@manifold-studio/wrapper'],
          output: {
            dir: './temp',
            format: 'es'
          }
        },
        outDir: './temp',
        target: 'esnext',
        minify: false,
        sourcemap: true
      },
      logLevel: 'error'
    });
    
    const duration = Date.now() - start;
    console.log(`✅ Vite build API completed in ${duration}ms`);
    
    // Test multiple builds to see caching behavior
    console.log('🔄 Testing second build (should be faster with cache)...');
    const start2 = Date.now();
    
    await build({
      root: process.cwd(),
      build: {
        lib: {
          entry: './temp/user-pipeline-entry.ts',
          name: 'UserPipeline',
          fileName: 'pipeline-speed-test-2',
          formats: ['es']
        },
        rollupOptions: {
          external: ['manifold-3d', '@manifold-studio/wrapper'],
          output: {
            dir: './temp',
            format: 'es'
          }
        },
        outDir: './temp',
        target: 'esnext',
        minify: false,
        sourcemap: true
      },
      logLevel: 'error'
    });
    
    const duration2 = Date.now() - start2;
    console.log(`✅ Second build completed in ${duration2}ms`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
  }
}

testBuildSpeed().catch(console.error);
