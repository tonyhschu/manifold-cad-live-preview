/**
 * Typeface Component - Using @manifold-studio/typeface Package
 *
 * This component demonstrates the new font loading package with lazy initialization.
 * It uses the async pattern to load fonts on demand.
 */

import { Manifold, P, createConfig } from '@manifold-studio/wrapper';
import { fontLoader, fonts } from '@manifold-studio/typeface';

/**
 * Create 3D text using the font loading package
 */
async function createTypefaceModel(params: {
  text: string;
  font: string;
  fontSize: number;
  height: number;
  align: string;
}): Promise<typeof Manifold> {
  if (!params) {
    params = {
      text: 'HELLO',
      font: 'Inter',
      fontSize: 12,
      height: 2,
      align: 'center'
    };
  }

  const { text, font, fontSize, height, align } = params;

  try {
    // Ensure fonts are loaded (lazy initialization)
    await fonts.ensureReady();

    // Create text renderer for the selected font
    const renderText = fontLoader(font);

    // Convert text to 2D cross-section
    const crossSection = renderText(text, {
      fontSize,
      align: align as 'left' | 'center' | 'right',
      letterSpacing: 1.1,
      subdivisionSteps: 8
    });

    // Extrude to 3D
    return crossSection.extrude(height);

  } catch (error) {
    console.error('Font loading failed:', error);

    // Fallback to simple geometric text
    const charWidth = fontSize * 0.6;
    const charSpacing = fontSize * 0.1;
    const totalWidth = text.length * (charWidth + charSpacing) - charSpacing;

    let result = new Manifold();

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Skip spaces
      if (char === ' ') continue;

      // Create a simple cube for each character
      const cube = Manifold.cube([charWidth, fontSize, height])
        .translate([i * (charWidth + charSpacing) - totalWidth / 2, 0, 0]);

      result = result.add(cube);
    }

    // If no characters, return a small placeholder cube
    if (result.isEmpty()) {
      result = Manifold.cube([fontSize, fontSize * 0.1, height]);
    }

    return result;
  }
}

// Export the parametric configuration
export default createConfig(
  {
    text: P.string('HELLO'),
    font: P.select('Inter', ['Inter', 'Roboto', 'Open Sans', 'Source Code Pro']),
    fontSize: P.number(12, 6, 48, 1),
    height: P.number(2, 0.5, 10, 0.1),
    align: P.select('center', ['left', 'center', 'right'])
  },
  createTypefaceModel,
  {
    name: 'Typeface',
    description: 'Font-based 3D text rendering with lazy font loading'
  }
);
