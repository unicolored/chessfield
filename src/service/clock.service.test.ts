import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import type { Store } from '../provider/store.ts';

import { ClockService, formatClock } from './clock.service.ts';
import type { TextInstance, TextOptions } from './text/types.ts';

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function createHarness() {
  const state = { turn: 'white' as cg.Color };
  const store = {
    gameState: null as Store['gameState'],
    getTurnColor: () => state.turn,
  } as unknown as Store;

  let now = 1000;
  const instances = new Map<string, TextInstance>();
  const group = { add: vi.fn() };

  const textService = {
    get: (id: string) => instances.get(id),
    update: (id: string, options: Partial<TextOptions>) => {
      const instance = instances.get(id);
      if (instance) {
        instance.options = { ...instance.options, ...options };
      }
    },
    add: async (options: TextOptions, id?: string) => {
      const instance = {
        id: id ?? `generated-${instances.size}`,
        object: { name: '' } as THREE.Object3D,
        backend: 'canvas-sprite',
        options: { ...options },
        dispose: vi.fn(),
        update: vi.fn(),
      } satisfies TextInstance;

      instances.set(instance.id, instance);
      return instance;
    },
  };

  const clock = new ClockService(store, () => now);
  const setNow = (value: number) => {
    now = value;
  };
  const setTurn = (turn: cg.Color) => {
    state.turn = turn;
  };

  return {
    store,
    clock,
    textService,
    group,
    instances,
    getNow: () => now,
    setNow,
    setTurn,
    mount: () =>
      clock.mount(
        textService as unknown as Parameters<ClockService['mount']>[0],
        { fontSize: 0.4, color: '#fff' },
        group as unknown as THREE.Group,
      ),
  };
}

describe('formatClock', () => {
  it('formats whole seconds as m:ss or h:mm:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(6)).toBe('0:06');
    expect(formatClock(30)).toBe('0:30');
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(60)).toBe('1:00');
    expect(formatClock(3661)).toBe('1:01:01');
  });

  it('never displays negative time', () => {
    expect(formatClock(-4)).toBe('0:00');
  });
});

describe('ClockService', () => {
  it('creates labels only once a snapshot exists', async () => {
    const h = createHarness();

    await h.mount();
    expect(h.textService.get('cf-clock-white')).toBeUndefined();

    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:30');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:06');
    expect(h.textService.get('cf-clock-white')?.options.cache).toBe(false);
    expect(h.textService.get('cf-clock-white')?.options.fontSize).toBeCloseTo(0.6);
    expect(h.group.add).toHaveBeenCalledTimes(2);
  });

  it('places each clock at its end of the left-edge turn switch', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    const white = h.textService.get('cf-clock-white')!;
    const black = h.textService.get('cf-clock-black')!;

    // Both clocks share the switch side; White is at +Z, Black at -Z.
    expect(white.options.position?.x).toBeLessThan(0);
    expect(black.options.position?.x).toBeLessThan(0);
    expect(white.options.position?.z).toBeGreaterThan(0);
    expect(black.options.position?.z).toBeLessThan(0);
  });

  it('creates labels from a snapshot received before the scene was mounted', async () => {
    const h = createHarness();

    h.clock.setTimeLeft({ white: 30, black: 6 });
    await h.mount();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:30');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:06');
  });

  it('counts down only the side to move', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.setNow(11_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:20');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:06');

    h.setTurn('black');
    h.clock.setTurn('black');
    await flush();

    h.setNow(13_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:20');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:04');
  });

  it('commits the elapsed time to the side that was moving when the turn changes', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.setNow(6000);
    h.setTurn('black');
    h.clock.setTurn('black');
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:25');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:06');

    h.setNow(8000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:25');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:04');
  });

  it('takes the counted side from the stored turn on a new snapshot', async () => {
    const h = createHarness();

    await h.mount();
    h.setTurn('black');
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.setNow(4000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:30');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:03');
  });

  it('freezes once the game state is terminal', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.store.gameState = { status: 'resign' };
    h.setNow(11_000);
    h.clock.tick();
    await flush();

    h.setNow(21_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:20');
  });

  it('freezes on mate details without a status', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.store.gameState = { winner: 'w', mate: ['e8'] };
    h.setNow(11_000);
    h.clock.tick();
    await flush();

    h.setNow(21_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:20');
  });

  it('freezes on draw details without a status', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.store.gameState = { draw: ['e8', 'e1'] };
    h.setNow(11_000);
    h.clock.tick();
    await flush();

    h.setNow(21_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:20');
  });

  it('shows 0:00 on the flagging side when the game ends by timeout', async () => {
    const h = createHarness();

    await h.mount();
    h.setTurn('black');
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    // Black has 0.4s left locally; the consumer reports the real flag fall.
    h.setNow(6600);
    h.store.gameState = { status: 'timeout', winner: 'w', gameoverReason: 'timeout' };
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:30');
    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:00');
  });

  it('also zeroes the flagging side from the timeout reason alone', async () => {
    const h = createHarness();

    await h.mount();
    h.setTurn('black');
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.setNow(6600);
    h.store.gameState = { winner: 'w', gameoverReason: 'timeout' };
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:00');
  });

  it('does not zero a clock on a non-timeout terminal state', async () => {
    const h = createHarness();

    await h.mount();
    h.setTurn('black');
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.setNow(6600);
    h.store.gameState = { status: 'resign', winner: 'w' };
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-black')?.options.text).toBe('0:01');
  });

  it('keeps counting while the game is in check', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    h.store.gameState = { status: 'check', check: ['e1'] };
    h.setNow(11_000);
    h.clock.tick();
    await flush();

    h.setNow(21_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:10');
  });

  it('stops at 0:00 without ending the game itself', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 1, black: 6 });
    await flush();

    h.setNow(3000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:00');

    h.setNow(10_000);
    h.clock.tick();
    await flush();

    expect(h.textService.get('cf-clock-white')?.options.text).toBe('0:00');
    expect(h.store.gameState).toBeNull();
  });

  it('does not update the text within the same displayed second', async () => {
    const h = createHarness();

    await h.mount();
    h.clock.setTimeLeft({ white: 30, black: 6 });
    await flush();

    const instance = h.textService.get('cf-clock-white')!;
    const update = vi.spyOn(h.textService, 'update');

    h.setNow(1100);
    h.clock.tick();
    await flush();

    expect(update).not.toHaveBeenCalled();
    expect(instance.options.text).toBe('0:30');
  });
});
