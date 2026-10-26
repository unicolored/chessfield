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
  camera!: THREE.PerspectiveCamera;
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
  moves: cf.Move[] = [];
  gameState: GameState | null = null;
  private boardPieces: cf.BoardPiece[] = [];
  piecesObjects: cf.ColorPieceNameObjectMap | null = null;
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

  private boardPiecesObjectsMap: cf.ColorPieceNameObjectMap = new Map();

  private piecesGeometriesGltfMap: Map<cg.Role, THREE.BufferGeometry> = new Map();

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

  private fenSubject = new SimpleSubject<cf.Moves>({
    moves: [
      {
        fen: Store.initialFen,
        lastMove: [],
      },
    ],
  });
  fenSubject$ = new SimpleObservable(this.fenSubject);

  setFen = (fen: cg.FEN, lastMove?: cg.Key[] | string[], previousFen: cg.FEN | null = null): void => {
    if (!FenParser.isFen(fen)) {
      console.error('Invalid FEN', fen);
      return;
    }

    const howmanymoves = this.moves.length;
    const previousIsIdentical = previousFen === fen;
    previousFen = previousIsIdentical ? null : previousFen;

    if (howmanymoves === 0) {
      if (previousFen && !previousIsIdentical) {
        this.moves.push({ fen: previousFen });
      }

      this.moves.push({
        fen,
        lastMove,
      });
    } else {
      const previousMove = this.moves[this.moves.length - 1];
      const previousIsIdentical = previousMove.fen === fen;
      if (!previousIsIdentical) {
        this.moves.push({ fen, lastMove });
      }
    }

    console.log(this.moves);

    this.fenSubject.next({ moves: this.moves });
  };

  getBoardPieces(): cf.BoardPiece[] {
    return this.boardPieces;
  }

  setBoardPieces(boardPieces: cf.BoardPiece[]): void {
    this.boardPieces = boardPieces;
  }

  setBoardPiecesObjectsMap(boardPiecesObjectsMap: cf.ColorPieceNameObjectMap): void {
    this.boardPiecesObjectsMap = boardPiecesObjectsMap;
  }

  getBoardPiecesObjectsMap(): cf.ColorPieceNameObjectMap {
    return this.boardPiecesObjectsMap;
  }

  getBoardCases(): THREE.Mesh[] {
    const cases: THREE.Mesh[] = [];

    this.casesGroup?.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) cases.push(child);
    });

    return cases;
  }

  getPieces(): THREE.Mesh[] {
    const pieces: THREE.Mesh[] = [];

    this.piecesGroup?.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) pieces.push(child);
    });

    return pieces;
  }

  getTextGroup(): THREE.Group {
    if (!this.textGroup) {
      this.textGroup = new THREE.Group();
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
