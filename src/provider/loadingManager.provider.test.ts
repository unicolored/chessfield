import type * as THREE from 'three/webgpu';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  textureLoads: [] as Array<{
    onLoad: (texture: unknown) => void;
    onError: (error: unknown) => void;
  }>,
  fontLoads: [] as Array<{
    onLoad: (font: unknown) => void;
    onError: (error: unknown) => void;
  }>,
}));

vi.mock('three/webgpu', async importOriginal => {
  const actual = await importOriginal<typeof THREE>();

  class MockTextureLoader {
    load(
      _url: string,
      onLoad: (texture: unknown) => void,
      _onProgress?: unknown,
      onError?: (error: unknown) => void,
    ): void {
      mocks.textureLoads.push({ onLoad, onError: onError ?? (() => {}) });
    }
  }

  return { ...actual, TextureLoader: MockTextureLoader };
});

vi.mock('three/examples/jsm/loaders/FontLoader.js', () => ({
  FontLoader: class {
    load(
      _url: string,
      onLoad: (font: unknown) => void,
      _onProgress?: unknown,
      onError?: (error: unknown) => void,
    ): void {
      mocks.fontLoads.push({ onLoad, onError: onError ?? (() => {}) });
    }
  },
}));

import type { GameProvider } from './game.provider.ts';
import { LoadingManagerProvider } from './loadingManager.provider.ts';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => {
    resolve = r;
  });

  return { promise, resolve };
}

function createGameProvider() {
  const glb = deferred();
  const gameProvider = {
    loadGlbGeometry: vi.fn(() => glb.promise),
    pieceMaterials: { white: null, black: null },
  } as unknown as GameProvider;

  return { gameProvider, resolveGlb: glb.resolve };
}

/** Let the promise `finally` handlers run. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('LoadingManagerProvider', () => {
  beforeEach(() => {
    mocks.textureLoads.length = 0;
    mocks.fontLoads.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the pieces and both textures, reporting monotonic progress', async () => {
    const { gameProvider, resolveGlb } = createGameProvider();
    const provider = new LoadingManagerProvider({}, gameProvider);
    const progress: Array<[number, number]> = [];

    const load = provider.load((loaded, total) => progress.push([loaded, total]));

    expect(mocks.textureLoads).toHaveLength(2);
    expect(progress).toEqual([[0, 3]]);

    mocks.textureLoads[0].onLoad({});
    await flush();
    expect(progress.at(-1)).toEqual([1, 3]);

    resolveGlb();
    mocks.textureLoads[1].onLoad({});
    await load;

    expect(progress.at(-1)).toEqual([3, 3]);
  });

  it('loads the font when coordinates are enabled and exposes it after load', async () => {
    const { gameProvider, resolveGlb } = createGameProvider();
    const provider = new LoadingManagerProvider({ coordinatesOnSquares: true }, gameProvider);
    const progress: Array<[number, number]> = [];

    const load = provider.load((loaded, total) => progress.push([loaded, total]));
    const font = { isFont: true };

    expect(mocks.fontLoads).toHaveLength(1);
    expect(progress[0]).toEqual([0, 4]);

    resolveGlb();
    mocks.textureLoads.forEach(texture => texture.onLoad({}));
    mocks.fontLoads[0].onLoad(font);
    await load;

    expect(provider.font).toBe(font);
    expect(progress.at(-1)).toEqual([4, 4]);
  });

  it('settles when an asset fails instead of blocking the board', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { gameProvider, resolveGlb } = createGameProvider();
    const provider = new LoadingManagerProvider({}, gameProvider);
    const progress: Array<[number, number]> = [];

    const load = provider.load((loaded, total) => progress.push([loaded, total]));

    mocks.textureLoads[0].onError(new Error('broken texture'));
    mocks.textureLoads[1].onLoad({});
    resolveGlb();
    await load;

    expect(error).toHaveBeenCalled();
    expect(progress.at(-1)).toEqual([3, 3]);
  });
});
