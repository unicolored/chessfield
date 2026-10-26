import * as THREE from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import type { CameraProvider } from '../provider/camera.provider.ts';
import { Store } from '../provider/store.ts';

import { CameraController } from './CameraController.ts';

function createController(config: ConstructorParameters<typeof Store>[0]) {
  const store = new Store(config);
  store.camera = new THREE.PerspectiveCamera();
  store.camGroup = new THREE.Group();

  const provider = {
    setConfig: vi.fn(),
    getCameraPosition: vi.fn(() => new THREE.Vector3(1, 2, 3)),
    getCameraGroupRotation: vi.fn(() => new THREE.Vector3(0, 0.5, 0)),
  } as unknown as CameraProvider;

  return { store, provider, controller: new CameraController(provider, store) };
}

describe('CameraController.applyConfig', () => {
  it('moves the live camera and group to the configured view', () => {
    const { store, provider, controller } = createController({ camera: 'top', angle: 'center' });
    store.requestRender = vi.fn();

    controller.applyConfig();

    expect(provider.setConfig).toHaveBeenCalledWith(store.getConfig());
    expect(provider.getCameraPosition).toHaveBeenCalledWith('top');
    expect(provider.getCameraGroupRotation).toHaveBeenCalledWith('top', 'center');
    expect(store.camera.position.toArray()).toEqual([1, 2, 3]);
    expect(store.camGroup.rotation.toArray().slice(0, 3)).toEqual([0, 0.5, 0]);
    expect(store.requestRender).toHaveBeenCalled();
  });

  it('stores the next camera before applying it', () => {
    const { store, controller } = createController({ camera: 'white' });

    controller.switchCamera();

    expect(store.getConfig().camera).toBe('right');
    // The provider receives the new camera through the shared apply path.
    expect(store.camera.position).toBeDefined();
  });
});
