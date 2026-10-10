import * as THREE from 'three/webgpu';

export const checkShader = {
  name: 'check',
  uniforms: {
    u_outerRadius: { value: 0.5 } as THREE.Uniform,
  },

  vertexShader: `
    attribute vec3 instanceColor;
    attribute float instanceVisible;
    varying vec3 vColor;
    varying float vVisible;
    varying vec2 vUv;
    
    void main() {
      vColor = instanceColor;
      vVisible = instanceVisible;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    varying vec3 vColor;
    varying float vVisible;
    varying vec2 vUv;
    uniform float u_outerRadius;
    
    void main() {
      if (vVisible < 0.5) discard;
      
      vec2 center = vec2(0.5);
      float dist = length(vUv - center);
      
      // Dynamic anti-aliasing delta based on screen pixel derivative
      float delta = fwidth(dist);
      
      // Radial gradient: opaque at center, transparent at edge
      float alpha = 1.0 - smoothstep(0.0, u_outerRadius + delta, dist);
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
} as const;

export type CheckShaderUniforms = typeof checkShader.uniforms;