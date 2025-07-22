// Test 3MF export functionality
import { manifoldTo3MF } from './packages/wrapper/src/lib/3mf-export.ts';

// Create a simple test manifold (cube)
const testManifold = {
  getMesh: () => ({
    vertProperties: new Float32Array([
      // Simple cube vertices
      -1, -1, -1,  // 0
       1, -1, -1,  // 1
       1,  1, -1,  // 2
      -1,  1, -1,  // 3
      -1, -1,  1,  // 4
       1, -1,  1,  // 5
       1,  1,  1,  // 6
      -1,  1,  1   // 7
    ]),
    triVerts: new Uint32Array([
      // Front face
      0, 1, 2,  0, 2, 3,
      // Back face
      4, 7, 6,  4, 6, 5,
      // Left face
      0, 3, 7,  0, 7, 4,
      // Right face
      1, 5, 6,  1, 6, 2,
      // Top face
      3, 2, 6,  3, 6, 7,
      // Bottom face
      0, 4, 5,  0, 5, 1
    ])
  })
};

async function test3MFExport() {
  try {
    console.log('Testing 3MF export...');
    
    const result = await manifoldTo3MF(testManifold, {
      filename: 'test-cube'
    });
    
    console.log('3MF export successful!');
    console.log('Result type:', typeof result);
    console.log('Result size:', result.size);
    
    return result;
  } catch (error) {
    console.error('3MF export failed:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Run the test
test3MFExport().then(result => {
  console.log('Test completed successfully');
}).catch(error => {
  console.error('Test failed:', error);
});
