import { BehaviorSubject, Observable } from 'rxjs';
import { BufferGeometry, Vector3 } from 'three';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import * as cg from 'chessground/types';
import { initial } from 'chessground/fen';
import FenParser from '@chess-fu/fen-parser';
import { cm } from '../helper.ts';
import * as cf from '../resource/chessfield.types.ts';
import { Themes } from '../resource/chessfield.types.ts';

export class Store {
  static readonly boardSize = 8;
  static readonly squareSize = cm(4);
  static readonly squareHeight = cm(0.3);
  static readonly initialFen = `${initial} w KQkq - 0 1`;
  static readonly themes: Themes = {
    light: {
      light: '#f5f5f3',
      dark: '#eeebe8',
      highlight: '',
      selected: '',
    },
    dark: {
      light: '#1D232A',
      dark: '#13171c',
      highlight: '',
      selected: '',
    },
    blue: {
      light: '#bfcfdd',
      dark: '#9dabb6',
      highlight: '#B1CC82',
      selected: '',
    },
    brown: {
      light: '#efd9b5',
      dark: '#b58862',
      highlight: '#cdd16a',
      selected: '',
    },
    green: {
      light: '#feffdd',
      dark: '#87a664',
      highlight: '#96d6d3',
      selected: '',
    },
    bw: {
      light: '#e6e8e5',
      dark: '#505251',
      highlight: '#bdce82',
      selected: '',
    },
  };

  private piecesPositions!: Map<string, Vector3>;
  private boardPiecesObjectsMap: cf.ColorPieceNameObjectMap = new Map();

  // private loader: GLTFLoader;
  private piecesGeometriesGltfMap: Map<cg.Role, BufferGeometry> = new Map();
  setPiecesGeometriesGltfMap(piecesGeometriesGltfMap: Map<cg.Role, BufferGeometry>) {
    this.piecesGeometriesGltfMap = piecesGeometriesGltfMap;
  }

  getPiecesGeometriesGltfMap() {
    return this.piecesGeometriesGltfMap;
  }

  constructor(private config?: ChessfieldConfig) {}

  getConfig(): ChessfieldConfig {
    return this.config ?? {};
  }

  setConfig(config: ChessfieldConfig): void {
    this.config = config;
  }

  private movesSubject = new BehaviorSubject<cf.Moves>({
    moves: [
      {
        fen: Store.initialFen,
        lastMove: [],
      },
    ],
  });
  movesSubject$: Observable<cf.Moves> = this.movesSubject.asObservable();

  // private fenSubject = new BehaviorSubject<cg.FEN>(Store.initialFen);
  // fenSubject$: Observable<cg.FEN> = this.fenSubject.asObservable();
  setFen = (fen: cg.FEN, lastMove?: cg.Key[]) => {
    if (fen && FenParser.isFen(fen)) {
      const moves: cf.Moves = {
        moves: [
          {
            fen: fen,
            lastMove: lastMove,
          },
        ],
      };

      // this.fenSubject.next(fen);
      this.movesSubject.next(moves);
    }
  };

  private gamePiecesSubject = new BehaviorSubject<cf.BoardPiece[]>([]);
  gamePiecesSubject$: Observable<cf.BoardPiece[]> = this.gamePiecesSubject.asObservable();
  updategamePieces = (list: cf.BoardPiece[]) => {
    this.gamePiecesSubject.next(list);
  };

  getSquaresVector3(): Map<string, Vector3> {
    if (!this.piecesPositions) {
      this.piecesPositions = new Map<string, Vector3>();

      for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
        for (let colInt = 0; colInt < Store.boardSize; colInt++) {
          const coord = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

          const x = cm(rankInt - Store.boardSize / 2 + 0.5);
          const y = cm(Store.squareHeight / 2);
          const z = cm(colInt - Store.boardSize / 2 + 0.5);

          this.piecesPositions.set(coord, new Vector3(x, y, z));
        }
      }
    }

    return this.piecesPositions;
  }

  setBoardPiecesObjectsMap(boardPiecesObjectsMap: cf.ColorPieceNameObjectMap) {
    this.boardPiecesObjectsMap = boardPiecesObjectsMap;
  }
  getBoardPiecesObjectsMap(): cf.ColorPieceNameObjectMap {
    return this.boardPiecesObjectsMap;
  }
}
