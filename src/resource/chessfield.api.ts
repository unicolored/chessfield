import type * as cg from '@lichess-org/chessground/types';

import { type ChessfieldConfig } from './chessfield.config.ts';
import { type GameState } from './chessfield.state.ts';

export interface ChessfieldApi {
  // set a fen with flags, and optionally squares part of the last move
  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void;

  // set a fen with flags, and optionally squares part of the last move
  configUpdate(partialConfig: Partial<ChessfieldConfig>): void;

  setCheck(state: GameState): void;
  setGameOver(state: GameState): void;

  // click a square programmatically
  // selectSquare(key: cg.Key | null): void;
}
