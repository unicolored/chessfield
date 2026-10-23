import { type ChessfieldConfig, type ThemeColors } from '../chessfield';
import { CameraController } from '../config/CameraController';
import { ConfigManager } from '../config/ConfigManager';
import { ThemeController } from '../config/ThemeController';
import { ResourceDisposal } from '../lifecycle/ResourceDisposal';
import { CameraProvider } from '../provider/camera.provider';
import { ControlsProvider } from '../provider/controls.provider';
import { GameProvider } from '../provider/game.provider';
import { LoadingManagerProvider } from '../provider/loadingManager.provider';
import { PieceProvider } from '../provider/piece.provider';
import { RendererProvider } from '../provider/renderer.provider';
import { SceneProvider } from '../provider/scene.provider';
import { Store } from '../provider/store';
import { ThemeProvider } from '../provider/theme.provider';
import { BoardService } from '../service/board.service';
import { GamePieceService } from '../service/game-piece.service';
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
  private rendererProvider!: RendererProvider;
  private controlsProvider!: ControlsProvider;
  private sceneProvider!: SceneProvider;
  private animationLoop!: AnimationLoop;

  private pieceProvider!: PieceProvider;
  private themeProvider!: ThemeProvider;
  private gameProvider!: GameProvider;
  private loadingManagerProvider!: LoadingManagerProvider;

  private boardService!: BoardService;
  private shapesService!: ShapesService;
  private textService!: TextService;
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
      this.core = new ChessfieldCore(
        this._cfElement,
        this.getStore(),
        this.getThemeProvider(),
        this.getSceneProvider(),
        this.getCameraProvider(),
        this.getRendererProvider(),
        this.getControlsProvider(),
        this.getAnimationLoop(),
        this.getLoadingManagerProvider(),
        this.getGamePieceService(),
        this.getShapesService(),
        this.getStateService(),
        this.getBoardService(),
        this.getTextService(),
      );
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
      this.pieceProvider = new PieceProvider(this.getStore());
    }

    return this.pieceProvider;
  }

  getCameraProvider(): CameraProvider {
    if (!this.cameraProvider) {
      this.cameraProvider = new CameraProvider(this._config);
    }

    return this.cameraProvider;
  }

  getControlsProvider(): ControlsProvider {
    if (!this.controlsProvider) {
      this.controlsProvider = new ControlsProvider(this._config);
    }

    return this.controlsProvider;
  }

  getThemeProvider(): ThemeProvider {
    if (!this.themeProvider) {
      this.themeProvider = new ThemeProvider(this._config.mode, this._config.theme);
    }

    return this.themeProvider;
  }

  getRendererProvider(): RendererProvider {
    if (!this.rendererProvider) {
      this.rendererProvider = new RendererProvider();
    }

    return this.rendererProvider;
  }

  getSceneProvider(): SceneProvider {
    if (!this.sceneProvider) {
      this.sceneProvider = new SceneProvider();
    }

    return this.sceneProvider;
  }

  getLoadingManagerProvider(): LoadingManagerProvider {
    if (!this.loadingManagerProvider) {
      this.loadingManagerProvider = new LoadingManagerProvider(this._config, this.getGameProvider());
    }

    return this.loadingManagerProvider;
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
      this.textService = new TextService(this._config?.text?.backend ?? 'canvas-sprite');
    }

    return this.textService;
  }

  getGamePieceService(): GamePieceService {
    if (!this.gamePieceService) {
      this.gamePieceService = new GamePieceService(this);
    }

    return this.gamePieceService;
  }

  getAnimationLoop(): AnimationLoop {
    if (!this.animationLoop) {
      this.animationLoop = new AnimationLoop();
    }

    return this.animationLoop;
  }

  getConfigManager(): ConfigManager {
    if (!this.configManager) {
      this.configManager = new ConfigManager(this, ResourceDisposal);
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
      this.shapeController = new ShapeController(this.getShapesService(), this.getThemeProvider());
    }

    return this.shapeController;
  }

  getCameraController(): CameraController {
    if (!this.cameraController) {
      this.cameraController = new CameraController(this.getCameraProvider(), this.getStore());
    }

    return this.cameraController;
  }
}
