import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Three.js Inspector to avoid localStorage access in jsdom
vi.mock('three/addons/inspector/Inspector.js', () => {
  class MockInspector {}
  return { Inspector: MockInspector };
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
    // Keep the core's startup pending: jsdom cannot render the WebGPU scene.
    load(): Promise<void> {
      return new Promise<void>(() => {});
    }
    font = null;
  }
  return { LoadingManagerProvider: MockLoadingManagerProvider };
});

import { Chessfield } from './chessfield.ts';
import { Store } from './provider/store.ts';
import type { LoadingProgress } from './resource/chessfield.types.ts';

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

  it('exposes the loading API', () => {
    expect(typeof chessfield.whenReady).toBe('function');
    expect(typeof chessfield.onLoadingProgress).toBe('function');
  });

  it('reports the initial loading progress to subscribers', () => {
    const states: LoadingProgress[] = [];
    const unsubscribe = chessfield.onLoadingProgress(progress => states.push(progress));

    unsubscribe();

    expect(states).toHaveLength(1);
    expect(states[0]).toMatchObject({ progress: 0, ready: false });
  });

  it('should accept FEN string in setFen', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    expect(() => chessfield.setFen(fen, ['e2', 'e4'], { white: 30, black: 6 })).not.toThrow();
  });

  it('should accept partial config in configUpdate', () => {
    expect(() => chessfield.configUpdate({ theme: 'blue' })).not.toThrow();
    expect(() => chessfield.configUpdate({ orientation: 'black' })).not.toThrow();
  });

  it('applies theme and mode changes without recreating the scene', async () => {
    const canvas = container.querySelector('canvas');

    await chessfield.configUpdate({ mode: 'dark', theme: 'blue' });

    expect(container.querySelector('canvas')).toBe(canvas);
    expect(chessfield.getCurrentMode()).toBe('dark');
    expect(chessfield.getThemeColors().light).toBe(Store.themes['blue'].light);
  });

  it('applies camera changes to the live board', async () => {
    await chessfield.configUpdate({ camera: 'top' });

    expect(chessfield.getCurrentCamera()).toBe('top');
  });

  it('switches the camera projection', async () => {
    expect(chessfield.getCurrentProjection()).toBe('perspective');

    chessfield.switchProjection();

    expect(chessfield.getCurrentProjection()).toBe('isometric');

    await chessfield.configUpdate({ projection: 'perspective' });

    expect(chessfield.getCurrentProjection()).toBe('perspective');
  });

  it('switches the mode and rebuilds through configUpdate', () => {
    expect(chessfield.getCurrentMode()).toBe('light');

    chessfield.switchMode();
    expect(chessfield.getCurrentMode()).toBe('dark');

    chessfield.switchMode();
    expect(chessfield.getCurrentMode()).toBe('light');

    chessfield.switchMode('dark');
    expect(chessfield.getCurrentMode()).toBe('dark');
  });

  it('treats an empty update as a no-op', async () => {
    const canvas = container.querySelector('canvas');
    const mode = chessfield.getCurrentMode();

    await chessfield.configUpdate({});

    expect(container.querySelector('canvas')).toBe(canvas);
    expect(chessfield.getCurrentMode()).toBe(mode);
  });
});
