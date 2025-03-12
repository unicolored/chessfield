import { Color } from 'chessground/types';
import * as cg from 'chessground/types';
import { PieceColorRole } from './resource/chessfield.types.ts';

export const cm = (meter: number): number => {
  return meter / 100;
};

export const objKey = (color: Color, key: cg.Role): PieceColorRole => `${color}-${key}`;

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
 * @doc return x and y positions on the board
 * @param lastMove
 */
export function lmToCoordinates(lastMove: cg.Key[]): { x: number; y: number }[] {
  if (!lastMove) {
    return [];
  }

  const coords: { x: number; y: number }[] = [];
  lastMove.forEach(m => {
    const letterStart = Object.values(cg.files).findIndex(v => {
      const letter = m[0];
      return v === letter;
    });

    coords.push({
      x: letterStart,
      y: parseInt(m[1]) - 1,
    });
  });

  return coords;
}
