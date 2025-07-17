import { Manifold, CrossSection, createConfig, P } from '@manifold-studio/wrapper';

function createExtrudedString(text: string = "Hello", height: number = 10, typeface: string = 'Arial'): typeof Manifold {
  // Create a 2D text path (simplified for demo)
  const path = text.split('').map(char => {
    // Each character is a simple square for now
    return CrossSection.square([1, 1]).translate([char.charCodeAt(0) - 97, 0]);
  });

  // Extrude the path
  const extruded = CrossSection.union(path).extrude(height);

  return extruded;
}

// Export the parametric config as the default export
const typefaceConfig = createConfig(
    {
        string: P.string('Hello'),
        height: P.number(10, 1, 50, 1),
        typeface: P.select('Arial', ['Arial', 'Helvetica', 'Times New Roman'])
    },
    (params: { string: string; height: number; typeface: string }) =>
        createExtrudedString(params.string, params.height, params.typeface),
    {
        name: 'Typeface',
        description: 'A simple typeface component'
    }
);

export default typefaceConfig;