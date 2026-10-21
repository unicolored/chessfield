import type * as cg from '@lichess-org/chessground/types';

import { type ChessfieldConfig } from './chessfield.config.ts';
import { type GameState } from './chessfield.state.ts';
import { type Camera, type ThemeColors } from './chessfield.types.ts';

export interface ChessfieldApi {
  // set a fen with flags, and optionally squares part of the last move
  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void;

  // set a fen with flags, and optionally squares part of the last move
  configUpdate(partialConfig: Partial<ChessfieldConfig>): void;

  // switch theme (cycle if no theme provided)
  switchTheme(theme?: string): void;

  // switch camera position (cycle if no camera provided)
  switchCamera(camera?: string): void;

  // get current camera position
  getCurrentCamera(): Camera;

  // get current theme colors (light, dark, highlight, etc.)
  getThemeColors(): ThemeColors;

  setCheck(state: GameState): void;
  setGameOver(state: GameState): void;

  // click a square programmatically
  // selectSquare(key: cg.Key | null): void;
}
