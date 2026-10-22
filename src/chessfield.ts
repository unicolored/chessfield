import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';

import { CameraController } from './config/CameraController.ts';
import { ConfigManager } from './config/ConfigManager.ts';
import { ThemeController } from './config/ThemeController.ts';
import { ChessfieldCore } from './core/ChessfieldCore.ts';
import { GameStateManager } from './game/GameStateManager.ts';
import { ResourceDisposal } from './lifecycle/ResourceDisposal.ts';
import { CameraProvider } from './provider/camera.provider.ts';
import { ControlsProvider } from './provider/controls.provider.ts';
import { GameProvider } from './provider/game.provider.ts';
import { LoadingManagerProvider } from './provider/loadingManager.provider.ts';
import { PieceProvider } from './provider/piece.provider.ts';
import { RendererProvider } from './provider/renderer.provider.ts';
import { SceneProvider } from './provider/scene.provider.ts';
import { Store } from './provider/store.ts';
import { ThemeProvider } from './provider/theme.provider.ts';
import { type ChessfieldApi } from './resource/chessfield.api.ts';
import { type ChessfieldConfig } from './resource/chessfield.config.ts';
import { type GameState } from './resource/chessfield.state.ts';
import { BoardService } from './service/board.service.ts';
import { GamePieceService } from './service/game-piece.service.ts';
import { ShapesService } from './service/shapes.service.ts';
import { StateService } from './service/state.service.ts';
import { TextService } from './service/text/text.service.ts';
import { ShapeController } from './shapes/ShapeController.ts';

export type { ChessfieldApi, ChessfieldConfig, GameState };
export * from './resource/chessfield.types';

export class Chessfield implements ChessfieldApi {
  private readonly core: ChessfieldCore;
  private readonly themeController: ThemeController;
  private readonly cameraController: CameraController;
  private readonly configManager: ConfigManager;
  private readonly gameStateManager: GameStateManager;
  private readonly shapeController: ShapeController;

  public readonly textService: TextService;

  constructor(
    private cfElement: HTMLElement | null,
    config: ChessfieldConfig = {},
  ) {
    const store = new Store(config);
    const textService = new TextService(config?.text?.backend ?? 'canvas-sprite');

    if (this.cfElement && this.cfElement instanceof HTMLElement) {
      const gameProvider = new GameProvider(store);
      const pieceProvider = new PieceProvider(store);
      const cameraProvider = new CameraProvider(config);
      const controlsProvider = new ControlsProvider(config);
      const themeProvider = new ThemeProvider(config.mode, config.theme);
      const rendererProvider = new RendererProvider();
      const sceneProvider = new SceneProvider();
      const loadingManagerProvider = new LoadingManagerProvider(config, gameProvider);
      const boardService = new BoardService();
      const shapesService = new ShapesService(['ring']);
      const stateService = new StateService([['check', String(themeProvider.getThemeColors().statusCheck)]]);

      const gamePieceService = new GamePieceService(
        store,
        gameProvider,
        pieceProvider,
        stateService,
        shapesService,
        themeProvider,
      );

      const core = new ChessfieldCore(this.cfElement, {
        store,
        gameProvider,
        pieceProvider,
        cameraProvider,
        controlsProvider,
        themeProvider,
        rendererProvider,
        sceneProvider,
        loadingManagerProvider,
        boardService,
        shapesService,
        stateService,
        textService,
        gamePieceService,
      });

      const themeController = new ThemeController(
        themeProvider,
        store,
        boardService,
        stateService,
        sceneProvider,
      );

      const configManager = new ConfigManager(store, textService, boardService, core, ResourceDisposal);

      // Initialize camera controller after core has camera/camGroup
      // We'll set it up after start() is called

      const gameStateManager = new GameStateManager(
        store,
        gameProvider,
        pieceProvider,
        stateService,
        shapesService,
        gamePieceService,
      );

      const shapeController = new ShapeController(shapesService, themeProvider);

      this.core = core;
      this.themeController = themeController;
      this.configManager = configManager;
      this.gameStateManager = gameStateManager;
      this.shapeController = shapeController;
      this.textService = textService;

      // Camera controller will be initialized after start()
      this.cameraController = new CameraController(
        cameraProvider,
        store,
        this.core.getCamera(),
        this.core.getCamGroup(),
      );

      // Set initial FEN
      const initialFen = store.getConfig().fen ?? Store.initialFen;
      const initialLastMove = store.getConfig().lastMove ?? [];
      this.gameStateManager.setFen(initialFen, initialLastMove);
      // store.setFen(initialFen, initialLastMove);

      this.start();
    } else {
      // Create dummy instances for when cfElement is null
      this.core = null as any;
      this.themeController = null as any;
      this.cameraController = null as any;
      this.configManager = null as any;
      this.gameStateManager = null as any;
      this.shapeController = null as any;
      this.textService = textService;
    }
  }

  private async start(): Promise<void> {
    if (!this.cfElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    await this.core.start();
  }

  public setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.gameStateManager.setFen(fen, lastMove);
  }

  public async configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    await this.configManager.configUpdate(partialConfig);
  }

  public switchTheme(theme?: string): void {
    this.themeController.switchTheme(theme);
  }

  public getThemeColors() {
    return this.themeController.getThemeColors();
  }

  public getCurrentCamera() {
    return this.cameraController.getCurrentCamera();
  }

  public getCurrentMode() {
    return this.themeController.getCurrentMode();
  }

  public switchMode(mode?: 'light' | 'dark'): void {
    this.themeController.switchMode(mode);
  }

  public switchCamera(camera?: string): void {
    this.cameraController.switchCamera(camera as any);
  }

  public setState(state: GameState): void {
    this.gameStateManager.setState(state);
  }

  /** @deprecated Use setState instead */
  public setCheck(state: GameState): void {
    this.gameStateManager.setCheck(state);
  }

  /** @deprecated Use setState instead */
  public setGameOver(state: GameState): void {
    this.gameStateManager.setGameOver(state);
  }

  public addRing(rank: number, file: number, shape: string): void {
    this.shapeController.addRing(rank, file, shape);
  }

  public clearShape(rank?: number, file?: number, shaderName?: string): void {
    this.shapeController.clearShape(rank, file, shaderName);
  }
}
