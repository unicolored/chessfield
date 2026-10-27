import { afterEach, describe, expect, it, vi } from 'vitest';

import { Store } from '../provider/store';

import { EventsService } from './events.service';

type Square = { rank: number; file: number };

describe('EventsService right-button gestures', () => {
  let service: EventsService | null = null;

  afterEach(() => {
    service?.dispose();
    service = null;
    document.body.innerHTML = '';
  });

  function setup(squares: (Square | null)[]) {
    const store = new Store();
    const cfElement = document.createElement('div');
    const canvas = store.getCanvas();
    cfElement.appendChild(canvas);
    document.body.appendChild(cfElement);

    service = new EventsService(store, cfElement);
    service.init();

    // The real raycast needs a camera and board meshes: feed the resolved squares instead.
    (service as unknown as { getSquareFromMouse: () => Square | null }).getSquareFromMouse = () =>
      squares.shift() ?? null;
    (service as unknown as { lastRaycastTime: number }).lastRaycastTime = Number.NEGATIVE_INFINITY;

    return { service, cfElement, canvas };
  }

  it('draws an arrow when the right button is dragged to another square', () => {
    const { service, cfElement, canvas } = setup([
      { rank: 0, file: 0 },
      { rank: 4, file: 3 },
      { rank: 4, file: 3 },
    ]);

    const preview = vi.fn();
    const arrow = vi.fn();
    const ring = vi.fn();
    service.onSquareRightDragPreview = preview;
    service.onSquareRightDrag = arrow;
    service.onSquareRightClick = ring;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
    cfElement.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));

    expect(preview).toHaveBeenCalledWith(0, 0, 4, 3, 'ring');
    expect(arrow).toHaveBeenCalledWith(0, 0, 4, 3, 'ring');
    expect(ring).not.toHaveBeenCalled();
  });

  it('draws a ring when the right button is released on the starting square', () => {
    const { service, canvas } = setup([
      { rank: 0, file: 0 },
      { rank: 0, file: 0 },
    ]);

    const arrow = vi.fn();
    const ring = vi.fn();
    service.onSquareRightDrag = arrow;
    service.onSquareRightClick = ring;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));

    expect(ring).toHaveBeenCalledWith(0, 0, 'ring');
    expect(arrow).not.toHaveBeenCalled();
  });

  it('cancels the gesture when the right button is released outside the board', () => {
    const { service, canvas } = setup([{ rank: 0, file: 0 }, null]);

    const arrow = vi.fn();
    const ring = vi.fn();
    service.onSquareRightDrag = arrow;
    service.onSquareRightClick = ring;

    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));

    expect(arrow).not.toHaveBeenCalled();
    expect(ring).not.toHaveBeenCalled();
  });
});
