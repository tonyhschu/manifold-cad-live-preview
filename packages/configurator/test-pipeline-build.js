import { PipelineCompilerImpl } from './src/pipeline-compiler/index.js';

async function testPipelineBuild() {
  console.log('🔄 Testing pipeline build with Vite API...');
  
  try {
    const compiler = new PipelineCompilerImpl('/Users/tchu/code/manifold-cad-live-preview/reference-project');
    
    console.log('📁 Compiler created, starting compilation...');
    const result = await compiler.compile();
    
    console.log('✅ Compilation result:', {
      pipelinePath: result.pipelinePath,
      modelCount: result.modelCount,
      errors: result.errors,
      warnings: result.warnings
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPipelineBuild();
