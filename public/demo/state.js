import { BLACK, Chess, KING, WHITE } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

import { Chessfield } from '../../src/chessfield.ts';

// DEFAULT
new Chessfield(document.getElementById('board-default'), {});

// States
const chess = new Chess();

const fens = [
  {
    status: 'check',
    fen: 'r1b1k2r/1pqpbppp/p3pn2/8/4PB2/2N2n2/PPPQBPPP/R3K2R w KQkq - 0 11',
    lastMove: ['e5', 'f3'],
  },
  {
    status: 'mate',
    fen: '6Qk/7p/p5p1/1b1B4/8/q7/1r3PPP/2R1R1K1 b - - 2 34',
    lastMove: ['f7', 'g8'],
  },
  {
    status: 'draw',
    fen: '5K2/8/8/4q2k/2b5/8/8/8 w - - 32 81',
    lastMove: ['h4', 'h5'],
  },
  {
    status: 'resign',
    fen: '1k1r2r1/pN3p2/1p5p/3RP3/2p2P2/Q7/PPP5/2KR4 b - - 0 32',
    lastMove: ['d6', 'b7'],
  },
  {
    status: 'timeout',
    fen: '8/5ppk/7p/2RpPp2/r2P1P2/8/3NK1PP/8 b - - 3 37',
    lastMove: ['c8', 'c5'],
  },
];

// CHECK
const fenCheck = fens.find(f => f.status === 'check');
if (fenCheck) {
  const board1 = new Chessfield(document.getElementById('board-check'), {
    orientation: 'white',
    camera: 'white',
    angle: 'right',
    theme: 'custom',
    fen: fenCheck.fen,
    lastMove: fenCheck.lastMove,
    zoomMinDistance: 5,
    zoomMaxDistance: 30,
    plugins: {
      themes: {
        custom: {
          light: '#e3dbc9',
          dark: '#cb4444',
          highlight: '#c99a39',
          statusCheck: '#ffff00',
          selected: 'orange',
        },
        chesspop: {
          light: '#e3dbc9',
          dark: '#cb4444',
          highlight: '#c99a39',
          statusCheck: '#ffff00',
          selected: 'orange',
        },
      },
    },
  });
  chess.load(fenCheck.fen, { skipValidation: false });
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

// MATE
const fenMate = fens.find(f => f.status === 'mate');
if (fenMate) {
  const board2 = new Chessfield(document.getElementById('board-mate'), {
    orientation: 'white',
    camera: 'black',
    angle: 'left',
    theme: 'brown',
    mode: 'dark',
  });
  board2.setFen(fenMate.fen, fenMate.lastMove);
  chess.load(fenMate.fen, { skipValidation: false });
  const winner = chess.turn() === WHITE ? BLACK : WHITE;
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
  board2.setState(gO);
}

// DRAW
const fenDraw = fens.find(f => f.status === 'draw');
if (fenDraw) {
  const board3 = new Chessfield(document.getElementById('board-draw'), {
    angle: 'right',
    camera: 'black',
    theme: 'green',
    mode: 'light',
  });
  board3.setFen(fenDraw.fen, fenDraw.lastMove);
  chess.load(fenDraw.fen, { skipValidation: false });
  const findBlackKing = chess.findPiece({ type: KING, color: BLACK }).pop();
  const findWhiteKing = chess.findPiece({ type: KING, color: WHITE }).pop();

  const gOdraw = {
    kings: {
      white: findWhiteKing,
      black: findBlackKing,
    },
    draw: [findWhiteKing, findBlackKing],
  };
  board3.setState(gOdraw);
}

// RESIGN
const fenResign = fens.find(f => f.status === 'resign');
if (fenResign) {
  const board4 = new Chessfield(document.getElementById('board-resign'), {});
  board4.setFen(fenResign.fen, fenResign.lastMove);
  chess.load(fenResign.fen, { skipValidation: false });
  const winner = chess.turn() === WHITE ? BLACK : WHITE;
  const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
  const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });

  const resign = [];
  if (winner === WHITE) {
    resign.push(findBlackKing);
  } else if (winner === BLACK) {
    resign.push(findWhiteKing);
  }

  const gOresign = {
    winner,
    kings: {
      white: findWhiteKing.pop(),
      black: findBlackKing.pop(),
    },
    mate: resign,
  };
  board4.setState(gOresign);
}

// LOST ON TIME
const fenTime = fens.find(f => f.status === 'timeout');
if (fenTime) {
  const board5 = new Chessfield(document.getElementById('board-timeout'), {
    theme: 'custom',
    plugins: {
      themes: {
        custom: {
          light: '#e3dbc9',
          dark: '#cb4444',
          highlight: '#c99a39',
          statusCheck: '#0000ff',
          selected: 'orange',
        },
        chesspop: {
          light: '#e3dbc9',
          dark: '#cb4444',
          highlight: '#c99a39',
          statusCheck: '#ffff00',
          selected: 'orange',
        },
      },
    },
  });
  board5.setFen(fenTime.fen, fenTime.lastMove);
  chess.load(fenTime.fen, { skipValidation: false });
  const winner = chess.turn() === WHITE ? BLACK : WHITE;
  const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
  const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });

  const timeout = [];
  if (winner === WHITE) {
    timeout.push(findBlackKing);
  } else if (winner === BLACK) {
    timeout.push(findWhiteKing);
  }

  const gOtime = {
    winner,
    kings: {
      white: findWhiteKing.pop(),
      black: findBlackKing.pop(),
    },
    mate: timeout,
  };
  board5.setState(gOtime);
}
