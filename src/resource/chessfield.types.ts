import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

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
  [key in cg.Color]: THREE.Material | null;
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
  highlightStatusMate: string | number;
  selected: string | number;
}

export type CoordPieceNameMap = Map<cg.Key, cg.Role>;
export type ColorPieceNameObjectMap = Map<
  PieceColorRole,
  THREE.Mesh | THREE.InstancedMesh | THREE.Group | undefined
>;

export interface BoardPiece extends cg.Piece {
  coord: cg.Key | null;
  objectKey: PieceColorRole | null;
  count: number;
}

declare module 'three/webgpu' {
  interface Mesh {
    setSquareColors: (light: string | number, dark: string | number) => void;
    highlightSquareStart: (x: number, y: number) => void;
    highlightSquareEnd: (x: number, y: number) => void;
    highlightSquareSelected: (x: number, y: number) => void;
    setHighlightColor: (hex: string | number) => void;
    setHighlightStatusMateColor: (hex: string | number) => void;
    highlightSquareCursor: (x: number, y: number) => void;
    setStatusMate: (x: number, y: number) => void;
    setShape: (index: number, colorHex: string, show?: boolean) => void;
    setShapeAt: (rank: number, file: number, colorHex: string, show?: boolean) => void;
    clearShape: (index?: number) => void;
    clearAllShapes: () => void;
  }
}

export type ExtendedMesh = THREE.Mesh;
// export interface ExtendedMesh extends Mesh {
// setSquareColors: (light: string | number, dark: string | number) => void;
// highlightSquareStart: (x: number, y: number) => void;
// highlightSquareEnd: (x: number, y: number) => void;
// highlightSquareSelected: (x: number, y: number) => void;
// setHighlightColor: (hex: string | number) => void;
// highlightSquareCursor: (x: number, y: number) => void;
// }
