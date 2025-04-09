import { WebGLRenderer } from 'three';

export class RendererProvider {
  static enableAntialias = window.devicePixelRatio < 2;

  getCanvas(): HTMLCanvasElement {
    return document.createElement('canvas') as HTMLCanvasElement;
  }

  getRenderer(
    { width, height }: { width: number; height: number },
    canvas: HTMLCanvasElement,
  ): WebGLRenderer {
    const renderer = new WebGLRenderer({
      canvas: canvas,
      // powerPreference: 'high-performance',
      antialias: RendererProvider.enableAntialias,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    return renderer;
  }
}
