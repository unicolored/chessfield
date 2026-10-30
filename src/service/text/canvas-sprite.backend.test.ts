import * as THREE from 'three/webgpu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CanvasSpriteBackend } from './canvas-sprite.backend.ts';

// The backend uses the real THREE.Sprite since we can't easily mock the module it imports from
// We'll just test the basic functionality

function getTextureCanvas(object: THREE.Object3D): HTMLCanvasElement {
  return (object as THREE.Sprite).material.map!.image as HTMLCanvasElement;
}

function inkBounds(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = { minX: canvas.width, maxX: -1, minY: canvas.height, maxY: -1 };

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (data[(y * canvas.width + x) * 4 + 3] === 0) continue;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  return bounds;
}

describe('CanvasSpriteBackend', () => {
  let backend: CanvasSpriteBackend;

  beforeEach(() => {
    backend = new CanvasSpriteBackend();
  });

  afterEach(() => {
    backend.dispose();
    vi.clearAllMocks();
  });

  it('should create text instance', () => {
    const instance = backend.create({
      text: 'Test',
      position: new THREE.Vector3(0, 0, 5),
    });

    expect(instance).toBeDefined();
    expect(instance.backend).toBe('canvas-sprite');
    expect(instance.object).toBeInstanceOf(THREE.Sprite);
  });

  it('should cache repeated text with same options', () => {
    const options = { text: 'Cached', position: new THREE.Vector3(0, 0, 5) };
    const instance1 = backend.create(options);
    const instance2 = backend.create(options);

    // Should reuse texture (implementation detail)
    expect(instance1.object).not.toBe(instance2.object);
  });

  it('should update instance', () => {
    const instance = backend.create({
      text: 'Original',
      position: new THREE.Vector3(0, 0, 5),
      fontSize: 0.4,
    });

    backend.updateInstance(instance, { text: 'Updated', fontSize: 0.5 });
    expect(instance.options.text).toBe('Updated');
    expect(instance.options.fontSize).toBe(0.5);
  });

  it.each([1, 2, 3])('keeps glyphs inside the texture at pixel ratio %i', pixelRatio => {
    const instance = backend.create({
      text: 'Player White',
      position: new THREE.Vector3(0, 0, 5),
      fontSize: 0.006,
      pixelRatio,
    });
    const canvas = getTextureCanvas(instance.object);
    const { minX, maxX, minY, maxY } = inkBounds(canvas);

    // The pixel ratio must only affect resolution, never crop the rendered glyphs.
    expect(minX).toBeGreaterThan(0);
    expect(minY).toBeGreaterThan(0);
    expect(maxX).toBeLessThan(canvas.width - 1);
    expect(maxY).toBeLessThan(canvas.height - 1);
  });

  it('keeps the sprite world size independent of the pixel ratio', () => {
    const options = { text: 'Player White', position: new THREE.Vector3(0, 0, 5), fontSize: 0.006 };
    const first = backend.create({ ...options, pixelRatio: 1 }).object as THREE.Sprite;
    const second = backend.create({ ...options, pixelRatio: 2 }).object as THREE.Sprite;

    expect(second.scale.x / first.scale.x).toBeCloseTo(1, 2);
    expect(second.scale.y / first.scale.y).toBeCloseTo(1, 2);
    // Same request at twice the pixel ratio doubles the backing store, not the drawing.
    expect(getTextureCanvas(second).width / getTextureCanvas(first).width).toBeCloseTo(2, 1);
  });

  it('keeps the shared cached texture alive when one instance is disposed', () => {
    const options = { text: 'Shared', position: new THREE.Vector3(0, 0, 5) };
    const first = backend.create(options);
    const second = backend.create(options);

    const texture = (first.object as THREE.Sprite).material.map!;
    expect((second.object as THREE.Sprite).material.map).toBe(texture);
    const dispose = vi.spyOn(texture, 'dispose');

    first.dispose();

    expect(dispose).not.toHaveBeenCalled();
  });

  it('does not dispose the cached texture when an instance is updated', () => {
    const options = { text: 'One', position: new THREE.Vector3(0, 0, 5) };
    const first = backend.create(options);
    const second = backend.create(options);

    const texture = (first.object as THREE.Sprite).material.map!;
    const dispose = vi.spyOn(texture, 'dispose');

    second.update({ text: 'Two' });

    expect((second.object as THREE.Sprite).material.map).not.toBe(texture);
    expect(dispose).not.toHaveBeenCalled();
  });

  it('disposes cached textures when the backend is disposed', () => {
    const instance = backend.create({ text: 'Owned', position: new THREE.Vector3(0, 0, 5) });
    const texture = (instance.object as THREE.Sprite).material.map!;
    const dispose = vi.spyOn(texture, 'dispose');

    backend.dispose();

    expect(dispose).toHaveBeenCalled();
  });

  it('replaces and disposes the texture of an uncached instance on update', () => {
    const instance = backend.create({
      text: '0:30',
      position: new THREE.Vector3(0, 0, 5),
      cache: false,
    });
    const texture = (instance.object as THREE.Sprite).material.map!;
    const dispose = vi.spyOn(texture, 'dispose');

    instance.update({ text: '0:29' });

    expect((instance.object as THREE.Sprite).material.map).not.toBe(texture);
    expect(dispose).toHaveBeenCalled();
  });

  it('disposes the texture of an uncached instance on removal', () => {
    const instance = backend.create({
      text: '0:30',
      position: new THREE.Vector3(0, 0, 5),
      cache: false,
    });
    const texture = (instance.object as THREE.Sprite).material.map!;
    const dispose = vi.spyOn(texture, 'dispose');

    instance.dispose();

    expect(dispose).toHaveBeenCalled();
  });

  it('should dispose cleanly', () => {
    backend.create({
      text: 'Test',
      position: new THREE.Vector3(0, 0, 5),
    });

    backend.dispose();
    // No errors thrown
  });
});
