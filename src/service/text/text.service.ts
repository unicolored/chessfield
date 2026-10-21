import * as THREE from 'three/webgpu';

import { CanvasSpriteBackend } from './canvas-sprite.backend.ts';
import { TroikaTextBackend } from './troika-text.backend.ts';
import {
  type TextService as ITextService,
  type TextBackendType,
  type TextInstance,
  type TextOptions,
} from './types.ts';

export class TextService implements ITextService {
  private scene: THREE.Scene | null = null;
  private textGroup: THREE.Group | null = null;
  private backend: CanvasSpriteBackend | TroikaTextBackend;
  private instances: Map<string, TextInstance> = new Map();
  private _backendType: TextBackendType;

  public get backendType(): TextBackendType {
    return this._backendType;
  }

  constructor(backendType: TextBackendType = 'canvas-sprite') {
    this._backendType = backendType;
    this.backend = this.createBackend(backendType);
  }

  private createBackend(type: TextBackendType): CanvasSpriteBackend | TroikaTextBackend {
    switch (type) {
      case 'troika-text':
        return new TroikaTextBackend();
      case 'canvas-sprite':
      default:
        return new CanvasSpriteBackend();
    }
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.textGroup = new THREE.Group();
    this.textGroup.name = '📝 Player Names';
    scene.add(this.textGroup);
  }

  async setBackend(type: TextBackendType): Promise<void> {
    if (type === this._backendType) return;

    const currentInstances = Array.from(this.instances.values()).map(inst => ({
      id: inst.id,
      options: { ...inst.options },
    }));

    this.backend.dispose();
    this.instances.clear();

    this._backendType = type;
    this.backend = this.createBackend(type);

    for (const { id, options } of currentInstances) {
      const instance = await this.add(options);
      this.instances.delete(instance.id);
      instance.id = id;
      this.instances.set(id, instance);
    }
  }

  async add(options: TextOptions): Promise<TextInstance> {
    if (!this.textGroup) {
      throw new Error('TextService: scene not set. Call setScene() first.');
    }

    const instance = await (this.backend as any).create(options);
    this.textGroup.add(instance.object);
    this.instances.set(instance.id, instance);
    return instance;
  }

  remove(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      this.textGroup?.remove(instance.object);
      instance.dispose();
      this.instances.delete(id);
    }
  }

  removeAll(): void {
    for (const instance of this.instances.values()) {
      this.textGroup?.remove(instance.object);
      instance.dispose();
    }
    this.instances.clear();
  }

  update(id: string, options: Partial<TextOptions>): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.update(options);
    }
  }

  get(id: string): TextInstance | undefined {
    return this.instances.get(id);
  }

  getAll(): TextInstance[] {
    return Array.from(this.instances.values());
  }

  dispose(): void {
    this.removeAll();
    this.backend.dispose();
    if (this.textGroup && this.scene) {
      this.scene.remove(this.textGroup);
    }
    this.textGroup = null;
    this.scene = null;
  }
}

export type { TextOptions, TextInstance, TextBackendType, TextConfig } from './types.ts';
