import * as cg from 'chessground/types';
import { ChessfieldConfig } from './chessfield.config.ts';

export interface ChessfieldApi {
  // set a fen with flags, and optionally squares part of the last move
  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void;

  // set a fen with flags, and optionally squares part of the last move
  configUpdate(partialConfig: Partial<ChessfieldConfig>): void;

  // click a square programmatically
  // selectSquare(key: cg.Key | null): void;
}
