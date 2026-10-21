import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Three.js and dependencies (similar to chessfield.test.ts)
vi.mock('three/addons/inspector/Inspector.js', () => {
  return { Inspector: class MockInspector {} };
});

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
  }
  return { RendererProvider: MockRendererProvider };
});

// Store the onLoad callback so tests can trigger it manually
let storedOnLoadCallback: Function | null = null;

vi.mock('./provider/loadingManager.provider.ts', () => {
  class MockLoadingManagerProvider {
    constructor() {
      this.font = null;
    }
    getLoadingManager() {
      const loadingManager = {
        onError: null,
        _onLoad: null as Function | null,
        onProgress: null,
      };

      // Use defineProperty to intercept assignment to onLoad
      Object.defineProperty(loadingManager, 'onLoad', {
        get() {
          return loadingManager._onLoad;
        },
        set(callback: Function) {
          loadingManager._onLoad = callback;
          storedOnLoadCallback = callback;
        },
        configurable: true,
      });

      return loadingManager;
    }
    font = null;
  }
  return { LoadingManagerProvider: MockLoadingManagerProvider };
});

import { Chessfield } from './chessfield.ts';

describe('Player Names Feature', () => {
  let container: HTMLDivElement;
  let chessfield: Chessfield;

  beforeEach(async () => {
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
      playerNames: { white: 'Alice', black: 'Bob' },
      text: { backend: 'canvas-sprite', fontSize: 0.004, offset: 0.055 },
    });

    // Wait a bit for constructor to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Manually trigger onLoad after chessfield is initialized
    if (storedOnLoadCallback) {
      await storedOnLoadCallback();
    }
  });

  afterEach(() => {
    container.remove();
    storedOnLoadCallback = null;
    vi.clearAllMocks();
  });

  it('should display player names with custom config', () => {
    expect(chessfield).toBeInstanceOf(Chessfield);
    expect(chessfield.textService).toBeDefined();
    expect(chessfield.textService.backendType).toBe('canvas-sprite');
  });

  it('should switch backend via configUpdate', async () => {
    await chessfield.configUpdate({
      text: { backend: 'troika-text' },
    });
    expect(chessfield.textService.backendType).toBe('troika-text');
  });

  it('should update player names via configUpdate', async () => {
    await chessfield.configUpdate({
      playerNames: { white: 'Carol', black: 'Dave' },
    });
    const instances = chessfield.textService.getAll();
    const names = instances.map(i => i.options.text).sort();
    expect(names).toEqual(['Carol', 'Dave']);
  });
});
