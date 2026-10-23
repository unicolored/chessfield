import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import type { Store } from '../provider/store.ts';
import { SceneComposer } from './SceneComposer.ts';
import { Container } from './Container.ts';

export interface ChessfieldCoreDependencies {
  container: Container;
  store: Store;
}

export class ChessfieldCore {
  private container: Container;
  private cfElement: HTMLElement | null;

  public readonly canvas: HTMLCanvasElement | null = null;
  public renderer: THREE.WebGPURenderer | null = null;
  public renderPipeline: THREE.RenderPipeline | null = null;
  public readonly controls: OrbitControls | null = null;
  public readonly camera: THREE.PerspectiveCamera | null = null;
  public readonly camGroup: THREE.Group | null = null;

  constructor(container: Container, cfElement: HTMLElement | null) {
    this.container = container;
    this.cfElement = cfElement;
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
    // const renderPipeline = this.rendererProvider.getRenderPipeline(renderer);
    this.setCanvas(canvas);
    this.setRenderer(renderer);
    this.setRenderPipeline(renderer);
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
    this.eventsService!.onSquareHover = (rank, file) => {
      this.store.chessboard?.highlightSquareCursor(rank, file);
    };

    this.eventsService!.onSquareRightClick = this.gamePieceService.addRingAt.bind(this.gamePieceService);

    this.eventsService!.onLeftClickClear = () => this.shapesService.clearAll();

    this.eventsService!.onResize = async () => {
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
    const renderPipeline = this.getRenderPipeline();
    if (controls && renderer) {
      this.animationLoop.start(controls, renderer, renderPipeline, scene, camera);
    }
  }
}
