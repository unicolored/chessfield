import type { CameraProvider } from '../provider/camera.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';
import type { Projection } from '../resource/chessfield.types.ts';

type Camera = NonNullable<ChessfieldConfig['camera']>;

const CAMERAS: Camera[] = ['white', 'right', 'black', 'left', 'top'];

export class CameraController {
  constructor(
    private cameraProvider: CameraProvider,
    private store: Store,
  ) {}

  /** Apply the camera, angle, projection and orientation already stored in the config to the live scene. */
  applyConfig(): void {
    const config = this.store.getConfig();
    const camera = config.camera ?? 'white';

    // Projection first: it may replace the camera object the transform is applied to.
    this.applyProjection(config.projection ?? 'perspective');

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

  /** Swap the rendered camera instance when the config asks for another projection. */
  private applyProjection(projection: Projection): void {
    const current = this.store.camera;
    if (!current) {
      return;
    }

    const next = this.cameraProvider.getCameraFor(projection);
    if (next === current) {
      return;
    }

    this.cameraProvider.syncProjection(next, current);

    this.store.camGroup?.remove(current);
    this.store.camGroup?.add(next);
    this.store.camera = next;

    // OrbitControls keeps its own reference to the camera object.
    if (this.store.controls) {
      this.store.controls.object = next;
    }

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

  switchProjection(projection?: Projection): void {
    const target =
      projection ?? (this.getCurrentProjection() === 'perspective' ? 'isometric' : 'perspective');

    this.store.setConfig({ ...this.store.getConfig(), projection: target });
    // Only the projection changes: keep the current orbit position and zoom.
    this.applyProjection(target);
  }

  getCurrentCamera(): Camera {
    return this.store.getConfig().camera ?? 'white';
  }

  getCurrentProjection(): Projection {
    return this.store.getConfig().projection ?? 'perspective';
  }
}
