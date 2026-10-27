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
  set = vi.fn();
}

class MockSprite {
  position: MockVector3;
  scale = { set: vi.fn(), x: 1, y: 1, z: 1 };
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

class MockObject3D {
  position = new MockVector3(0, 0, 0);
  rotation = new MockEuler();
  scale = { set: vi.fn(), x: 1, y: 1, z: 1 };
  copy = vi.fn();
  sync = vi.fn();
  dispose = vi.fn();
  font = '';
  text = '';
  fontSize = 0.4;
  color = 0xff_ff_ff;
  anchorX = 'center';
  anchorY = 'center';
  maxWidth = undefined;
  fontWeight = '400';
  outlineWidth = 0;
  outlineColor = 0x00_00_00;
}

// Mock Troika Text constructor
class MockTroikaText extends MockObject3D {}

// Apply mocks using vi.doMock to avoid hoisting issues
vi.doMock('three', () => ({
  Scene: MockScene,
  Group: MockGroup,
  Vector3: MockVector3,
  Euler: MockEuler,
  Sprite: MockSprite,
  SpriteMaterial: MockSpriteMaterial,
  CanvasTexture: MockCanvasTexture,
  Color: MockColor,
  Object3D: MockObject3D,
  Texture: vi.fn(),
  LinearFilter: 1001,
  RGBAFormat: 1022,
  FloatType: 1024,
  DynamicDrawUsage: 35_048,
  InstancedBufferGeometry: vi.fn(),
  Sphere: vi.fn(),
  Box3: vi.fn(),
  InstancedBufferAttribute: vi.fn(),
  PlaneGeometry: vi.fn(),
  Vector2: vi.fn(),
  Vector4: vi.fn(),
  Matrix3: vi.fn(),
  Mesh: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  DoubleSide: 2,
  Matrix4: vi.fn(),
  DataTexture: vi.fn(),
}));

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

vi.doMock('troika-three-text', () => ({
  Text: MockTroikaText,
}));

vi.doMock('webgl-sdf-generator', () => ({
  __esModule: true,
  default: vi.fn(() =>
    Promise.resolve({
      generate: vi.fn(),
      dispose: vi.fn(),
    }),
  ),
}));

vi.doMock('troika-worker-utils', () => ({
  defineWorkerModule: vi.fn(),
  terminateWorker: vi.fn(),
}));

vi.doMock('bidi-js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.doMock('troika-three-utils', () => ({
  createDerivedMaterial: vi.fn(),
  voidMainRegExp: /void\s+main\s*\(/,
}));

describe('TextService', () => {
  let textService: TextService;

  beforeEach(() => {
    textService = new TextService('canvas-sprite');
  });

  afterEach(() => {
    textService.dispose();
    vi.clearAllMocks();
  });

  it('should instantiate with default backend', () => {
    expect(textService.backendType).toBe('canvas-sprite');
  });

  it('should instantiate with troika-text backend', () => {
    const service = new TextService('troika-text');
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

  it('should reattach recreated text to the parent that held the old object', async () => {
    const instance = await textService.add({ text: 'White', position: new MockVector3(0, 0, 5) });
    const parent = new MockGroup();
    // The mocked Object3D does not wire parents, so emulate the scene graph link.
    instance.object.parent = parent as any;

    await textService.setBackend('troika-text');

    const recreated = textService.getAll()[0];
    expect(recreated).not.toBe(instance);
    expect(parent.remove).toHaveBeenCalledWith(instance.object);
    expect(parent.add).toHaveBeenCalledWith(recreated.object);
  });

  it('should remove text from the parent it was attached to', async () => {
    const instance = await textService.add({ text: 'White', position: new MockVector3(0, 0, 5) });
    const parent = new MockGroup();
    instance.object.parent = parent as any;

    textService.remove(instance.id);

    expect(parent.remove).toHaveBeenCalledWith(instance.object);
  });

  it('should dispose cleanly', async () => {
    await textService.add({ text: 'Test', position: new MockVector3(0, 0, 5) });
    textService.dispose();
    expect(textService.getAll().length).toBe(0);
  });
});
