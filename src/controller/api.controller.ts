import FenParser from '@chess-fu/fen-parser';
import { FEN, Key } from 'chessground/types';
import { LichessMoves } from '../interface/lichess.interface.ts';
import { GameProvider } from '../provider/game.provider.ts';
import { Store } from '../provider/store.ts';
import { ChessfieldApi } from '../resource/chessfield.api.ts';
import { ChessfieldState } from '../resource/chessfield.state.ts';
import { initial } from 'chessground/fen';
import { BoardService } from '../service/board.service.ts';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Group } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

export class ApiController implements ChessfieldApi {
  state!: ChessfieldState;
  private fen: FEN = `${initial} w KQkq - 0 1`;

  constructor(
    private store: Store,
    private gameProvider: GameProvider,
    private boardService: BoardService,
  ) {}

  getFen(): FEN {
    return this.fen;
  }

  setFen(fen: FEN | null | undefined) {
    if (fen && FenParser.isFen(fen)) {
      this.fen = fen;
      const lichessMoves: LichessMoves = {
        moves: [
          {
            fen: fen,
          },
        ],
      };

      this.gameProvider.initGamePieces(lichessMoves);
      this.store.updatePos(true);
    }
  }

  toggleView(): void {
    throw new Error('Method not implemented.');
  }

  selectSquare(key: Key | null): void {
    console.log('Select square', key);
    throw new Error('Method not implemented.');
  }

  async init(cfElement: HTMLElement) {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;

    const gui: GUI = new GUI();

    const sizes = {
      width: cfElement.clientWidth, // 500
      height: cfElement.clientHeight, // 500
    };

    const camera = new THREE.PerspectiveCamera(44, sizes.width / sizes.height, 0.1, 100);

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

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Gray background

    // Position the camera
    camera.position.set(0, 8.5, 7.5);
    camera.lookAt(0, 2, 0);
    // camera.updateProjectionMatrix();
    scene.add(camera);

    const debugGroup = this.boardService.debug();
    scene.add(debugGroup);

    /**
     * DEBUG UI
     */
    const updateCamera = () => {
      camera.updateProjectionMatrix();
    };

    gui.add(camera, 'fov', 1, 180, 1).onChange(updateCamera);

    this.setFen(this.fen);

    new FontLoader().load('assets/helvetiker_regular.typeface.json', async (font: any) => {
      const chessboardGroup = this.boardService.chessBoard(font);

      const debugGroup = this.boardService.debug();

      const lightGroup = this.boardService.light(gui);
      const decorGroup = this.boardService.decor();

      scene.add(debugGroup, lightGroup, decorGroup, chessboardGroup);
    });

    let pG: Group;
    let mygroup: Group;
    // let pG = await this.updateGamePositions();
    // scene.add(pG)

    // this.store.updatePos(true)

    /**
     * Animate
     */
    // const clock = new THREE.Clock();
    // Render the scene function
    const tick = () => {
      // const elapsedTime = clock.getElapsedTime();
      // console.log(elapsedTime)

      this.updateGamePositions().then(pG => {
        mygroup = pG;
        scene.add(mygroup);
      });

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

    cfElement.appendChild(renderer.domElement);

    await tick();
  }

  async updateGamePositions(): Promise<Group> {
    const piecesGroupe = new THREE.Group();
    piecesGroupe.name = 'pieces';
    const piecesPositions = this.store.getPiecesPositions();
    if (piecesPositions) {
      piecesPositions.forEach((value: any, key: any) => {
        // const piece = this.gameProvider.gamePiecesSignalComputed(key);
        this.store.gamePiecesSubject$.subscribe(map => {
          const piece = map.get(key);
          if (piece) {
            piece.position.copy(value);
            piece.position.y = 0;
            piecesGroupe.add(piece);
          }
        });
      });
    }

    return piecesGroupe;
  }
}
