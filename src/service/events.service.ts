import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

import { lmToCoordinates } from '../helper';
import { type Store } from '../provider/store';

type Square = { rank: number; file: number };

export class EventsService {
  public readonly mouse = new THREE.Vector2();

  private readonly canvas: HTMLCanvasElement;

  private readonly raycaster = new THREE.Raycaster();
  // Raycast targets are the two board groups, built once instead of per mouse event.
  private raycastTargets: THREE.Object3D[] | null = null;
  private lastRaycastTime = 0;
  private readonly RAYCAST_INTERVAL = 33;

  // Right-button gesture: a click draws a ring, a drag draws an arrow on release.
  private rightDragStart: Square | null = null;
  private rightDragHover: Square | null = null;
  private rightDragShape: string | null = null;

  onSquareHover: ((rank: number, file: number) => void) | null = null;
  onSquareRightClick: ((rank: number, file: number, shape: string) => void) | null = null;
  onSquareRightDrag:
    | ((fromRank: number, fromFile: number, toRank: number, toFile: number, shape: string) => void)
    | null = null;
  onSquareRightDragPreview:
    | ((fromRank: number, fromFile: number, toRank: number, toFile: number, shape: string) => void)
    | null = null;
  onSquareRightDragCancel: (() => void) | null = null;
  onLeftClickClear: (() => void) | null = null;
  onResize: (() => void) | null = null;

  constructor(
    private readonly store: Store,
    private readonly cfElement: HTMLElement,
  ) {
    this.canvas = store.getCanvas();
  }

  init(): void {
    this.cfElement.addEventListener('pointermove', this.handlePointerMove);
    this.cfElement.addEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    // The release can happen outside the board: listen on the window so the gesture always ends.
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  dispose(): void {
    this.cfElement.removeEventListener('pointermove', this.handlePointerMove);
    this.cfElement.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerMove = (event: PointerEvent): void => {
    // Touch and pen drive the camera through OrbitControls; only a hovering mouse highlights.
    // Touch does not emit mouse events with a pointerType, so pointer events are the only
    // reliable way to tell a finger from a real mouse.
    if (event.pointerType !== 'mouse') return;

    this.updateMouse(event);

    const now = performance.now();
    if (now - this.lastRaycastTime >= this.RAYCAST_INTERVAL) {
      this.lastRaycastTime = now;
      this.raycastAndHover(event);
    }
  };

  private handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;

    this.mouse.x = this.mouse.y = -2;

    // A preview arrow must not stay behind while the pointer is outside the board.
    this.clearRightDragPreview();
  };

  private updateMouse(event: MouseEvent): void {
    const rect = this.cfElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private raycastAndHover(event: MouseEvent): void {
    // One raycast per mouse event; the same hit now provides the hovered square.
    const square = this.getSquareFromMouse(this.mouse);

    if (!square) {
      this.onSquareHover?.(-1, -1);
      if (this.rightDragStart) {
        this.clearRightDragPreview();
      }
      return;
    }

    this.onSquareHover?.(square.rank, square.file);

    if (this.rightDragStart) {
      this.updateRightDragPreview(square, this.getShapeName(event));
    }
  }

  private updateRightDragPreview(square: Square, shape: string): void {
    const start = this.rightDragStart;
    if (!start) {
      return;
    }

    // A drag that is still on its starting square has nothing to preview.
    if (square.rank === start.rank && square.file === start.file) {
      this.clearRightDragPreview();
      return;
    }

    const hover = this.rightDragHover;
    const unchanged =
      hover !== null &&
      hover.rank === square.rank &&
      hover.file === square.file &&
      this.rightDragShape === shape;

    if (unchanged) {
      return;
    }

    this.rightDragHover = square;
    this.rightDragShape = shape;
    this.onSquareRightDragPreview?.(start.rank, start.file, square.rank, square.file, shape);
  }

  private clearRightDragPreview(): void {
    if (!this.rightDragHover && !this.rightDragShape) {
      return;
    }

    this.rightDragHover = null;
    this.rightDragShape = null;
    this.onSquareRightDragCancel?.();
  }

  private getSquareFromIntersect(intersect: THREE.Intersection): Square | null {
    // Piece meshes and case hit-boxes both store their square on the mesh itself.
    const coord = intersect.object.userData['square'] as string | undefined;

    if (!coord) return null;
    const coords = lmToCoordinates(['a1', coord as cg.Key]);
    return { rank: coords[1].x, file: coords[1].y };
  }

  private handleContextMenu = (event: MouseEvent): void => {
    // Shape drawing is driven by mousedown/mouseup so a right-drag can become an arrow.
    event.preventDefault();
  };

  private getSquareFromMouse(mouse: THREE.Vector2): Square | null {
    const camera = this.store.camera;
    if (!camera) return null;

    this.raycaster.setFromCamera(mouse, camera);

    // Recursive against the cached groups: hidden case hit-boxes still intersect.
    const [intersect] = this.raycaster.intersectObjects(this.getRaycastTargets(), true);

    return intersect ? this.getSquareFromIntersect(intersect) : null;
  }

  private getRaycastTargets(): THREE.Object3D[] {
    if (!this.raycastTargets) {
      // Only the groups are cached: their children change as pieces move, the groups do not.
      this.raycastTargets = [this.store.piecesGroup, this.store.casesGroup].filter(
        (target): target is THREE.Group => Boolean(target),
      );
    }

    return this.raycastTargets;
  }

  private getShapeName(event: MouseEvent): string {
    if (event.altKey && event.ctrlKey) return 'ringCtrlAlt';
    if (event.altKey) return 'ringAlt';
    if (event.ctrlKey) return 'ringCtrl';
    return 'ring';
  }

  private handlePointerDown = (event: PointerEvent): void => {
    // Shape gestures are mouse-only: a touch drag belongs to the camera, not to the board.
    if (event.pointerType !== 'mouse') return;

    if (event.button === 0) {
      this.onLeftClickClear?.();
      return;
    }

    if (event.button !== 2) {
      return;
    }

    this.updateMouse(event);

    this.rightDragStart = this.getSquareFromMouse(this.mouse);
    this.rightDragHover = null;
    this.rightDragShape = null;
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 2 || !this.rightDragStart) {
      return;
    }

    const start = this.rightDragStart;
    this.updateMouse(event);
    const end = this.getSquareFromMouse(this.mouse);
    const shape = this.getShapeName(event);

    this.clearRightDragPreview();
    this.rightDragStart = null;
    this.rightDragHover = null;
    this.rightDragShape = null;

    if (!end) {
      return;
    }

    if (end.rank === start.rank && end.file === start.file) {
      this.onSquareRightClick?.(start.rank, start.file, shape);
      return;
    }

    this.onSquareRightDrag?.(start.rank, start.file, end.rank, end.file, shape);
  };
}
