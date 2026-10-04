import * as THREE from 'three/webgpu';

export const ringShader = {
  name: 'ring',
  uniforms: {
    u_ringWidth: { value: 0.06 } as THREE.Uniform,
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
    uniform float u_ringWidth;
    uniform float u_outerRadius;
    
    void main() {
      if (vVisible < 0.5) discard;
      
      vec2 center = vec2(0.5);
      float dist = length(vUv - center);
      float innerRadius = u_outerRadius - u_ringWidth;
      
      // Dynamic anti-aliasing delta based on screen pixel derivative
      float delta = fwidth(dist);
      
      // Inner edge transitions from 0 to 1 as dist increases
      float innerEdge = smoothstep(innerRadius - delta, innerRadius + delta, dist);
      // Outer edge transitions from 1 to 0 as dist increases past radius
      float outerEdge = 1.0 - smoothstep(u_outerRadius - delta, u_outerRadius + delta, dist);
      
      float mask = innerEdge * outerEdge;
      
      if (mask < 0.01) discard;
      
      gl_FragColor = vec4(vColor, mask);
    }
  `,
} as const;

export type RingShaderUniforms = typeof ringShader.uniforms;
