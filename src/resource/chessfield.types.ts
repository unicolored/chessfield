import { Group, InstancedMesh, Material, Mesh } from 'three';
import * as cg from 'chessground/types';

export type Mode = 'light' | 'dark';
export type Theme = 'blue' | 'green' | 'brown' | 'bw' | 'light' | 'dark' | string;

export type Camera = 'white' | 'right' | 'black' | 'left' | 'top';

export type Angle = 'left' | 'center' | 'right';

export interface Moves {
  moves: Move[];
}

export interface Move {
  fen: cg.FEN;
  lastMove?: cg.Key[];
}

export type ColorMaterial = {
  [key in cg.Color]: Material;
};

export type PieceColorRole = 'white-knight' | `${cg.Color}-${cg.Role}`;

export type PieceKey = keyof typeof PiecesEnum;

export enum PiecesEnum {
  p = 'pawn',
  k = 'king',
  q = 'queen',
  n = 'knight',
  b = 'bishop',
  r = 'rook',
}

export const PiecesTypes: Record<PieceKey, PiecesEnum> = {
  p: PiecesEnum.p,
  k: PiecesEnum.k,
  q: PiecesEnum.q,
  n: PiecesEnum.n,
  b: PiecesEnum.b,
  r: PiecesEnum.r,
};

export type Themes = {
  [key in Theme]: ThemeColors;
};

export interface ThemeColors {
  light: string | number;
  dark: string | number;
  highlight: string | number;
  selected: string | number;
}

export type CoordPieceNameMap = Map<cg.Key, cg.Role>;
export type ColorPieceNameObjectMap = Map<PieceColorRole, Mesh | InstancedMesh | Group | undefined>;

export interface BoardPiece extends cg.Piece {
  coord: cg.Key | null;
  objectKey: PieceColorRole | null;
  count: number;
}

declare module 'three' {
  interface Mesh {
    setSquareColors?: (light: string | number, dark: string | number) => void;
    highlightSquareStart?: (x: number, y: number) => void;
    highlightSquareEnd?: (x: number, y: number) => void;
    highlightSquareSelected?: (x: number, y: number) => void;
    setHighlightColor?: (hex: string | number) => void;
  }
}

export interface ExtendedMesh extends Mesh {
  setSquareColors: (light: string | number, dark: string | number) => void;
  highlightSquareStart: (x: number, y: number) => void;
  highlightSquareEnd: (x: number, y: number) => void;
  highlightSquareSelected: (x: number, y: number) => void;
  setHighlightColor: (hex: string | number) => void;
}
