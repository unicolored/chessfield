import type * as THREE from 'three/webgpu';

import type { CameraProvider } from '../provider/camera.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';

type Camera = ChessfieldConfig['camera'];

export class CameraController {
  // private camera: THREE.PerspectiveCamera;
  // private camGroup: THREE.Group;

  constructor(
    private cameraProvider: CameraProvider,
    private store: Store,
    private camera: THREE.PerspectiveCamera | null,
    private camGroup: THREE.Group | null,
  ) {
    // this.camera = camera;
    // this.camGroup = camGroup;
  }

  switchCamera(camera?: Camera): void {
    const cameras: Camera[] = ['white', 'right', 'black', 'left', 'top'];
    const currentCamera = this.store.getConfig().camera ?? 'white';
    const currentIndex = cameras.indexOf(currentCamera);

    let targetCamera: Camera;
    if (camera) {
      if (!cameras.includes(camera)) {
        console.warn(`Camera "${camera}" not found. Available: ${cameras.join(', ')}`);
        return;
      }
      targetCamera = camera;
    } else {
      const nextIndex = (currentIndex + 1) % cameras.length;
      targetCamera = cameras[nextIndex];
    }

    const angle = targetCamera === 'white' || targetCamera === 'black' ? 'center' : undefined;

    this.cameraProvider.setConfig({ ...this.store.getConfig(), camera: targetCamera, angle });

    const newPosition = this.cameraProvider.getCameraPosition(targetCamera);
    this.camera.position.set(newPosition.x, newPosition.y, newPosition.z);

    const newRotation = this.cameraProvider.getCameraGroupRotation(targetCamera, angle);
    this.camGroup.rotation.set(newRotation.x, newRotation.y, newRotation.z);

    this.store.setConfig({ ...this.store.getConfig(), camera: targetCamera, angle });
  }

  getCurrentCamera(): Camera {
    return this.store.getConfig().camera ?? 'white';
  }
}
