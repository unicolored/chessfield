import './chessfield.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardService } from './service/board.service.ts';
import * as cg from 'chessground/types';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { tap } from 'rxjs';
import { fadeAlpha, lmToCoordinates } from './helper.ts';
import * as cf from './resource/chessfield.types';
import { Move, Moves } from './resource/chessfield.types';
import { ChessfieldApi } from './resource/chessfield.api.ts';
import { ThemeProvider } from './provider/theme.provider.ts';
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { CameraProvider } from './provider/camera.provider.ts';
import { ControlsProvider } from './provider/controls.provider.ts';
import { RendererProvider } from './provider/renderer.provider.ts';
import { SceneProvider } from './provider/scene.provider.ts';
import { LoaderComponent } from './component/loader.component.ts';
import { LoadingManagerProvider } from './provider/loadingManager.provider.ts';
import { PieceProvider } from './provider/piece.provider.ts';
import { Group, Scene } from 'three';

export class Chessfield implements ChessfieldApi {
  private readonly boardService = new BoardService();
  private readonly rendererProvider = new RendererProvider();
  private readonly sceneProvider = new SceneProvider();
  private readonly store: Store;
  private readonly cameraProvider!: CameraProvider;
  private readonly controlsProvider!: ControlsProvider;
  private readonly gameProvider!: GameProvider;
  private readonly pieceProvider!: PieceProvider;
  private readonly themeProvider!: ThemeProvider;

  private canvas!: HTMLCanvasElement;
  private foundLastMove!: Move | null;

  constructor(
    private cfElement: HTMLElement,
    config?: ChessfieldConfig,
  ) {
    this.store = new Store(config);
    this.cameraProvider = new CameraProvider(this.store.getConfig());
    this.controlsProvider = new ControlsProvider(this.store.getConfig());
    this.gameProvider = new GameProvider(this.store);
    this.pieceProvider = new PieceProvider(this.store);
    this.themeProvider = new ThemeProvider(this.store.getConfig().mode, this.store.getConfig().theme);

    const initialFen = this.store.getConfig().fen ?? Store.initialFen;
    const initialLastMove = this.store.getConfig().lastMove ?? [];
    this.setFen(initialFen, initialLastMove);

    if (this.cfElement && this.cfElement instanceof HTMLElement) {
      this.start().then();
    }
  }

  setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.store.setFen(fen, lastMove);
  }

  configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);

    this.canvas.remove();
    this.start().then();
  }

  async start() {
    const cfElement = this.cfElement;
    cfElement.classList.add('cf-chessfield-container');

    const sizes = {
      // width: cfElement.clientWidth, // 500
      // height: cfElement.clientHeight, // 500
      width: cfElement.offsetWidth, // 500
      height: cfElement.offsetHeight, // 500
    };

    // const gui: GUI = new GUI();

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

    // Composer
    // let fxaaPass: ShaderPass;
    // const composer = new EffectComposer(renderer);
    //
    // const renderPass = new RenderPass(scene, camera);
    // renderPass.clearAlpha = 0;
    //
    // const outputPass = new OutputPass();
    //
    // composer.addPass(renderPass);
    // composer.addPass(outputPass);
    //
    // if (RendererProvider.enableAntialias) {
    //   // FXAA is engineered to be applied towards the end of engine post processing after conversion to low dynamic range and conversion to the sRGB color space for display.
    //   fxaaPass = new ShaderPass(FXAAShader);
    //   fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * renderer.getPixelRatio());
    //   fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * renderer.getPixelRatio());
    //
    //   composer.addPass(fxaaPass);
    // }

    // Handle window resize
    function onWindowResize() {
      const sizes = {
        // width: cfElement.clientWidth, // 500
        // height: cfElement.clientHeight, // 500
        width: cfElement.offsetWidth, // 500
        height: cfElement.offsetHeight, // 500
      };

      // Update camera aspect ratio
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      // Update renderer size
      renderer.setSize(sizes.width, sizes.height);
      // composer.setSize(cfElement.offsetWidth, sizes.width);
      // composer.setSize(cfElement.offsetWidth, sizes.height);
      //
      // if (RendererProvider.enableAntialias && fxaaPass) {
      //   fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * renderer.getPixelRatio());
      //   fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * renderer.getPixelRatio());
      // }
    }

    // Add resize event listener
    window.addEventListener('resize', onWindowResize);

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
        // Example usage:
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

      this.updatePieces(scene, chessboard);

      const casesGroup = this.boardService.createCases(loadingManagerProvider.font);

      const chessboardGroup = new Group();
      chessboardGroup.name = '🟣 Chessboard Group';
      chessboardGroup.add(chessboard);
      chessboardGroup.add(casesGroup);
      scene.add(chessboardGroup);
    };

    // Controls
    const controls = this.controlsProvider.getControls(camera, this.canvas);

    controls.enabled = this.store.getConfig().controlsEnabled ?? true;
    controls.update();

    // Animate
    // const clock = new THREE.Clock();
    const animate = () => {
      // const elapsedTime = clock.getElapsedTime();
      // console.log(elapsedTime)
      // camGroup.rotation.y += 0.001;

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);
      // composer.render();

      // Call tick again on the next frame
      document.defaultView?.requestAnimationFrame(animate);
    };

    cfElement.appendChild(renderer.domElement);

    // Start
    animate();
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

      piecesGroup = this.pieceProvider.updateGamePositions();
      scene.add(piecesGroup);
    });
  }
}
