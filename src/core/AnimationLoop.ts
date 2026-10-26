import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { pass, renderOutput } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { type Store } from '../provider/store';

export class AnimationLoop {
  private animationLoop: (() => void) | null = null;
  private timer: THREE.Timer | null = null;

  start(
    store: Store,
    // controls: OrbitControls,
    // renderer: THREE.WebGPURenderer,
    // renderPipeline: THREE.RenderPipeline,
    // scene: THREE.Scene,
    // camera: THREE.PerspectiveCamera,
  ): void {
    if (!store.controls || !store.renderPipeline.renderer) {
      return;
    }

    this.timer = new THREE.Timer();
    this.timer.connect(document);

    // Scene pass
    const scenePass = pass(store.getScene(), store.camera);
    store.renderPipeline.outputNode = scenePass;

    // Bloom pass
    // const bloomPass = bloom(scenePass);
    // bloomPass.threshold.value = 0.95;
    // bloomPass.strength.value = 0.15;
    // store.renderPipeline.outputNode = scenePass.add(bloomPass);

    // Color transform pass
    store.renderPipeline.outputNode = renderOutput(store.renderPipeline.outputNode);

    // FXAA pass
    const fxaaPass = fxaa(store.renderPipeline.outputNode);
    store.renderPipeline.outputNode = fxaaPass;

    const tick = () => {
      if (!this.timer) return;
      this.timer.update();

      store.controls.update();
      // renderer.render(scene, camera);
      store.renderPipeline.render();
    };

    this.animationLoop = tick;
    store.renderPipeline.renderer.setAnimationLoop(tick);
  }

  stop(renderer: THREE.WebGPURenderer): void {
    renderer.setAnimationLoop(null);
    this.animationLoop = null;
    if (this.timer) {
      this.timer = null;
    }
  }

  getTick(): (() => void) | null {
    return this.animationLoop;
  }
}
