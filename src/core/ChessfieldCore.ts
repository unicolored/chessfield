import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import { EventWiring } from '../events/EventWiring.ts';
import { type CameraProvider } from '../provider/camera.provider.ts';
import { type ControlsProvider } from '../provider/controls.provider.ts';
import { type LoadingManagerProvider } from '../provider/loadingManager.provider.ts';
import { type RendererProvider } from '../provider/renderer.provider.ts';
import { Store } from '../provider/store.ts';
import { type ThemeProvider } from '../provider/theme.provider.ts';
import { type BoardService } from '../service/board.service.ts';
import { EventsService } from '../service/events.service.ts';
import { type GamePieceService } from '../service/game-piece.service.ts';
import { type ShapesService } from '../service/shapes.service.ts';
import { type StateService } from '../service/state.service.ts';
import { type TextService } from '../service/text/text.service.ts';

import { type AnimationLoop } from './AnimationLoop.ts';
import { type Container } from './Container.ts';
import { SceneComposer } from './SceneComposer.ts';

export class ChessfieldCore {
  public eventsService!: EventsService;

  constructor(
    private _container: Container,
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

    this._cfElement.classList.add('cf-chessfield._container');

    const rect = this._cfElement.getBoundingClientRect();
    const sizes = {
      width: rect.width,
      height: rect.height,
    };

    // Scene
    const mode = Store.modes[this.store.getConfig().mode ?? 'light'];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mode.light);
    this.store.setScene(scene);

    // Camera
    // Save camera references for direct updates
    this.store.camera = this.cameraProvider.getCamera(sizes);
    this.store.camGroup = this.cameraProvider.getCameraGroup(this.store.camera);
    this.store.getScene().add(this.store.camGroup);

    // Canvas & Renderer
    this.store.canvas = this.rendererProvider.getCanvas();
    this.store.renderer = this.rendererProvider.getRenderer(sizes, this.store.canvas);
    this.store.renderPipeline = this.rendererProvider.getRenderPipeline(this.store.renderer);

    this._cfElement.appendChild(this.store.renderer.domElement);

    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      this.store.renderer.inspector = new Inspector();
    }

    // Loading Management
    const font = this.loadingManagerProvider.font;

    this.loadingManagerProvider.getLoadingManager().onError = e => {
      console.error('error', e);
    };

    if (this.store.getScene()) {
      this.loadingManagerProvider.getLoadingManager().onLoad = this.onLoad.bind(this, font);
    }
  }

  private async onLoad(font: Font | null): Promise<void> {
    if (!this._cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
      return;
    }

    // 1. Compose the scene: decor, chessboard, etc.
    SceneComposer.compose(
      this.store,
      this.themeProvider,
      this.boardService,
      this.shapesService,
      this.stateService,
      this.textService,
      this.store.getScene(),
      font,
    );

    // 2. Update pieces
    this.gamePieceService.updatePieces();

    // . Setup events: interactions with chessboard
    this.setupEvents(this._cfElement);

    // Controls
    this.store.controls = this.controlsProvider.getControls(this.store.camera, this.store.canvas);

    // . Start animation loop
    // this.animationLoop.start(this.store, controls, renderer, renderPipeline, scene, camera);
    this.animationLoop.start(this.store);
  }

  public setupEvents(cfElement: HTMLElement): void {
    // Create EventsService now that canvas, camera, and scene are available
    const eventsService = new EventsService(this._container.getStore(), cfElement);

    EventWiring.setup(
      this._container.getStore(),
      eventsService,
      this._container.getShapeController(),
      this._container.getShapesService(),
    );
  }
}
