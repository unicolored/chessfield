import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';

export class AnimationLoop {
  private animationLoop: (() => void) | null = null;
  private timer: THREE.Timer | null = null;

  start(
    controls: OrbitControls,
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ): void {
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    const tick = () => {
      if (!this.timer) return;
      this.timer.update();

      controls.update();
      renderer.render(scene, camera);
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
