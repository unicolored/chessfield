import { Chess, BLACK, WHITE, KING } from 'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm';

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
    fen: 'r4k1r/1b2bPR1/p4n1B/3p4/4P2P/1q5B/PpP5/1K4R1 b - - 1 26',
    lastMove: ['e3', 'h6'],
  },
  {
    status: 'timeout',
    fen: '4r1k1/2b2p2/p5pp/1p1RP1r1/4N3/2P1R1P1/PP4K1/8 b - - 6 36',
    lastMove: ['f2', 'e4'],
  },
];

// CHECK
const fenCheck = fens.find(f => f.status === 'check');
const board1 = new Chessfield(document.getElementById('board-check'), {
  orientation: 'white',
  camera: 'white',
  angle: 'right',
  theme: 'green',
  fen: fenCheck.fen,
  lastMove: fenCheck.lastMove,
  zoomMinDistance: 5,
  zoomMaxDistance: 30,
});
chess.load(fenCheck.fen, { skipValidation: false });
const findCheckKing = chess.findPiece({ type: KING, color: chess.turn() });
// -> ['e8']
console.log(`Check king ${chess.turn()} on:`, findCheckKing);
const check = {
  state: 'check',
  kings: {
    white: chess.turn() === 'w' ? findCheckKing.pop() : null,
    black: chess.turn() === 'b' ? findCheckKing.pop() : null,
  },
};
console.log('check', check);
board1.setCheck(check);

// MATE
const board2 = new Chessfield(document.getElementById('board-mate'), {
  orientation: 'white',
  camera: 'black',
  angle: 'left',
  theme: 'brown',
  mode: 'dark',
});
const fenMate = fens.find(f => f.status === 'mate');
board2.setFen(fenMate.fen, fenMate.lastMove);
chess.load(fenMate.fen, { skipValidation: false });
const findWhiteKing = chess.findPiece({ type: KING, color: WHITE });
const findBlackKing = chess.findPiece({ type: KING, color: BLACK });
const gO = {
  state: 'mate',
  winner: 'w',
  kings: {
    // white: findWhiteKing.pop(),
    black: findBlackKing.pop(),
  },
};
console.log('board2 set gO', gO);
board2.setGameOver(gO);

// DRAW
const board3 = new Chessfield(document.getElementById('board-draw'), {
  angle: 'right',
  camera: 'black',
  theme: 'green',
  mode: 'light',
});

const fenDraw = fens.find(f => f.status === 'draw');

board3.setFen(fenDraw.fen, fenDraw.lastMove);
chess.load(fenDraw.fen, { skipValidation: false });
const findDrawWhiteKing = chess.findPiece({ type: KING, color: WHITE });
const findDrawBlackKing = chess.findPiece({ type: KING, color: BLACK });
const gOdraw = {
  state: 'draw',
  kings: {
    white: findDrawWhiteKing.pop(),
    black: findDrawBlackKing.pop(),
  },
};
console.log('board3 set gO', gOdraw);
board3.setGameOver(gOdraw);

// RESIGN
const board4 = new Chessfield(document.getElementById('board-resign'), {});

const fenResign = fens.find(f => f.status === 'resign');

board4.setFen(fenResign.fen, fenResign.lastMove);
chess.load(fenResign.fen, { skipValidation: false });
// const findDrawWhiteKing = chess.findPiece({ type: KING, color: WHITE });
const findResignBlackKing = chess.findPiece({ type: KING, color: BLACK });
const gOresign = {
  state: 'resign',
  winner: 'w',
  kings: {
    // white: findResignWhiteKing.pop(),
    black: findResignBlackKing.pop(),
  },
};
console.log('board4 set gO', gOdraw);
board4.setGameOver(gOresign);

// LOST ON TIME
const board5 = new Chessfield(document.getElementById('board-timeout'), {});

const fenTime = fens.find(f => f.status === 'timeout');

board5.setFen(fenTime.fen, fenTime.lastMove);
chess.load(fenTime.fen, { skipValidation: false });
const findTimeWhiteKing = chess.findPiece({ type: KING, color: WHITE });
// const findDrawBlackKing = chess.findPiece({ type: KING, color: BLACK });
const gOtime = {
  state: 'timeout',
  winner: 'b',
  kings: {
    white: findTimeWhiteKing.pop(),
    // black: findDrawBlackKing.pop(),
  },
};
console.log('board5 set gO', gOdraw);
board5.setGameOver(gOtime);
