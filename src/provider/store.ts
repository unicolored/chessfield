import { BehaviorSubject, Observable } from 'rxjs';
import { Group, Vector3 } from 'three';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
import { letters } from '../interface/board.interface.ts';
import { FEN } from 'chessground/types';
import { initial } from 'chessground/fen';
import FenParser from '@chess-fu/fen-parser';
import { LichessMoves } from '../interface/lichess.interface.ts';

export class Store {
  static readonly boardSize = 8;
  static readonly squareSize = 1;
  static readonly squareHeight = 0.1;
  static readonly initialFen = `${initial} w KQkq - 0 1`;
  private piecesPositions!: Map<string, Vector3>;

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
  setFen = (fen: FEN | null | undefined) => {
    if (fen && FenParser.isFen(fen)) {
      const lichessMoves: LichessMoves = {
        moves: [
          {
            fen: fen,
          },
        ],
      };

      this.fenSubject.next(fen);
      this.movesSubject.next(lichessMoves);
    }
  };

  private gamePiecesSubject = new BehaviorSubject<Map<string, Group>>(new Map());
  gamePiecesSubject$: Observable<Map<string, Group>> = this.gamePiecesSubject.asObservable();
  updategamePieces = (map: Map<string, Group>) => {
    this.gamePiecesSubject.next(map);
  };

  getPiecesPositions(): Map<string, Vector3> {
    if (!this.piecesPositions) {
      this.piecesPositions = new Map<string, Vector3>();

      for (let i = 0; i < Store.boardSize; i++) {
        for (let j = 0; j < Store.boardSize; j++) {
          const coord = letters[i] + (Store.boardSize - j);

          const x = i - Store.boardSize / 2 + 0.5;
          const y = Store.squareHeight / 2;
          const z = j - Store.boardSize / 2 + 0.5;

          this.piecesPositions.set(coord, new Vector3(x, y, z));
        }
      }
    }

    return this.piecesPositions;
  }
}
