import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { tap } from 'rxjs';
import { Inspector } from 'three/addons/inspector/Inspector.js';
import { type OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import { coordToVector2, lmToCoordinates } from './helper.ts';
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
import { type GameState } from './resource/chessfield.state.ts';
import type * as cf from './resource/chessfield.types';
import { type Move, type Moves } from './resource/chessfield.types';
import { BoardService } from './service/board.service.ts';
import { EventsService } from './service/events.service.ts';
import { ShapesService } from './service/shapes.service.ts';
import { StateService } from './service/state.service.ts';
import { type ShaderName } from './shader';

export class Chessfield implements ChessfieldApi {
  private readonly boardService = new BoardService();
  private readonly shapesService = new ShapesService(['ring']);
  private readonly stateService = new StateService(['check']);
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
    private cfElement: HTMLElement | null,
    config?: ChessfieldConfig,
  ) {
    this.store = new Store(config);

    if (this.cfElement && this.cfElement instanceof HTMLElement) {
      this.gameProvider = new GameProvider(this.store);
      this.pieceProvider = new PieceProvider(this.store);

      const initialFen = this.store.getConfig().fen ?? Store.initialFen;
      const initialLastMove = this.store.getConfig().lastMove ?? [];
      this.setFen(initialFen, initialLastMove as cg.Key[]);

      this.cameraProvider = new CameraProvider(this.store.getConfig());
      this.controlsProvider = new ControlsProvider(this.store.getConfig());
      this.themeProvider = new ThemeProvider(this.store.getConfig().mode, this.store.getConfig().theme);

      this.start();
    }
  }

  public setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.store.gameOver = null;

    this.store.setFen(fen, lastMove);
  }

  public configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);

    this.eventsService?.dispose();
    this.canvas.remove();
    this.start();
  }

  public setShape(rank: number, file: number, color: string, shaderName: ShaderName = 'ring'): void {
    this.shapesService.setShapeAt(rank, file, color, true, shaderName);
  }

  public clearShape(rank?: number, file?: number, shaderName?: ShaderName): void {
    if (rank !== undefined && file !== undefined) {
      this.shapesService.clearShape(rank * 8 + file, shaderName);
    } else {
      this.shapesService.clearAll(shaderName ? [shaderName] : undefined);
    }
  }

  // public getShapesMesh(shaderName: ShaderName): THREE.InstancedMesh {
  //   return this.shapesService.getMesh(shaderName);
  // }

  public setCheck(state: GameState): void {
    this.store.gameOver = state;
    let kingVec;

    if (state.kings.white) {
      kingVec = coordToVector2(state.kings.white);
    } else if (state.kings.black) {
      kingVec = coordToVector2(state.kings.black);
    }

    if (kingVec) {
      this.stateService.setStateAt(kingVec.x, kingVec.y);
    }
  }

  public setGameOver(state: GameState): void {
    console.log('setGameOver api', state);
    this.store.gameOver = state;

    this.addShapes(state);

    // TODO: add/enable/show king sprites
  }

  private onLoad(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.Renderer,
    controls: OrbitControls,
    font: Font | null,
  ): void {
    if (!this.cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
      return;
    }

    // setTimeout(() => {
    //   // fadeAlpha(loaderComponent.overlayMaterial.opacityNode, 500);
    //   loaderComponent.overlayMaterial.opacityNode = float(1);
    //   // loaderComponent.progressMaterial.opacityNode = { value: 0 };
    // }, 200);

    const chessboardGroup = new THREE.Group();
    chessboardGroup.name = '🟣 Chessboard Group';
    scene.add(chessboardGroup);

    const stateGroup = new THREE.Group();
    stateGroup.name = '🟣 State Group';
    scene.add(stateGroup);

    const shapesGroup = new THREE.Group();
    shapesGroup.name = '🟣 Shapes Group';
    scene.add(shapesGroup);

    // Chessboard
    const themeColors = this.themeProvider.getThemeColors();
    this.store.chessboard = this.boardService.createChessboard();
    this.store.chessboard.setSquareColors(themeColors.light, themeColors.dark);
    this.store.chessboard.setHighlightColor(themeColors.highlight);
    this.store.chessboard.setHighlightStatusMateColor(themeColors.highlightStatusMate);
    chessboardGroup.add(this.store.chessboard);

    this.updatePieces(scene, this.store.chessboard);

    // Cases
    this.store.casesGroup = this.boardService.createCases(font);
    chessboardGroup.add(this.store.casesGroup);

    // Shapes / Rings
    this.store.shapesRing = this.shapesService.getMesh('ring');
    this.store.shapesRing.name = '🟢 Shapes (ring)';
    shapesGroup.add(this.store.shapesRing);

    // Shapes / Checks
    this.store.state = this.stateService.getMesh('check');
    this.store.state.name = '🟢 Shapes (check)';
    shapesGroup.add(this.store.state);

    // EventsService
    this.eventsService = new EventsService({
      cfElement: this.cfElement,
      canvas: this.canvas,
      camera,
      scene,
      store: this.store,
      shapesService: this.shapesService,
    });

    this.eventsService.onSquareHover = (rank, file) => {
      this.store.chessboard?.highlightSquareCursor(rank, file);
    };

    this.eventsService.onSquareRightClick = (rank, file, color) => {
      const index = rank * 8 + file;
      const isVisible = this.shapesService.getVisible(index, 'ring');

      if (!isVisible) {
        this.shapesService.setShapeAt(rank, file, color, true, 'ring');
      } else {
        const currentColor = this.shapesService.getColor(index, 'ring');
        if (currentColor.toLowerCase() === color.toLowerCase()) {
          this.shapesService.clearShape(index, 'ring');
        } else {
          this.shapesService.setShapeAt(rank, file, color, true, 'ring');
        }
      }
    };

    this.eventsService.onLeftClickClear = () => this.shapesService.clearAll();

    this.eventsService.onResize = () => {
      if (!this.cfElement) {
        return;
      }

      const rect = this.cfElement.getBoundingClientRect();
      const sizes = { width: rect.width, height: rect.height };
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
    };

    this.eventsService.init();

    // Animation
    const timer = new THREE.Timer();
    timer.connect(document);

    const tick = () => {
      timer.update();

      controls.update();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(tick);
  }

  async start() {
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
    const scene = this.sceneProvider.getScene(backgroundColor);

    // Camera
    const camera = this.cameraProvider.getCamera(sizes);
    const camGroup = this.cameraProvider.getCameraGroup(camera);
    scene.add(camGroup);

    // Canvas & Renderer
    this.canvas = this.rendererProvider.getCanvas();
    const renderer = this.rendererProvider.getRenderer(sizes, this.canvas);
    this.cfElement.appendChild(renderer.domElement);
    renderer.inspector = new Inspector(); // for debug
    await renderer.init();

    // Controls
    const controls = this.controlsProvider.getControls(camera, this.canvas);

    // Overlay
    // const loaderComponent = new LoaderComponent(backgroundColor, this.themeProvider.getInvertColor());
    // scene.add(loaderComponent.getOverlay());
    // scene.add(loaderComponent.getProgressBar());

    // Décor
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

    // loadingManagerProvider.getLoadingManager().onProgress = (_itemUrl, itemsNumber, itemsTotal) => {
    //   // loaderComponent.progressMaterial.uniforms['uTime'] = { value: itemsNumber / itemsTotal };
    // };

    const font = loadingManagerProvider.font;
    loadingManagerProvider.getLoadingManager().onLoad = this.onLoad.bind(
      this,
      camera,
      scene,
      renderer,
      controls,
      font,
    );
  }

  private addShapes(state: GameState): void {
    const gO = state;
    /*if (gO.status === 'check') {
      if (gO.kings.white) {
        const whiteVec2 = coordToVector2(gO.kings.white);
        console.log('whiteVec2', whiteVec2);
        this.shapesService.setShapeAt(whiteVec2.x, whiteVec2.y, '#ff0000', true, 'ring');
      } else if (gO.kings.black) {
        const blackVec2 = coordToVector2(gO.kings.black);
        console.log(blackVec2);
        this.shapesService.setShapeAt(blackVec2.x, blackVec2.y, '#ff0000', true, 'ring');
      }
    } else*/ if (gO.winner) {
      let mateKey;
      if (gO.winner === 'w') {
        mateKey = gO.kings.black;
      } else {
        // Black wins
        mateKey = gO.kings.white;
      }
      if (mateKey) {
        console.log('mateKey', mateKey);

        const squareVec2 = coordToVector2(mateKey);

        this.stateService.setStateAt(squareVec2.x, squareVec2.y);
      }
    } else {
      // game is a draw
      console.log('draw!', gO.kings);
      // if (gO.kings.white) {
      //   const whiteVec2 = coordToVector2(gO.kings.white);
      //   // this.shapesService.setShapeAt(whiteVec2.x, whiteVec2.y, '#ff0000', true, 'ring');
      // }
      // if (gO.kings.black) {
      //   const blackVec2 = coordToVector2(gO.kings.black);
      //   // this.shapesService.setShapeAt(blackVec2.x, blackVec2.y, '#ff0000', true, 'ring');
      // }
    }
  }

  private updatePieces(scene: THREE.Scene, chessboard: cf.ExtendedMesh) {
    let piecesGroup: THREE.Group;

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

      if (this.store.gameOver?.status === 'mate') {
        // this.addShapes(this.store.gameOver);
      } else if (this.store.gameOver?.status === 'check') {
        // ...
      } else if (!this.store.gameOver) {
        this.stateService.clearAll(['check']);
      }

      piecesGroup = this.pieceProvider.updateGamePositions();
      this.store.piecesGroup = piecesGroup;
      scene.add(piecesGroup);
    });
  }
}
