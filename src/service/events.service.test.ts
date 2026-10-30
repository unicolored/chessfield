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

    canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 2, pointerType: 'mouse', bubbles: true }));
    cfElement.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { button: 2, pointerType: 'mouse', bubbles: true }));

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

    canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 2, pointerType: 'mouse', bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { button: 2, pointerType: 'mouse', bubbles: true }));

    expect(ring).toHaveBeenCalledWith(0, 0, 'ring');
    expect(arrow).not.toHaveBeenCalled();
  });

  it('cancels the gesture when the right button is released outside the board', () => {
    const { service, canvas } = setup([{ rank: 0, file: 0 }, null]);

    const arrow = vi.fn();
    const ring = vi.fn();
    service.onSquareRightDrag = arrow;
    service.onSquareRightClick = ring;

    canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 2, pointerType: 'mouse', bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { button: 2, pointerType: 'mouse', bubbles: true }));

    expect(arrow).not.toHaveBeenCalled();
    expect(ring).not.toHaveBeenCalled();
  });
});

describe('EventsService pointer filtering', () => {
  let service: EventsService | null = null;

  afterEach(() => {
    service?.dispose();
    service = null;
    document.body.innerHTML = '';
  });

  function setup() {
    const store = new Store();
    const cfElement = document.createElement('div');
    const canvas = store.getCanvas();
    cfElement.appendChild(canvas);
    document.body.appendChild(cfElement);

    service = new EventsService(store, cfElement);
    service.init();

    const getSquareFromMouse = vi.fn(() => ({ rank: 3, file: 4 }));
    (service as unknown as { getSquareFromMouse: typeof getSquareFromMouse }).getSquareFromMouse =
      getSquareFromMouse;
    (service as unknown as { lastRaycastTime: number }).lastRaycastTime = Number.NEGATIVE_INFINITY;

    return { service, cfElement, canvas, getSquareFromMouse };
  }

  it('highlights a square for a hovering mouse', () => {
    const { service, cfElement, getSquareFromMouse } = setup();
    const hover = vi.fn();
    service.onSquareHover = hover;

    cfElement.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }));

    expect(getSquareFromMouse).toHaveBeenCalledOnce();
    expect(hover).toHaveBeenCalledWith(3, 4);
  });

  it('does not highlight while a finger moves the camera', () => {
    const { service, cfElement, getSquareFromMouse } = setup();
    const hover = vi.fn();
    service.onSquareHover = hover;

    cfElement.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', bubbles: true }));

    expect(getSquareFromMouse).not.toHaveBeenCalled();
    expect(hover).not.toHaveBeenCalled();
  });

  it('does not clear shapes when the board is tapped', () => {
    const { service, canvas } = setup();
    const clear = vi.fn();
    service.onLeftClickClear = clear;

    canvas.dispatchEvent(new PointerEvent('pointerdown', { button: 0, pointerType: 'touch', bubbles: true }));

    expect(clear).not.toHaveBeenCalled();
  });
});
