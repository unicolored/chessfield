import { Group, Material, Mesh } from 'three';
import { Color } from 'chessground/types';

export type COORD = string;

export type ColorMaterial = {
  [key in Color]: Material;
};

export type PieceKey = keyof typeof PiecesEnum;

export enum PiecesEnum {
  p = 'pawn',
  k = 'king',
  q = 'queen',
  n = 'knight',
  b = 'bishop',
  r = 'rook',
  P = 'pawn',
  K = 'king',
  Q = 'queen',
  N = 'knight',
  B = 'bishop',
  R = 'rook',
}

export const PiecesTypes: Record<PieceKey, PiecesEnum> = {
  p: PiecesEnum.p,
  k: PiecesEnum.k,
  q: PiecesEnum.q,
  n: PiecesEnum.n,
  b: PiecesEnum.b,
  r: PiecesEnum.r,
  P: PiecesEnum.p,
  K: PiecesEnum.k,
  Q: PiecesEnum.q,
  N: PiecesEnum.n,
  B: PiecesEnum.b,
  R: PiecesEnum.r,
};

export const letters = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i));

export const createEl = (tagName: string, className?: string): HTMLElement => {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  return el;
};

export interface Theme {
  light: string | number;
  dark: string | number;
}

export type CoordPieceNameMap = Map<COORD, PiecesEnum>;
export type PieceNameObjectMap = Map<PiecesEnum, Mesh | Group>;
export type ColorPieceNameObjectMap = Map<string, Mesh | Group>;
export type CoordPieceObjectMap = Map<COORD, Mesh | Group>;

export interface BoardPiece {
  coord: COORD;
  color: Color;
  name: PiecesEnum;
  objectKey: string;
}
