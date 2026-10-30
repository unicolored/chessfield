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

// Fonts are sized in world units (meters); 100 px per cm maps one meter to 10,000 px.
const PIXELS_PER_METER = 10_000;
// Blank margin around the glyphs, in CSS pixels, so overhangs and antialiasing stay inside.
const PADDING_PX = 10;

function getPixelRatio(options: TextOptions): number {
  return options.pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 2) ?? 2;
}

export class CanvasSpriteBackend extends BaseTextBackend {
  readonly type: TextBackendType = 'canvas-sprite';
  private cache: Map<string, CacheEntry> = new Map();
  // Cache-owned textures outlive individual instances; everything else is instance-owned.
  private cachedTextures = new WeakSet<THREE.Texture>();

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

    // Measure in CSS pixels. The backing store is enlarged by the pixel ratio afterwards,
    // so glyphs stay sharp on high-DPI screens without changing their world size.
    const fontString = `${fontWeight} ${Math.round(fontSize * PIXELS_PER_METER)}px ${fontFamily}`;
    ctx.font = fontString;
    const metrics = ctx.measureText(options.text);

    // Size from the real ink box: system fonts differ in ascent/descent, and a fixed
    // line height would clip tall fonts (or italic/accented glyphs).
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent ?? metrics.fontBoundingBoxAscent ?? 0);
    const descent = Math.ceil(metrics.actualBoundingBoxDescent ?? metrics.fontBoundingBoxDescent ?? 0);

    canvas.width = Math.ceil((metrics.width + PADDING_PX * 2) * pixelRatio);
    canvas.height = Math.ceil((ascent + descent + PADDING_PX * 2) * pixelRatio);

    // Resizing the canvas resets its context, so the transform and font are applied after.
    ctx.scale(pixelRatio, pixelRatio);
    ctx.font = fontString;
    ctx.fillStyle = typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.fillText(options.text, canvas.width / 2 / pixelRatio, PADDING_PX + ascent);

    // Report CSS pixels: the texture is stretched to the sprite, so its aspect ratio must
    // match the backing store exactly at every pixel ratio.
    return {
      canvas,
      width: canvas.width / pixelRatio,
      height: canvas.height / pixelRatio,
    };
  }

  private getOrCreateTexture(options: TextOptions): CacheEntry {
    // Dynamic text (clocks) opts out: its texture is owned by the instance and replaced on update.
    if (options.cache === false) {
      const { canvas, width, height } = this.renderToCanvas(options);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return { canvas, texture, width, height, pixelRatio: getPixelRatio(options) };
    }

    const key = this.getCacheKey(options);
    let cached = this.cache.get(key);

    if (!cached) {
      const { canvas, width, height } = this.renderToCanvas(options);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const pixelRatio = getPixelRatio(options);
      cached = { canvas, texture, width, height, pixelRatio };
      this.cache.set(key, cached);
      this.cachedTextures.add(texture);
    }

    return cached;
  }

  private disposeIfInstanceOwned(texture: THREE.Texture | null): void {
    if (texture && !this.cachedTextures.has(texture)) {
      texture.dispose();
    }
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
      // Cached textures are shared with other instances and owned by the cache.
      this.disposeIfInstanceOwned(material.map);
      material.dispose();
    }
  }

  protected updateInstance(instance: TextInstance, options: Partial<TextOptions>): void {
    if (!(instance.object instanceof THREE.Sprite)) return;

    const mergedOptions = { ...instance.options, ...options };
    instance.options = mergedOptions;

    const { texture, width, height } = this.getOrCreateTexture(mergedOptions);
    const material = instance.object.material as THREE.SpriteMaterial;
    const previousTexture = material.map;

    // Replace the instance-owned texture; cached textures stay in the cache.
    material.map = texture;
    material.needsUpdate = true;
    this.disposeIfInstanceOwned(previousTexture);

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
