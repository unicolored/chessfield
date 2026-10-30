import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoaderComponent } from './loader.component.ts';

describe('LoaderComponent', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'cf-chessfield-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mounts an accessible overlay with a progress bar', () => {
    new LoaderComponent(container, { backgroundColor: '#123456', progressBarHeight: 6 });

    const overlay = container.querySelector<HTMLElement>('.cf-chessfield-loading');
    const bar = container.querySelector<HTMLElement>('.cf-chessfield-loading__bar');

    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('status');
    expect(overlay?.getAttribute('aria-busy')).toBe('true');
    expect(overlay?.style.backgroundColor).toBe('rgb(18, 52, 86)');
    expect(bar?.style.height).toBe('6px');
    expect(bar?.getAttribute('role')).toBe('progressbar');
  });

  it('clamps progress and updates the bar', () => {
    const loader = new LoaderComponent(container);
    const fill = container.querySelector<HTMLElement>('.cf-chessfield-loading__fill');
    const bar = container.querySelector<HTMLElement>('.cf-chessfield-loading__bar');

    loader.setProgress(0.42);
    expect(fill?.style.width).toBe('42%');
    expect(bar?.getAttribute('aria-valuenow')).toBe('42');

    loader.setProgress(2);
    expect(fill?.style.width).toBe('100%');

    loader.setProgress(-1);
    expect(fill?.style.width).toBe('0%');
  });

  it('can hide the progress bar', () => {
    new LoaderComponent(container, { progressBarHeight: 0 });

    expect(container.querySelector('.cf-chessfield-loading__bar')).toBeNull();
  });

  it('fades out and removes the overlay', async () => {
    vi.useFakeTimers();
    const loader = new LoaderComponent(container, { overlayFadeDuration: 100 });
    const overlay = container.querySelector<HTMLElement>('.cf-chessfield-loading');

    const completed = loader.complete();

    expect(overlay?.classList.contains('cf-chessfield-loading--fading')).toBe(true);
    expect(overlay?.getAttribute('aria-busy')).toBe('false');

    vi.advanceTimersByTime(200);
    await completed;

    expect(container.querySelector('.cf-chessfield-loading')).toBeNull();
  });

  it('removes the overlay immediately when motion is reduced', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );

    const loader = new LoaderComponent(container, { overlayFadeDuration: 100 });
    await loader.complete();

    expect(container.querySelector('.cf-chessfield-loading')).toBeNull();
  });
});
