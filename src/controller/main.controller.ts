import { LichessTvFeed } from "../interface/feed.interface.ts";
import { ChessfieldConfig } from "../resource/chessfield.config.ts";
import { StreamService } from "../service/stream.service.ts";
import FenParser from "@chess-fu/fen-parser";
import { LichessMoves } from "../interface/lichess.interface.ts";
import { GameProvider } from "../provider/game.provider.ts";
import { Store } from "../provider/store.ts";

export class MainController {
  items: LichessTvFeed[] = [];

  constructor(
    private store: Store,
    private gameProvider: GameProvider,
    private board: HTMLDivElement,
    private config: ChessfieldConfig,
  ) {
    // // const stream = fetch('https://lichess.org/api/games/user/neio',{headers:{Accept:'application/x-ndjson'}});
    // StreamService.listenToNdjsonStream('https://lichess.org/api/tv/feed').subscribe({
    //     next: (data: LichessTvFeed) => {
    //         // this.items.push(data); // Add new data to the array
    //         if (data.t === 'fen') {
    //             this.updateFen(data.d.fen);
    //         }
    //     },
    //     error: (err) => {
    //         console.error('Stream error:', err);
    //     },
    //     complete: () => {
    //         console.log('Stream completed');
    //     },
    // });
  }

  onSubmit(): void {
    // const fen = this.optionsForm.value.fen;
    const fen = "";
    this.updateFen(fen);
  }

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
