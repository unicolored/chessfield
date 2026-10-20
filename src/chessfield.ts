import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
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
import { type Move, type Moves, type ThemeColors } from './resource/chessfield.types';
import { BoardService } from './service/board.service.ts';
import { EventsService } from './service/events.service.ts';
import { ShapesService } from './service/shapes.service.ts';
import { StateService } from './service/state.service.ts';
import { type ShaderName } from './shader';
import { LoaderComponent, LoaderOptions } from './component/loader.component.ts';

export type { ChessfieldApi, ChessfieldConfig, GameState };
export * from './resource/chessfield.types';

export type { ChessfieldApi, ChessfieldConfig, GameState };
export * from './resource/chessfield.types';

export class Chessfield implements ChessfieldApi {
  private readonly boardService = new BoardService();
  private readonly shapesService = new ShapesService(['ring']);
  private readonly rendererProvider = new RendererProvider();
  private readonly sceneProvider = new SceneProvider();
  private readonly store: Store;
  private cameraProvider!: CameraProvider;
  private controlsProvider!: ControlsProvider;
  private readonly gameProvider!: GameProvider;
  private readonly pieceProvider!: PieceProvider;
  private stateService!: StateService;
  private themeProvider!: ThemeProvider;

  private canvas!: HTMLCanvasElement;
  private eventsService!: EventsService;
  private foundLastMove!: Move | null;
  private movesSubscription: (() => void) | null = null;
  // private loadingCompleted = false;

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
      const theme = this.themeProvider.getThemeColors();
      this.stateService = new StateService([['check', String(theme.statusCheck)]]);

      this.start();
    }
  }

  public setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.store.gameState = null;

    this.store.setFen(fen, lastMove);
  }

  public configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);

    // Clean up moves subscription before restarting
    if (this.movesSubscription) {
      this.movesSubscription();
      this.movesSubscription = null;
    }

    // Clean up pieces group from current scene
    if (this.store.piecesGroup && this.store.scene) {
      this.store.scene.remove(this.store.piecesGroup);
      this.store.piecesGroup.clear();
    }

    this.eventsService?.dispose();
    this.canvas.remove();
    this.start();
  }

  public switchTheme(theme?: string): void {
    // Resolve theme: use provided theme or cycle to next
    let targetTheme: string;
    if (theme) {
      // Validate theme exists in Store.themes
      if (!Store.themes[theme]) {
        console.warn(`Theme "${theme}" not found. Available themes: ${Object.keys(Store.themes).join(', ')}`);
        return;
      }
      targetTheme = theme;
    } else {
      // Cycle to next theme
      targetTheme = this.themeProvider.getNextTheme();
    }

    // Update ThemeProvider
    this.themeProvider.setTheme(targetTheme as any);

    // Update store config for persistence
    const currentConfig = this.store.getConfig();
    this.store.setConfig({ ...currentConfig, theme: targetTheme });

    // Apply visual updates
    this.applyThemeColors();
  }

  public getThemeColors(): ThemeColors {
    return this.themeProvider.getThemeColors();
  }

  private applyThemeColors(): void {
    const themeColors = this.themeProvider.getThemeColors();
    const modeColors = this.themeProvider.getModeColors();

    // 1. Chessboard colors (TSL uniforms)
    this.store.chessboard?.setSquareColors(themeColors.light, themeColors.dark);
    this.store.chessboard?.setHighlightColor(themeColors.highlight);

    // 2. Scene background
    const bgColor = this.themeProvider.getBackgroundColor();
    this.sceneProvider.updateBackground(this.store.scene!, bgColor);

    // 3. Decor (frame, player indicators) - update via TSL userData
    this.boardService.updateDecorColors(modeColors);

    // 4. State/Check color
    this.stateService.updateCheckColor(themeColors.statusCheck);
  }

  public addRing(rank: number, file: number, shape: string): void {
    this.addRingAt(rank, file, shape);
  }

  // private setShape(rank: number, file: number, color: string, shaderName: ShaderName = 'ring'): void {
  //   this.shapesService.setShapeAt(rank, file, color, true, shaderName);
  // }

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

  public setState(state: GameState): void {
    this.store.gameState = state;
    this.updatePieces();
  }

  // /** @deprecated Use setState instead */
  // public setCheck(state: GameState): void {
  //   this.store.gameState = state;
  //   this.updatePieces();
  // }
  //
  // /** @deprecated Use setState instead */
  // public setGameOver(state: GameState): void {
  //   this.store.gameState = state;
  //   this.updatePieces();
  // }

  private onLoad(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.Renderer,
    controls: OrbitControls,
    font: Font | null,
    // loaderComponent: LoaderComponent,
  ): void {
    if (!this.cfElement) {
      console.error('Onload: Chessfield HtmlElement is missing.');
      return;
    }

    // Trigger overlay fade via loader component
    // loaderComponent.startFade();
    // this.loadingCompleted = true;

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
    // this.store.chessboard.setStatusCheckColor(themeColors.statusCheck);
    chessboardGroup.add(this.store.chessboard);

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

    this.eventsService.onSquareRightClick = this.addRingAt.bind(this);

    this.eventsService.onLeftClickClear = () => this.shapesService.clearAll();

    this.eventsService.onResize = async () => {
      if (!this.cfElement) {
        return;
      }

      const rect = this.cfElement.getBoundingClientRect();
      const sizes = { width: rect.width, height: rect.height };
      renderer.setSize(sizes.width, sizes.height);
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
    };

    this.eventsService.init();

    // Animation
    const timer = new THREE.Timer();
    timer.connect(document);

    const tick = () => {
      timer.update();

      controls.update();
      // await renderer.init();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(tick);

    this.updatePieces();
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
    this.store.scene = this.sceneProvider.getScene(backgroundColor);

    // Camera
    const camera = this.cameraProvider.getCamera(sizes);
    const camGroup = this.cameraProvider.getCameraGroup(camera);
    this.store.scene.add(camGroup);

    // Canvas & Renderer
    this.canvas = this.rendererProvider.getCanvas();
    const renderer = this.rendererProvider.getRenderer(sizes, this.canvas);
    this.cfElement.appendChild(renderer.domElement);
    if (!import.meta.env.PROD && import.meta.env.MODE === 'development') {
      const { Inspector } = await import('three/addons/inspector/Inspector.js');
      renderer.inspector = new Inspector();
    }
    // await renderer.init();

    // Controls
    const controls = this.controlsProvider.getControls(camera, this.canvas);

    // Overlay - configure from config
    const config = this.store.getConfig();
    const loadingOptions: LoaderOptions = {
      overlayFadeDuration: config.loading?.overlayFadeDuration ?? 200,
      progressBarHeight: config.loading?.progressBarHeight ?? 10,
      onLoadingComplete: config.loading?.onLoadingComplete,
    };
    const loaderComponent = new LoaderComponent(loadingOptions);
    const loaderGroup = new THREE.Group();
    this.store.scene.add(loaderGroup);
    // const overlay = loaderComponent.getOverlay(backgroundColor, loadingOptions.overlayFadeDuration);
    // const progress = loaderComponent.getProgressBar(
    //   this.themeProvider.getInvertColor(),
    //   loadingOptions.progressBarHeight,
    // );
    // loaderGroup.add(overlay);
    // loaderGroup.add(progress);

    // Décor
    const decorGroup = this.boardService.decor(this.themeProvider.getModeColors());
    decorGroup.name = '🔵 Décor';
    this.store.scene.add(decorGroup);

    /**
     * LOADING MANAGEMENT
     */
    const loadingManagerProvider = new LoadingManagerProvider(this.store.getConfig(), this.gameProvider);

    loadingManagerProvider.getLoadingManager().onError = e => {
      console.error('error', e);
    };

    // loadingManagerProvider.getLoadingManager().onProgress = (_itemUrl, itemsNumber, itemsTotal) => {
    //   const progressValue = itemsNumber / itemsTotal;
    //   console.log('[Loader] Progress:', progressValue);
    //   loaderComponent.setProgress(progressValue);
    // };

    const font = loadingManagerProvider.font;
    // this.loadingCompleted = false;
    loadingManagerProvider.getLoadingManager().onLoad = this.onLoad.bind(
      this,
      camera,
      this.store.scene,
      renderer,
      controls,
      font,
      // loaderComponent,
    );
  }

  private updatePieces() {
    if (this.movesSubscription) {
      this.movesSubscription();
    }
    this.movesSubscription = this.store.movesSubject$.subscribe((moves: Moves) => {
      // Robust cleanup: remove previous pieces group from scene
      if (this.store.piecesGroup) {
        this.store.scene?.remove(this.store.piecesGroup);
        // Clear children references to help GC
        this.store.piecesGroup.clear();
      }

      this.foundLastMove = GameProvider.findLastMove(moves.moves);

      let boardPieces: cf.BoardPiece[] = [];

      if (this.foundLastMove) {
        boardPieces = this.gameProvider.initGamePieces(this.foundLastMove);

        const lastMoveToCoordinates = lmToCoordinates(this.foundLastMove.lastMove);
        if (lastMoveToCoordinates.length > 1) {
          this.store.chessboard?.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
          this.store.chessboard?.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
        }
      }

      const piecesGroup = this.pieceProvider.updateGamePositions(boardPieces);
      this.store.piecesGroup = piecesGroup;
      this.store.scene?.add(piecesGroup);

      // Happen after pieces have been put in position
      if (this.store.gameState) {
        if (this.store.gameState.mate || this.store.gameState.draw) {
          this.addShapes(this.store.gameState);
        }
        if (this.store.gameState.check) {
          let kingVec;

          // NOTE: for debugging purpose,
          // both kings can be checked at the same time.

          this.store.gameState.check.forEach((key: cg.Key) => {
            kingVec = coordToVector2(key);
            this.stateService.setStateAt(kingVec.x, kingVec.y);
          });
        }
      } else {
        this.stateService.clearAll(['check']);
      }
    });
  }

  private addShapes(state: GameState | null): void {
    if (!state) {
      return;
    }

    const findPieceOnMateKey = (mateKey: string) => {
      return this.store.piecesGroup?.children.find(c => {
        return c.userData['coord'] === mateKey;
      });
    };

    const findStateSprite = (piece: THREE.Object3D) => {
      return piece.children.find(c => {
        return c.name === 'stateSprite';
      });
    };

    if (state.winner) {
      let mateKey;
      if (state.winner === 'w') {
        mateKey = state.kings.black;
      } else {
        // Black wins
        mateKey = state.kings.white;
      }
      if (mateKey) {
        const squareVec2 = coordToVector2(mateKey);

        this.stateService.setStateAt(squareVec2.x, squareVec2.y);

        const pieceFound = findPieceOnMateKey(mateKey);

        if (pieceFound) {
          const spriteFound = findStateSprite(pieceFound);
          spriteFound.userData['showSprite'] = true;
          spriteFound.userData['lostState'] = true;
        }
      }
    }
    if (state.draw) {
      // game is a draw
      state.draw.forEach((key: cg.Key) => {
        const pieceFound = findPieceOnMateKey(key);

        if (pieceFound) {
          const spriteFound = findStateSprite(pieceFound);
          spriteFound.userData['showSprite'] = true;
          spriteFound.userData['lostState'] = false;
        }
      });
    }
  }

  public addRingAt(rank: number, file: number, shape: string): void {
    const index = rank * 8 + file;
    const isVisible = this.shapesService.getVisible(index, 'ring');

    const theme: cf.ThemeColors = this.themeProvider.getThemeColors();

    const color =
      (theme as unknown as Record<string, string | number | undefined>)[shape]?.toString() ?? '#000000';

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
  }
}
