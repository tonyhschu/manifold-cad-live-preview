/**
 * Font Test Component
 * 
 * Simple test component to verify the @manifold-studio/typeface package
 * works correctly in the CLI pipeline generation.
 */

import { Manifold, P, createConfig } from '@manifold-studio/wrapper';
import { fontLoader, fonts } from '@manifold-studio/typeface';

export default createConfig(
  {
    text: P.string('HELLO', 'Text to render'),
    height: P.number(3, 1, 10, 0.5, 'Extrusion height')
  },
  async (params) => {
    console.log('🔤 Font Test: Starting font loading...');

    try {
      // Ensure fonts are loaded
      await fonts.ensureReady();
      console.log('✅ Font Test: Fonts loaded successfully');

      // Hardcode font and fontSize to bypass parameter issues
      const fontName = 'Inter';
      const fontSize = 16;

      console.log(`🎨 Font Test: Using hardcoded font "${fontName}"`);

      // Create text renderer
      const renderText = fontLoader(fontName);

      // Render text to CrossSection
      const textCrossSection = renderText(params.text, {
        fontSize: fontSize,
        align: 'center'
      });

      // Extrude to 3D
      const textManifold = textCrossSection.extrude(params.height);
      console.log('🏗️ Font Test: Text extruded to 3D');

      return textManifold;

    } catch (error) {
      console.error('❌ Font Test: Font loading failed:', error);
      throw new Error(`Font loading failed: ${error.message}`);
    }
  },
  {
    name: 'Font Test',
    description: 'Test component for font loading package'
  }
);
