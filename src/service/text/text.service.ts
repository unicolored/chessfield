import { CanvasSpriteBackend } from './canvas-sprite.backend.ts';
import { TroikaTextBackend } from './troika-text.backend.ts';
import {
  type TextBackendType,
  type TextInstance,
  type TextOptions,
  type TextServiceInterface,
} from './types.ts';

export class TextService implements TextServiceInterface {
  private backend: CanvasSpriteBackend | TroikaTextBackend;
  private instances: Map<string, TextInstance> = new Map();
  private _backendType: TextBackendType;

  public get backendType(): TextBackendType {
    return this._backendType;
  }

  constructor(
    backendType: TextBackendType = 'canvas-sprite',
    // Notified whenever rendered text changes, so on-demand rendering can draw a frame.
    private readonly onChange: () => void = () => {},
  ) {
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

  async setBackend(type: TextBackendType): Promise<void> {
    if (type === this._backendType) return;

    // Keep the scene graph links: add() leaves the objects detached, so the caller's group
    // must be captured before the old instances are disposed and reattached afterwards.
    const currentInstances = Array.from(this.instances.values()).map(inst => ({
      id: inst.id,
      options: { ...inst.options },
      parent: inst.object.parent,
    }));

    for (const instance of this.instances.values()) {
      instance.object.parent?.remove(instance.object);
    }

    this.backend.dispose();
    this.instances.clear();

    this._backendType = type;
    this.backend = this.createBackend(type);

    for (const { id, options, parent } of currentInstances) {
      const instance = await this.add(options);
      this.instances.delete(instance.id);
      instance.id = id;
      this.instances.set(id, instance);
      parent?.add(instance.object);
    }
  }

  async add(options: TextOptions, id?: string): Promise<TextInstance> {
    const instance = await (this.backend as any).create(options);

    // A caller-provided id stays stable across backend switches, so owners can update by id.
    if (id !== undefined && id !== instance.id) {
      this.instances.delete(instance.id);
      instance.id = id;
    }

    // Troika builds its glyph atlas asynchronously; repaint when it signals completion.
    instance.object.addEventListener?.('synccomplete', () => this.onChange());
    this.instances.set(instance.id, instance);
    // Text changed: ask the idle animation loop for a frame.
    this.onChange();
    return instance;
  }

  remove(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      // Remove from the group the caller attached it to, not from an internal one.
      instance.object.parent?.remove(instance.object);
      instance.dispose();
      this.instances.delete(id);
      // Removing text changes the scene: request a frame.
      this.onChange();
    }
  }

  removeAll(): void {
    for (const instance of this.instances.values()) {
      instance.object.parent?.remove(instance.object);
      instance.dispose();
    }
    this.instances.clear();
    // Removing text changes the scene: request a frame.
    this.onChange();
  }

  update(id: string, options: Partial<TextOptions>): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.update(options);
      // Updated text changes the scene: request a frame.
      this.onChange();
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
  }
}

export type { TextOptions, TextInstance, TextBackendType, TextConfig } from './types.ts';
