import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import type * as THREE from 'three/webgpu';

import { type CameraProvider } from '../provider/camera.provider.ts';
import { type ControlsProvider } from '../provider/controls.provider.ts';
import { type LoadingManagerProvider } from '../provider/loadingManager.provider.ts';
import { type RendererProvider } from '../provider/renderer.provider.ts';
import { type Store } from '../provider/store.ts';
import { type ThemeProvider } from '../provider/theme.provider.ts';
import { type BoardService } from '../service/board.service.ts';
import { EventsService } from '../service/events.service.ts';
import { type GamePieceService } from '../service/game-piece.service.ts';
import { type ShapesService } from '../service/shapes.service.ts';
import { type StateService } from '../service/state.service.ts';
import { type TextService } from '../service/text/text.service.ts';

import { type AnimationLoop } from './AnimationLoop.ts';
import { SceneComposer } from './SceneComposer.ts';

export class ChessfieldCore {
  public eventsService!: EventsService;

  constructor(
    // private _container: Container,
    private _cfElement: HTMLElement | null,
    private store: Store,
    private themeProvider: ThemeProvider,
    private cameraProvider: CameraProvider,
    private rendererProvider: RendererProvider,
    private controlsProvider: ControlsProvider,
    private animationLoop: AnimationLoop,
    private loadingManagerProvider: LoadingManagerProvider,
    private gamePieceService: GamePieceService,
    private shapesService: ShapesService,
    private stateService: StateService,
    private boardService: BoardService,
    private textService: TextService,
  ) {}

  async start(): Promise<void> {
    if (!this._cfElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    this._cfElement.classList.add('cf-chessfield-container');

    const rect = this._cfElement.getBoundingClientRect();
    const sizes = {
      width: rect.width,
      height: rect.height,
    };

    // Scene
    const backgroundColor = this.themeProvider.getBackgroundColor();
    this.store.scene = this.store.getScene(backgroundColor);

    // Camera

    // Save camera references for direct updates
    this.store.camera = this.cameraProvider.getCamera(sizes);
    this.store.camGroup = this.cameraProvider.getCameraGroup(this.store.camera);
    this.store.scene?.add(this.store.camGroup);

    // Canvas & Renderer
    this.store.canvas = this.rendererProvider.getCanvas();
    this.store.renderer = this.rendererProvider.getRenderer(sizes, this.store.canvas);
    this.store.renderPipeline = this.rendererProvider.getRenderPipeline(this.store.renderer);

    this._cfElement.appendChild(this.store.renderer.domElement);

    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      this.store.renderer.inspector = new Inspector();
    }

    // Controls
    const controls = this.controlsProvider.getControls(this.store.camera, this.store.canvas);
    this.store.controls = controls;

    // Create EventsService now that canvas, camera, and scene are available
    this.eventsService = new EventsService(this.store, this._cfElement);

    // Loading Management
    const font = this.loadingManagerProvider.font;

    this.loadingManagerProvider.getLoadingManager().onError = e => {
      console.error('error', e);
    };

    if (this.store.scene) {
      this.loadingManagerProvider.getLoadingManager().onLoad = this.onLoad.bind(
        this,
        this.store.camera,
        this.store.scene,
        font,
      );
    }
  }

  private async onLoad(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    font: Font | null,
  ): Promise<void> {
    if (!this._cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
      return;
    }

    // Compose the scene
    SceneComposer.compose(
      this.store,
      this.themeProvider,
      this.boardService,
      this.shapesService,
      this.stateService,
      this.textService,
      scene,
      font,
    );

    // Update pieces
    this.gamePieceService.updatePieces();

    // Setup events
    this.eventsService!.onSquareHover = (rank, file) => {
      this.store.chessboard?.highlightSquareCursor(rank, file);
    };

    this.eventsService!.onSquareRightClick = this.gamePieceService.addRingAt.bind(this.gamePieceService);

    this.eventsService!.onLeftClickClear = () => this.shapesService.clearAll();

    this.eventsService!.onResize = async () => {
      if (!this._cfElement) {
        return;
      }

      const rect = this._cfElement.getBoundingClientRect();
      const sizes = { width: rect.width, height: rect.height };
      this.store.renderer?.setSize(sizes.width, sizes.height);
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
    };

    this.eventsService.init();

    // Start animation loop
    const controls = this.store.controls;
    const renderer = this.store.renderer;
    const renderPipeline = this.store.renderPipeline;
    if (controls && renderer) {
      this.animationLoop.start(controls, renderer, renderPipeline, scene, camera);
    }
  }
}
