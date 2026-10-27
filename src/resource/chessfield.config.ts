import type * as cg from '@lichess-org/chessground/types';

import type * as cf from './chessfield.types';
import { type Themes } from './chessfield.types';

export type TextBackendType = 'canvas-sprite' | 'troika-text';

export interface ChessfieldConfig {
  mode?: cf.Mode;
  theme?: cf.Theme;
  fen?: cg.FEN;
  lastMove?: cg.Key[] | string[];
  orientation?: cg.Color;
  camera?: cf.Camera;
  projection?: cf.Projection;
  angle?: cf.Angle;
  turnColor?: cg.Color;
  coordinatesOnSquares?: boolean;
  plugins?: {
    themes?: Themes;
  };
  controlsEnabled?: boolean;
  zoomMinDistance?: number;
  zoomMaxDistance?: number;
  loading?: {
    overlayFadeDuration?: number;
    progressBarHeight?: number;
    onLoadingComplete?: () => void;
  };

  /** Player names to display on board sides */
  playerNames?: {
    white?: string;
    black?: string;
  };

  /** Text rendering configuration */
  text?: {
    /** Rendering backend: 'canvas-sprite' | 'troika-text' */
    backend?: TextBackendType;
    /** Font size in world units (centimeters) */
    fontSize?: number;
    /** CSS font family */
    fontFamily?: string;
    /** Font weight */
    fontWeight?: string | number;
    /** Text color (CSS color or hex) */
    color?: string | number;
    /** Distance from board edge along Z axis */
    offset?: number;
    /** Maximum width for text wrapping (troika only) */
    maxWidth?: number;
    /** Outline width (troika only) */
    outlineWidth?: number;
    /** Outline color (troika only) */
    outlineColor?: string | number;
  };
}
