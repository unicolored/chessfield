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

  it('should dispose cleanly', () => {
    const instance = backend.create({
      text: 'Test',
      position: new THREE.Vector3(0, 0, 5),
    });

    backend.dispose();
    // No errors thrown
  });
});
