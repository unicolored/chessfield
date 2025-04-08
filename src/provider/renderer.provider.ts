import * as THREE from 'three';

export class RendererProvider {
  getCanvas(): HTMLCanvasElement {
    return document.createElement('canvas') as HTMLCanvasElement;
  }

  getRenderer(
    { width, height }: { width: number; height: number },
    canvas: HTMLCanvasElement,
  ): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // powerPreference: 'high-performance',
      antialias: window.devicePixelRatio < 2,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    return renderer;
  }
}
