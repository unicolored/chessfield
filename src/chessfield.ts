import './style.css';

import { ChessfieldConfig } from './resource/chessfield.config.ts';
import { ChessfieldState } from './resource/chessfield.state.ts';
import { GameProvider } from './provider/game.provider.ts';
import { Store } from './provider/store.ts';
import { BoardService } from './service/board.service.ts';
import { LichessMoves } from './interface/lichess.interface.ts';
import { FEN } from 'chessground/types';
import * as THREE from 'three';
import { Group, Vector3 } from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { tap } from 'rxjs';

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
    const camera = new THREE.PerspectiveCamera(44, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 9.5, 9.5);
    camera.lookAt(0, 2, 0);
    // camera.updateProjectionMatrix();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.target.set(0, -0.7, 0);
    controls.minDistance = 8; // Set the minimum zoom distance
    controls.maxDistance = 16; // Set the maximum zoom distance

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
    const lightGroup = this.boardService.light(gui);
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

      this.updateGamePositions().then(pG => {
        scene.remove(mygroup);

        mygroup = pG;
        scene.add(mygroup);
      });
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

      // Call tick again on the next frame
      document.defaultView?.requestAnimationFrame(tick);
    };

    await tick();
  }

  async updateGamePositions(): Promise<Group> {
    const piecesGroupe = new THREE.Group();
    piecesGroupe.name = 'pieces';

    const piecesPositions: Map<string, Vector3> = this.store.getPiecesPositions();

    this.store.gamePiecesSubject$
      .pipe(
        tap((map: Map<string, Group>) => {
          map.forEach((piece: Group, coord: string) => {
            const pos = piecesPositions.get(coord);
            if (pos) {
              piece.position.copy(pos);
              piece.position.y = 0;
              piecesGroupe.add(piece);
            }
          });
        }),
      )
      .subscribe();

    return piecesGroupe;
  }

  // async updateGamePositions(): Promise<Group> {
  //     const piecesGroupe = new THREE.Group();
  //     piecesGroupe.name = 'pieces';
  //
  //     this.store.getPiecesPositions().forEach((value: any, key: any) => {
  //         // const piece = this.gameProvider.gamePiecesSignalComputed(key);
  //         this.store.gamePiecesSubject$.subscribe(map => {
  //             const piece = map.get(key);
  //             if (piece) {
  //                 piece.position.copy(value);
  //                 piece.position.y = 0;
  //                 piecesGroupe.add(piece);
  //             }
  //         });
  //     });
  //
  //     return piecesGroupe;
  // }
}

export { Chessfield };
