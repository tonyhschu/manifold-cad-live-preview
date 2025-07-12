import { Manifold } from '@manifold-studio/wrapper';
import { P, createConfig } from '@manifold-studio/wrapper';

// Test cylinder component to verify HMR functionality
export default createConfig({
  name: 'Test Cylinder',
  parameters: {
    radius: P.number('Radius', 10, { min: 1, max: 50 }),
    height: P.number('Height', 20, { min: 1, max: 100 }),
    segments: P.number('Segments', 16, { min: 3, max: 64, step: 1 })
  }
}, ({ radius, height, segments }) => {
  console.log('🔧 Building test cylinder with:', { radius, height, segments });
  
  // Create a simple cylinder
  const cylinder = Manifold.cylinder(height, radius, radius, segments);
  
  return cylinder;
});
