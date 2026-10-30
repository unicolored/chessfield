import { type ChessfieldConfig, type ThemeColors } from '../chessfield';
import { CameraController } from '../config/CameraController';
import { ConfigManager } from '../config/ConfigManager';
import { ThemeController } from '../config/ThemeController';
import { CameraProvider } from '../provider/camera.provider';
import { ControlsProvider } from '../provider/controls.provider';
import { GameProvider } from '../provider/game.provider';
import { LoadingManagerProvider } from '../provider/loadingManager.provider';
import { PieceProvider } from '../provider/piece.provider';
import { Store } from '../provider/store';
import { ThemeProvider } from '../provider/theme.provider';
import { BoardService } from '../service/board.service';
import { ClockService } from '../service/clock.service';
import { GamePieceService } from '../service/game-piece.service';
import { LoadingService } from '../service/loading.service';
import { ShapesService } from '../service/shapes.service';
import { StateService } from '../service/state.service';
import { TextService } from '../service/text/text.service';
import { ShapeController } from '../shapes/ShapeController';

import { AnimationLoop } from './AnimationLoop';
import { ChessfieldCore } from './ChessfieldCore';

export class Container {
  private core!: ChessfieldCore;
  private store!: Store;

  private cameraProvider!: CameraProvider;
  private controlsProvider!: ControlsProvider;
  private animationLoop!: AnimationLoop;

  private pieceProvider!: PieceProvider;
  private themeProvider!: ThemeProvider;
  private gameProvider!: GameProvider;
  private loadingManagerProvider!: LoadingManagerProvider;
  private loadingService!: LoadingService;

  private boardService!: BoardService;
  private shapesService!: ShapesService;
  private textService!: TextService;
  private clockService!: ClockService;
  private stateService!: StateService;
  private gamePieceService!: GamePieceService;

  private themeController!: ThemeController;
  private shapeController!: ShapeController;
  private cameraController!: CameraController;

  private configManager!: ConfigManager;

  constructor(
    private _cfElement: HTMLElement,
    private _config: ChessfieldConfig,
  ) {}

  getCore(): ChessfieldCore {
    if (!this.core) {
      this.core = new ChessfieldCore(this, this._cfElement);
    }

    return this.core;
  }

  getStore(): Store {
    if (!this.store) {
      this.store = new Store(this._config);
    }

    return this.store;
  }

  getGameProvider(): GameProvider {
    if (!this.gameProvider) {
      this.gameProvider = new GameProvider(this.getStore());
    }

    return this.gameProvider;
  }

  getPieceProvider(): PieceProvider {
    if (!this.pieceProvider) {
      this.pieceProvider = new PieceProvider(this.getStore(), this.getGameProvider());
    }

    return this.pieceProvider;
  }

  getCameraProvider(): CameraProvider {
    if (!this.cameraProvider) {
      this.cameraProvider = new CameraProvider(this.getStore().getConfig());
    }

    return this.cameraProvider;
  }

  getControlsProvider(): ControlsProvider {
    if (!this.controlsProvider) {
      this.controlsProvider = new ControlsProvider(this.getStore().getConfig());
    }

    return this.controlsProvider;
  }

  getThemeProvider(): ThemeProvider {
    if (!this.themeProvider) {
      const config = this.getStore().getConfig();
      this.themeProvider = new ThemeProvider(config.mode, config.theme);
    }

    return this.themeProvider;
  }

  getLoadingManagerProvider(): LoadingManagerProvider {
    if (!this.loadingManagerProvider) {
      this.loadingManagerProvider = new LoadingManagerProvider(
        this.getStore().getConfig(),
        this.getGameProvider(),
      );
    }

    return this.loadingManagerProvider;
  }

  getLoadingService(): LoadingService {
    if (!this.loadingService) {
      this.loadingService = new LoadingService();
    }

    return this.loadingService;
  }

  getBoardService(): BoardService {
    if (!this.boardService) {
      this.boardService = new BoardService();
    }

    return this.boardService;
  }

  getShapesService(): ShapesService {
    if (!this.shapesService) {
      this.shapesService = new ShapesService(['ring']);
    }

    return this.shapesService;
  }

  getStateService(): StateService {
    if (!this.stateService) {
      const themeColors: ThemeColors = this.getThemeProvider().getThemeColors();
      this.stateService = new StateService([['check', String(themeColors.statusCheck)]]);
    }

    return this.stateService;
  }

  getTextService(): TextService {
    if (!this.textService) {
      const backend = this.getStore().getConfig().text?.backend ?? 'canvas-sprite';
      // The callback lets async text (and troika glyph syncing) repaint the idle loop.
      this.textService = new TextService(backend, () => this.getStore().requestRender());
    }

    return this.textService;
  }

  getGamePieceService(): GamePieceService {
    if (!this.gamePieceService) {
      this.gamePieceService = new GamePieceService(this);
    }

    return this.gamePieceService;
  }

  getClockService(): ClockService {
    if (!this.clockService) {
      this.clockService = new ClockService(this.getStore());
    }

    return this.clockService;
  }

  getAnimationLoop(): AnimationLoop {
    if (!this.animationLoop) {
      this.animationLoop = new AnimationLoop();
    }

    return this.animationLoop;
  }

  getConfigManager(): ConfigManager {
    if (!this.configManager) {
      this.configManager = new ConfigManager(this);
    }

    return this.configManager;
  }

  getThemeController(): ThemeController {
    if (!this.themeController) {
      this.themeController = new ThemeController(this);
    }

    return this.themeController;
  }

  getShapeController(): ShapeController {
    if (!this.shapeController) {
      // The controller needs the store to request a frame after changing shapes.
      this.shapeController = new ShapeController(
        this.getShapesService(),
        this.getThemeProvider(),
        this.getStore(),
      );
    }

    return this.shapeController;
  }

  getCameraController(): CameraController {
    if (!this.cameraController) {
      this.cameraController = new CameraController(
        this.getCameraProvider(),
        this.getStore(),
        this.getControlsProvider(),
      );
    }

    return this.cameraController;
  }
}
