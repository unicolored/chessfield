import './style.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { MainController } from './controller/main.controller.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardController } from './controller/board.controller.ts';
import { BoardService } from './service/board.service.ts';
import { ChessfieldState, defaults, HeadlessState } from './resource/chessfield.state.ts';
import { configure } from './resource/chessfield.config.ts';

const Chessfield = (container: HTMLElement | null, config?: ChessfieldConfig) => {
  const maybeState: ChessfieldState | HeadlessState = defaults();

  configure(maybeState, config || {});

  console.log('Chessfield!');

  if (!container) {
    console.log('Container not found.');
    return;
  }

  const store = new Store();
  const gameProvider = new GameProvider(store);
  const boardService = new BoardService(store);

  const mainController = new MainController(store, gameProvider, container, config);
  if (config && config.fen) {
    mainController.updateFen(config.fen);
  }

  const boardController = new BoardController(store, boardService, container);
  boardController.init();

  return mainController;
};

export { Chessfield };
