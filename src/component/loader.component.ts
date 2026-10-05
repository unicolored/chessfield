import * as THREE from 'three/webgpu';

import { hexToRgb } from '../helper.ts';
import { cameraViewMatrix, positionLocal, vec3 } from 'three/tsl';

export class LoaderComponent {
  overlayMaterial: THREE.MeshBasicNodeMaterial;
  progressMaterial: THREE.MeshBasicNodeMaterial;

  constructor(overlayColor: string | number, barColor: string | number) {
    // this.overlayMaterial = new THREE.ShaderMaterial({
    //   transparent: true,
    //   uniforms: {
    //     uAlpha: { value: 1 },
    //     uColor: { value: hexToRgb(overlayColor) },
    //   },
    //   vertexShader: `
    //     void main()
    //     {
    //       gl_Position = vec4(position, 1.0);
    //     }
    // `,
    //   fragmentShader: `
    //   uniform float uAlpha;
    //   uniform vec3 uColor;
    //
    //     void main()
    //     {
    //       gl_FragColor = vec4(uColor, uAlpha);
    //     }
    //   `,
    // });
    this.overlayMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 1,
    });
    const colors = hexToRgb(overlayColor);
    this.overlayMaterial.colorNode = vec3(colors[0], colors[1], colors[2]);
    this.overlayMaterial.positionNode = positionLocal.mul(cameraViewMatrix);

    // this.progressMaterial = new THREE.ShaderMaterial({
    //   transparent: true,
    //   uniforms: {
    //     uColor: { value: hexToRgb(barColor) },
    //     uPosition: { value: new THREE.Vector3(0, 0, 0) },
    //     uTime: { value: -1 },
    //     uAlpha: { value: 1 },
    //   },
    //   vertexShader: `
    //     uniform vec3 uPosition;
    //     uniform float uTime;
    //
    //     void main()
    //     {
    //         // Add the vertex position to see the actual geometry
    //         vec3 animatedPosition = position + uPosition;
    //         animatedPosition.x += uTime * 20.0 * 0.1;
    //
    //         gl_Position = vec4(animatedPosition, 1.0);
    //     }
    // `,
    //   fragmentShader: `
    //     uniform vec3 uColor;
    //     uniform float uAlpha;
    //
    //     void main()
    //     {
    //         gl_FragColor = vec4(uColor, uAlpha);
    //     }
    // `,
    // });
    this.progressMaterial = new THREE.MeshBasicNodeMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 1,
    });
    const colors2 = hexToRgb(barColor);
    this.progressMaterial.colorNode = vec3(colors2[0], colors2[1], colors2[2]);
    this.progressMaterial.positionNode = positionLocal.mul(cameraViewMatrix).mul(0.15);
  }

  getOverlay(): THREE.Mesh {
    const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);

    return new THREE.Mesh(overlayGeometry, this.overlayMaterial);
  }

  getProgressBar(): THREE.Mesh {
    const progressGeometry = new THREE.PlaneGeometry(2, 0.01, 1, 1);

    return new THREE.Mesh(progressGeometry, this.progressMaterial);
  }
}
