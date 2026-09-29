import {
  Raycaster,
  Vector2,
  Camera,
  Scene,
  type Intersection,
  InstancedMesh,
  InstancedBufferAttribute,
} from 'three';
import { Store } from '../provider/store';
import { ShapesService } from './shapes.service';
import { lmToCoordinates, vector2ToCoord } from '../helper';
import type * as cg from '@lichess-org/chessground/types';

export class EventsService {
  public readonly mouse = new Vector2();

  private readonly cfElement: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly camera: Camera;
  private readonly scene: Scene;
  private readonly store: Store;
  private readonly _shapesService: ShapesService;

  private readonly raycaster = new Raycaster();
  private lastRaycastTime = 0;
  private readonly RAYCAST_INTERVAL = 33;

  onSquareHover: ((rank: number, file: number) => void) | null = null;
  onSquareRightClick: ((rank: number, file: number, color: string) => void) | null = null;
  onLeftClickClear: (() => void) | null = null;
  onResize: (() => void) | null = null;

  constructor(params: {
    cfElement: HTMLElement;
    canvas: HTMLCanvasElement;
    camera: Camera;
    scene: Scene;
    store: Store;
    shapesService: ShapesService;
  }) {
    this.cfElement = params.cfElement;
    this.canvas = params.canvas;
    this.camera = params.camera;
    this.scene = params.scene;
    this.store = params.store;
    this._shapesService = params.shapesService;
    // _shapesService is used by Chessfield callbacks, not directly in this service
    void this._shapesService;
  }

  init(): void {
    this.cfElement.addEventListener('mousemove', this.handleMouseMove);
    this.cfElement.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('resize', this.handleResize);
  }

  dispose(): void {
    this.cfElement.removeEventListener('mousemove', this.handleMouseMove);
    this.cfElement.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('resize', this.handleResize);
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

    const square = this.getSquareFromIntersect(intersects[0]);
    if (square) {
      this.onSquareHover?.(square.rank, square.file);
    }
  }

  private getSquareFromIntersect(intersect: Intersection): { rank: number; file: number } | null {
    let coord: string | null = null;

    if (intersect.object.parent?.name.includes('Pièces')) {
      const mesh = intersect.object;
      const instanceId = intersect.instanceId;
      if (mesh instanceof InstancedMesh && instanceId !== undefined) {
        const coordAttr = mesh.geometry.getAttribute('instanceCoord') as InstancedBufferAttribute | undefined;
        if (coordAttr) {
          const file = coordAttr.getX(instanceId);
          const rank = coordAttr.getY(instanceId);
          coord = vector2ToCoord(new Vector2(file, rank));
        } else {
          coord = mesh.userData['coord'] as string;
        }
      } else {
        coord = mesh.userData['coord'] as string;
      }
    } else {
      coord = intersect.object.parent?.userData['coord'] as string;
    }

    if (!coord) return null;
    const coords = lmToCoordinates(['a1', coord as cg.Key]);
    return { rank: coords[1].x, file: coords[1].y };
  }

  private handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();

    const square = this.getSquareFromMouse(this.mouse);
    console.log(square);
    if (!square) return;

    // TODO: move these colors to the brown theme in store.ts
    // And set alternative colors for each theme so it appears correctly on dark and light squares
    let color = '#73a45d';
    if (event.altKey && event.ctrlKey) color = '#f0b24d';
    else if (event.altKey) color = '#66799f';
    else if (event.ctrlKey) color = '#b86f60';

    this.onSquareRightClick?.(square.rank, square.file, color);
  };

  private getSquareFromMouse(mouse: Vector2): { rank: number; file: number } | null {
    if (!this.scene || !this.camera) return null;

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      [...this.store.getPieces(), ...this.store.getBoardCases()],
      false,
    );

    if (intersects.length === 0) return null;
    return this.getSquareFromIntersect(intersects[0]);
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.onLeftClickClear?.();
    }
  };

  private handleResize = (): void => {
    this.onResize?.();
  };
}
