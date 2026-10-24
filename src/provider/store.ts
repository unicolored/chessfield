import { FenParser } from '@chess-fu/fen-parser';
import { initial } from '@lichess-org/chessground/fen';
import type * as cg from '@lichess-org/chessground/types';
import { type OrbitControls } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import type { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { type GameState } from '../resource/chessfield.state.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { Themes } from '../resource/chessfield.types.ts';

import { SimpleObservable, SimpleSubject } from './observable.ts';

export class Store {
  private scene: THREE.Scene | null = null;
  camera: THREE.PerspectiveCamera | null = null;
  camGroup: THREE.Group | null = null;
  canvas!: HTMLCanvasElement;
  renderer!: THREE.WebGPURenderer;
  renderPipeline!: THREE.RenderPipeline;
  controls!: OrbitControls;
  chessboard!: cf.ExtendedMesh;
  casesGroup!: THREE.Group;
  piecesGroup: THREE.Group | null = null;
  textGroup!: THREE.Group;
  state!: THREE.InstancedMesh;
  shapesRing!: THREE.InstancedMesh;
  gameState: GameState | null = null;
  boardPieces: cf.BoardPiece[] = [];
  piecesObjects: cf.ColorPieceNameObjectMap | null = null;
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

  // private loader: GLTFLoader;
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

  private movesSubject = new SimpleSubject<cf.Moves>({
    moves: [
      {
        fen: Store.initialFen,
        lastMove: [],
      },
    ],
  });
  movesSubject$ = new SimpleObservable(this.movesSubject);

  setFen = (fen: cg.FEN, lastMove?: cg.Key[] | string[]) => {
    if (fen && FenParser.isFen(fen)) {
      const moves: cf.Moves = {
        moves: [
          {
            fen,
            lastMove,
          },
        ],
      };

      this.movesSubject.next(moves);
    }
  };

  setBoardPiecesObjectsMap(boardPiecesObjectsMap: cf.ColorPieceNameObjectMap) {
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
}
