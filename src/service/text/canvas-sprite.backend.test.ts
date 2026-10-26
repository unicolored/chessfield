import * as THREE from 'three/webgpu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CanvasSpriteBackend } from './canvas-sprite.backend.ts';

// The backend uses the real THREE.Sprite since we can't easily mock the module it imports from
// We'll just test the basic functionality

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

  it('should dispose cleanly', () => {
    backend.create({
      text: 'Test',
      position: new THREE.Vector3(0, 0, 5),
    });

    backend.dispose();
    // No errors thrown
  });
});
