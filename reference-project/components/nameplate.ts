/**
 * Nameplate Component - Professional Badge with Raised Text
 * 
 * Creates a customizable nameplate/badge perfect for:
 * - Desk nameplates
 * - Door nameplates  
 * - Luggage tags
 * - ID badges
 * - Awards and plaques
 */

import { Manifold, P, createConfig } from '@manifold-studio/wrapper';
import { fontLoader, fonts } from '@manifold-studio/typeface';

async function createNameplate(params: {
  name: string;
  title?: string;
  plateWidth: number;
  plateHeight: number;
  plateThickness: number;
  textHeight: number;
  font: string;
  cornerRadius: number;
  hasMountingHoles: boolean;
}): Promise<typeof Manifold> {
  
  const {
    name,
    title = '',
    plateWidth,
    plateHeight,
    plateThickness,
    textHeight,
    font,
    cornerRadius,
    hasMountingHoles
  } = params;

  try {
    // Ensure fonts are loaded
    await fonts.ensureReady();
    const renderText = fontLoader(font);

    // Create base plate (simplified - no rounded corners for now)
    let basePlate = Manifold.cube([plateWidth, plateHeight, plateThickness], true);

    // Add mounting holes if requested
    if (hasMountingHoles) {
      const holeRadius = Math.min(plateWidth, plateHeight) * 0.025; // 2.5% of smallest dimension
      const holeSpacing = Math.min(plateWidth, plateHeight) * 0.8;   // 80% of smallest dimension
      
      const hole = Manifold.cylinder(plateThickness + 1, holeRadius);
      basePlate = basePlate.subtract([
        hole.translate([-holeSpacing/2, 0, 0]),
        hole.translate([holeSpacing/2, 0, 0])
      ]);
    }

    // Calculate font size based on plate dimensions
    const nameFontSize = Math.min(plateWidth * 0.15, plateHeight * 0.25);
    const titleFontSize = nameFontSize * 0.6;

    // Create name text
    const nameText = renderText(name, {
      fontSize: nameFontSize,
      align: 'center',
      letterSpacing: 1.05
    });

    // Position name text
    let textElements = [nameText.extrude(textHeight).translate([0, title ? plateHeight * 0.1 : 0, plateThickness/2])];

    // Create title text if provided
    if (title.trim()) {
      const titleTextShape = renderText(title, {
        fontSize: titleFontSize,
        align: 'center',
        letterSpacing: 1.1
      });
      
      textElements.push(
        titleTextShape.extrude(textHeight * 0.8)
          .translate([0, -plateHeight * 0.2, plateThickness/2])
      );
    }

    // Combine base plate with raised text
    const result = basePlate.add(textElements);
    
    return result;

  } catch (error) {
    console.error('Nameplate creation failed:', error);
    
    // Fallback: simple geometric nameplate
    const basePlate = Manifold.cube([plateWidth, plateHeight, plateThickness], true);
    const textBlock = Manifold.cube([
      plateWidth * 0.8,
      plateHeight * 0.3,
      textHeight
    ], true).translate([0, 0, plateThickness/2]);
    
    return basePlate.add(textBlock);
  }
}

// Export the parametric configuration
export default createConfig(
  {
    name: P.string('JOHN DOE', 'Primary name/text'),
    title: P.string('MANAGER', 'Optional title/subtitle'),
    plateWidth: P.number(80, 40, 150, 5, 'Nameplate width (mm)'),
    plateHeight: P.number(25, 15, 60, 2.5, 'Nameplate height (mm)'),
    plateThickness: P.number(3, 1, 8, 0.5, 'Base plate thickness (mm)'),
    textHeight: P.number(1, 0.5, 3, 0.1, 'Height of raised text (mm)'),
    font: P.select('Inter', ['Inter', 'Roboto', 'Open Sans', 'Source Code Pro'], 'Font family'),
    cornerRadius: P.number(3, 0, 8, 0.5, 'Corner roundness (0 = sharp corners)'),
    hasMountingHoles: P.boolean(false, 'Add mounting holes for screws')
  },
  createNameplate,
  {
    name: 'Professional Nameplate',
    description: 'Customizable nameplate with raised text - perfect for desk nameplates, door signs, luggage tags, and professional badges'
  }
);