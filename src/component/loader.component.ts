import { cameraViewMatrix, float, positionLocal, positionWorld, userData, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { hexToRgb } from '../helper.ts';

export class LoaderComponent {
  // overlayMaterial: THREE.MeshBasicNodeMaterial;
  // progressMaterial: THREE.MeshBasicNodeMaterial;

  getOverlay(overlayColor: string | number): THREE.Mesh {
    const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const overlayMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff_00_00,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false,
    });
    const colors = hexToRgb(overlayColor);
    overlayMaterial.colorNode = vec3(colors[0], colors[1], colors[2]);
    overlayMaterial.positionNode = positionLocal.mul(cameraViewMatrix);
    const opacity = userData('overlayOpacity', 'float');
    overlayMaterial.opacityNode = opacity;

    const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlay.renderOrder = 1;
    overlay.userData['overlayOpacity'] = 1.0;

    return overlay;
  }

  getProgressBar(barColor: string | number): THREE.Mesh {
    const progressGeometry = new THREE.PlaneGeometry(2, 0.01, 1, 1);
    const progressMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff_00_00,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false,
    });
    const colors2 = hexToRgb(barColor);
    progressMaterial.colorNode = vec3(colors2[0], colors2[1], colors2[2]);
    progressMaterial.positionNode = vec3(positionLocal.mul(cameraViewMatrix).mul(0.15));

    const progress = new THREE.Mesh(progressGeometry, progressMaterial);
    progress.renderOrder = 1;
    progress.userData['completion'] = 1.0;

    return progress;
  }
}
