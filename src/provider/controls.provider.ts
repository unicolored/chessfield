import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cm } from '../helper.ts';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { PerspectiveCamera } from 'three';

export class ControlsProvider {
  private readonly enabled;
  private readonly zoomMinDistance;
  private readonly zoomMaxDistance;

  constructor(private config: ChessfieldConfig) {
    this.enabled = this.config.controlsEnabled ?? true;
    this.zoomMinDistance = this.config.zoomMinDistance ?? 10;
    this.zoomMaxDistance = this.config.zoomMaxDistance ?? 25;
  }

  getControls(camera: PerspectiveCamera, canvas: HTMLCanvasElement): OrbitControls {
    const controls = new OrbitControls(camera, canvas);
    controls.enabled = this.enabled;

    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);
    controls.minDistance = cm(this.zoomMinDistance); // Set the minimum zoom distance
    controls.maxDistance = cm(this.zoomMaxDistance); // Set the maximum zoom distance

    return controls;
  }
}
