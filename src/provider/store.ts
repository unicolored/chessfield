import { BehaviorSubject, Observable } from 'rxjs';
import { BufferGeometry, Vector3 } from 'three';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import {
  BoardPiece,
  ColorPieceNameObjectMap,
  letters,
  PiecesEnum,
  Theme,
} from '../interface/board.interface.ts';
import { FEN } from 'chessground/types';
import { initial } from 'chessground/fen';
import FenParser from '@chess-fu/fen-parser';
import { LichessMoves } from '../interface/lichess.interface.ts';
import { cm } from '../helper.ts';

export class Store {
  static readonly boardSize = 8;
  static readonly squareSize = cm(4);
  static readonly squareHeight = cm(0.3);
  static readonly initialFen = `${initial} w KQkq - 0 1`;
  static readonly themes: { [key: string]: Theme } = {
    blue: {
      light: '#bfcfdd',
      dark: '#9dabb6',
    },
    brown: {
      light: '#f0d9b5',
      dark: '#0xc6b295',
    },
    bw: {
      light: '#dddddd',
      dark: '#222222',
    },
  };

  private piecesPositions!: Map<string, Vector3>;
  private boardPiecesObjectsMap: ColorPieceNameObjectMap = new Map();

  // private loader: GLTFLoader;
  private piecesGeometriesGltfMap: Map<PiecesEnum, BufferGeometry> = new Map();
  setPiecesGeometriesGltfMap(piecesGeometriesGltfMap: Map<PiecesEnum, BufferGeometry>) {
    this.piecesGeometriesGltfMap = piecesGeometriesGltfMap;
  }

  getPiecesGeometriesGltfMap() {
    return this.piecesGeometriesGltfMap;
  }

  constructor(private readonly config?: ChessfieldConfig) {}

  getConfig(): ChessfieldConfig {
    return this.config ?? {};
  }

  private movesSubject = new BehaviorSubject<LichessMoves>({
    moves: [],
  });
  movesSubject$: Observable<LichessMoves> = this.movesSubject.asObservable();

  private fenSubject = new BehaviorSubject<FEN>(Store.initialFen);
  fenSubject$: Observable<FEN> = this.fenSubject.asObservable();
  setFen = (fen: FEN | null | undefined, lastMove?: string | null) => {
    if (fen && FenParser.isFen(fen)) {
      const lichessMoves: LichessMoves = {
        moves: [
          {
            fen: fen,
            lm: lastMove,
          },
        ],
      };

      this.fenSubject.next(fen);
      this.movesSubject.next(lichessMoves);
    }
  };

  private gamePiecesSubject = new BehaviorSubject<BoardPiece[]>([]);
  gamePiecesSubject$: Observable<BoardPiece[]> = this.gamePiecesSubject.asObservable();
  updategamePieces = (list: BoardPiece[]) => {
    this.gamePiecesSubject.next(list);
  };

  getPiecesPositions(): Map<string, Vector3> {
    if (!this.piecesPositions) {
      this.piecesPositions = new Map<string, Vector3>();

      for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
        for (let colInt = 0; colInt < Store.boardSize; colInt++) {
          const coord = letters[rankInt] + (Store.boardSize - colInt);

          const x = cm(rankInt - Store.boardSize / 2 + 0.5);
          const y = cm(Store.squareHeight / 2);
          const z = cm(colInt - Store.boardSize / 2 + 0.5);

          this.piecesPositions.set(coord, new Vector3(x, y, z));
        }
      }
    }

    return this.piecesPositions;
  }

  setBoardPiecesObjectsMap(boardPiecesObjectsMap: ColorPieceNameObjectMap) {
    this.boardPiecesObjectsMap = boardPiecesObjectsMap;
  }
  getBoardPiecesObjectsMap(): ColorPieceNameObjectMap {
    return this.boardPiecesObjectsMap;
  }
}
