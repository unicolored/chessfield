import type * as cg from '@lichess-org/chessground/types';

import { type ChessfieldConfig } from './chessfield.config.ts';
import {
  type Camera,
  type LoadingProgress,
  type Mode,
  type Projection,
  type ThemeColors,
  type TimeLeft,
} from './chessfield.types.ts';

export interface ChessfieldApi {
  // resolves once assets, fonts and the scene are ready
  whenReady(): Promise<void>;

  // subscribe to loading progress; returns an unsubscribe function
  onLoadingProgress(listener: (progress: LoadingProgress) => void): () => void;

  // set a fen with flags, optionally squares part of the last move and the remaining clock time
  setFen(fen: cg.FEN, lastMove?: cg.Key[], timeLeft?: TimeLeft): void;

  // set a move, and the fen
  // setMove(lastMove: cg.Key[] | string[], fen?: cg.FEN): void;

  // set a fen with flags, and optionally squares part of the last move
  configUpdate(partialConfig: Partial<ChessfieldConfig>): Promise<void>;

  // switch theme (cycle if no theme provided)
  switchTheme(theme?: string): void;

  // switch camera position (cycle if no camera provided)
  switchCamera(camera?: string): void;

  // switch mode (light/dark) - toggles if no mode provided
  switchMode(mode?: Mode): void;

  // switch camera projection (perspective/isometric) - toggles if no projection provided
  switchProjection(projection?: Projection): void;

  // get current camera position
  getCurrentCamera(): Camera | undefined;

  // get current camera projection
  getCurrentProjection(): Projection;

  // get current mode (light/dark)
  getCurrentMode(): Mode;

  // get current theme colors (light, dark, highlight, etc.)
  getThemeColors(): ThemeColors;

  // click a square programmatically
  // selectSquare(key: cg.Key | null): void;
}
