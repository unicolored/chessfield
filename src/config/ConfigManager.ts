import type { ChessfieldCore } from '../core/ChessfieldCore.ts';
import type { ResourceDisposal } from '../lifecycle/ResourceDisposal.ts';
import type { Store } from '../provider/store.ts';
import type { ChessfieldConfig, TextConfig } from '../resource/chessfield.types.ts';
import type { BoardService } from '../service/board.service.ts';
import type { TextService } from '../service/text/text.service.ts';

export class ConfigManager {
  constructor(
    private store: Store,
    private textService: TextService,
    private boardService: BoardService,
    private core: ChessfieldCore,
    private resourceDisposal: typeof ResourceDisposal,
  ) {}

  async configUpdate(partialConfig: Partial<ChessfieldConfig>): Promise<void> {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);

    // Handle text backend switch
    if (partialConfig.text?.backend && partialConfig.text.backend !== currentConfig.text?.backend) {
      await this.textService.setBackend(partialConfig.text.backend);
    }

    // Handle player names change
    if (partialConfig.playerNames) {
      this.textService.removeAll();
      await this.boardService.addPlayerNames(
        this.textService,
        {
          white: partialConfig.playerNames.white ?? 'White',
          black: partialConfig.playerNames.black ?? 'Black',
        },
        {
          ...currentConfig.text,
          ...partialConfig.text,
        } as TextConfig,
      );
    }

    // Clean up moves subscription before restarting
    if (this.core.getMovesSubscription()) {
      this.core.getMovesSubscription()!();
      this.core.setMovesSubscription(null);
    }

    // Dispose resources
    this.resourceDisposal.dispose({
      store: this.store,
      shapesService: this.core.getShapesService(),
      stateService: this.core.getStateService(),
      gameProvider: this.core.getGameProvider(),
      eventsService: this.core.getEventsService(),
      renderer: this.core.getRenderer(),
      controls: this.core.getControls(),
      canvas: this.core.getCfElement()?.querySelector('canvas') ?? null,
    });

    // Restart
    await this.core.start();
  }
}
