import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { pass, renderOutput } from 'three/tsl';
import type * as THREE from 'three/webgpu';

import { type Store } from '../provider/store';

export class AnimationLoop {
  private animationLoop: (() => void) | null = null;

  start(
    store: Store,
    // controls: OrbitControls,
    // renderer: THREE.WebGPURenderer,
    // renderPipeline: THREE.RenderPipeline,
    // scene: THREE.Scene,
    // camera: THREE.PerspectiveCamera,
  ): void {
    // Use the public getter instead of reaching into the store's private pipeline.
    const renderPipeline = store.getRenderPipeline();

    if (!store.controls || !renderPipeline?.renderer) {
      return;
    }

    // Scene pass
    const scenePass = pass(store.getScene(), store.camera);
    renderPipeline.outputNode = scenePass;

    // Bloom pass
    // const bloomPass = bloom(scenePass);
    // bloomPass.threshold.value = 0.95;
    // bloomPass.strength.value = 0.15;
    // store.renderPipeline.outputNode = scenePass.add(bloomPass);

    // Color transform pass
    renderPipeline.outputNode = renderOutput(renderPipeline.outputNode);

    // FXAA pass
    const fxaaPass = fxaa(renderPipeline.outputNode);
    renderPipeline.outputNode = fxaaPass;

    const tick = () => {
      // The projection switch swaps the camera instance: the pass follows the active one.
      scenePass.camera = store.camera;

      // Consume pending changes first; requestRender() marks a single dirty frame.
      const requested = store.consumeRenderRequest();

      // OrbitControls.update() reports whether damping or user input moved the camera.
      const cameraMoved = store.controls.update();

      // Idle boards render nothing: only changed frames are submitted to the GPU.
      if (!requested && !cameraMoved) {
        return;
      }

      // renderer.render(scene, camera);
      renderPipeline.render();
    };

    this.animationLoop = tick;
    renderPipeline.renderer.setAnimationLoop(tick);
  }

  stop(renderer: THREE.WebGPURenderer): void {
    renderer.setAnimationLoop(null);
    this.animationLoop = null;
  }

  getTick(): (() => void) | null {
    return this.animationLoop;
  }
}
