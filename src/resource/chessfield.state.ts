import * as fen from '@lichess-org/chessground/fen';
import type * as cg from '@lichess-org/chessground/types';

import type * as cf from './chessfield.types';

export interface GameOverState {
  // status: 'mate' | 'draw';
  winner?: 'w' | 'b';
  kings: { white: cg.Key; black: cg.Key };
}

export interface HeadlessState {
  pieces: cg.Pieces;
  orientation: cg.Color; // board orientation. white | black
  camera: cf.Camera; // board view. white | right | black | left
  angle: cf.Angle; // board view. white | right | black | left
  turnColor: cg.Color; // turn to play. white | black
  check?: cg.Key; // square currently in check "a2"
  lastMove?: cg.Key[]; // squares part of the last move ["c3"; "c4"]
  // selected?: cg.Key; // square currently selected "a1"
  // coordinates: boolean; // include coords attributes
  coordinatesOnSquares: boolean; // include coords attributes on every square
}

export interface ChessfieldState extends HeadlessState {
  dom: cg.Dom;
}

export function defaults(): HeadlessState {
  return {
    pieces: fen.read(fen.initial),
    orientation: 'white',
    camera: 'white',
    angle: 'right',
    turnColor: 'white',
    coordinatesOnSquares: false,
  };
}
