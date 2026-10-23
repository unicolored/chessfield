import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { ChessfieldConfig, ThemeColors } from '../chessfield';
import { CameraController } from '../config/CameraController';
import { ConfigManager } from '../config/ConfigManager';
import { ThemeController } from '../config/ThemeController';
import { GameStateManager } from '../game/GameStateManager';
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
import { EventsService } from '../service/events.service';
import { GamePieceService } from '../service/game-piece.service';
import { ShapesService } from '../service/shapes.service';
import { StateService } from '../service/state.service';
import { TextService } from '../service/text/text.service';
import { ShapeController } from '../shapes/ShapeController';
import { AnimationLoop } from './AnimationLoop';

export class Container {
  private readonly store: Store;

  private cameraProvider: CameraProvider;
  private rendererProvider: RendererProvider;
  private controlsProvider: ControlsProvider;
  private sceneProvider: SceneProvider;
  private animationLoop: AnimationLoop;

  private gameProvider: GameProvider;
  private pieceProvider: PieceProvider;
  private themeProvider: ThemeProvider;
  private loadingManagerProvider: LoadingManagerProvider;
  private boardService: BoardService;
  private shapesService: ShapesService;
  private stateService: StateService;
  private textService: TextService;
  private gamePieceService: GamePieceService;
  private eventsService: EventsService | null = null;
  private readonly gameStateManager: GameStateManager;
  private readonly themeController: ThemeController;
  private readonly configManager: ConfigManager;
  private readonly shapeController: ShapeController;
  private readonly cameraController: CameraController;

  constructor(config: ChessfieldConfig) {
    this.store = new Store(config);

    // ThreeJS
    this.cameraProvider = new CameraProvider(config);
    this.rendererProvider = new RendererProvider();
    this.controlsProvider = new ControlsProvider(config);
    this.sceneProvider = new SceneProvider();
    this.animationLoop = new AnimationLoop();

    // Providers
    this.pieceProvider = new PieceProvider(this.store);
    this.themeProvider = new ThemeProvider(config.mode, config.theme);
    const themeColors: ThemeColors = this.themeProvider.getThemeColors();

    // Loader
    this.gameProvider = new GameProvider(this.store);
    this.loadingManagerProvider = new LoadingManagerProvider(config, this.gameProvider);

    // Services
    this.boardService = new BoardService();
    this.shapesService = new ShapesService(['ring']);
    this.textService = new TextService(config?.text?.backend ?? 'canvas-sprite');

    this.stateService = new StateService([['check', String(themeColors.statusCheck)]]);

    this.gamePieceService = new GamePieceService(this);

    this.themeController = new ThemeController(this);

    this.configManager = new ConfigManager(this, ResourceDisposal);

    // Initialize camera controller after core has camera/camGroup
    // We'll set it up after start() is called

    this.gameStateManager = new GameStateManager(this);

    this.shapeController = new ShapeController(this.shapesService, this.themeProvider);

    // Camera controller will be initialized after start()
    this.cameraController = new CameraController(this.cameraProvider, this.store);
  }

  getStore(): Store {
    return this.store;
  }

  getGameProvider(): GameProvider {
    return this.gameProvider;
  }

  getPieceProvider(): PieceProvider {
    return this.pieceProvider;
  }

  getCameraProvider(): CameraProvider {
    return this.cameraProvider;
  }

  getControlsProvider(): ControlsProvider {
    return this.controlsProvider;
  }

  getThemeProvider(): ThemeProvider {
    return this.themeProvider;
  }

  getRendererProvider(): RendererProvider {
    return this.rendererProvider;
  }

  getSceneProvider(): SceneProvider {
    return this.sceneProvider;
  }

  getLoadingManagerProvider(): LoadingManagerProvider {
    return this.loadingManagerProvider;
  }

  getBoardService(): BoardService {
    return this.boardService;
  }

  getShapesService(): ShapesService {
    return this.shapesService;
  }

  getStateService(): StateService {
    return this.stateService;
  }

  getTextService(): TextService {
    return this.textService;
  }

  getGamePieceService(): GamePieceService {
    return this.gamePieceService;
  }

  getEventsService(): EventsService | null {
    return this.eventsService;
  }

  getRenderer(): THREE.WebGPURenderer | null {
    return this.renderer;
  }

  getRenderPipeline(): THREE.RenderPipeline | null {
    return this.renderPipeline;
  }

  getControls(): OrbitControls | null {
    return this.controls;
  }

  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  getCamGroup(): THREE.Group | null {
    return this.camGroup;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    (this as any).canvas = canvas;
  }

  setRenderer(renderer: THREE.WebGPURenderer): void {
    this.renderer = renderer;
  }

  setRenderPipeline(renderer: THREE.WebGPURenderer): void {
    this.renderPipeline = new THREE.RenderPipeline(renderer);
  }

  setControls(controls: OrbitControls): void {
    (this as any).controls = controls;
  }

  setCamera(camera: THREE.PerspectiveCamera): void {
    (this as any).camera = camera;
  }

  setCamGroup(camGroup: THREE.Group): void {
    (this as any).camGroup = camGroup;
  }

  getMovesSubscription(): (() => void) | null {
    return this.movesSubscription;
  }

  setMovesSubscription(sub: (() => void) | null): void {
    this.movesSubscription = sub;
  }

  getAnimationLoop(): AnimationLoop {
    return this.animationLoop;
  }

  getGameStateManger(): GameStateManager {
    return this.gameStateManager;
  }
}
