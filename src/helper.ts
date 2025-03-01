import { PiecesEnum } from './interface/board.interface.ts';
import { Color } from 'chessground/types';

export const cm = (meter: number): number => {
  return meter / 100;
};

export const objKey = (color: Color, key: PiecesEnum) => `${color}-${key}`;
