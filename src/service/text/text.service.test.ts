import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TextService } from './text.service.ts';

// Define mock classes first
class MockScene {
  add = vi.fn();
  remove = vi.fn();
}

class MockGroup {
  add = vi.fn();
  remove = vi.fn();
  name = '';
}

class MockVector3 {
  x: number;
  y: number;
  z: number;
  copy = vi.fn();
  set = vi.fn();
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class MockEuler {
  copy = vi.fn();
}

class MockSprite {
  position: MockVector3;
  scale = { set: vi.fn() };
  rotation: MockEuler;
  material: any;
  constructor(material: any) {
    this.material = material;
    this.position = new MockVector3(0, 0, 0);
    this.rotation = new MockEuler();
  }
}

class MockSpriteMaterial {
  map: any = null;
  dispose = vi.fn();
  needsUpdate = false;
  constructor(params: any) {
    this.map = params.map;
  }
}

class MockCanvasTexture {
  dispose = vi.fn();
  needsUpdate = false;
}

class MockColor {
  getHex = () => 0xff_ff_ff;
}

// Apply mocks using vi.doMock to avoid hoisting issues
vi.doMock('three/webgpu', () => ({
  Scene: MockScene,
  Group: MockGroup,
  Vector3: MockVector3,
  Euler: MockEuler,
  Sprite: MockSprite,
  SpriteMaterial: MockSpriteMaterial,
  CanvasTexture: MockCanvasTexture,
  Color: MockColor,
}));

describe('TextService', () => {
  let scene: any;
  let textService: TextService;

  beforeEach(() => {
    scene = new MockScene();
    textService = new TextService(scene, 'canvas-sprite');
    // textService.setScene(scene);
  });

  afterEach(() => {
    textService.dispose();
    vi.clearAllMocks();
  });

  it('should instantiate with default backend', () => {
    expect(textService.backendType).toBe('canvas-sprite');
  });

  it('should instantiate with troika-text backend', () => {
    const service = new TextService(null, 'troika-text');
    expect(service.backendType).toBe('troika-text');
    service.dispose();
  });

  it('should add text and return instance', async () => {
    const instance = await textService.add({
      text: 'Test Player',
      position: new MockVector3(0, 0, 5),
    });

    expect(instance).toBeDefined();
    expect(instance.id).toContain('canvas-sprite');
    expect(instance.object).toBeDefined();
    expect(instance.options.text).toBe('Test Player');
  });

  it('should get instance by id', async () => {
    const instance = await textService.add({
      text: 'Test',
      position: new MockVector3(0, 0, 5),
    });

    const found = textService.get(instance.id);
    expect(found).toBe(instance);
  });

  it('should get all instances', async () => {
    await textService.add({ text: 'White', position: new MockVector3(0, 0, 5) });
    await textService.add({ text: 'Black', position: new MockVector3(0, 0, -5) });

    const all = textService.getAll();
    expect(all.length).toBe(2);
  });

  it('should remove instance by id', async () => {
    const instance = await textService.add({
      text: 'Test',
      position: new MockVector3(0, 0, 5),
    });

    textService.remove(instance.id);
    expect(textService.get(instance.id)).toBeUndefined();
    expect(textService.getAll().length).toBe(0);
  });

  it('should remove all instances', async () => {
    await textService.add({ text: 'White', position: new MockVector3(0, 0, 5) });
    await textService.add({ text: 'Black', position: new MockVector3(0, 0, -5) });

    textService.removeAll();
    expect(textService.getAll().length).toBe(0);
  });

  it('should update instance options', async () => {
    const instance = await textService.add({
      text: 'Original',
      position: new MockVector3(0, 0, 5),
      fontSize: 0.4,
    });

    textService.update(instance.id, { text: 'Updated', fontSize: 0.5 });
    expect(instance.options.text).toBe('Updated');
    expect(instance.options.fontSize).toBe(0.5);
  });

  it('should switch backend and preserve instances', async () => {
    await textService.add({ text: 'White', position: new MockVector3(0, 0, 5) });
    await textService.add({ text: 'Black', position: new MockVector3(0, 0, -5) });

    await textService.setBackend('troika-text');
    expect(textService.backendType).toBe('troika-text');
    expect(textService.getAll().length).toBe(2);
  });

  it('should dispose cleanly', async () => {
    await textService.add({ text: 'Test', position: new MockVector3(0, 0, 5) });
    textService.dispose();
    expect(textService.getAll().length).toBe(0);
  });
});
