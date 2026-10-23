// import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { pass, renderOutput } from 'three/tsl';
import * as THREE from 'three/webgpu';

export class AnimationLoop {
  private animationLoop: (() => void) | null = null;
  private timer: THREE.Timer | null = null;

  start(
    controls: OrbitControls,
    renderer: THREE.WebGPURenderer,
    renderPipeline: THREE.RenderPipeline,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    // Scene pass
    const scenePass = pass(scene, camera);
    renderPipeline.outputNode = scenePass;

    // Bloom pass
    // const bloomPass = bloom(scenePass);
    // bloomPass.threshold.value = 0.95;
    // bloomPass.strength.value = 0.15;
    // renderPipeline.outputNode = scenePass.add(bloomPass);

    // Color transform pass
    renderPipeline.outputNode = renderOutput(renderPipeline.outputNode);

    // FXAA pass
    const fxaaPass = fxaa(renderPipeline.outputNode);
    renderPipeline.outputNode = fxaaPass;

    const tick = () => {
      if (!this.timer) return;
      this.timer.update();

      controls.update();
      // renderer.render(scene, camera);
      renderPipeline.render();
    };

    this.animationLoop = tick;
    renderer.setAnimationLoop(tick);
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
