import * as THREE from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import { CameraProvider } from '../provider/camera.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';

import { CameraController } from './CameraController.ts';

const sizes = { width: 1200, height: 700 };

function createHarness(config: ChessfieldConfig = {}) {
  const provider = new CameraProvider(config);
  const perspective = provider.getCamera(sizes);
  const isometric = provider.getIsometricCamera(sizes);
  provider.syncProjection(isometric, perspective);

  const store = {
    config,
    camera: perspective as THREE.PerspectiveCamera | THREE.OrthographicCamera,
    camGroup: new THREE.Group(),
    controls: undefined as { object: THREE.Camera } | undefined,
    requestRender: vi.fn(),
    getConfig: () => store.config,
    setConfig: (next: ChessfieldConfig) => {
      store.config = next;
    },
  };

  store.camGroup.add(store.camera);

  return {
    provider,
    store,
    perspective,
    isometric,
    controller: new CameraController(provider, store as unknown as Store),
  };
}

describe('CameraController.switchProjection', () => {
  it('renders the isometric camera and keeps the orbit transform', () => {
    const h = createHarness();
    h.store.camera.position.set(0, 0.1, 0.2);
    h.store.controls = { object: h.store.camera };

    h.controller.switchProjection();

    expect(h.store.camera).toBe(h.isometric);
    expect(h.store.getConfig().projection).toBe('isometric');
    expect(h.store.controls.object).toBe(h.isometric);
    expect(h.store.camGroup.children).toEqual([h.isometric]);
    expect(h.store.camera.position.equals(new THREE.Vector3(0, 0.1, 0.2))).toBe(true);
    expect(h.store.requestRender).toHaveBeenCalled();
  });

  it('matches the apparent size so switching does not zoom the board', () => {
    const h = createHarness();
    h.store.camera.position.set(0, 0.1, 0.2);

    h.controller.switchProjection();

    const iso = h.store.camera as THREE.OrthographicCamera;
    const expectedHalfHeight =
      h.store.camera.position.length() * Math.tan(THREE.MathUtils.degToRad(h.perspective.fov / 2));

    expect((iso.top - iso.bottom) / 2).toBeCloseTo(expectedHalfHeight);
    expect(iso.zoom).toBe(1);
  });

  it('toggles back to the perspective camera at the equivalent distance', () => {
    const h = createHarness();
    h.controller.switchProjection();

    h.controller.switchProjection();

    expect(h.store.camera).toBe(h.perspective);
    expect(h.store.getConfig().projection).toBe('perspective');
    // The perspective distance reproduces the isometric apparent height.
    expect(h.perspective.position.length()).toBeCloseTo(0.14 * Math.SQRT2);
  });

  it('moves the active camera when the camera position changes', () => {
    const h = createHarness();
    h.controller.switchProjection('isometric');

    h.controller.switchCamera('top');

    expect(h.store.camera).toBe(h.isometric);
    expect(h.isometric.position.y).toBeCloseTo(0.16);
    expect(h.controller.getCurrentCamera()).toBe('top');
  });
});
