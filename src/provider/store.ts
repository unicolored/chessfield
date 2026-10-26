import { FenParser } from '@chess-fu/fen-parser';
import { initial } from '@lichess-org/chessground/fen';
import * as cg from '@lichess-org/chessground/types';
import { type OrbitControls } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { type GameState } from '../resource/chessfield.state.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { Themes } from '../resource/chessfield.types.ts';

import { SimpleObservable, SimpleSubject } from './observable.ts';

export class Store {
  private canvas!: HTMLCanvasElement;
  private scene!: THREE.Scene;
  camera!: cf.ProjectionCamera;
  camGroup!: THREE.Group;
  // static enableAntialias = window.devicePixelRatio < 2;
  // renderer!: THREE.WebGPURenderer;
  private renderPipeline!: THREE.RenderPipeline;
  controls!: OrbitControls;
  chessboard!: cf.ExtendedMesh;
  casesGroup!: THREE.Group;
  piecesGroup!: THREE.Group;
  textGroup!: THREE.Group;
  state!: THREE.InstancedMesh;
  shapesRing!: THREE.InstancedMesh;
  gameState: GameState | null = null;
  // Starts dirty so the first animation-loop frame always draws.
  private renderRequested = true;

  private boardPiecesObjectsMap: cf.SquareMeshMap = new Map();
  private piecesGeometriesGltfMap: Map<cg.Role, THREE.BufferGeometry> = new Map();
  private squarePositionsVec3!: Map<string, THREE.Vector3>;

  static readonly boardSize = 8;
  static readonly squareSize = cm(4);
  static readonly squareHeight = cm(0.3);
  static readonly initialFen = `${initial} w KQkq - 0 1`;
  static modes: Themes = {
    light: {
      light: '#f5f5f3',
      dark: '#eeebe8',
      highlight: '',
      statusCheck: '#aa0000',
      selected: '',
    },
    dark: {
      light: '#1D232A',
      dark: '#161512',
      highlight: '',
      statusCheck: '#aa0000',
      selected: '',
    },
  };
  static themes: Themes = {
    default: {
      light: '#efd9b5',
      dark: '#b58862',
      highlight: '#cdd16a',
      statusCheck: '#aa0000',
      selected: '',
      ring: '#73a45d',
      ringCtrlAlt: '#f0b24d',
      ringAlt: '#66799f',
      ringCtrl: '#b86f60',
    },
    blue: {
      light: '#bfcfdd',
      dark: '#9dabb6',
      highlight: '#B1CC82',
      statusCheck: '#aa0000',
      selected: '',
    },
    brown: {
      light: '#efd9b5',
      dark: '#b58862',
      highlight: '#cdd16a',
      statusCheck: '#aa0000',
      selected: '',
    },
    green: {
      light: '#feffdd',
      dark: '#87a664',
      highlight: '#96d6d3',
      statusCheck: '#aa0000',
      selected: '',
      ring: '#73a45d',
      ringCtrlAlt: '#f0b24d',
      ringAlt: '#66799f',
      ringCtrl: '#b86f60',
    },
    bw: {
      light: '#e6e8e5',
      dark: '#505251',
      highlight: '#bdce82',
      statusCheck: '#aa0000',
      selected: '',
    },
  };

  setPiecesGeometriesGltfMap(piecesGeometriesGltfMap: Map<cg.Role, THREE.BufferGeometry>) {
    this.piecesGeometriesGltfMap = piecesGeometriesGltfMap;
  }

  getPiecesGeometriesGltfMap() {
    return this.piecesGeometriesGltfMap;
  }

  constructor(private config?: ChessfieldConfig) {
    if (config) {
      if (config.plugins) {
        Store.themes = { ...Store.themes, ...config.plugins.themes };
      }
    }
  }

  getConfig(): ChessfieldConfig {
    return this.config ?? {};
  }

  setConfig(config: ChessfieldConfig): void {
    this.config = config;
  }

  // Only the current move is kept: no move history, so memory stays constant.
  private moveSubject = new SimpleSubject<cf.Move | null>(null);
  moveSubject$ = new SimpleObservable(this.moveSubject);

  // Set the current position; returns false when the FEN was already the current one.
  setFen = (fen: cg.FEN, lastMove?: cg.Key[] | string[]): boolean => {
    if (!FenParser.isFen(fen)) {
      console.error('Invalid FEN', fen);
      return false;
    }

    // Compare with the stored move instead of a history list (the history no longer exists).
    if (this.moveSubject.value?.fen === fen) {
      return false;
    }

    // Replace (never append) the stored move, so a single object is retained at most.
    this.moveSubject.next({ fen, lastMove });

    return true;
  };

  // Replace only the highlight of the current position; the pieces do not need a re-parse.
  setLastMove(lastMove?: cg.Key[] | string[]): void {
    const move = this.moveSubject.value;
    if (!move) {
      return;
    }

    this.moveSubject.next({ ...move, lastMove });
  }

  setBoardPiecesObjectsMap(boardPiecesObjectsMap: cf.SquareMeshMap): void {
    this.boardPiecesObjectsMap = boardPiecesObjectsMap;
  }

  getBoardPiecesObjectsMap(): cf.SquareMeshMap {
    return this.boardPiecesObjectsMap;
  }

  getTextGroup(): THREE.Group {
    if (!this.textGroup) {
      this.textGroup = new THREE.Group();
      this.textGroup.name = '📝 Player Names';
      this.getScene().add(this.textGroup);
    }

    return this.textGroup;
  }

  setTextGroup(textGroup: THREE.Group): void {
    this.textGroup = textGroup;
  }

  getScene(): THREE.Scene {
    if (!this.scene) {
      this.scene = new THREE.Scene();
      const mode = Store.modes[this.config?.mode ?? 'light'];
      this.scene.background = new THREE.Color(mode.light);
    }

    return this.scene;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  getSquarePositionsVec3(): Map<string, THREE.Vector3> {
    return this.squarePositionsVec3;
  }

  initSquarePositionsVec3(): void {
    const piecesPositions = new Map<string, THREE.Vector3>();

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const square = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

        const x = cm(rankInt - Store.boardSize / 2 + 0.5);
        const y = cm(Store.squareHeight / 2);
        const z = cm(colInt - Store.boardSize / 2 + 0.5);

        piecesPositions.set(square, new THREE.Vector3(x, y, z));
      }
    }

    this.squarePositionsVec3 = piecesPositions;
  }

  getPiecesGroup(): THREE.Group {
    if (!this.piecesGroup) {
      // Pieces Group
      this.piecesGroup = new THREE.Group();
      this.piecesGroup.name = '🟢 Pièces Group';
      this.getScene().add(this.piecesGroup);
    }

    return this.piecesGroup;
  }

  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    }

    return this.canvas;
  }

  getRenderPipeline(): THREE.RenderPipeline {
    return this.renderPipeline;
  }

  // Mark the scene as changed; the animation loop skips frames while nothing is pending.
  requestRender(): void {
    this.renderRequested = true;
  }

  // Consume one pending render request from the animation loop (idle frames draw nothing).
  consumeRenderRequest(): boolean {
    if (!this.renderRequested) {
      return false;
    }

    this.renderRequested = false;

    return true;
  }

  initRenderPipeline(canvas: HTMLCanvasElement, sizes: { width: number; height: number }): void {
    const renderer = new THREE.WebGPURenderer({
      canvas,
      // powerPreference: 'high-performance',
      // antialias: RendererProvider.enableAntialias,
      antialias: false,
      forceWebGL: false,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    /**
     * Post-processing
     */
    this.renderPipeline = new THREE.RenderPipeline(renderer);
    this.renderPipeline.outputColorTransform = false;
  }
}
