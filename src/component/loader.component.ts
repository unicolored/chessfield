import * as THREE from 'three';
import { hexToRgb } from '../helper.ts';
import { ShaderMaterial } from 'three';

export class LoaderComponent {
  overlayMaterial: ShaderMaterial;
  progressMaterial: ShaderMaterial;

  constructor(overlayColor: string | number, barColor: string | number) {
    this.overlayMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uAlpha: { value: 1 },
        uColor: { value: hexToRgb(overlayColor) },
      },
      vertexShader: `
        void main()
        {
          gl_Position = vec4(position, 1.0);
        }
    `,
      fragmentShader: `
      uniform float uAlpha;
      uniform vec3 uColor;
      
        void main()
        {
          gl_FragColor = vec4(uColor, uAlpha);
        }
      `,
    });

    this.progressMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: hexToRgb(barColor) },
        uPosition: { value: new THREE.Vector3(0, 0, 0) },
        uTime: { value: -1 },
        uAlpha: { value: 1 },
      },
      vertexShader: `
        uniform vec3 uPosition;
        uniform float uTime;
        
        void main()
        {
            // Add the vertex position to see the actual geometry
            vec3 animatedPosition = position + uPosition;
            animatedPosition.x += uTime * 20.0 * 0.1; 
            
            gl_Position = vec4(animatedPosition, 1.0);
        }
    `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        
        void main()
        {
            gl_FragColor = vec4(uColor, uAlpha);
        }
    `,
    });
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
