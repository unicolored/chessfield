import type * as cg from '@lichess-org/chessground/types';
import { describe, expect, it, vi } from 'vitest';

import type { Container } from '../core/Container.ts';
import { Store } from '../provider/store.ts';

import { GamePieceService } from './game-piece.service.ts';

const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' as cg.FEN;
const afterE4Fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' as cg.FEN;

function createHarness() {
  const store = new Store({});
  const clockService = { setTimeLeft: vi.fn(), setTurn: vi.fn() };
  const boardService = { setTurn: vi.fn() };

  const container = {
    getStore: () => store,
    getClockService: () => clockService,
    getBoardService: () => boardService,
  } as unknown as Container;

  return { store, clockService, boardService, service: new GamePieceService(container) };
}

describe('GamePieceService.setFen', () => {
  it('updates the clock without clearing the game state for a time-only sync', () => {
    const h = createHarness();
    h.service.setFen(startFen);

    const gameState = { status: 'check' as const, check: ['e1'] };
    h.store.gameState = gameState;
    const refresh = vi.spyOn(h.service, 'refresh');
    h.clockService.setTurn.mockClear();
    h.boardService.setTurn.mockClear();

    h.service.setFen(startFen, undefined, { white: 30, black: 6 });

    expect(h.clockService.setTimeLeft).toHaveBeenCalledWith({ white: 30, black: 6 });
    expect(h.clockService.setTurn).not.toHaveBeenCalled();
    expect(h.boardService.setTurn).not.toHaveBeenCalled();
    expect(h.store.gameState).toBe(gameState);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('updates the clock and clears the game state for a new position', () => {
    const h = createHarness();
    h.service.setFen(startFen);
    h.store.gameState = { status: 'check' as const, check: ['e1'] };

    h.service.setFen(afterE4Fen, undefined, { white: 30, black: 6 });

    expect(h.clockService.setTimeLeft).toHaveBeenCalledWith({ white: 30, black: 6 });
    expect(h.clockService.setTurn).toHaveBeenLastCalledWith('black');
    expect(h.boardService.setTurn).toHaveBeenLastCalledWith('black');
    expect(h.store.gameState).toBeNull();
    expect(h.store.getCurrentFen()).toBe(afterE4Fen);
  });

  it('keeps the previous clock when a new position is set without time left', () => {
    const h = createHarness();
    h.service.setFen(startFen, undefined, { white: 30, black: 6 });

    h.clockService.setTimeLeft.mockClear();
    h.service.setFen(afterE4Fen);

    expect(h.clockService.setTimeLeft).not.toHaveBeenCalled();
    // The turn still follows the new FEN even without a clock snapshot.
    expect(h.clockService.setTurn).toHaveBeenLastCalledWith('black');
    expect(h.boardService.setTurn).toHaveBeenLastCalledWith('black');
  });
});
