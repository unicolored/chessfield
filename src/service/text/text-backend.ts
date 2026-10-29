import type * as THREE from 'three/webgpu';

import { type TextBackend, type TextBackendType, type TextInstance, type TextOptions } from './types.ts';

export abstract class BaseTextBackend implements TextBackend {
  abstract readonly type: TextBackendType;
  protected instances: Map<string, TextInstance> = new Map();
  protected idCounter = 0;

  protected generateId(): string {
    return `text_${this.type}_${++this.idCounter}_${Date.now()}`;
  }

  abstract create(options: TextOptions): Promise<TextInstance> | TextInstance;

  protected createTextInstance(
    object: THREE.Object3D,
    options: TextOptions,
    backend: TextBackendType,
  ): TextInstance {
    const id = this.generateId();
    const instance: TextInstance = {
      id,
      object,
      backend,
      options: { ...options },
      dispose: () => {
        this.disposeInstance(instance);
        // Drop the backend's own reference; the caller (TextService) drops its entry too.
        this.instances.delete(id);
      },
      update: (newOptions: Partial<TextOptions>) => {
        this.updateInstance(instance, newOptions);
      },
    };
    this.instances.set(id, instance);
    return instance;
  }

  protected abstract disposeInstance(instance: TextInstance): void;
  protected abstract updateInstance(instance: TextInstance, options: Partial<TextOptions>): void;

  dispose(): void {
    for (const instance of this.instances.values()) {
      this.disposeInstance(instance);
    }
    this.instances.clear();
  }
}
