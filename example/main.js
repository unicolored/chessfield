import { Chessfield } from '../dist/chessfield.umd.js';

const chessfield = new Chessfield({
    container: document.getElementById('chess-container'),
    fen: 'rnbqkbnr/pppp1ppp/5n2/5p2/5P2/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 2',
});
