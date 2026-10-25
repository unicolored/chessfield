import { type Container } from '../core/Container.ts';
import type { ResourceDisposal } from '../lifecycle/ResourceDisposal.ts';
import { type ChessfieldConfig } from '../resource/chessfield.config.ts';
import type { TextConfig } from '../service/text/text.service.ts';

export class ConfigManager {
  constructor(
    private readonly container: Container,
    private resourceDisposal: typeof ResourceDisposal,
  ) {}

  async configUpdate(partialConfig: Partial<ChessfieldConfig>): Promise<void> {
    const currentConfig = this.container.getStore().getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.container.getStore().setConfig(updatedConfig);

    // Handle text backend switch
    if (partialConfig.text?.backend && partialConfig.text.backend !== currentConfig.text?.backend) {
      await this.container.getTextService().setBackend(partialConfig.text.backend);
    }

    // Handle player names change
    if (partialConfig.playerNames) {
      this.container.getTextService().removeAll();
      const textColor = this.container.getThemeProvider().getInvertColor();
      const textOptions = this.container.getStore().getConfig().text ?? {};
      textOptions.color = textColor;
      await this.container.getBoardService().addPlayerNames(
        this.container.getTextService(),
        {
          white: partialConfig.playerNames.white ?? 'White',
          black: partialConfig.playerNames.black ?? 'Black',
        },
        {
          ...currentConfig.text,
          ...partialConfig.text,
          ...textOptions,
        } as TextConfig,
        this.container.getStore().getTextGroup(),
      );
    }

    // Clean up moves subscription before restarting
    // if (this.container.getGamePieceService().getMovesSubscription()) {
    //   this.container.getGamePieceService().getMovesSubscription()!();
    //   this.container.getGamePieceService().setMovesSubscription(null);
    // }

    // Dispose resources
    this.resourceDisposal.dispose({
      store: this.container.getStore(),
      shapesService: this.container.getShapesService(),
      stateService: this.container.getStateService(),
      gameProvider: this.container.getGameProvider(),
      renderer: this.container.getStore().renderer,
      controls: this.container.getStore().controls,
      canvas: this.container.getStore().canvas,
    });

    // Restart
    await this.container.getCore().start();
  }
}
