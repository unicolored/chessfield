import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Three.js Inspector to avoid localStorage access in jsdom
vi.mock('three/addons/inspector/Inspector.js', () => {
  class MockInspector {}
  return { Inspector: MockInspector };
});

// Mock renderer provider to avoid WebGPU initialization in tests
vi.mock('./provider/renderer.provider.ts', () => {
  class MockRendererProvider {
    getCanvas() {
      return document.createElement('canvas');
    }
    getRenderer() {
      return {
        init: vi.fn().mockResolvedValue(undefined),
        setSize: vi.fn(),
        setAnimationLoop: vi.fn(),
        render: vi.fn(),
        domElement: document.createElement('canvas'),
      };
    }
    getRenderPipeline() {
      return {
        outputColorTransform: false,
      };
    }
  }
  return { RendererProvider: MockRendererProvider };
});

// Mock loading manager provider to avoid GLTF loading errors
vi.mock('./provider/loadingManager.provider.ts', () => {
  class MockLoadingManagerProvider {
    constructor() {
      this.font = null;
    }
    getLoadingManager() {
      return {
        onError: null,
        onLoad: null,
        onProgress: null,
      };
    }
    font = null;
  }
  return { LoadingManagerProvider: MockLoadingManagerProvider };
});

import { Chessfield } from './chessfield.ts';

describe('Chessfield API', () => {
  let container: HTMLDivElement;
  let chessfield: Chessfield;

  beforeEach(() => {
    // Create a container element for the chessfield
    container = document.createElement('div');
    container.id = 'test-board';
    container.style.width = '400px';
    container.style.height = '400px';
    document.body.appendChild(container);

    chessfield = new Chessfield(container, {
      orientation: 'white',
      camera: 'white',
      angle: 'right',
      theme: 'green',
    });
  });

  afterEach(() => {
    container.remove();
    vi.clearAllMocks();
  });

  it('should instantiate without errors', () => {
    expect(chessfield).toBeInstanceOf(Chessfield);
  });

  it('should have setFen method', () => {
    expect(typeof chessfield.setFen).toBe('function');
  });

  it('should have configUpdate method', () => {
    expect(typeof chessfield.configUpdate).toBe('function');
  });

  it('should accept FEN string in setFen', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    expect(() => chessfield.setFen(fen, ['e2', 'e4'])).not.toThrow();
  });

  it('should accept partial config in configUpdate', () => {
    expect(() => chessfield.configUpdate({ theme: 'blue' })).not.toThrow();
    expect(() => chessfield.configUpdate({ orientation: 'black' })).not.toThrow();
  });
});
