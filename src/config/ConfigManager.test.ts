import * as THREE from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import type { Container } from '../core/Container.ts';
import { Store } from '../provider/store.ts';
import { ThemeProvider } from '../provider/theme.provider.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';

import { ConfigManager } from './ConfigManager.ts';
import { ThemeController } from './ThemeController.ts';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function createHarness(config: ChessfieldConfig = {}) {
  const store = {
    config,
    chessboard: undefined as unknown,
    textGroup: { name: '📝 Player Names' },
    scene: { background: null as unknown },
    moveSubject$: { value: null as { fen: string; lastMove?: string[] } | null },
    requestRender: vi.fn(),
    getConfig: () => store.config,
    getCurrentFen: () => store.moveSubject$.value?.fen ?? null,
    getTurnColor: () => {
      const override = store.config.turnColor;
      if (override) {
        return override;
      }

      const fen = store.moveSubject$.value?.fen ?? store.config.fen;
      const field = fen?.split(' ')[1];

      return field === 'b' ? 'black' : 'white';
    },
    setConfig: (next: ChessfieldConfig) => {
      store.config = next;
    },
    getScene: () => store.scene,
    getTextGroup: () => store.textGroup,
  };

  const themeProvider = new ThemeProvider(config.mode, config.theme);
  const textService = { setBackend: vi.fn(async () => {}), removeAll: vi.fn() };
  const boardService = {
    addPlayerNames: vi.fn(async () => {}),
    updateDecorColors: vi.fn(),
    setTurn: vi.fn(),
  };
  const gamePieceService = { setFen: vi.fn() };
  const clockService = {
    hasTimeLeft: vi.fn(() => false),
    setTimeLeft: vi.fn(),
    setTurn: vi.fn(),
    mount: vi.fn(async () => {}),
  };
  const cameraController = { applyConfig: vi.fn() };
  const controlsProvider = { apply: vi.fn() };

  const container = {
    getStore: () => store,
    getThemeProvider: () => themeProvider,
    getThemeController: () => themeController,
    getTextService: () => textService,
    getBoardService: () => boardService,
    getGamePieceService: () => gamePieceService,
    getClockService: () => clockService,
    getCameraController: () => cameraController,
    getControlsProvider: () => controlsProvider,
  } as unknown as Container;
  const themeController = new ThemeController(container);

  return {
    container,
    store,
    themeProvider,
    textService,
    boardService,
    gamePieceService,
    clockService,
    cameraController,
    controlsProvider,
    manager: new ConfigManager(container),
  };
}

describe('ConfigManager.configUpdate', () => {
  it('merges nested options instead of replacing them', async () => {
    const h = createHarness({ text: { fontSize: 0.7, color: '#123456' } });

    await h.manager.configUpdate({ text: { backend: 'troika-text' } });

    expect(h.store.getConfig().text).toEqual({
      fontSize: 0.7,
      color: '#123456',
      backend: 'troika-text',
    });
    expect(h.textService.setBackend).toHaveBeenCalledWith('troika-text');
  });

  it('treats an empty update as a no-op', async () => {
    const h = createHarness({ mode: 'light', theme: 'blue' });

    await h.manager.configUpdate({});

    expect(h.store.getConfig()).toEqual({ mode: 'light', theme: 'blue' });
  });

  it('applies camera and control changes in place', async () => {
    const h = createHarness({ camera: 'white' });

    await h.manager.configUpdate({ camera: 'top', controlsEnabled: false, projection: 'isometric' });

    expect(h.cameraController.applyConfig).toHaveBeenCalled();
    expect(h.controlsProvider.apply).toHaveBeenCalledWith(h.store.getConfig(), undefined);
  });

  it('uses the live FEN when only the last move changes', async () => {
    const h = createHarness();
    h.store.moveSubject$.value = { fen: initialFen };

    await h.manager.configUpdate({ lastMove: ['e2', 'e4'] });

    expect(h.gamePieceService.setFen).toHaveBeenCalledWith(initialFen, ['e2', 'e4']);
  });

  it('forwards a time left update to the clock service', async () => {
    const h = createHarness();
    h.store.moveSubject$.value = { fen: initialFen };

    await h.manager.configUpdate({ timeLeft: { white: 30, black: 6 } });

    expect(h.gamePieceService.setFen).toHaveBeenCalledWith(initialFen, undefined, {
      white: 30,
      black: 6,
    });
  });

  it('applies a new FEN without keeping the previous last move', async () => {
    const h = createHarness({ lastMove: ['d2', 'd4'] });

    await h.manager.configUpdate({ fen: initialFen });

    expect(h.gamePieceService.setFen).toHaveBeenCalledWith(initialFen, undefined);
  });

  it('rebuilds player names with the mode-contrasting color', async () => {
    const h = createHarness({
      mode: 'light',
      playerNames: { white: 'Alice', black: 'Bob' },
      text: { fontSize: 0.7 },
    });
    (h.store as any).chessboard = { setSquareColors: vi.fn(), setHighlightColor: vi.fn() };

    await h.manager.configUpdate({ mode: 'dark' });

    expect(h.textService.removeAll).toHaveBeenCalled();
    expect(h.boardService.addPlayerNames).toHaveBeenCalled();

    const [, names, textConfig] = h.boardService.addPlayerNames.mock.calls[0] as any[];
    expect(names).toEqual({ white: 'Alice', black: 'Bob' });
    expect(textConfig.fontSize).toBe(0.7);
    expect(textConfig.color).toBe(h.themeProvider.getTextColor());
    expect(h.store.scene.background).toEqual(new THREE.Color(h.themeProvider.getBackgroundColor()));
    expect(h.clockService.mount).toHaveBeenCalled();
  });

  it('rebuilds the clock labels when only a clock is configured', async () => {
    const h = createHarness({
      mode: 'light',
      timeLeft: { white: 30, black: 6 },
    });
    (h.store as any).chessboard = { setSquareColors: vi.fn(), setHighlightColor: vi.fn() };
    h.clockService.hasTimeLeft.mockReturnValue(true);

    await h.manager.configUpdate({ text: { fontSize: 0.7 } });

    expect(h.textService.removeAll).toHaveBeenCalled();
    expect(h.boardService.addPlayerNames).not.toHaveBeenCalled();
    expect(h.clockService.mount).toHaveBeenCalled();
  });

  it('rebuilds player names in dark text when switching back to light', async () => {
    const h = createHarness({
      mode: 'dark',
      playerNames: { white: 'Alice', black: 'Bob' },
    });
    (h.store as any).chessboard = { setSquareColors: vi.fn(), setHighlightColor: vi.fn() };

    await h.manager.configUpdate({ mode: 'light' });

    const [, , textConfig] = h.boardService.addPlayerNames.mock.calls[0] as any[];
    expect(textConfig.color).toBe(Store.modes['dark'].light);
  });

  it('keeps an explicit text color and merges partial player names', async () => {
    const h = createHarness({
      playerNames: { white: 'Alice', black: 'Bob' },
      text: { color: '#333333' },
    });
    (h.store as any).chessboard = { setSquareColors: vi.fn(), setHighlightColor: vi.fn() };

    await h.manager.configUpdate({ playerNames: { white: 'Carol' } });

    const [, names, textConfig] = h.boardService.addPlayerNames.mock.calls[0] as any[];
    expect(names).toEqual({ white: 'Carol', black: 'Bob' });
    expect(textConfig.color).toBe('#333333');
  });

  it('only refreshes the turn when turnColor is part of the update', async () => {
    const h = createHarness({ fen: initialFen, turnColor: 'white' });
    h.store.moveSubject$.value = { fen: initialFen };

    await h.manager.configUpdate({ camera: 'top' });

    expect(h.boardService.setTurn).not.toHaveBeenCalled();
    expect(h.clockService.setTurn).not.toHaveBeenCalled();
  });

  it('moves the turn indicator and clock when turnColor changes', async () => {
    const h = createHarness({ fen: initialFen });
    h.store.moveSubject$.value = { fen: initialFen };

    await h.manager.configUpdate({ turnColor: 'black' });

    expect(h.boardService.setTurn).toHaveBeenCalledWith('black');
    expect(h.clockService.setTurn).toHaveBeenCalledWith('black');
    expect(h.store.requestRender).toHaveBeenCalled();
  });

  it('returns to the FEN turn when the turnColor override is cleared', async () => {
    const h = createHarness({ fen: initialFen, turnColor: 'black' });
    h.store.moveSubject$.value = { fen: initialFen };

    await h.manager.configUpdate({ turnColor: undefined });

    expect(h.boardService.setTurn).toHaveBeenCalledWith('white');
    expect(h.clockService.setTurn).toHaveBeenCalledWith('white');
  });
});
