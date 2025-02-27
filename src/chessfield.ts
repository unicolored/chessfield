import './style.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { ApiController } from './controller/api.controller.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardService } from './service/board.service.ts';
import { ChessfieldState, defaults, HeadlessState } from './resource/chessfield.state.ts';
import { configure } from './resource/chessfield.config.ts';

const Chessfield = (container: HTMLElement | null, config?: ChessfieldConfig) => {
  const maybeState: ChessfieldState | HeadlessState = defaults();

  configure(maybeState, config || {});

  if (!container) {
    console.log('Container not found.');
    return;
  }

  const store = new Store(config);
  const gameProvider = new GameProvider(store);
  const boardService = new BoardService(store);

  const apiController = new ApiController(store, gameProvider, boardService);
  if (config && config.fen) {
    apiController.setFen(config.fen);
  }

  apiController.init(container);

  return apiController;
};

export { Chessfield };
