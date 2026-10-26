import type { CameraProvider } from '../provider/camera.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';

type Camera = NonNullable<ChessfieldConfig['camera']>;

const CAMERAS: Camera[] = ['white', 'right', 'black', 'left', 'top'];

export class CameraController {
  constructor(
    private cameraProvider: CameraProvider,
    private store: Store,
  ) {}

  /** Apply the camera, angle and orientation already stored in the config to the live scene. */
  applyConfig(): void {
    const config = this.store.getConfig();
    const camera = config.camera ?? 'white';

    if (!CAMERAS.includes(camera)) {
      console.warn(`Camera "${camera}" not found. Available: ${CAMERAS.join(', ')}`);
      return;
    }

    // Rebuild the provider maps first: positions depend on the orientation.
    this.cameraProvider.setConfig(config);

    const newPosition = this.cameraProvider.getCameraPosition(camera);
    this.store.camera?.position.set(newPosition.x, newPosition.y, newPosition.z);

    const newRotation = this.cameraProvider.getCameraGroupRotation(camera, config.angle);
    this.store.camGroup?.rotation.set(newRotation.x, newRotation.y, newRotation.z);

    // The camera transform changed outside the animation loop: draw the next frame.
    this.store.requestRender();
  }

  switchCamera(camera?: Camera): void {
    const currentCamera = this.getCurrentCamera();
    const currentIndex = CAMERAS.indexOf(currentCamera);

    let targetCamera: Camera;
    if (camera) {
      if (!CAMERAS.includes(camera)) {
        console.warn(`Camera "${camera}" not found. Available: ${CAMERAS.join(', ')}`);
        return;
      }
      targetCamera = camera;
    } else {
      const nextIndex = (currentIndex + 1) % CAMERAS.length;
      targetCamera = CAMERAS[nextIndex];
    }

    const angle = targetCamera === 'white' || targetCamera === 'black' ? 'center' : undefined;

    this.store.setConfig({ ...this.store.getConfig(), camera: targetCamera, angle });
    this.applyConfig();
  }

  getCurrentCamera(): Camera {
    return this.store.getConfig().camera ?? 'white';
  }
}
