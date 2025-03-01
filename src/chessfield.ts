import './style.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { ChessfieldState } from './resource/chessfield.state.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardService } from './service/board.service.ts';
import { LichessMoves } from './interface/lichess.interface.ts';
import { FEN } from 'chessground/types';
import * as THREE from 'three';
import { Group, InstancedMesh, Mesh, Vector3 } from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { tap } from 'rxjs';
import { cm } from './helper.ts';
import { BoardPiece, ColorPieceNameObjectMap } from './interface/board.interface.ts';

class Chessfield {
  private store: Store;
  private gameProvider!: GameProvider;
  private boardService: BoardService;

  state!: ChessfieldState;

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

    this.start();

    this.store.setFen(this.config?.fen ?? Store.initialFen);
  }

  setFen(fen: FEN | null | undefined) {
    this.store.setFen(fen);
  }

  toggleView(): void {
    throw new Error('Method not implemented.');
  }

  async start() {
    if (!this.cfElement) {
      throw new Error('Container not found');
    }

    const canvas = document.createElement('canvas') as HTMLCanvasElement;

    const gui: GUI = new GUI();

    const sizes = {
      width: this.cfElement.clientWidth, // 500
      height: this.cfElement.clientHeight, // 500
    };

    // Camera
    const camera = new THREE.PerspectiveCamera(44, sizes.width / sizes.height, cm(0.1), 3);
    camera.position.set(0, cm(9.5), cm(9.5));
    camera.lookAt(0, cm(2), 0);
    // camera.updateProjectionMatrix();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // powerPreference: 'high-performance',
      antialias: window.devicePixelRatio < 2,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    // Controls
    const controls = new OrbitControls(camera, canvas);
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

    /**
     * DEBUG UI
     */
    const updateCamera = () => {
      camera.updateProjectionMatrix();
    };

    gui.add(camera, 'fov', 1, 180, 1).onChange(updateCamera);

    new FontLoader().load('assets/helvetiker_regular.typeface.json', async (font: any) => {
      const chessboardGroup = this.boardService.chessBoard(font);
      scene.add(chessboardGroup);
    });

    // const debugGroup = this.boardService.debug();
    // scene.add(debugGroup);
    const lightGroup = this.boardService.lights(gui);
    scene.add(lightGroup);
    const decorGroup = this.boardService.decor();
    scene.add(decorGroup);

    let mygroup: Group;
    // let pG = await this.updateGamePositions();
    // scene.add(pG)

    // this.store.updatePos(true)

    this.cfElement.appendChild(renderer.domElement);

    this.store.movesSubject$.subscribe((moves: LichessMoves) => {
      scene.remove(mygroup);
      this.gameProvider.initGamePieces(moves);

      const pG = this.updateGamePositions();
      scene.remove(pG);
      scene.remove(mygroup);

      mygroup = pG;
      scene.add(mygroup);
    });

    /**
     * Animate
     */
    // const clock = new THREE.Clock();
    // Render the scene function
    const tick = () => {
      // const elapsedTime = clock.getElapsedTime();
      // console.log(elapsedTime)

      // this.updateGamePositions().then(pG => {
      //     mygroup = pG;
      //     scene.add(mygroup);
      // });

      if (mygroup) {
        // scene.remove(mygroup);
        // this.updateGamePositions().then(pG => {
        //     mygroup = pG;
        //     scene.add(mygroup);
        // })
        // this.store.updatePosSubject$.subscribe(async (updatePos) => {
        //     if (updatePos) {
        //         pG = await this.updateGamePositions();
        //         scene.add(pG);
        //     }
        //     this.store.updatePos(false)
        // });
      }

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

  updateGamePositions(): Group {
    const piecesGroupe = new THREE.Group();
    piecesGroupe.name = 'pieces';

    const piecesPositions: Map<string, Vector3> = this.store.getPiecesPositions();
    console.log(piecesPositions);
    const piecesObjects: ColorPieceNameObjectMap = this.store.getBoardPiecesObjectsMap();

    this.store.gamePiecesSubject$
      .pipe(
        tap((list: BoardPiece[]) => {
          const matrixes: Map<string, { mesh: InstancedMesh; pos: Vector3 }[]> = new Map();

          list.forEach((boardPiece: BoardPiece) => {
            const pos = piecesPositions.get(boardPiece.coord);
            if (pos) {
              const mesh = piecesObjects.get(boardPiece.objectKey) as Mesh as InstancedMesh;

              if (mesh) {
                piecesGroupe.add(mesh);
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
          });

          matrixes.forEach((meshes, key) => {
            console.log(key, meshes.length);
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

    return piecesGroupe;
  }
}

export { Chessfield };
