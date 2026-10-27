import { BLACK, Chess, KING, QUEEN, WHITE } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

import { Chessfield } from '../../src/chessfield.ts';

const board1El = document.getElementById('board-1');

const board1 = new Chessfield(board1El, {
  orientation: 'white',
  camera: 'white',
  angle: 'right',
  theme: 'green',
  playerNames: {
    white: 'Player White',
    black: 'Player Black',
  },
  text: {
    backend: 'canvas-sprite',
    fontSize: 0.006,
    offset: 0.07,
  },
  plugins: {
    themes: {
      custom: {
        light: '#e8d5ff',
        dark: '#b388ff',
        highlight: '#ffd700',
        statusCheck: '#ff4444',
        selected: '',
        ring: '#9b59b6',
        ringCtrlAlt: '#e74c3c',
        ringAlt: '#3498db',
        ringCtrl: '#e67e22',
      },
    },
  },
});

const switchThemeBtn = document.getElementById('switch-theme-btn');
if (switchThemeBtn) {
  switchThemeBtn.addEventListener('click', () => {
    board1.switchTheme();
  });
}

const fullscreenBtn = document.getElementById('fullscreen-btn');
const isBoardFullscreen = () => document.fullscreenElement === board1El;

if (fullscreenBtn && board1El) {
  fullscreenBtn.addEventListener('click', () => {
    if (isBoardFullscreen()) {
      void document.exitFullscreen();

      return;
    }

    board1El.requestFullscreen().catch(e => console.error('Fullscreen failed', e));
  });

  // Escape exits fullscreen natively: only the button label has to follow.
  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = isBoardFullscreen() ? 'Exit Fullscreen' : 'Fullscreen';
  });
}

const switchCameraBtn = document.getElementById('switch-camera-btn');

if (switchCameraBtn) {
  const syncCameraLabel = () => {
    switchCameraBtn.textContent = `Camera: ${board1.getCurrentCamera()}`;
  };

  syncCameraLabel();
  switchCameraBtn.addEventListener('click', () => {
    board1.switchCamera();
    syncCameraLabel();
  });
}

const switchModeBtn = document.getElementById('switch-mode-btn');

if (switchModeBtn) {
  const syncModeLabel = () => {
    switchModeBtn.textContent = `Mode: ${board1.getCurrentMode()}`;
  };

  syncModeLabel();
  switchModeBtn.addEventListener('click', () => {
    board1.switchMode();
    syncModeLabel();
  });
}

const switchProjectionBtn = document.getElementById('switch-projection-btn');

if (switchProjectionBtn) {
  const syncProjectionLabel = () => {
    switchProjectionBtn.textContent = `Projection: ${board1.getCurrentProjection()}`;
  };

  syncProjectionLabel();
  switchProjectionBtn.addEventListener('click', () => {
    board1.switchProjection();
    syncProjectionLabel();
  });
}

board1.addRing(6, 2, 'ring');
board1.addRing(7, 2, 'ring');

board1.addRing(6, 3, 'ringAlt');
board1.addRing(7, 3, 'ringAlt');

board1.addRing(6, 4, 'ringCtrl');
board1.addRing(7, 4, 'ringCtrl');

board1.addRing(6, 5, 'ringCtrlAlt');
board1.addRing(7, 5, 'ringCtrlAlt');

// const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'; // e4
const fen = 'rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR b KQkq - 0 1'; // e3
board1.setFen(fen, ['e2', 'e3']);

board1.configUpdate({
  playerNames: {
    white: 'GM White',
    black: 'IM Black',
  },
});

try {
  const chess = new Chess();
  chess.load(fen, { skipValidation: false });

  const whiteKing = chess.findPiece({ type: KING, color: WHITE }).pop() ?? undefined;
  const blackKing = chess.findPiece({ type: KING, color: BLACK }).pop() ?? undefined;
  const whiteQueen = chess.findPiece({ type: QUEEN, color: WHITE }).pop() ?? undefined;
  const blackQueen = chess.findPiece({ type: QUEEN, color: BLACK }).pop() ?? undefined;

  board1.setState({
    winner: WHITE,
    kings: {
      white: whiteKing,
      black: blackKing,
    },
    draw: [whiteQueen, blackQueen],
    mate: [whiteQueen],
    check: [whiteKing, blackKing],
  });

  // const castling = chess.getCastlingRights(BLACK); // black can castle queenside only
  // // -> { 'k': false, 'q': true }
  //
  // const moveNumber = chess.moveNumber();
  //
  // const turn = chess.turn(); // Returns the current side to move.
  //
  // const isAttacked = chess.isAttacked('e4', WHITE); // .isAttacked(square, color)
  //
  // Returns a list of legal moves from the current position.
  // .moves({ piece?: Piece, square?: Square, verbose = false} = {})
  // const legalMoves = chess.moves({ square: 'e7', verbose: true });
  // console.log(legalMoves);
} catch (e) {
  console.error(e);
}
