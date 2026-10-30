import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import type { Store } from '../provider/store.ts';

import { AnimationLoop } from './AnimationLoop.ts';

function createHarness() {
  const canvas = document.createElement('canvas');
  const camera = new THREE.PerspectiveCamera(33, 1.7, 0.001, 3);
  camera.position.set(0, 0.14, 0.14);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 0.25;
  controls.update();

  const render = vi.fn();
  const renderer = { setAnimationLoop: vi.fn<(callback: (() => void) | null) => void>() };

  // Mirrors the store's single dirty-frame flag.
  let dirty = true;
  const requestRender = vi.fn(() => {
    dirty = true;
  });
  const consumeRenderRequest = vi.fn(() => {
    const requested = dirty;
    dirty = false;

    return requested;
  });

  const store = {
    camera,
    controls,
    getScene: () => new THREE.Scene(),
    getRenderPipeline: () => ({ outputNode: null, render, renderer }),
    requestRender,
    consumeRenderRequest,
  };

  return {
    canvas,
    controls,
    loop: new AnimationLoop(),
    render,
    renderer,
    requestRender,
    store: store as unknown as Store,
  };
}

describe('AnimationLoop', () => {
  it('renders a frame after OrbitControls applies a wheel zoom outside the tick', () => {
    const h = createHarness();
    h.loop.start(h.store);
    const tick = h.loop.getTick();

    // Draw the initial dirty frame.
    tick?.();
    expect(h.render).toHaveBeenCalledTimes(1);

    // OrbitControls moves the camera and consumes its own update within its wheel handler.
    const before = h.store.camera.position.length();
    h.canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));

    expect(h.store.camera.position.length()).toBeLessThan(before);
    // The movement is already applied: update() alone would leave this frame undrawn.
    expect(h.store.controls.update()).toBe(false);

    tick?.();
    expect(h.render).toHaveBeenCalledTimes(2);
  });

  it('stops listening to control changes when stopped', () => {
    const h = createHarness();
    h.loop.start(h.store);
    h.loop.getTick()?.();
    expect(h.render).toHaveBeenCalledTimes(1);

    h.loop.stop(h.renderer as unknown as THREE.WebGPURenderer);
    h.canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));

    expect(h.renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(h.requestRender).not.toHaveBeenCalled();
  });
});
