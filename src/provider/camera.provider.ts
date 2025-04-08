import * as cf from '../resource/chessfield.types.ts';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { cm } from '../helper.ts';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';

export class CameraProvider {
  cameraPositionsMap = new Map<cf.Camera, Vector3>();
  cameraGroupRotationMap = new Map<string, Vector3>();

  defaultCameraPosition = new Vector3(0, cm(14), cm(14));

  constructor(private readonly config: ChessfieldConfig) {
    const orientation = this.config.orientation ?? 'white';
    const viewOrientation = orientation === 'white' ? 0.01 : -0.01;
    this.cameraPositionsMap.set('top', new Vector3(0, cm(16), cm(viewOrientation)));
    this.cameraPositionsMap.set('white', this.defaultCameraPosition);

    const qcd = Math.PI / 4;
    this.cameraGroupRotationMap.set('white', new Vector3(0, 0, 0));
    this.cameraGroupRotationMap.set('white-left', new Vector3(0, -qcd - 0.05, 0));
    this.cameraGroupRotationMap.set('white-right', new Vector3(0, qcd + 0.05, 0));
    this.cameraGroupRotationMap.set('black', new Vector3(0, qcd * 4, 0));
    this.cameraGroupRotationMap.set('black-left', new Vector3(0, qcd * 3, 0));
    this.cameraGroupRotationMap.set('black-right', new Vector3(0, qcd * 5, 0));
    this.cameraGroupRotationMap.set('right', new Vector3(0, qcd * 2, 0));
    this.cameraGroupRotationMap.set('left', new Vector3(0, qcd * 6, 0));
  }

  getCamera({ width, height }: { width: number; height: number }): PerspectiveCamera {
    const camera = new PerspectiveCamera(33, width / height, cm(0.1), 3);
    camera.name = '🎥 Main Camera';

    const viewPosition =
      this.cameraPositionsMap.get(this.config.camera ?? 'white') ?? this.defaultCameraPosition;
    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);

    // camera.lookAt(0, cm(2), 0);

    return camera;
  }

  getCameraGroup(camera: PerspectiveCamera): Group {
    const camGroup = new Group();
    camGroup.add(camera);

    let angle = '';
    if (this.config.camera === 'white' || this.config.camera === 'black') {
      const configAngle = this.config.angle;
      if (configAngle === 'left' || configAngle === 'right') {
        angle = this.config.angle ? '-' + this.config.angle : '';
      }
    }

    const cameraAngle = `${this.config.camera}${angle}`;
    const viewRotation = this.cameraGroupRotationMap.get(cameraAngle) ?? new Vector3(0, cm(12), cm(12));
    camGroup.rotation.set(viewRotation.x, viewRotation.y, viewRotation.z);

    return camGroup;
  }
}
