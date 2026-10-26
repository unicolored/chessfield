import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import { type ChessfieldConfig } from '../resource/chessfield.config.ts';

export class ControlsProvider {
  private enabled = true;
  private zoomMinDistance = 10;
  private zoomMaxDistance = 25;

  constructor(config: ChessfieldConfig) {
    this.apply(config);
  }

  /** Update the cached values and, when it already exists, the live OrbitControls instance. */
  apply(config: ChessfieldConfig, controls?: OrbitControls): void {
    this.enabled = config.controlsEnabled ?? true;
    this.zoomMinDistance = config.zoomMinDistance ?? 10;
    this.zoomMaxDistance = config.zoomMaxDistance ?? 25;

    if (!controls) {
      return;
    }

    controls.enabled = this.enabled;
    controls.minDistance = cm(this.zoomMinDistance);
    controls.maxDistance = cm(this.zoomMaxDistance);
  }

  getControls(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement): OrbitControls {
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN, // pan is disabled
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: null, // THREE.MOUSE.DOLLY,
    };
    controls.enabled = this.enabled;

    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);
    controls.minDistance = cm(this.zoomMinDistance); // Set the minimum zoom distance
    controls.maxDistance = cm(this.zoomMaxDistance); // Set the maximum zoom distance

    return controls;
  }
}
