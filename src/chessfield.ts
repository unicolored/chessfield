import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { tap } from 'rxjs';
import { Group, type Scene, InstancedMesh } from 'three';

import { LoaderComponent } from './component/loader.component.ts';
import { fadeAlpha, lmToCoordinates } from './helper.ts';
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
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
import { type HeadlessState } from './resource/chessfield.state.ts';
import type * as cf from './resource/chessfield.types';
import { type Move, type Moves } from './resource/chessfield.types';
import { BoardService } from './service/board.service.ts';
import { EventsService } from './service/events.service.ts';
import { ShapesService } from './service/shapes.service.ts';

export class Chessfield implements ChessfieldApi {
  private readonly boardService = new BoardService();
  private readonly shapesService = new ShapesService('ring');
  private readonly rendererProvider = new RendererProvider();
  private readonly sceneProvider = new SceneProvider();
  private readonly store: Store;
  private cameraProvider!: CameraProvider;
  private controlsProvider!: ControlsProvider;
  private readonly gameProvider!: GameProvider;
  private readonly pieceProvider!: PieceProvider;
  private themeProvider!: ThemeProvider;

  private canvas!: HTMLCanvasElement;
  private eventsService!: EventsService;
  private foundLastMove!: Move | null;

  constructor(
    private cfElement: HTMLElement,
    config?: ChessfieldConfig,
  ) {
    this.store = new Store(config);
    this.gameProvider = new GameProvider(this.store);
    this.pieceProvider = new PieceProvider(this.store);

    const initialFen = this.store.getConfig().fen ?? Store.initialFen;
    const initialLastMove = this.store.getConfig().lastMove ?? [];
    this.setFen(initialFen, initialLastMove);

    if (this.cfElement instanceof HTMLElement) {
      this.start();
    }
  }

  setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.store.setFen(fen, lastMove);
  }

  configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);

    this.eventsService?.dispose();
    this.canvas.remove();
    this.start();
  }

  setCheck(state: HeadlessState, color: cg.Color | boolean): void {
    state.check = undefined;
    if (color === true) color = state.turnColor;
    if (color)
      for (const [k, p] of state.pieces) {
        if (p.role === 'king' && p.color === color) {
          state.check = k;
        }
      }
  }

  async start() {
    const cfElement = this.cfElement;
    cfElement.classList.add('cf-chessfield-container');

    this.cameraProvider = new CameraProvider(this.store.getConfig());
    this.controlsProvider = new ControlsProvider(this.store.getConfig());
    this.themeProvider = new ThemeProvider(this.store.getConfig().mode, this.store.getConfig().theme);

    const rect = cfElement.getBoundingClientRect();
    const sizes = {
      width: rect.width,
      height: rect.height,
    };

    // Camera
    const camera = this.cameraProvider.getCamera(sizes);
    const camGroup = this.cameraProvider.getCameraGroup(camera);

    // Renderer
    this.canvas = this.rendererProvider.getCanvas();
    const renderer = this.rendererProvider.getRenderer(sizes, this.canvas);

    // Set up the scene, camera, and renderer
    const backgroundColor = this.themeProvider.getBackgroundColor();
    const scene = this.sceneProvider.getScene(backgroundColor);

    scene.add(camGroup);

    /**
     * 0. LOADER overlay
     */
    const loaderComponent = new LoaderComponent(backgroundColor, this.themeProvider.getInvertColor());
    scene.add(loaderComponent.getOverlay());
    scene.add(loaderComponent.getProgressBar());

    const decorGroup = this.boardService.decor(this.themeProvider.getModeColors());
    decorGroup.name = '🔵 Décor';
    scene.add(decorGroup);

    /**
     * LOADING MANAGEMENT
     */
    const loadingManagerProvider = new LoadingManagerProvider(this.store.getConfig(), this.gameProvider);

    loadingManagerProvider.getLoadingManager().onError = e => {
      console.error('error', e);
    };

    loadingManagerProvider.getLoadingManager().onProgress = (_itemUrl, itemsNumber, itemsTotal) => {
      loaderComponent.progressMaterial.uniforms['uTime'] = { value: itemsNumber / itemsTotal };
    };

    loadingManagerProvider.getLoadingManager().onLoad = () => {
      setTimeout(() => {
        fadeAlpha(loaderComponent.overlayMaterial.uniforms['uAlpha'], 500);
        loaderComponent.progressMaterial.uniforms['uAlpha'] = { value: 0 };
      }, 200);

      const themeColors = this.themeProvider.getThemeColors();
      /**
       * 1. CHESSBOARD shader
       */
      const chessboard = this.boardService.createChessboard();
      chessboard.setSquareColors(themeColors.light, themeColors.dark);
      chessboard.setHighlightColor(themeColors.highlight);
      chessboard.setHighlightStatusMateColor(themeColors.highlightStatusMate);

      this.updatePieces(scene, chessboard);

      const casesGroup = this.boardService.createCases(loadingManagerProvider.font);

      const shapes = this.shapesService.getMesh();
      shapes.name = '🟢 Shapes';
      scene.add(shapes);

      const chessboardGroup = new Group();
      chessboardGroup.name = '🟣 Chessboard Group';
      chessboardGroup.add(chessboard);
      chessboardGroup.add(casesGroup);
      scene.add(chessboardGroup);

      this.store.chessboard = chessboard;
      this.store.casesGroup = casesGroup;
      this.store.shapes = shapes;

      // Initialize EventsService after assets are loaded
      this.eventsService = new EventsService({
        cfElement: this.cfElement,
        canvas: this.canvas,
        camera: camera,
        scene: scene,
        store: this.store,
        shapesService: this.shapesService,
      });

      this.eventsService.onSquareHover = (rank, file) =>
        this.store.chessboard?.highlightSquareCursor(rank, file);

      this.eventsService.onSquareRightClick = (rank, file, color) => {
        const index = rank * 8 + file;
        if (this.shapesService.getVisible(index)) {
          this.shapesService.clearShape(index);
        } else {
          this.shapesService.setShapeAt(rank, file, color);
        }
      };

      this.eventsService.onLeftClickClear = () => this.shapesService.clearAll();

      this.eventsService.onResize = () => {
        const rect = cfElement.getBoundingClientRect();
        const sizes = { width: rect.width, height: rect.height };
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        renderer.setSize(sizes.width, sizes.height);
      };

      this.eventsService.init();

      // Controls
      const controls = this.controlsProvider.getControls(camera, this.canvas);

      // Animate
      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        document.defaultView?.requestAnimationFrame(animate);
      };

      cfElement.appendChild(renderer.domElement);
      animate();
    };
  }

  private updatePieces(scene: Scene, chessboard: cf.ExtendedMesh) {
    let piecesGroup: Group;

    this.store.movesSubject$.pipe(tap(() => scene.remove(piecesGroup))).subscribe((moves: Moves) => {
      this.foundLastMove = GameProvider.findLastMove(moves.moves);
      if (this.foundLastMove) {
        this.gameProvider.initGamePieces(this.foundLastMove);

        const lastMoveToCoordinates = lmToCoordinates(this.foundLastMove.lastMove);
        if (lastMoveToCoordinates.length > 1) {
          chessboard.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
          chessboard.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
        }
      }

      chessboard.setStatusMate(4, 7);

      piecesGroup = this.pieceProvider.updateGamePositions();
      this.store.piecesGroup = piecesGroup;
      scene.add(piecesGroup);
    });
  }

  public setShape(rank: number, file: number, color: string): void {
    this.shapesService.setShapeAt(rank, file, color);
  }

  public clearShape(rank?: number, file?: number): void {
    if (rank !== undefined && file !== undefined) {
      this.shapesService.clearShape(rank * 8 + file);
    } else {
      this.shapesService.clearAll();
    }
  }

  public getShapesMesh(): InstancedMesh {
    return this.shapesService.getMesh();
  }
}
