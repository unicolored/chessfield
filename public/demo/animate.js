import { BLACK, Chess, KING, WHITE } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

import { Chessfield } from '../../src/chessfield.ts';

const board1 = new Chessfield(document.getElementById('board-1'), {
  orientation: 'white',
  camera: 'white',
  angle: 'right',
  theme: 'green',
});

// const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
// board1.setFen(fen, ['e2', 'e4']);

const chess = new Chess();

try {
  // chess.load(fen, { skipValidation: false });

  const addFenBtn = document.getElementById('add-fen-btn');
  if (addFenBtn) {
    addFenBtn.addEventListener('click', animate.bind(this));
  }

  function animate() {
    const moves = chess.moves();
    const move = moves[Math.floor(Math.random() * moves.length)];

    console.log(move);
    const previousFen = chess.fen();
    chess.move(move);
    const currentFen = chess.fen();
    const history = chess.history({ verbose: true });
    const lastMove = [history[history.length - 1].from, history[history.length - 1].to];
    board1.setFen(currentFen, lastMove, previousFen);

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        // Winner is the OPPOSITE of the side to move (they just got checkmated)
        const winner = chess.turn() === WHITE ? BLACK : WHITE;
        const loser = winner === WHITE ? BLACK : WHITE;
        console.log(`Checkmate! Winner: ${winner}`);

        const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
        const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });

        const mate = [];
        if (winner === WHITE) {
          mate.push(findBlackKing);
        } else if (winner === BLACK) {
          mate.push(findWhiteKing);
        }

        const gO = {
          winner,
          kings: {
            white: findWhiteKing.pop(),
            black: findBlackKing.pop(),
          },
          mate,
        };
        board1.setState(gO);
      } else if (chess.isDraw()) {
        // It's a draw - check specific reason
        console.log('Draw!');
        console.log('Stalemate:', chess.isStalemate());
        console.log('Threefold repetition:', chess.isThreefoldRepetition());
        console.log('50-move rule:', chess.isDrawByFiftyMoves());
        console.log('Insufficient material:', chess.isInsufficientMaterial());

        const findBlackKing = chess.findPiece({ type: KING, color: BLACK }).pop();
        const findWhiteKing = chess.findPiece({ type: KING, color: WHITE }).pop();

        const gO = {
          kings: {
            white: findWhiteKing,
            black: findBlackKing,
          },
          draw: [findWhiteKing, findBlackKing],
        };
        board1.setState(gO);
      }
    } else if (chess.inCheck()) {
      // Find king in check

      // Returns a list containing the squares where the requested piece is located. Returns an empty list if the piece is not on the board.
      const findCheckKing = chess.findPiece({ type: KING, color: chess.turn() });
      // -> ['e8']
      const check = {
        check: [
          chess.turn() === 'w' ? findCheckKing.pop() : undefined,
          chess.turn() === 'b' ? findCheckKing.pop() : undefined,
        ],
      };
      board1.setState(check);
    }
  }
} catch (e) {
  console.error(e);
}
