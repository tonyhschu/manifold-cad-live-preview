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
    try {
      // Ensure fonts are loaded
      await fonts.ensureReady();

      // Hardcode font and fontSize to bypass parameter issues
      const fontName = 'Inter';
      const fontSize = 16;

      // Create text renderer
      const renderText = fontLoader(fontName);

      // Render text to CrossSection
      const textCrossSection = renderText(params.text, {
        fontSize: fontSize,
        align: 'center'
      });

      // Extrude to 3D
      const textManifold = textCrossSection.extrude(params.height);

      return textManifold;

    } catch (error) {
      throw new Error(`Font loading failed: ${error.message}`);
    }
  },
  {
    name: 'Font Test',
    description: 'Test component for font loading package'
  }
);
