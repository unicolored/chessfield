// Type declarations for troika-three-text
declare module 'troika-three-text' {
  import type * as THREE from 'three';

  export class Text extends THREE.Object3D {
    text: string;
    fontSize: number;
    color: number;
    anchorX: 'left' | 'center' | 'right';
    anchorY: 'top' | 'center' | 'bottom';
    maxWidth: number | null;
    font: string;
    fontWeight: string | number;
    outlineWidth: number;
    outlineColor: number;
    sync(): void;
    dispose(): void;
  }
}