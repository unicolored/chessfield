import { describe, expect, it, vi } from 'vitest';

import type { LoadingProgress } from '../resource/chessfield.types.ts';

import { LoadingService } from './loading.service.ts';

describe('LoadingService', () => {
  it('reports the initial state to new subscribers', () => {
    const service = new LoadingService();
    const states: LoadingProgress[] = [];

    service.subscribe(state => states.push(state));

    expect(states).toEqual([{ loaded: 0, total: 0, progress: 0, ready: false }]);
  });

  it('keeps progress monotonic when the total grows', () => {
    const service = new LoadingService();

    service.setAssets(1, 2);
    expect(service.value.progress).toBe(0.5);

    service.setAssets(1, 4);
    expect(service.value.progress).toBe(0.5);

    service.setAssets(2, 4);
    expect(service.value.progress).toBe(0.5);

    service.setAssets(3, 4);
    expect(service.value.progress).toBe(0.75);
  });

  it('ignores progress updates once ready', () => {
    const service = new LoadingService();
    service.setAssets(1, 3);
    service.markReady();

    service.setAssets(1, 3);

    expect(service.value).toEqual({ loaded: 3, total: 3, progress: 1, ready: true });
  });

  it('resolves whenReady after markReady, including late subscribers', async () => {
    const service = new LoadingService();
    const ready = vi.fn();

    void service.whenReady().then(ready);
    expect(ready).not.toHaveBeenCalled();

    service.markReady();
    await service.whenReady();

    expect(ready).toHaveBeenCalledTimes(1);
    expect(service.value.ready).toBe(true);
    expect(service.value.progress).toBe(1);
  });

  it('resolves an already completed service immediately', async () => {
    const service = new LoadingService();
    service.markReady();

    await expect(service.whenReady()).resolves.toBeUndefined();
  });

  it('stops notifying after unsubscribe', () => {
    const service = new LoadingService();
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    unsubscribe();
    service.setAssets(1, 1);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('isolates a throwing listener', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const service = new LoadingService();

    expect(() => {
      service.subscribe(() => {
        throw new Error('listener failed');
      });
    }).not.toThrow();
    expect(() => service.setAssets(1, 2)).not.toThrow();

    expect(error).toHaveBeenCalled();

    error.mockRestore();
  });
});
