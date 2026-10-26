import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

import { lmToCoordinates, vector2ToCoord } from '../helper';
import { type Store } from '../provider/store';

export class EventsService {
  public readonly mouse = new THREE.Vector2();

  private readonly canvas: HTMLCanvasElement;
  private readonly camera: THREE.PerspectiveCamera | null;
  private readonly scene: THREE.Scene | null;

  private readonly raycaster = new THREE.Raycaster();
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
    this.scene = store.getScene();
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
    if (!this.scene || !this.camera) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      [...this.store.getPieces(), ...this.store.getBoardCases()],
      false,
    );

    if (intersects.length === 0) {
      this.onSquareHover?.(-1, -1);
      return;
    }

    const square = this.getSquareFromMouse(this.mouse);
    if (square) {
      this.onSquareHover?.(square.rank, square.file);
    }
  }

  private getSquareFromIntersect(intersect: THREE.Intersection): { rank: number; file: number } | null {
    let coord: string | null = null;

    if (intersect.object.parent?.name.includes('Pièces')) {
      const mesh = intersect.object;
      const instanceId = intersect.instanceId;
      if (mesh instanceof THREE.InstancedMesh && instanceId !== undefined) {
        const coordAttr = mesh.geometry.getAttribute('instanceCoord') as
          | THREE.InstancedBufferAttribute
          | undefined;
        if (coordAttr) {
          const file = coordAttr.getX(instanceId);
          const rank = coordAttr.getY(instanceId);
          coord = vector2ToCoord(new THREE.Vector2(file, rank));
        } else {
          coord = mesh.userData['square'] as string;
        }
      } else {
        coord = mesh.userData['square'] as string;
      }
    } else {
      coord = intersect.object.parent?.userData['square'] as string;
    }

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
    if (!this.scene || !this.camera) return null;

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster
      .intersectObjects([...this.store.getPieces(), ...this.store.getBoardCases()], false)
      .filter((m: THREE.Intersection) => m.object.name !== 'stateSprite');

    if (intersects.length === 0) return null;
    return this.getSquareFromIntersect(intersects[0]);
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.onLeftClickClear?.();
    }
  };
}
