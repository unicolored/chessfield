import type * as cg from '@lichess-org/chessground/types';

import type * as cf from './chessfield.types';
import { type Themes } from './chessfield.types';

/** Zoom range defaults, in centimeters, when the config omits them. */
export const DEFAULT_ZOOM_MIN_DISTANCE = 10;
export const DEFAULT_ZOOM_MAX_DISTANCE = 25;

export type TextBackendType = 'canvas-sprite' | 'troika-text';

export interface ChessfieldConfig {
  mode?: cf.Mode;
  theme?: cf.Theme;
  fen?: cg.FEN;
  lastMove?: cg.Key[] | string[];
  /** Remaining clock time per player, in whole seconds. */
  timeLeft?: cf.TimeLeft;
  orientation?: cg.Color;
  camera?: cf.Camera;
  projection?: cf.Projection;
  angle?: cf.Angle;
  /** Explicit turn override. When omitted, the FEN's side-to-move field drives the turn. */
  turnColor?: cg.Color;
  coordinatesOnSquares?: boolean;
  plugins?: {
    themes?: Themes;
  };
  controlsEnabled?: boolean;
  /** Closest zoom, in centimeters, shared by both projections. */
  zoomMinDistance?: number;
  /** Farthest zoom, in centimeters, shared by both projections. */
  zoomMaxDistance?: number;
  loading?: {
    /** Show the loading overlay. Defaults to true. */
    enabled?: boolean;
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
