import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type * as THREE from 'three/webgpu';

import type { CameraProvider } from '../provider/camera.provider.ts';
import type { ControlsProvider } from '../provider/controls.provider.ts';
import { type GameProvider } from '../provider/game.provider.ts';
import type { LoadingManagerProvider } from '../provider/loadingManager.provider.ts';
import type { PieceProvider } from '../provider/piece.provider.ts';
import type { RendererProvider } from '../provider/renderer.provider.ts';
import type { SceneProvider } from '../provider/scene.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ThemeProvider } from '../provider/theme.provider.ts';
import type { BoardService } from '../service/board.service.ts';
import type { EventsService } from '../service/events.service.ts';
import type { GamePieceService } from '../service/game-piece.service.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import type { StateService } from '../service/state.service.ts';
import type { TextService } from '../service/text/text.service.ts';

import { AnimationLoop } from './AnimationLoop.ts';
import { SceneComposer } from './SceneComposer.ts';

export interface ChessfieldCoreDependencies {
  store: Store;
  gameProvider: GameProvider;
  pieceProvider: PieceProvider;
  cameraProvider: CameraProvider;
  controlsProvider: ControlsProvider;
  themeProvider: ThemeProvider;
  rendererProvider: RendererProvider;
  sceneProvider: SceneProvider;
  loadingManagerProvider: LoadingManagerProvider;
  boardService: BoardService;
  shapesService: ShapesService;
  stateService: StateService;
  textService: TextService;
  gamePieceService: GamePieceService;
}

export class ChessfieldCore {
  private cfElement: HTMLElement | null;
  private store: Store;
  private gameProvider: GameProvider;
  private pieceProvider: PieceProvider;
  private cameraProvider: CameraProvider;
  private controlsProvider: ControlsProvider;
  private themeProvider: ThemeProvider;
  private rendererProvider: RendererProvider;
  private sceneProvider: SceneProvider;
  private loadingManagerProvider: LoadingManagerProvider;
  private boardService: BoardService;
  private shapesService: ShapesService;
  private stateService: StateService;
  private textService: TextService;
  private gamePieceService: GamePieceService;
  private eventsService: EventsService | null = null;

  public readonly canvas: HTMLCanvasElement | null = null;
  public readonly renderer: THREE.WebGPURenderer | null = null;
  public readonly controls: OrbitControls | null = null;
  public readonly camera: THREE.PerspectiveCamera | null = null;
  public readonly camGroup: THREE.Group | null = null;

  private animationLoop: AnimationLoop;

  constructor(cfElement: HTMLElement | null, deps: ChessfieldCoreDependencies) {
    this.cfElement = cfElement;
    this.store = deps.store;
    this.gameProvider = deps.gameProvider;
    this.pieceProvider = deps.pieceProvider;
    this.cameraProvider = deps.cameraProvider;
    this.controlsProvider = deps.controlsProvider;
    this.themeProvider = deps.themeProvider;
    this.rendererProvider = deps.rendererProvider;
    this.sceneProvider = deps.sceneProvider;
    this.loadingManagerProvider = deps.loadingManagerProvider;
    this.boardService = deps.boardService;
    this.shapesService = deps.shapesService;
    this.stateService = deps.stateService;
    this.textService = deps.textService;
    this.gamePieceService = deps.gamePieceService;
    this.animationLoop = new AnimationLoop();
  }

  getCfElement(): HTMLElement | null {
    return this.cfElement;
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

  getEventsService(): EventsService {
    return this.eventsService;
  }

  getRenderer(): THREE.WebGPURenderer | null {
    return this.renderer;
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
    (this as any).renderer = renderer;
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

  async start(): Promise<void> {
    if (!this.cfElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    this.cfElement.classList.add('cf-chessfield-container');

    const rect = this.cfElement.getBoundingClientRect();
    const sizes = {
      width: rect.width,
      height: rect.height,
    };

    // Scene
    const backgroundColor = this.themeProvider.getBackgroundColor();
    this.store.scene = this.sceneProvider.getScene(backgroundColor);

    // Camera
    const camera = this.cameraProvider.getCamera(sizes);
    const camGroup = this.cameraProvider.getCameraGroup(camera);
    this.store.scene.add(camGroup);

    // Save camera references for direct updates
    this.setCamera(camera);
    this.setCamGroup(camGroup);

    // Canvas & Renderer
    const canvas = this.rendererProvider.getCanvas();
    const renderer = this.rendererProvider.getRenderer(sizes, canvas);
    this.setCanvas(canvas);
    this.setRenderer(renderer);
    this.cfElement.appendChild(renderer.domElement);

    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      renderer.inspector = new Inspector();
    }

    // Controls
    const controls = this.controlsProvider.getControls(camera, canvas);
    this.setControls(controls);

    // Create EventsService now that canvas, camera, and scene are available
    const { EventsService } = await import('../service/events.service.ts');
    this.eventsService = new EventsService({
      cfElement: this.cfElement!,
      canvas,
      camera,
      scene: this.store.scene!,
      store: this.store,
      shapesService: this.shapesService,
    });

    // Loading Management
    const font = this.loadingManagerProvider.font;

    this.loadingManagerProvider.getLoadingManager().onError = e => {
      console.error('error', e);
    };

    this.loadingManagerProvider.getLoadingManager().onLoad = this.onLoad.bind(
      this,
      camera,
      this.store.scene,
      font,
    );
  }

  private async onLoad(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    font: Font | null,
  ): Promise<void> {
    if (!this.cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
      return;
    }

    // Compose the scene
    SceneComposer.compose(
      scene,
      this.store,
      this.boardService,
      this.shapesService,
      this.stateService,
      this.textService,
      this.themeProvider,
      this.store.getConfig(),
      font,
    );

    // Update pieces
    this.gamePieceService.updatePieces();

    // Setup events
    this.eventsService.onSquareHover = (rank, file) => {
      this.store.chessboard?.highlightSquareCursor(rank, file);
    };

    this.eventsService.onSquareRightClick = this.gamePieceService.addRingAt.bind(this.gamePieceService);

    this.eventsService.onLeftClickClear = () => this.shapesService.clearAll();

    this.eventsService.onResize = async () => {
      if (!this.cfElement) {
        return;
      }

      const rect = this.cfElement.getBoundingClientRect();
      const sizes = { width: rect.width, height: rect.height };
      this.renderer?.setSize(sizes.width, sizes.height);
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
    };

    this.eventsService.init();

    // Start animation loop
    const controls = this.getControls();
    const renderer = this.getRenderer();
    if (controls && renderer) {
      this.animationLoop.start(controls, renderer, scene, camera);
    }
  }
}
