import * as cg from 'chessground/types';
import * as cf from './chessfield.types';
import { Themes } from './chessfield.types';

export interface ChessfieldConfig {
  mode?: cf.Mode; //
  theme?: cf.Theme; //
  fen?: cg.FEN; // chess position in Forsyth notation
  orientation?: cg.Color; // board orientation when 'view' is 'top'.
  camera?: cf.Camera; // camera position around the chessboard.
  angle?: cf.Angle; // angle of the chessboard when camera is 'white' or 'black'.
  turnColor?: cg.Color; // turn to play. Override the value set by a fen.
  lastMove?: cg.Key[]; // squares part of the last move ["c3", "c4"]
  // selected?: cg.Key; // square currently selected "a1"
  // coordinates?: boolean; // include coords attributes
  coordinatesOnSquares?: boolean; // include coords attributes on every square
  plugins?: {
    themes?: Themes;
  };
}
