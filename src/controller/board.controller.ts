import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Group } from 'three';
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import {Store} from "../provider/store.ts";
import {FontLoader} from "three/examples/jsm/loaders/FontLoader.js";
import {lastValueFrom} from "rxjs";
import {BoardService} from "../service/board.service.ts";

export class BoardController {
  // board = viewChild<ElementRef>('board');

  // inputFen = input<string | null>(null);

  // document = inject(DOCUMENT);
  // boardService = inject(BoardService);
  // gameService = inject(GameService);
  // pieceProvider = inject(PieceProvider);
  // gameProvider = inject(GameProvider);
  // @Input() config!: ChessfieldConfig;

  constructor(
      private store: Store,
      private boardService: BoardService,
      private board: HTMLDivElement
  ) {
  }

  init() {
    if (this.board) {
      this.animate();
    }
  }

  async animate() {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;

    const gui: GUI = new GUI();

    const sizes = {
      width: 650, // 500
      height: 500, // 500
    };

    const camera = new THREE.PerspectiveCamera(44, sizes.width / sizes.height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    this.board.appendChild(renderer.domElement);

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

    let piecesGroup: Group;
    new FontLoader().load('assets/helvetiker_regular.typeface.json', async (font: any) => {
      const chessboardGroup = this.boardService.chessBoard(font);

      piecesGroup = await this.updateGamePositions();
      scene.add(piecesGroup);

      const debugGroup = this.boardService.debug();

      const lightGroup = this.boardService.light(gui);
      const decorGroup = this.boardService.decor();

      scene.add(debugGroup, lightGroup, decorGroup, chessboardGroup);

      this.store.updatePos(true);
    });

    const debugGroup = this.boardService.debug();
    scene.add(debugGroup)

    /**
     * DEBUG UI
     */
    const updateCamera = () => {
      camera.updateProjectionMatrix();
    };

    gui.add(camera, 'fov', 1, 180, 1).onChange(updateCamera);

    /**
     * Animate
     */
    // const clock = new THREE.Clock();
    // Render the scene function
    const tick = async () => {
      // const elapsedTime = clock.getElapsedTime();
      // console.log(elapsedTime)

      // let updatePos = await lastValueFrom(this.store.updatePosSubject$);
      // if (updatePos) {
      //   if (piecesGroup) {
      //     scene.remove(piecesGroup);
      //   }
      //   this.store.updatePos(false);
      //   piecesGroup = await this.updateGamePositions();
      //   scene.add(piecesGroup);
      // }

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
    // const piecesPositions = this.pieceProvider.piecesPositionsComputed();
    const piecesPositions = await lastValueFrom(this.store.piecesPositionsSubject$);

    piecesPositions.forEach(async (value: any, key: any) => {
      // const piece = this.gameProvider.gamePiecesSignalComputed(key);
      const map = await lastValueFrom(this.store.gamePiecesSubject$);
      const piece = map.get(key);
      if (piece) {
        piece.position.copy(value);
        piece.position.y = 0;
        piecesGroupe.add(piece);
      }
    });

    return piecesGroupe;
  }
}
