import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import {
  type ChessfieldConfig,
  DEFAULT_ZOOM_MAX_DISTANCE,
  DEFAULT_ZOOM_MIN_DISTANCE,
} from '../resource/chessfield.config.ts';

import { CAMERA_FOV } from './camera.provider.ts';

export class ControlsProvider {
  private enabled = true;
  private zoomMinDistance = DEFAULT_ZOOM_MIN_DISTANCE;
  private zoomMaxDistance = DEFAULT_ZOOM_MAX_DISTANCE;

  constructor(config: ChessfieldConfig) {
    this.apply(config);
  }

  /** Update the cached values and, when it already exists, the live OrbitControls instance. */
  apply(config: ChessfieldConfig, controls?: OrbitControls): void {
    this.enabled = config.controlsEnabled ?? true;
    this.zoomMinDistance = config.zoomMinDistance ?? DEFAULT_ZOOM_MIN_DISTANCE;
    this.zoomMaxDistance = config.zoomMaxDistance ?? DEFAULT_ZOOM_MAX_DISTANCE;

    if (!controls) {
      return;
    }

    controls.enabled = this.enabled;
    controls.minDistance = cm(this.zoomMinDistance);
    controls.maxDistance = cm(this.zoomMaxDistance);
    this.applyZoomLimits(controls);
  }

  /**
   * OrbitControls zooms an orthographic camera through `camera.zoom`, not its orbit distance,
   * so the configured distance range has to be expressed as zoom factors. `zoom === 1` is the
   * frustum height set by CameraProvider.syncProjection(), matching the perspective view.
   */
  applyZoomLimits(controls: OrbitControls): void {
    const camera = controls.object;

    if (!(camera instanceof THREE.OrthographicCamera)) {
      // Perspective zoom is clamped by minDistance/maxDistance instead.
      controls.minZoom = 0;
      controls.maxZoom = Infinity;
      return;
    }

    const halfHeight = (camera.top - camera.bottom) / 2;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    // zoom = frustum half-height / (orbit distance * tan(fov / 2))
    controls.minZoom = halfHeight / (cm(this.zoomMaxDistance) * tanHalfFov);
    controls.maxZoom = halfHeight / (cm(this.zoomMinDistance) * tanHalfFov);
  }

  getControls(camera: THREE.Camera, canvas: HTMLCanvasElement): OrbitControls {
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
    this.applyZoomLimits(controls);

    return controls;
  }
}
