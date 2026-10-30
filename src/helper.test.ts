import { describe, expect, it } from 'vitest';

import { turnFromFen } from './helper.ts';

const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

describe('turnFromFen', () => {
  it('reads white and black from the turn field', () => {
    expect(turnFromFen(startFen)).toBe('white');
    expect(turnFromFen(blackToMoveFen)).toBe('black');
  });

  it('returns null when the turn field is missing or invalid', () => {
    expect(turnFromFen()).toBeNull();
    expect(turnFromFen('')).toBeNull();
    expect(turnFromFen('8/8/8/8/8/8/8/8 x - - 0 1')).toBeNull();
  });
});
