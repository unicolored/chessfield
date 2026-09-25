import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cm } from '../helper.ts';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { MOUSE, PerspectiveCamera } from 'three';

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
    controls.enablePan = false;
    controls.mouseButtons = {
      LEFT: MOUSE.PAN, // pan is disabled
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
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
