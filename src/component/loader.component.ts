import { hexToRgb } from '../helper.ts';
import { Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';

export class LoaderComponent {
  overlayMaterial: ShaderMaterial;
  progressMaterial: ShaderMaterial;

  constructor(overlayColor: string | number, barColor: string | number) {
    this.overlayMaterial = new ShaderMaterial({
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

    this.progressMaterial = new ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: hexToRgb(barColor) },
        uPosition: { value: new Vector3(0, 0, 0) },
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

  getOverlay(): Mesh {
    const overlayGeometry = new PlaneGeometry(2, 2, 1, 1);

    return new Mesh(overlayGeometry, this.overlayMaterial);
  }

  getProgressBar(): Mesh {
    const progressGeometry = new PlaneGeometry(2, 0.01, 1, 1);

    return new Mesh(progressGeometry, this.progressMaterial);
  }
}
