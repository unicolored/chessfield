import * as fen from 'chessground/fen';
import * as cg from 'chessground/types';
import * as cf from './chessfield.types';

export interface HeadlessState {
  pieces: cg.Pieces;
  orientation: cg.Color; // board orientation. white | black
  view: cf.View; // board view. white | right | black | left
  turnColor: cg.Color; // turn to play. white | black
  check?: cg.Key; // square currently in check "a2"
  lastMove?: cg.Key[]; // squares part of the last move ["c3"; "c4"]
  selected?: cg.Key; // square currently selected "a1"
  coordinates: boolean; // include coords attributes
  coordinatesOnSquares: boolean; // include coords attributes on every square
  ranksPosition: cg.RanksPosition; // position ranks on either side. left | right
  viewOnly: boolean; // don't bind events: the user will never be able to move pieces around
  highlight: {
    lastMove: boolean; // add last-move class to squares
    check: boolean; // add check class to squares
  };
}

export interface ChessfieldState extends HeadlessState {
  dom: cg.Dom;
}

export function defaults(): HeadlessState {
  return {
    pieces: fen.read(fen.initial),
    orientation: 'white',
    view: 'right',
    turnColor: 'white',
    coordinates: true,
    coordinatesOnSquares: false,
    ranksPosition: 'right',
    viewOnly: false,
    highlight: {
      lastMove: true,
      check: true,
    },
  };
}
