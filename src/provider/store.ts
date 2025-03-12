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
      light: '#bfcfdd',
      dark: '#9dabb6',
    },
    dark: {
      light: '#bfcfdd',
      dark: '#9dabb6',
    },
    blue: {
      light: '#bfcfdd',
      dark: '#9dabb6',
    },
    brown: {
      light: '#f0d9b5',
      dark: '#c6b295',
    },
    green: {
      light: '#dddddd',
      dark: '#222222',
    },
    bw: {
      light: '#dddddd',
      dark: '#222222',
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

  constructor(private readonly config?: ChessfieldConfig) {}

  getConfig(): ChessfieldConfig {
    return this.config ?? {};
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
