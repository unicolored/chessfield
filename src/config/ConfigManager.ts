import { type Container } from '../core/Container.ts';
import { Store } from '../provider/store.ts';
import { type ChessfieldConfig } from '../resource/chessfield.config.ts';

export class ConfigManager {
  constructor(private readonly container: Container) {}

  async configUpdate(partialConfig: Partial<ChessfieldConfig>): Promise<void> {
    const store = this.container.getStore();
    const currentConfig = store.getConfig();
    const updatedConfig: ChessfieldConfig = { ...currentConfig, ...partialConfig };

    // Nested options are partial by nature: merge them so unspecified values survive.
    if (partialConfig.text) {
      updatedConfig.text = { ...currentConfig.text, ...partialConfig.text };
    }
    if (partialConfig.playerNames) {
      updatedConfig.playerNames = { ...currentConfig.playerNames, ...partialConfig.playerNames };
    }
    if (partialConfig.loading) {
      updatedConfig.loading = { ...currentConfig.loading, ...partialConfig.loading };
    }

    // Plugin themes must exist before the theme controller validates the requested theme.
    if (partialConfig.plugins) {
      updatedConfig.plugins = { ...currentConfig.plugins, ...partialConfig.plugins };
      if (partialConfig.plugins.themes) {
        Store.themes = { ...Store.themes, ...partialConfig.plugins.themes };
      }
    }

    // Theme and mode own their providers and repaint the board colors.
    if (partialConfig.theme !== undefined) {
      this.container.getThemeController().switchTheme(partialConfig.theme);
    }
    if (partialConfig.mode !== undefined) {
      this.container.getThemeController().switchMode(partialConfig.mode);
    }
    const themeProvider = this.container.getThemeProvider();
    // Keep the stored config truthful when an unknown theme was rejected.
    updatedConfig.theme = themeProvider.getCurrentTheme();
    updatedConfig.mode = themeProvider.getCurrentMode();

    store.setConfig(updatedConfig);

    // Camera positions depend on the camera, angle, orientation and projection.
    if (
      partialConfig.camera !== undefined ||
      partialConfig.angle !== undefined ||
      partialConfig.orientation !== undefined ||
      partialConfig.projection !== undefined
    ) {
      this.container.getCameraController().applyConfig();
    }

    // OrbitControls is created once; update its live settings when it already exists.
    this.container.getControlsProvider().apply(updatedConfig, store.controls);

    // Position updates fall back to the live FEN when only the last move changes.
    if (partialConfig.fen !== undefined || partialConfig.lastMove !== undefined) {
      const fen = partialConfig.fen ?? store.moveSubject$.value?.fen;
      if (fen) {
        this.container.getGamePieceService().setFen(fen, partialConfig.lastMove);
      }
    }

    const backend = partialConfig.text?.backend;
    if (backend !== undefined && backend !== currentConfig.text?.backend) {
      await this.container.getTextService().setBackend(backend);
    }

    // Player names are rebuilt only once the scene exists; SceneComposer handles the first load.
    const appearanceChanged =
      partialConfig.text !== undefined && Object.keys(partialConfig.text).some(key => key !== 'backend');
    const modeChanged = updatedConfig.mode !== currentConfig.mode;
    if (
      store.chessboard &&
      updatedConfig.playerNames &&
      (partialConfig.playerNames !== undefined || appearanceChanged || modeChanged)
    ) {
      await this.refreshPlayerNames();
    }
  }

  /** Rebuild the name labels with the current names, text options and mode contrast color. */
  private async refreshPlayerNames(): Promise<void> {
    const store = this.container.getStore();
    const config = store.getConfig();
    const textService = this.container.getTextService();

    textService.removeAll();

    if (!config.playerNames) {
      return;
    }

    const textConfig = { ...config.text };
    // An explicit text color wins; otherwise use the mode-contrasting default.
    textConfig.color ??= this.container.getThemeProvider().getTextColor();

    await this.container.getBoardService().addPlayerNames(
      textService,
      {
        white: config.playerNames.white ?? 'White',
        black: config.playerNames.black ?? 'Black',
      },
      textConfig,
      store.getTextGroup(),
    );
  }
}
