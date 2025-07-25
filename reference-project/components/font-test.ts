/**
 * Font Test Component
 * 
 * Simple test component to verify the @manifold-studio/typeface package
 * works correctly in the CLI pipeline generation.
 */

import { Manifold, P, createConfig } from '@manifold-studio/wrapper';
import { fontLoader, fonts } from '@manifold-studio/typeface';

export const config = createConfig({
  name: 'Font Test',
  description: 'Test component for font loading package',
  parameters: {
    text: P.string('TEST', 'Text to render'),
    font: P.select(['Inter', 'Roboto', 'Open Sans'], 'Inter', 'Font family'),
    fontSize: P.number(16, 8, 32, 1, 'Font size'),
    height: P.number(3, 1, 10, 0.5, 'Extrusion height')
  }
});

export default createConfig(
  config.parameters,
  async (params) => {
    console.log('🔤 Font Test: Starting font loading...');
    
    try {
      // Ensure fonts are loaded
      await fonts.ensureReady();
      console.log('✅ Font Test: Fonts loaded successfully');
      
      // Create text renderer
      const renderText = fontLoader(params.font);
      console.log(`🎨 Font Test: Using font ${params.font}`);
      
      // Render text to CrossSection
      const textCrossSection = renderText(params.text, {
        fontSize: params.fontSize,
        align: 'center'
      });
      
      // Extrude to 3D
      const textManifold = textCrossSection.extrude(params.height);
      console.log('🏗️ Font Test: Text extruded to 3D');
      
      return textManifold;
      
    } catch (error) {
      console.error('❌ Font Test: Error during font loading or rendering:', error);
      
      // Fallback to geometric text
      console.log('🔄 Font Test: Falling back to geometric text');
      const fallbackText = Manifold.cube([params.text.length * params.fontSize * 0.6, params.fontSize, params.height])
        .translate([0, 0, params.height / 2]);
      
      return fallbackText;
    }
  }
);
