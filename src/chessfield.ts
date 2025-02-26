import './style.css'

import {ChessfieldConfig} from "./resource/chessfield.config.ts";
import {MainController} from "./controller/main.controller.ts";
import {GameProvider} from "./provider/game.provider.ts";
import {Store} from "./provider/store.ts";
import {BoardController} from "./controller/board.controller.ts";
import {BoardService} from "./service/board.service.ts";

const container = document.querySelector('div.chessfield') as HTMLDivElement;

if (container) {

    const store = new Store();
    const gameProvider = new GameProvider(store);
    const boardService = new BoardService(store);

    const config: ChessfieldConfig = {
        orientation: 'white',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        coordinates: false,
    }

    new MainController(store, gameProvider, container, config);

    const boardController = new BoardController(store, boardService, container);
    boardController.init();
}
