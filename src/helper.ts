import { type Color } from '@lichess-org/chessground/types';
import * as cg from '@lichess-org/chessground/types';
import { Vector2 } from 'three';

import { type PieceColorRole } from './resource/chessfield.types.ts';

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

  const r = Number.parseInt(hexValue.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hexValue.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hexValue.slice(4, 6), 16) / 255;

  return [r, g, b];
}

/**
 * @doc return x and y positions on the board
 * @param lastMove
 */
export function lmToCoordinates(lastMove: cg.Key[] | undefined): { x: number; y: number }[] {
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
      y: Number.parseInt(m[1]) - 1,
    });
  });

  return coords;
}

export function fadeAlpha(uAlpha: { value: number }, duration = 1000) {
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1); // Clamps between 0 and 1
    if (uAlpha) {
      uAlpha.value = 1 - progress; // Update uAlpha directly

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
  };

  requestAnimationFrame(animate);
}

export function coordToVector2(coord: string): Vector2 {
  const file = coord.charCodeAt(0) - 97;
  const rank = Number.parseInt(coord[1]) - 1;
  return new Vector2(file, rank);
}

export function vector2ToCoord(vec: Vector2): string {
  const file = String.fromCharCode(97 + Math.round(vec.x));
  const rank = Math.round(vec.y) + 1;
  return `${file}${rank}`;
}
