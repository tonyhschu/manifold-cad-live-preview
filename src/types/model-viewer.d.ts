declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': any;
  }
}

// Basic type definitions for the model-viewer element
interface HTMLModelViewerElement extends HTMLElement {
  src: string;
  alt: string;
  cameraControls: boolean;
  shadowIntensity: number;
  exposure: number;
  poster: string;
  loading: 'auto' | 'lazy' | 'eager';
  reveal: 'auto' | 'manual';
  ar: boolean;
  arModes: string;
  autoRotate: boolean;
  environmentImage: string;
  cameraOrbit: string;
  // Add other properties as needed
}

// Declare the element for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'model-viewer': HTMLModelViewerElement;
  }
}
