import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import { type ChessfieldConfig, DEFAULT_ZOOM_MAX_DISTANCE } from '../resource/chessfield.config.ts';
import type * as cf from '../resource/chessfield.types.ts';

/** Vertical field of view shared by the perspective camera and the orthographic zoom mapping. */
export const CAMERA_FOV = 33;

export class CameraProvider {
  cameraPositionsMap = new Map<cf.Camera, THREE.Vector3>();
  cameraGroupRotationMap = new Map<string, THREE.Vector3>();

  /** The board opens fully zoomed out, looking at it along this direction. */
  private readonly defaultViewDirection = new THREE.Vector3(0, 1, 1).normalize();

  defaultCameraPosition = new THREE.Vector3();

  private readonly fov = CAMERA_FOV;
  private readonly near = cm(0.1);
  private readonly far = 3;

  private perspectiveCamera: THREE.PerspectiveCamera | null = null;
  private isometricCamera: THREE.OrthographicCamera | null = null;
  private sizes = { width: 1, height: 1 };

  constructor(private config: ChessfieldConfig) {
    this.initMaps();
  }

  private initMaps(): void {
    const orientation = this.config.orientation ?? 'white';
    const viewOrientation = orientation === 'white' ? 0.01 : -0.01;
    const maxDistance = cm(this.config.zoomMaxDistance ?? DEFAULT_ZOOM_MAX_DISTANCE);

    // The default camera distance is the maximum zoom distance: the board starts fully zoomed out.
    this.defaultCameraPosition.copy(this.defaultViewDirection).multiplyScalar(maxDistance);

    this.cameraPositionsMap.set('top', new THREE.Vector3(0, cm(16), cm(viewOrientation)));
    this.cameraPositionsMap.set('white', this.defaultCameraPosition);

    const qcd = Math.PI / 4;
    this.cameraGroupRotationMap.set('white', new THREE.Vector3(0, 0, 0));
    this.cameraGroupRotationMap.set('white-left', new THREE.Vector3(0, -qcd - 0.05, 0));
    this.cameraGroupRotationMap.set('white-right', new THREE.Vector3(0, qcd + 0.05, 0));
    this.cameraGroupRotationMap.set('black', new THREE.Vector3(0, qcd * 4, 0));
    this.cameraGroupRotationMap.set('black-left', new THREE.Vector3(0, qcd * 3, 0));
    this.cameraGroupRotationMap.set('black-right', new THREE.Vector3(0, qcd * 5, 0));
    this.cameraGroupRotationMap.set('right', new THREE.Vector3(0, qcd * 2, 0));
    this.cameraGroupRotationMap.set('left', new THREE.Vector3(0, qcd * 6, 0));
  }

  setConfig(config: ChessfieldConfig): void {
    this.config = config;
    this.initMaps();
  }

  getCamera({ width, height }: { width: number; height: number }): THREE.PerspectiveCamera {
    this.sizes = { width, height };

    const camera = new THREE.PerspectiveCamera(this.fov, width / height, this.near, this.far);
    camera.name = '🎥 Main Camera';

    const viewPosition =
      this.cameraPositionsMap.get(this.config.camera ?? 'white') ?? this.defaultCameraPosition;
    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);

    // camera.lookAt(0, cm(2), 0);

    this.perspectiveCamera = camera;

    return camera;
  }

  getIsometricCamera({ width, height }: { width: number; height: number }): THREE.OrthographicCamera {
    this.sizes = { width, height };

    // Frustum starts from the default view distance: switchProjection() re-syncs it anyway.
    const halfHeight = this.defaultCameraPosition.length() * Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
    const halfWidth = halfHeight * (width / height);

    const camera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      this.near,
      this.far,
    );
    camera.name = '🎥 Isometric Camera';

    const viewPosition =
      this.cameraPositionsMap.get(this.config.camera ?? 'white') ?? this.defaultCameraPosition;
    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);

    this.isometricCamera = camera;

    return camera;
  }

  /** The camera instance for a projection, creating the isometric one on first use. */
  getCameraFor(projection: cf.Projection): cf.ProjectionCamera {
    if (projection === 'isometric') {
      return this.isometricCamera ?? this.getIsometricCamera(this.sizes);
    }

    return this.perspectiveCamera ?? this.getCamera(this.sizes);
  }

  /**
   * Give `camera` the apparent size of `source` at the orbit target (origin), so switching
   * projection does not zoom the board. Both cameras share the same local position/orientation.
   */
  syncProjection(camera: cf.ProjectionCamera, source: cf.ProjectionCamera): void {
    if (camera instanceof THREE.OrthographicCamera && source instanceof THREE.PerspectiveCamera) {
      const halfHeight = source.position.length() * Math.tan(THREE.MathUtils.degToRad(source.fov / 2));

      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.left = -halfHeight * source.aspect;
      camera.right = halfHeight * source.aspect;
      camera.zoom = 1;
      camera.position.copy(source.position);
    } else if (camera instanceof THREE.PerspectiveCamera && source instanceof THREE.OrthographicCamera) {
      // Distance reproducing the orthographic apparent height, so zooming does not jump.
      const halfHeight = (source.top - source.bottom) / 2 / source.zoom;
      const distance = halfHeight / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

      // The perspective aspect may be stale if the container was resized meanwhile.
      camera.aspect = (source.right - source.left) / (source.top - source.bottom);
      camera.position.copy(source.position).setLength(distance);
    }

    // Orientation is driven by OrbitControls, but a swap should never leave a half-set camera.
    camera.quaternion.copy(source.quaternion);
    camera.updateProjectionMatrix();
  }

  /** Keep the active camera's frustum matching the container aspect ratio. */
  resize(camera: cf.ProjectionCamera, { width, height }: { width: number; height: number }): void {
    this.sizes = { width, height };

    const aspect = width / height;

    if (camera instanceof THREE.OrthographicCamera) {
      const halfHeight = (camera.top - camera.bottom) / 2;

      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
    } else {
      camera.aspect = aspect;
    }

    camera.updateProjectionMatrix();
  }

  getCameraPosition(camera: cf.Camera): THREE.Vector3 {
    return this.cameraPositionsMap.get(camera) ?? this.defaultCameraPosition;
  }

  getCameraGroupRotation(camera: cf.Camera, angle?: cf.Angle): THREE.Vector3 {
    let angleSuffix = '';
    if ((camera === 'white' || camera === 'black') && angle && (angle === 'left' || angle === 'right')) {
      angleSuffix = '-' + angle;
    }
    const cameraAngle = `${camera}${angleSuffix}`;
    return this.cameraGroupRotationMap.get(cameraAngle) ?? new THREE.Vector3(0, cm(12), cm(12));
  }

  getCameraGroup(camera: cf.ProjectionCamera): THREE.Group {
    const camGroup = new THREE.Group();
    camGroup.add(camera);

    const viewRotation = this.getCameraGroupRotation(this.config.camera ?? 'white', this.config.angle);
    camGroup.rotation.set(viewRotation.x, viewRotation.y, viewRotation.z);

    return camGroup;
  }
}
