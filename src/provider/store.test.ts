import { describe, expect, it } from 'vitest';

import { Store } from './store.ts';

const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const afterE4Fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const afterE5Fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';

describe('Store.setFen', () => {
  it('keeps only the latest move', () => {
    const store = new Store();
    const seen: (string | null)[] = [];
    store.moveSubject$.subscribe(move => seen.push(move?.fen ?? null));

    store.setFen(startFen, ['e2', 'e4']);
    store.setFen(afterE4Fen, ['e2', 'e4']);
    store.setFen(afterE5Fen, ['e7', 'e5']);

    const current = store.moveSubject$.value;
    expect(current?.fen).toBe(afterE5Fen);
    expect(current?.lastMove).toEqual(['e7', 'e5']);
    // The observer replays the initial null, then one notification per new FEN.
    expect(seen).toEqual([null, startFen, afterE4Fen, afterE5Fen]);
  });

  it('does not store a move history', () => {
    const store = new Store();
    store.setFen(startFen);
    store.setFen(afterE4Fen);

    // A previous implementation kept a growing `moves` array; it must not come back.
    expect('moves' in store).toBe(false);
  });

  it('ignores a repeated FEN without notifying subscribers', () => {
    const store = new Store();
    let notifications = 0;
    store.moveSubject$.subscribe(() => notifications++);

    expect(store.setFen(startFen)).toBe(true);
    expect(store.setFen(startFen)).toBe(false);

    expect(notifications).toBe(2); // initial replay + first setFen
    expect(store.moveSubject$.value?.fen).toBe(startFen);
  });

  it('rejects an invalid FEN', () => {
    const store = new Store();
    store.setFen(startFen);

    expect(store.setFen('not a fen')).toBe(false);
    expect(store.moveSubject$.value?.fen).toBe(startFen);
  });

  it('updates only the last move without changing the position', () => {
    const store = new Store();
    store.setFen(startFen, ['e2', 'e4']);
    const seen: (string | null)[] = [];
    store.moveSubject$.subscribe(move => seen.push(move?.fen ?? null));

    store.setLastMove(['d2', 'd4']);

    expect(store.moveSubject$.value?.fen).toBe(startFen);
    expect(store.moveSubject$.value?.lastMove).toEqual(['d2', 'd4']);
    // The observer replays the current position, then receives the highlight update.
    expect(seen).toEqual([startFen, startFen]);
  });
});

describe('Store render requests', () => {
  it('starts dirty and consumes one frame per request', () => {
    const store = new Store();

    expect(store.consumeRenderRequest()).toBe(true);
    expect(store.consumeRenderRequest()).toBe(false);

    store.requestRender();
    expect(store.consumeRenderRequest()).toBe(true);
  });
});
