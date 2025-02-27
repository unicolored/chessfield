import { HeadlessState } from './chessfield.state.js';
import * as cg from 'chessground/types';

export function reset(state: HeadlessState): void {
  state.lastMove = undefined;
  unselect(state);
}

export function setPieces(state: HeadlessState, pieces: cg.PiecesDiff): void {
  for (const [key, piece] of pieces) {
    if (piece) state.pieces.set(key, piece);
    else state.pieces.delete(key);
  }
}

export function setCheck(state: HeadlessState, color: cg.Color | boolean): void {
  state.check = undefined;
  if (color === true) color = state.turnColor;
  if (color)
    for (const [k, p] of state.pieces) {
      if (p.role === 'king' && p.color === color) {
        state.check = k;
      }
    }
}

export function selectSquare(state: HeadlessState, key: cg.Key): void {
  if (state.selected) {
    if (state.selected === key) {
      unselect(state);
      return;
    }
  }

  setSelected(state, key);
}

export function setSelected(state: HeadlessState, key: cg.Key): void {
  state.selected = key;
}

export function unselect(state: HeadlessState): void {
  state.selected = undefined;
}
