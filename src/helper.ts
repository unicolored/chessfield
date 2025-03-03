import { letters, PiecesEnum } from './interface/board.interface.ts';
import { Color } from 'chessground/types';

export const cm = (meter: number): number => {
  return meter / 100;
};

export const objKey = (color: Color, key: PiecesEnum) => `${color}-${key}`;

// Helper function to convert hex color to RGB (0-1 range), handling "0x" prefix
export function hexToRgb(hex: string | number): [number, number, number] {
  const hexStr = `${hex}`;
  // Remove '0x' prefix if present, or '#' if present
  let hexValue = hexStr.replace(/^(0x|#)/, '');

  // Handle 3-digit or 6-digit hex
  if (hexValue.length === 3) {
    hexValue = hexValue
      .split('')
      .map(char => char + char)
      .join('');
  }

  const r = parseInt(hexValue.slice(0, 2), 16) / 255;
  const g = parseInt(hexValue.slice(2, 4), 16) / 255;
  const b = parseInt(hexValue.slice(4, 6), 16) / 255;

  return [r, g, b];
}

/**
 * @doc lastMove input: b7b6, c5b6 or any pair of chess coordinates, return x and y positions on the board
 * @param lastMove
 */
export function lmToCoordinates(lastMove: string | null | undefined): { x: number; y: number }[] {
  if (!lastMove) {
    return [];
  }
  const start = lastMove.slice(0, 2);
  const end = lastMove.slice(2, 4);

  const letterStart = letters.findIndex(v => {
    const letter = start[0].toUpperCase();
    return v === letter;
  });

  const letterEnd = letters.findIndex(v => {
    const letter = end[0].toUpperCase();
    return v === letter;
  });

  const coords = [];
  coords.push({
    x: letterStart,
    y: parseInt(start[1]) - 1,
  });
  coords.push({
    x: letterEnd,
    y: parseInt(end[1]) - 1,
  });

  return coords;
}
