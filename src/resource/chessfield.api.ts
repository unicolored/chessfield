import * as cg from 'chessground/types';
import { ChessfieldState } from './chessfield.state.ts';

export interface ChessfieldApi {
  // read chessfield state; write at your own risks.
  state: ChessfieldState;

  // set a fen with flags, and optionally squares part of the last move
  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void;

  // change the view angle
  toggleView(): void;

  // click a square programmatically
  // selectSquare(key: cg.Key | null): void;
}
