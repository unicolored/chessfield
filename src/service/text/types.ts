import type * as THREE from 'three/webgpu';

export type TextBackendType = 'canvas-sprite' | 'troika-text';

export interface TextOptions {
  text: string;
  position: THREE.Vector3;
  fontSize?: number;
  color?: string | number;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'center' | 'bottom';
  rotation?: THREE.Euler;
  maxWidth?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  outlineWidth?: number;
  outlineColor?: string | number;
  /** Pixel ratio for high-DPI rendering (canvas-sprite backend) */
  pixelRatio?: number;
  /**
   * Cache the rendered texture by text/style. Disable for text that changes often
   * (clocks): uncached instances own their texture and dispose it on update/removal.
   */
  cache?: boolean;
}

export interface TextInstance {
  id: string;
  object: THREE.Object3D;
  backend: TextBackendType;
  options: TextOptions;
  dispose(): void;
  update(options: Partial<TextOptions>): void;
}

export interface TextBackend {
  readonly type: TextBackendType;
  create(options: TextOptions): Promise<TextInstance> | TextInstance;
  dispose(): void;
}

export interface TextConfig {
  backend?: TextBackendType;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string | number;
  offset?: number;
  maxWidth?: number;
  outlineWidth?: number;
  outlineColor?: string | number;
  /** Pixel ratio for high-DPI rendering (canvas-sprite backend) */
  pixelRatio?: number;
}

export interface TextServiceInterface {
  readonly backendType: TextBackendType;
  setBackend(type: TextBackendType): Promise<void>;
  add(options: TextOptions, id?: string): Promise<TextInstance>;
  remove(id: string): void;
  removeAll(): void;
  update(id: string, options: Partial<TextOptions>): void;
  get(id: string): TextInstance | undefined;
  getAll(): TextInstance[];
  dispose(): void;
}
