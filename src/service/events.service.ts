import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

import { lmToCoordinates } from '../helper';
import { type Store } from '../provider/store';

export class EventsService {
  public readonly mouse = new THREE.Vector2();

  private readonly canvas: HTMLCanvasElement;
  private readonly camera: THREE.PerspectiveCamera | null;

  private readonly raycaster = new THREE.Raycaster();
  // Raycast targets are the two board groups, built once instead of per mouse event.
  private raycastTargets: THREE.Object3D[] | null = null;
  private lastRaycastTime = 0;
  private readonly RAYCAST_INTERVAL = 33;

  onSquareHover: ((rank: number, file: number) => void) | null = null;
  onSquareRightClick: ((rank: number, file: number, shape: string) => void) | null = null;
  onLeftClickClear: (() => void) | null = null;
  onResize: (() => void) | null = null;

  constructor(
    private readonly store: Store,
    private readonly cfElement: HTMLElement,
  ) {
    this.canvas = store.getCanvas();
    this.camera = store.camera;
  }

  init(): void {
    this.cfElement.addEventListener('mousemove', this.handleMouseMove);
    this.cfElement.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
  }

  dispose(): void {
    this.cfElement.removeEventListener('mousemove', this.handleMouseMove);
    this.cfElement.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const rect = this.cfElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const now = performance.now();
    if (now - this.lastRaycastTime >= this.RAYCAST_INTERVAL) {
      this.lastRaycastTime = now;
      this.raycastAndHover();
    }
  };

  private handleMouseLeave = (): void => {
    this.mouse.x = this.mouse.y = -2;
  };

  private raycastAndHover(): void {
    // One raycast per mouse event; the same hit now provides the hovered square.
    const square = this.getSquareFromMouse(this.mouse);

    if (!square) {
      this.onSquareHover?.(-1, -1);
      return;
    }

    this.onSquareHover?.(square.rank, square.file);
  }

  private getSquareFromIntersect(intersect: THREE.Intersection): { rank: number; file: number } | null {
    // Piece meshes and case hit-boxes both store their square on the mesh itself.
    const coord = intersect.object.userData['square'] as string | undefined;

    if (!coord) return null;
    const coords = lmToCoordinates(['a1', coord as cg.Key]);
    return { rank: coords[1].x, file: coords[1].y };
  }

  private handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();

    const square = this.getSquareFromMouse(this.mouse);
    if (!square) return;

    // TODO: move these colors to the brown theme in store.ts
    // And set alternative colors for each theme so it appears correctly on dark and light squares
    let shape = 'ring'; // '#73a45d';
    if (event.altKey && event.ctrlKey)
      shape = 'ringCtrlAlt'; // '#f0b24d';
    else if (event.altKey)
      shape = 'ringAlt'; // '#66799f';
    else if (event.ctrlKey) shape = 'ringCtrl'; // '#b86f60';

    this.onSquareRightClick?.(square.rank, square.file, shape);
  };

  private getSquareFromMouse(mouse: THREE.Vector2): { rank: number; file: number } | null {
    if (!this.camera) return null;

    this.raycaster.setFromCamera(mouse, this.camera);

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

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.onLeftClickClear?.();
    }
  };
}
