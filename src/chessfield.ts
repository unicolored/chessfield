import './chessfield.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { ChessfieldState } from './resource/chessfield.state.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardService } from './service/board.service.ts';
import * as cg from 'chessground/types';
import * as THREE from 'three';
import { Group, InstancedMesh, Mesh, Vector3 } from 'three';
// import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { tap } from 'rxjs';
import { cm, lmToCoordinates } from './helper.ts';
import * as cf from './resource/chessfield.types';
import helvetikerFont from './assets/fonts/helvetiker_regular.typeface.json?url';
import { ChessfieldApi } from './resource/chessfield.api.ts';
import { Move } from './resource/chessfield.types';

export class Chessfield implements ChessfieldApi {
  private store: Store;
  private gameProvider!: GameProvider;
  private boardService: BoardService;

  state!: ChessfieldState;
  private canvas!: HTMLCanvasElement;
  private foundLastMove!: Move | null;

  constructor(
    private cfElement: HTMLElement | null,
    private config?: ChessfieldConfig,
  ) {
    // TODO: merge config params with defaults state config
    // const maybeState: ChessfieldState | HeadlessState = defaults();
    // configure(maybeState, this.config || {});

    this.store = new Store(config);
    this.boardService = new BoardService();
    this.gameProvider = new GameProvider(this.store);

    // this.store.setFen(this.config?.fen ?? Store.initialFen);
    // this.setFen(this.config?.fen ?? Store.initialFen);
    this.setFen(this.config?.fen ?? Store.initialFen);
    this.start();
  }

  setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    if (!this.canvas) {
      return;
    }
    this.store.setFen(fen, lastMove);
  }

  toggleView(): void {
    if (!this.canvas) {
      return;
    }
    throw new Error('Method not implemented.');
  }

  async start() {
    const chessfieldElement = this.cfElement;

    if (!chessfieldElement || !(chessfieldElement instanceof HTMLElement)) {
      throw new Error('Container not found');
    }

    console.log(chessfieldElement);
    chessfieldElement.classList.add('cf-chessfield-container');

    this.canvas = document.createElement('canvas') as HTMLCanvasElement;

    // const gui: GUI = new GUI();

    const sizes = {
      width: chessfieldElement.clientWidth, // 500
      height: chessfieldElement.clientHeight, // 500
    };

    // Camera
    const camera = new THREE.PerspectiveCamera(33, sizes.width / sizes.height, cm(0.1), 3);
    camera.name = '🎥 Main Camera';

    const cameraPositionsMap = new Map<cf.Camera, Vector3>();
    cameraPositionsMap.set('white', new Vector3(0, cm(12), cm(12)));
    cameraPositionsMap.set('black', new Vector3(0, cm(12), cm(-12)));
    cameraPositionsMap.set('right', new Vector3(cm(12), cm(12), 0));
    cameraPositionsMap.set('left', new Vector3(cm(-12), cm(12), 0));

    const orientation = this.config?.orientation ?? 'white';
    const viewOrientation = orientation === 'white' ? 0.01 : -0.01;
    cameraPositionsMap.set('top', new Vector3(0, cm(16), cm(viewOrientation)));

    const viewPosition =
      cameraPositionsMap.get(this.config?.camera ?? 'white') ?? new Vector3(0, cm(12), cm(12));

    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);

    camera.lookAt(0, cm(2), 0);
    // camera.updateProjectionMatrix();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      // powerPreference: 'high-performance',
      antialias: window.devicePixelRatio < 2,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    // Handle window resize
    function onWindowResize() {
      if (chessfieldElement) {
        const sizes = {
          width: chessfieldElement.clientWidth, // 500
          height: chessfieldElement.clientHeight, // 500
        };

        // Update camera aspect ratio
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update renderer size
        renderer.setSize(sizes.width, sizes.height);
      }
    }

    // Add resize event listener
    window.addEventListener('resize', onWindowResize);

    // Controls
    const controls = new OrbitControls(camera, this.canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.target.set(0, cm(-0.7), 0);
    controls.minDistance = cm(10); // Set the minimum zoom distance
    controls.maxDistance = cm(20); // Set the maximum zoom distance

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xecebe8); // Gray background
    scene.add(camera);

    const loadingManager = new THREE.LoadingManager();

    this.gameProvider.loadGltfGeometries(loadingManager);

    let helvetiker: Font | null = null;
    new FontLoader(loadingManager).load(helvetikerFont, async (font: any) => {
      helvetiker = font;
    });
    /**
     * DEBUG UI
     */
    // const updateCamera = () => {
    //   camera.updateProjectionMatrix();
    // };

    // gui.add(camera, 'fov', 1, 180, 1).onChange(updateCamera);

    const chessboardGroup = new THREE.Group();
    chessboardGroup.name = '🟣 Chessboard Group';
    scene.add(chessboardGroup);

    // const debugGroup = this.boardService.debug();
    // scene.add(debugGroup);
    const lightGroup = this.boardService.lights();
    lightGroup.name = '🟡 Lights';
    scene.add(lightGroup);
    const decorGroup = this.boardService.decor();
    decorGroup.name = '🔵 Décor';
    scene.add(decorGroup);

    // let pG = await this.updateGamePositions();
    // scene.add(pG)

    // this.store.updatePos(true)

    chessfieldElement.appendChild(renderer.domElement);

    function logObjectCount(scene: THREE.Scene) {
      const count = scene.children.length;
      console.log(`Current object count: ${count}`);

      // scene.children.forEach((child, index) => {
      //   console.log(`Object ${index}:`, child);
      // });
    }

    loadingManager.onLoad = () => {
      // FIXME: keep createChessboard() in onLoad() and load shaders from files inside createChessboard()
      const chessboard = this.boardService.createChessboard();
      chessboardGroup.add(chessboard);

      const casesGroup = this.boardService.createCases(helvetiker);
      chessboardGroup.add(casesGroup);

      let piecesGroup: THREE.Group;

      this.store.movesSubject$
        .pipe(
          tap(() => scene.remove(piecesGroup)),
          tap(moves => {
            this.foundLastMove = GameProvider.findLastMove(moves.moves);
            if (this.foundLastMove && this.foundLastMove.lastMove) {
              this.gameProvider.initGamePieces(this.foundLastMove);

              const lastMoveToCoordinates = lmToCoordinates(this.foundLastMove.lastMove);
              if (lastMoveToCoordinates && lastMoveToCoordinates.length > 1) {
                console.log(lastMoveToCoordinates);
                chessboard.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
                chessboard.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
              }
            }
          }),
        )
        .subscribe(() => {
          piecesGroup = this.updateGamePositions();
          scene.add(piecesGroup);

          logObjectCount(scene);
        });
    };

    /**
     * Animate
     */
    // const clock = new THREE.Clock();
    // Render the scene function
    const tick = () => {
      // const elapsedTime = clock.getElapsedTime();
      // console.log(elapsedTime)

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;

      // Call tick again on the next frame
      document.defaultView?.requestAnimationFrame(tick);
    };

    tick();
  }

  private updateGamePositions(): Group {
    const piecesGroup = new THREE.Group();
    piecesGroup.name = '🟢 Pièces Group';

    const squaresVector3: Map<string, Vector3> = this.store.getSquaresVector3();
    const piecesObjects: cf.ColorPieceNameObjectMap = this.store.getBoardPiecesObjectsMap();

    this.store.gamePiecesSubject$
      .pipe(
        tap((list: cf.BoardPiece[]) => {
          const matrixes: Map<string, { mesh: InstancedMesh; pos: Vector3 }[]> = new Map();

          list.forEach((boardPiece: cf.BoardPiece) => {
            if (boardPiece.coord && boardPiece.objectKey) {
              const pos = squaresVector3.get(boardPiece.coord);
              if (pos) {
                const mesh = piecesObjects.get(boardPiece.objectKey) as Mesh as InstancedMesh;

                if (mesh) {
                  piecesGroup.add(mesh);
                  if (mesh.count) {
                    // .. instancedMesh
                    const updateMatrix = matrixes.get(boardPiece.objectKey) ?? [];
                    updateMatrix.push({ mesh, pos });
                    matrixes.set(boardPiece.objectKey, updateMatrix);
                  } else {
                    mesh.position.copy(pos);
                  }
                }
              }
            }
          });

          matrixes.forEach(meshes => {
            let index = 0;
            for (const { mesh, pos } of meshes) {
              if (mesh && pos) {
                const matrix = new THREE.Matrix4();
                matrix.setPosition(pos);
                mesh.setMatrixAt(index, matrix);

                index++;
              }
            }
          });
        }),
      )
      .subscribe();

    return piecesGroup;
  }
}
