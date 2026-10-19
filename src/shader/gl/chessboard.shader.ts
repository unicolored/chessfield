import * as THREE from 'three/webgpu';

export const chessboardShader = {
  name: 'chessboard',
  uniforms: {
    u_resolution: { value: new THREE.Vector2() },
    u_squareSize: { value: 0.01 },
    u_highlightPosStart: { value: new THREE.Vector2(-1, -1) }, // Target square coordinates
    u_highlightPosEnd: { value: new THREE.Vector2(-1, -1) }, // Target square coordinates
    u_highlightPosCursor: { value: new THREE.Vector2(-1, -1) },
    u_highlightColor: { value: new THREE.Vector3(1, 1, 0) }, // Highlight color (yellow in this case)
    u_highlightStatusMateColor: { value: new THREE.Vector3(1, 1, 0) },
    u_highlightStatusMate: { value: new THREE.Vector2(-1, -1) },
    // u_squareLightColor: Store.themes['blue'].light,
    // u_squareDarkColor: Store.themes['blue'].dark,
    u_squareLightColor: { value: new THREE.Vector3(0.9, 0.9, 0.9) }, // Light gray by default
    u_squareDarkColor: { value: new THREE.Vector3(0.3, 0.3, 0.3) },
  },

  vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

  fragmentShader: `
        uniform vec2 u_resolution;
        uniform float u_squareSize;
        uniform vec2 u_highlightPosStart;
        uniform vec2 u_highlightPosEnd;
        uniform vec2 u_highlightPosCursor;
        uniform vec2 u_highlightStatusMate;
        uniform vec3 u_highlightColor;
        uniform vec3 u_highlightStatusMateColor;
        uniform vec3 u_squareLightColor;
        uniform vec3 u_squareDarkColor;
        varying vec2 vUv;
        
        void main() {
            vec2 coord = vUv * u_resolution / u_squareSize;
            vec2 gridPos = floor(coord);
            
            // Basic chessboard pattern
            float chess = mod(floor(coord.x) + floor(coord.y), 2.0);
            // vec3 baseColor = vec3(chess);
            
            // Base color based on light/dark squares
            vec3 baseColor = mix(u_squareDarkColor, u_squareLightColor, chess);
            
            // Check if current square matches highlight position
            float isHighlightedStart = step(0.0, 0.0 - length(gridPos - u_highlightPosStart));
            float isHighlightedEnd = step(0.0, 0.0 - length(gridPos - u_highlightPosEnd));
            float isHighlightedCursor = step(0.0, 0.0 - length(gridPos - u_highlightPosCursor));
            float isHighlightedStatusMate = step(0.0, 0.0 - length(gridPos - u_highlightStatusMate));
            
            // Mix base color with highlight color
            vec3 color = baseColor;
            color = mix(color, u_highlightColor, isHighlightedStart * 0.8);
            color = mix(color, u_highlightColor, isHighlightedEnd * 0.8);

            color = mix(color, u_highlightStatusMateColor, isHighlightedStatusMate * 0.8);
            color = mix(color, u_highlightColor, isHighlightedCursor * 0.8);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,
} as const;

export type ChessboardShaderUniforms = typeof chessboardShader.uniforms;
