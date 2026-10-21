import * as THREE from 'three/webgpu';

import { BaseTextBackend } from './text-backend.ts';
import { type TextBackendType, type TextInstance, type TextOptions } from './types.ts';

interface CacheEntry {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  width: number;
  height: number;
  pixelRatio: number;
}

function getPixelRatio(options: TextOptions): number {
  return options.pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 2) ?? 2;
}

export class CanvasSpriteBackend extends BaseTextBackend {
  readonly type: TextBackendType = 'canvas-sprite';
  private cache: Map<string, CacheEntry> = new Map();

  private getCacheKey(options: TextOptions): string {
    const pixelRatio = getPixelRatio(options);
    const key = {
      text: options.text,
      fontSize: options.fontSize ?? 0.4,
      fontFamily: options.fontFamily ?? 'system-ui, sans-serif',
      fontWeight: String(options.fontWeight ?? '400'),
      color: String(options.color ?? '#ffffff'),
      pixelRatio,
    };
    return JSON.stringify(key);
  }

  private renderToCanvas(options: TextOptions): { canvas: HTMLCanvasElement; width: number; height: number } {
    const fontSize = options.fontSize ?? 0.4;
    const fontFamily = options.fontFamily ?? 'system-ui, sans-serif';
    const fontWeight = String(options.fontWeight ?? '400');
    const color = options.color ?? '#ffffff';
    const pixelRatio = getPixelRatio(options);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Render at higher DPI for crisp text
    // fontSize is in meters (world units). 1 meter = 100cm. At 100px/cm = 10000px/meter
    const renderFontSize = Math.round(fontSize * 10_000 * pixelRatio);
    const fontString = `${fontWeight} ${renderFontSize}px ${fontFamily}`;
    ctx.font = fontString;

    const metrics = ctx.measureText(options.text);
    const textWidth = metrics.width;
    const textHeight = Math.round(renderFontSize * 1.2);

    const padding = 10 * pixelRatio;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Scale context to match high DPI rendering
    ctx.scale(pixelRatio, pixelRatio);
    ctx.font = fontString;
    ctx.fillStyle = typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(options.text, canvas.width / 2 / pixelRatio, canvas.height / 2 / pixelRatio);

    // Return CSS pixels (canvas pixels / pixelRatio)
    return { canvas, width: textWidth / pixelRatio, height: textHeight / pixelRatio };
  }

  private getOrCreateTexture(options: TextOptions): CacheEntry {
    const key = this.getCacheKey(options);
    let cached = this.cache.get(key);

    if (!cached) {
      const { canvas, width, height } = this.renderToCanvas(options);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const pixelRatio = getPixelRatio(options);
      cached = { canvas, texture, width, height, pixelRatio };
      this.cache.set(key, cached);
    }

    return cached;
  }

  create(options: TextOptions): TextInstance {
    const { texture, width, height } = this.getOrCreateTexture(options);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(options.position);

    const scale = options.fontSize ?? 0.4;
    sprite.scale.set((width * scale) / 100, (height * scale) / 100, 1);

    if (options.rotation) {
      sprite.rotation.copy(options.rotation);
    }

    return this.createTextInstance(sprite, options, this.type);
  }

  protected disposeInstance(instance: TextInstance): void {
    if (instance.object instanceof THREE.Sprite) {
      const material = instance.object.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();
    }
  }

  protected updateInstance(instance: TextInstance, options: Partial<TextOptions>): void {
    if (!(instance.object instanceof THREE.Sprite)) return;

    const mergedOptions = { ...instance.options, ...options };
    instance.options = mergedOptions;

    const { texture, width, height } = this.getOrCreateTexture(mergedOptions);
    const material = instance.object.material as THREE.SpriteMaterial;

    material.map?.dispose();
    material.map = texture;
    material.needsUpdate = true;

    const scale = mergedOptions.fontSize ?? 0.4;
    instance.object.scale.set((width * scale) / 100, (height * scale) / 100, 1);

    if (mergedOptions.position) {
      instance.object.position.copy(mergedOptions.position);
    }
    if (mergedOptions.rotation) {
      instance.object.rotation.copy(mergedOptions.rotation);
    }
  }

  override dispose(): void {
    super.dispose();
    for (const cached of this.cache.values()) {
      cached.texture.dispose();
    }
    this.cache.clear();
  }
}
