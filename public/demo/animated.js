import { BLACK, Chess, KING, WHITE } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

import { Chessfield } from '../../src/chessfield.ts';

const board1 = new Chessfield(document.getElementById('board-1'), {
  orientation: 'white',
  camera: 'white',
  angle: 'right',
  theme: 'green',
});

// board1.setShape(0, 0, '#0000ff');

// board1.setShape(7, 7, '#ff0000');

// Clear specific square
// board1.clearShape(3, 4);

// Clear all
// board1.clearShape();

const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
board1.setFen(fen, ['e2', 'e4']);

const chess = new Chess();

try {
  // import { validateFen } from 'chess.js'
  // validateFen('2n1r3/p1k2pp1/B1p3b1/P7/5bP1/2N1B3/1P2KP2/2R5 b - - 4 25')
  // -> { ok: true }

  // .load(fen: string, { skipValidation = false, preserveHeaders = false } = {})

  chess.setHeader('White', 'Morphy'); // Retrieve the PGN headers.
  chess.setHeader(WHITE, 'Morphy'); // Retrieve the PGN headers.
  chess.setHeader('Black', 'Anderssen');
  chess.setHeader(BLACK, 'Anderssen');
  chess.setHeader('Date', '1858-??-??');

  const headers = chess.getHeaders();

  console.log(`${chess.getHeaders()[WHITE]} plays against ${chess.getHeaders()[BLACK]}`);

  chess.load(fen, { skipValidation: false });

  let lastTime = 0;
  const delay = 5;

  function animate(time) {
    if (!lastTime) lastTime = time;
    if (time - lastTime >= delay && !chess.isGameOver()) {
      lastTime = time;
      const moves = chess.moves();
      const move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move);
      const history = chess.history({ verbose: true });
      const lastMove = [history[history.length - 1].from, history[history.length - 1].to];
      board1.setFen(chess.fen(), lastMove);

      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          // Winner is the OPPOSITE of the side to move (they just got checkmated)
          const winner = chess.turn() === WHITE ? BLACK : WHITE;
          const loser = winner === WHITE ? BLACK : WHITE;
          console.log(`Checkmate! Winner: ${winner}`);

          const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
          const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });
          // -> ['e8']
          // console.log(`Mate king ${loser} on:`, findMateKing);
          // console.log(`Winner king ${winner} on:`, findWinnerKing);
          console.log(`${headers[winner]} wins over ${headers[loser]}`);

          const gO = {
            winner,
            kings: {
              white: findWhiteKing.pop(),
              black: findBlackKing.pop(),
            },
          };
          board1.setGameOver(gO);
        } else if (chess.isDraw()) {
          // It's a draw - check specific reason
          console.log('Draw!');
          console.log(`${headers[WHITE]} draw ${headers[BLACK]}`);
          console.log('Stalemate:', chess.isStalemate());
          console.log('Threefold repetition:', chess.isThreefoldRepetition());
          console.log('50-move rule:', chess.isDrawByFiftyMoves());
          console.log('Insufficient material:', chess.isInsufficientMaterial());

          const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
          const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });

          const gO = {
            kings: {
              white: findWhiteKing.pop(),
              black: findBlackKing.pop(),
            },
          };
          board1.setGameOver(gO);
        }
      } else if (chess.inCheck()) {
        // Find king in check

        // Returns a list containing the squares where the requested piece is located. Returns an empty list if the piece is not on the board.
        const findCheckKing = chess.findPiece({ type: KING, color: chess.turn() });
        // -> ['e8']
        const check = {
          kings: {
            white: chess.turn() === 'w' ? findCheckKing.pop() : null,
            black: chess.turn() === 'b' ? findCheckKing.pop() : null,
          },
        };
        board1.setCheck(check);
      }
    }
    if (!chess.isGameOver()) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // const castling = chess.getCastlingRights(BLACK); // black can castle queenside only
  // // -> { 'k': false, 'q': true }
  //
  // const moveNumber = chess.moveNumber();
  //
  // const turn = chess.turn(); // Returns the current side to move.
  //
  // const isAttacked = chess.isAttacked('e4', WHITE); // .isAttacked(square, color)

  // if (chess.isGameOver()) {
  //   const isCheckmate = chess.isCheckmate(); // Returns true or false if the side to move has been checkmated.
  //   console.log('Checkmate', isCheckmate);
  //
  //   if (chess.isDraw()) {
  //     console.log('isDraw');
  //     console.log('Draw by stalemate', chess.isStalemate());
  //     console.log('Draw by 50moves', chess.isDrawByFiftyMoves());
  //     console.log('Draw by insufficient material', chess.isInsufficientMaterial());
  //
  //     // Returns true or false if the current board position has occurred three or more times.
  //     console.log('Draw by threefold repeition', chess.isThreefoldRepetition());
  //   }
  // }

  // Returns a list of legal moves from the current position.
  // .moves({ piece?: Piece, square?: Square, verbose = false} = {})
  // const legalMoves = chess.moves({ square: 'e7', verbose: true });
  // console.log(legalMoves);
} catch (e) {
  console.error(e);
}
