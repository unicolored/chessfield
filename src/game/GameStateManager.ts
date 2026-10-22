import type * as cg from '@lichess-org/chessground/types';

import type { GameProvider } from '../provider/game.provider.ts';
import type { PieceProvider } from '../provider/piece.provider.ts';
import type { Store } from '../provider/store.ts';
import type { GameState } from '../resource/chessfield.state.ts';
import type { GamePieceService } from '../service/game-piece.service.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import type { StateService } from '../service/state.service.ts';

export class GameStateManager {
  constructor(
    private store: Store,
    private gameProvider: GameProvider,
    private pieceProvider: PieceProvider,
    private stateService: StateService,
    private shapesService: ShapesService,
    private gamePieceService: GamePieceService,
  ) {}

  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void {
    this.store.gameState = null;
    this.store.setFen(fen, lastMove);
  }

  setState(state: GameState): void {
    this.store.gameState = state;
    this.gamePieceService.updatePieces();
  }

  /** @deprecated Use setState instead */
  setCheck(state: GameState): void {
    this.setState(state);
  }

  /** @deprecated Use setState instead */
  setGameOver(state: GameState): void {
    this.setState(state);
  }
}
