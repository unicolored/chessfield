import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import { LoaderComponent } from '../component/loader.component.ts';
import { EventWiring } from '../events/EventWiring.ts';
import { Store } from '../provider/store.ts';
import { type ChessfieldConfig } from '../resource/chessfield.config.ts';
import { EventsService } from '../service/events.service.ts';

import { type Container } from './Container.ts';
import { SceneComposer } from './SceneComposer.ts';

export class ChessfieldCore {
  public eventsService!: EventsService;

  constructor(
    private _container: Container,
    private _cfElement: HTMLElement | null,
  ) {}

  async start(): Promise<void> {
    if (!this._cfElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    this._cfElement.classList.add('cf-chessfield-container');

    const config = this._container.getStore().getConfig();
    const loadingService = this._container.getLoadingService();
    const loader = this.mountLoader(config);

    if (loader) {
      loadingService.subscribe(({ progress }) => loader.setProgress(progress));
    }

    const rect = this._cfElement.getBoundingClientRect();
    const sizes = {
      width: rect.width,
      height: rect.height,
    };

    // Scene
    const mode = Store.modes[this._container.getStore().getConfig().mode ?? 'light'];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mode.light);
    this._container.getStore().setScene(scene);

    // Camera
    // Both projections exist up front: switching only swaps which one is rendered.
    const cameraProvider = this._container.getCameraProvider();
    const store = this._container.getStore();
    const perspectiveCamera = cameraProvider.getCamera(sizes);
    const isometricCamera = cameraProvider.getIsometricCamera(sizes);
    cameraProvider.syncProjection(isometricCamera, perspectiveCamera);

    const projection = store.getConfig().projection ?? 'perspective';
    store.camera = cameraProvider.getCameraFor(projection);
    store.camGroup = cameraProvider.getCameraGroup(store.camera);
    store.getScene().add(store.camGroup);

    // Canvas & Renderer
    this._container.getStore().initRenderPipeline(this._container.getStore().getCanvas(), sizes);
    const renderPipeline = this._container.getStore().getRenderPipeline();
    this._cfElement.appendChild(renderPipeline.renderer.domElement);

    // Keep renderer and camera in sync with the container size (fullscreen, layout changes).
    // ResizeObserver is absent in jsdom, so tests keep the single initial size.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.resize()).observe(this._cfElement);
    }

    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      renderPipeline.renderer.inspector = new Inspector();
    }

    // Loading Management
    const loadingManagerProvider = this._container.getLoadingManagerProvider();

    await loadingManagerProvider.load((loaded, total) => loadingService.setAssets(loaded, total));

    // Canvas-sprite labels draw with CSS fonts: wait before composing the text.
    await this.waitForFonts();

    try {
      this.initScene(loadingManagerProvider.font);
    } catch (error) {
      // Keep the overlay from locking the board if a non-asset error slips through.
      console.error('Failed to initialize the Chessfield scene', error);
    }

    this._container.getStore().requestRender();
    loadingService.markReady();

    try {
      config.loading?.onLoadingComplete?.();
    } catch (error) {
      console.error('onLoadingComplete failed', error);
    }

    await loader?.complete();
  }

  private mountLoader(config: ChessfieldConfig): LoaderComponent | null {
    if (!this._cfElement || config.loading?.enabled === false) {
      return null;
    }

    const mode = Store.modes[config.mode ?? 'light'];

    return new LoaderComponent(this._cfElement, {
      overlayFadeDuration: config.loading?.overlayFadeDuration,
      progressBarHeight: config.loading?.progressBarHeight,
      backgroundColor: mode.light,
    });
  }

  /** Wait for the configured CSS font before canvas-sprite text is rasterised with a fallback. */
  private async waitForFonts(): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) {
      return;
    }

    const text = this._container.getStore().getConfig().text;
    const family = text?.fontFamily;

    // URL families are handled by the troika backend, not by document.fonts.
    if (!family || /^(https?:|\/)/i.test(family)) {
      return;
    }

    const weight = text?.fontWeight ?? '400';

    try {
      await document.fonts.load(`${weight} 16px ${family}`);
    } catch {
      // A malformed family must not block the board.
    }
  }

  // Match the drawing buffer and the camera frustum to the container's current size.
  private resize(): void {
    if (!this._cfElement) {
      return;
    }

    const { width, height } = this._cfElement.getBoundingClientRect();
    if (!width || !height) {
      return;
    }

    const store = this._container.getStore();
    store.getRenderPipeline().renderer.setSize(width, height);
    this._container.getCameraProvider().resize(store.camera, { width, height });
    store.requestRender();
  }

  private initScene(font: Font | null): void {
    if (!this._cfElement) {
      console.error('Init: Chessfield HtmlElement is missing.');
      return;
    }

    // 1. Compose the scene: decor, chessboard, etc.
    SceneComposer.compose(
      this._container.getStore(),
      this._container.getThemeProvider(),
      this._container.getBoardService(),
      this._container.getShapesService(),
      this._container.getStateService(),
      this._container.getTextService(),
      this._container.getClockService(),
      this._container.getStore().getScene(),
      font,
    );

    // 2. Subscribe to FEN changes and render the current position
    this._container.getGamePieceService().start();

    // . Setup events: interactions with chessboard
    this.setupEvents(this._cfElement);

    // Controls
    this._container.getStore().controls = this._container
      .getControlsProvider()
      .getControls(this._container.getStore().camera, this._container.getStore().getCanvas());

    // . Start animation loop
    // this.animationLoop.start(this._container.getStore(), controls, renderer, renderPipeline, scene, camera);
    this._container
      .getAnimationLoop()
      .start(this._container.getStore(), () => this._container.getClockService().tick());
  }

  public setupEvents(cfElement: HTMLElement): void {
    // Create EventsService now that canvas, camera, and scene are available
    const eventsService = new EventsService(this._container.getStore(), cfElement);

    EventWiring.setup(this._container.getStore(), eventsService, this._container.getShapeController());
  }
}
