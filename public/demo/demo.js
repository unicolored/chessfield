import { BLACK, Chess, WHITE } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

import { Chessfield } from '../../src/chessfield.ts';

const board1 = new Chessfield(document.getElementById('board-1'), {
  orientation: 'white',
  camera: 'white',
  angle: 'right',
  theme: 'green',
});

// board1.setShape(2, 5, '#0000ff');

// board1.setShape(7, 7, '#ff0000');

// Clear specific square
// board1.clearShape(3, 4);

// Clear all
// board1.clearShape();

const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
board1.setFen(fen, ['e2', 'e4']);

const chess = new Chess();

try {
  // chess.setHeader('White', 'Morphy'); // Retrieve the PGN headers.
  // chess.setHeader(WHITE, 'Morphy'); // Retrieve the PGN headers.
  // chess.setHeader('Black', 'Anderssen');
  // chess.setHeader(BLACK, 'Anderssen');
  // chess.setHeader('Date', '1858-??-??');

  // const headers = chess.getHeaders();

  console.log(`${chess.getHeaders()[WHITE]} plays against ${chess.getHeaders()[BLACK]}`);

  chess.load(fen, { skipValidation: false });

  // const castling = chess.getCastlingRights(BLACK); // black can castle queenside only
  // // -> { 'k': false, 'q': true }
  //
  // const moveNumber = chess.moveNumber();
  //
  // const turn = chess.turn(); // Returns the current side to move.
  //
  // const isAttacked = chess.isAttacked('e4', WHITE); // .isAttacked(square, color)

  // Returns a list of legal moves from the current position.
  // .moves({ piece?: Piece, square?: Square, verbose = false} = {})
  // const legalMoves = chess.moves({ square: 'e7', verbose: true });
  // console.log(legalMoves);
} catch (e) {
  console.error(e);
}
