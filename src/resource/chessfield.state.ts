import * as fen from 'chessground/fen';
import * as cg from 'chessground/types';
import * as cf from './chessfield.types';

export interface HeadlessState {
  pieces: cg.Pieces;
  orientation: cg.Color; // board orientation. white | black
  camera: cf.Camera; // board view. white | right | black | left
  angle: cf.Angle; // board view. white | right | black | left
  turnColor: cg.Color; // turn to play. white | black
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
