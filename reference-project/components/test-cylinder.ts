import { Manifold } from '@manifold-studio/wrapper';
import { P, createConfig } from '@manifold-studio/wrapper';

// Test cylinder component to verify HMR functionality
export default createConfig(
  {
    radius: P.number(10, 1, 50),
    height: P.number(20, 1, 100),
    segments: P.number(16, 3, 64, 1)
  },
  ({ radius, height, segments }) => {
  console.log('🔧 Building test cylinder with:', { radius, height, segments });
  
  // Create a simple cylinder
  const cylinder = Manifold.cylinder(height, radius, radius, segments);

  return cylinder;
},
{
  name: 'Test Cylinder',
  description: 'A simple test cylinder to verify HMR functionality'
});
