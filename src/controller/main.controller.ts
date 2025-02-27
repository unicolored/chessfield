import { LichessTvFeed } from '../interface/feed.interface.ts';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';
// @ts-ignore
import { StreamService } from '../service/stream.service.ts';
import FenParser from '@chess-fu/fen-parser';
import { LichessMoves } from '../interface/lichess.interface.ts';
import { GameProvider } from '../provider/game.provider.ts';
import { Store } from '../provider/store.ts';

export class MainController {
  items: LichessTvFeed[] = [];

  constructor(
    private store: Store,
    private gameProvider: GameProvider,
    // @ts-ignore
    private board: HTMLElement,
    // @ts-ignore
    private config?: ChessfieldConfig,
  ) {}

  updateFen(fen: string | null | undefined) {
    if (fen && FenParser.isFen(fen)) {
      const lichessMoves: LichessMoves = {
        moves: [
          {
            fen: fen,
          },
        ],
      };
      this.gameProvider.initGamePieces(lichessMoves);
      this.store.updatePos(true);
    }
  }
}
