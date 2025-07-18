// Test script to verify typeface model parametric configuration
import { isParametricConfig } from '../packages/configurator/src/pipeline-runtime/types.ts';

async function testTypefaceModel() {
  try {
    console.log('Testing typeface model...');
    
    // Import the typeface model
    const typefaceModule = await import('./components/typeface.ts');
    console.log('Typeface module imported:', Object.keys(typefaceModule));
    
    // Check the default export
    const defaultExport = typefaceModule.default;
    console.log('Default export:', defaultExport);
    console.log('Default export type:', typeof defaultExport);
    
    // Test if it's a parametric config
    const isParametric = isParametricConfig(defaultExport);
    console.log('Is parametric config:', isParametric);
    
    if (isParametric) {
      console.log('✅ Parametric config detected!');
      console.log('Config name:', defaultExport.name);
      console.log('Config description:', defaultExport.description);
      console.log('Parameters:', Object.keys(defaultExport.parameters));
      
      // Test parameter extraction
      const params = {};
      for (const [key, paramConfig] of Object.entries(defaultExport.parameters)) {
        params[key] = paramConfig.value;
      }
      console.log('Default parameters:', params);
      
      // Test model generation
      console.log('Testing model generation...');
      const result = defaultExport.generateModel(params);
      console.log('Generated model:', result);
      
    } else {
      console.log('❌ Not detected as parametric config');
      if (defaultExport && typeof defaultExport === 'object') {
        console.log('Object properties:', Object.keys(defaultExport));
        console.log('Has parameters:', 'parameters' in defaultExport);
        console.log('Has generateModel:', 'generateModel' in defaultExport);
        if ('generateModel' in defaultExport) {
          console.log('generateModel type:', typeof defaultExport.generateModel);
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing typeface model:', error);
  }
}

testTypefaceModel();
