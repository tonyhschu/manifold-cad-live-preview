const SIZE = 24;

class ManifoldLogo extends HTMLElement {
  constructor() {
    super();
    
    // Default configuration
    this.config = {
      size: SIZE,
      color: '#333333',
      secondaryColor: '#DDDDDD',
      faceColor: '#ffffff',
      faceOpacity: 0.5,
      backgroundColor: 'transparent',
      autoRotate: false,
      rotationSpeed: 0.02,
      strokeWidth: SIZE / 12,
      secondaryStrokeWidth: SIZE / 24,
      animationSpeed: 36
    };
    
    // Animation state
    this.isAnimating = false;
    this.isInProgress = false;
    this.animationId = null;
    this.rotation = { x: 0, y: 0, z: 0 };
    this.ticks = 0;
    this.baseRotation = 0;
    
    // Bind methods
    this.animate = this.animate.bind(this);
  }
  
  connectedCallback() {
    this.innerHTML = '';
    this.createCanvas();
    this.defineGeometry();
    this.updateCanvas();
    this.render();
    
    if (this.config.autoRotate) {
      this.startAnimation();
    }
  }
  
  disconnectedCallback() {
    this.stopAnimation();
  }
  
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'block';
    this.appendChild(this.canvas);
  }
  
  updateCanvas() {
    const size = this.config.size;
    const pixelRatio = window.devicePixelRatio || 1;

    // Set the actual canvas size in memory (scaled for retina)
    this.canvas.width = size * pixelRatio;
    this.canvas.height = size * pixelRatio;

    // Set the display size (CSS pixels)
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.canvas.style.backgroundColor = this.config.backgroundColor;

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(pixelRatio, pixelRatio);
  }
  
  defineGeometry() {
    const scale = this.config.size * 0.3;
    const height = this.config.size * 0.34;
    
    // Top face: corners at ±1 on both X and Y axes
    // Bottom face: corners at ±1 on X OR Y axis (but not both)
    this.vertices = [
      // Top face (z = scale): all corners at ±1 on both axes
      [-scale, -height, -scale],   // 0: top back-left
      [scale, -height, -scale],    // 1: top back-right  
      [scale, -height, scale],     // 2: top front-right
      [-scale, -height, scale],    // 3: top front-left
      
      // Bottom face (z = -scale): corners at ±1 on X OR Y (not both)
      [0, height, -scale],       // 4: back (only Y = -1)
      [scale, height, 0],        // 5: right (only X = 1)
      [0, height, scale],        // 6: front (only Y = 1)
      [-scale, height, 0],       // 7: left (only X = -1)
    ];
    
    // Define faces with their own edges for proper occlusion
    // All faces use counter-clockwise winding when viewed from outside the shape
    this.faces = [
      // Top face (quad) - counter-clockwise when viewed from above
      {
        vertices: [0, 1, 2, 3],
        type: 'quad',
        edges: [
          { from: 0, to: 1, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 1, to: 2, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 2, to: 3, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 3, to: 0, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } }
        ]
      },

      // Bottom face (quad) - counter-clockwise when viewed from below
      {
        vertices: [4, 7, 6, 5],
        type: 'quad',
        edges: [
          { from: 4, to: 7, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 7, to: 6, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 6, to: 5, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 5, to: 4, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } }
        ]
      },

      // 8 triangular side faces - corrected topology and winding order
      // Top edge anchored faces (counter-clockwise from outside)
      {
        vertices: [0, 4, 1],
        type: 'triangle',
        edges: [
          { from: 0, to: 1, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 1, to: 4, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 4, to: 0, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [1, 5, 2],
        type: 'triangle',
        edges: [
          { from: 1, to: 2, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 2, to: 5, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 5, to: 1, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [2, 6, 3],
        type: 'triangle',
        edges: [
          { from: 2, to: 3, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 3, to: 6, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 6, to: 2, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [3, 7, 0],
        type: 'triangle',
        edges: [
          { from: 3, to: 0, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 0, to: 7, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 7, to: 3, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      // Bottom edge anchored faces (counter-clockwise from outside)
      {
        vertices: [4, 5, 1],
        type: 'triangle',
        edges: [
          { from: 4, to: 5, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 5, to: 1, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 1, to: 4, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [5, 6, 2],
        type: 'triangle',
        edges: [
          { from: 5, to: 6, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 6, to: 2, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 2, to: 5, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [6, 7, 3],
        type: 'triangle',
        edges: [
          { from: 6, to: 7, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 7, to: 3, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 3, to: 6, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      },
      {
        vertices: [7, 4, 0],
        type: 'triangle',
        edges: [
          { from: 7, to: 4, style: { color: this.config.secondaryColor, width: this.config.secondaryStrokeWidth } },
          { from: 4, to: 0, style: { color: this.config.color, width: this.config.strokeWidth } },
          { from: 0, to: 7, style: { color: this.config.color, width: this.config.strokeWidth } }
        ]
      }
    ];

  }
  
  // Transform a vertex from 3D to 3D (apply rotations)
  transformVertex(vertex) {
    let [x, y, z] = vertex;
    
    const cos_x = Math.cos(this.rotation.x);
    const sin_x = Math.sin(this.rotation.x);
    const cos_y = Math.cos(this.rotation.y);
    const sin_y = Math.sin(this.rotation.y);
    const cos_z = Math.cos(this.rotation.z);
    const sin_z = Math.sin(this.rotation.z);
    
    // Rotate around X axis
    let y1 = y * cos_x - z * sin_x;
    let z1 = y * sin_x + z * cos_x;
    
    // Rotate around Y axis
    let x2 = x * cos_y + z1 * sin_y;
    let z2 = -x * sin_y + z1 * cos_y;
    
    // Rotate around Z axis
    let x3 = x2 * cos_z - y1 * sin_z;
    let y3 = x2 * sin_z + y1 * cos_z;
    
    return { x: x3, y: y3, z: z2 };
  }
  
  // Project 3D point to 2D screen coordinates
  project(point, fov = 30000) {
    const scale = 1;
    return {
      x: point.x * scale + this.config.size / 2,
      y: point.y * scale + this.config.size / 2,
      z: point.z
    };
  }

  // Calculate face normal using cross product (assumes counter-clockwise winding)
  calculateFaceNormal(face, transformedVertices) {
    const v0 = transformedVertices[face.vertices[0]];
    const v1 = transformedVertices[face.vertices[1]];
    const v2 = transformedVertices[face.vertices[2]];

    // Two edge vectors
    const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    // Cross product gives normal vector
    const normal = {
      x: edge1.y * edge2.z - edge1.z * edge2.y,
      y: edge1.z * edge2.x - edge1.x * edge2.z,
      z: edge1.x * edge2.y - edge1.y * edge2.x
    };

    // Normalize the vector
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (length > 0) {
      normal.x /= length;
      normal.y /= length;
      normal.z /= length;
    }

    return normal;
  }

  // Check if face is front-facing (counter-clockwise winding from camera view)
  isFaceFrontFacing(face, transformedVertices) {
    const normal = this.calculateFaceNormal(face, transformedVertices);

    // View vector (camera is at positive Z looking toward negative Z)
    const viewVector = { x: 0, y: 0, z: 1 };

    // Dot product with view vector
    // Positive = front-facing, negative = back-facing
    const dotProduct = normal.x * viewVector.x + normal.y * viewVector.y + normal.z * viewVector.z;

    return dotProduct > 0;
  }
  
  // Main render function
  render() {
    this.ctx.clearRect(0, 0, this.config.size, this.config.size);

    // Transform all vertices
    const transformedVertices = this.vertices.map(v => this.transformVertex(v));
    const projectedVertices = transformedVertices.map(v => this.project(v));

    // Determine which faces are front-facing
    const frontFacingFaces = this.faces.filter(face =>
      this.isFaceFrontFacing(face, transformedVertices)
    );

    // Sort front-facing faces by average Z depth (back to front for proper layering)
    const facesWithDepth = frontFacingFaces.map(face => {
      const avgZ = face.vertices.reduce((sum, vertexIndex) => {
        return sum + projectedVertices[vertexIndex].z;
      }, 0) / face.vertices.length;
      return { ...face, avgZ };
    });

    facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);

    // For each face (back to front): draw filled triangle first, then edges on top
    facesWithDepth.forEach(face => {
      // 1. Draw filled
      this.drawFace(face, projectedVertices, this.config.faceColor, this.config.faceOpacity);

      // 2. Draw edges on top of the filled face
      face.edges.forEach(edge => {
        const start = projectedVertices[edge.from];
        const end = projectedVertices[edge.to];
        this.drawEdge(start, end, edge.style);
      });
    });
  }
  
  // Draw a single edge with styling
  drawEdge(start, end, style) {
    this.ctx.strokeStyle = style.color || '#ffffff';
    this.ctx.lineWidth = style.width || 1;
    this.ctx.setLineDash(style.dash || []);
    this.ctx.globalAlpha = style.opacity || 1;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();

    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
  }

  // Draw a filled triangle or quad face
  drawFace(face, projectedVertices, fillColor = '#ffffff', opacity = 1) {
    this.ctx.fillStyle = fillColor;
    this.ctx.globalAlpha = opacity;

    this.ctx.beginPath();

    // Move to first vertex
    const firstVertex = projectedVertices[face.vertices[0]];
    this.ctx.moveTo(firstVertex.x, firstVertex.y);

    // Draw lines to all other vertices
    for (let i = 1; i < face.vertices.length; i++) {
      const vertex = projectedVertices[face.vertices[i]];
      this.ctx.lineTo(vertex.x, vertex.y);
    }

    // Close the path and fill
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
  }
  
  // Animation functions
  animate() {
    const animationSpeed = this.config.animationSpeed; // Higher = slower animation
    const progress = this.ticks * Math.PI / animationSpeed;
    const positionInPhase = progress % (2 * Math.PI);

    if (this.isInProgress) {
      const targetRotationY = Math.PI;
      const targetRotationZ = Math.PI / 4;

      // Phase controller - positive every 4π units of progress
      const phaseController = Math.sin(progress * 0.5);
      const isRotating = phaseController > 0;

      if (isRotating) {
        // Position within the current 2π phase
        
        
        // Cumulative rotation at this position
        const cumulativeRotationY = (-Math.sin(positionInPhase) + positionInPhase) * (targetRotationY / (2 * Math.PI));
        const cumulativeRotationZ = Math.sin(positionInPhase) * (targetRotationZ / (2 * Math.PI));
        
        this.rotation.y = this.baseRotation + cumulativeRotationY;
        this.rotation.x = cumulativeRotationZ;
        this.rotation.z = -cumulativeRotationZ * 1.2;
      } else {
        this.rotation.y = this.baseRotation;
        this.rotation.x = 0;
        this.rotation.z = 0;
      }
      
      this.render();
      this.ticks++;

      this.animationId = requestAnimationFrame(this.animate);
    }

    if (!this.isAnimating && positionInPhase <= 0) {
      this.ticks = 0;
      console.log('Stopping animation');

      this.isInProgress = false;

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

  }
  
  startAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.isInProgress = true;
      this.animate();
    }
  }
  
  stopAnimation() {
    this.isAnimating = false;
  }
  
  // Public methods for programmatic control
  start() {
    this.startAnimation();
  }
  
  startOnce() {
    if (!this.isInProgress) {
      this.isInProgress = true;
      this.ticks = 1;
      this.animate();
    }
  }

  stop() {
    this.stopAnimation();
  }
}

// Register the custom element
customElements.define('manifold-logo', ManifoldLogo);