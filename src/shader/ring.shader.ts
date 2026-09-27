import { type Uniform } from 'three';

export const ringShader = {
  name: 'ring',
  uniforms: {
    u_ringWidth: { value: 0.05 } as Uniform,
    u_outerRadius: { value: 0.35 } as Uniform,
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
    uniform float u_ringWidth;
    uniform float u_outerRadius;
    
    void main() {
      if (vVisible < 0.5) discard;
      
      vec2 center = vec2(0.5);
      float dist = length(vUv - center);
      float inner = u_outerRadius - u_ringWidth;
      
      float outerEdge = smoothstep(u_outerRadius - 0.01, u_outerRadius + 0.01, dist);
      float innerEdge = smoothstep(inner - 0.01, inner + 0.01, dist);
      float mask = outerEdge - innerEdge;
      
      if (mask < 0.01) discard;
      
      gl_FragColor = vec4(vColor, mask);
    }
  `,
} as const;

export type RingShaderUniforms = typeof ringShader.uniforms;
