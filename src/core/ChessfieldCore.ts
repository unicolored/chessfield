import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import { EventWiring } from '../events/EventWiring.ts';
import { Store } from '../provider/store.ts';
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

    this._cfElement.classList.add('cf-chessfield._container');

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
    // Save camera references for direct updates
    this._container.getStore().camera = this._container.getCameraProvider().getCamera(sizes);
    this._container.getStore().camGroup = this._container
      .getCameraProvider()
      .getCameraGroup(this._container.getStore().camera);
    this._container.getStore().getScene().add(this._container.getStore().camGroup);

    // Canvas & Renderer
    this._container.getStore().initRenderPipeline(this._container.getStore().getCanvas(), sizes);
    const renderPipeline = this._container.getStore().getRenderPipeline();
    this._cfElement.appendChild(renderPipeline.renderer.domElement);

    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      renderPipeline.renderer.inspector = new Inspector();
    }

    // Loading Management
    const font = this._container.getLoadingManagerProvider().font;

    this._container.getLoadingManagerProvider().getLoadingManager().onError = e => {
      console.error('error', e);
    };

    if (this._container.getStore().getScene()) {
      this._container.getLoadingManagerProvider().getLoadingManager().onLoad = this.onLoad.bind(this, font);
    }
  }

  private async onLoad(font: Font | null): Promise<void> {
    if (!this._cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
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
    this._container.getAnimationLoop().start(this._container.getStore());
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
