import * as THREE from 'three';
import { Group } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Store } from '../provider/store.ts';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { BoardService } from '../service/board.service.ts';

export class BoardController {

  constructor(
    private store: Store,
    private boardService: BoardService,
    private board: HTMLElement,
  ) {}

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

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
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

    let pG: Group;
    new FontLoader().load('assets/helvetiker_regular.typeface.json', (font: any) => {
      const chessboardGroup = this.boardService.chessBoard(font);

      this.updateGamePositions().then((piecesGroup: Group) => {
        pG = piecesGroup;
        scene.add(piecesGroup);
      });

      const debugGroup = this.boardService.debug();

      const lightGroup = this.boardService.light(gui);
      const decorGroup = this.boardService.decor();

      scene.add(debugGroup, lightGroup, decorGroup, chessboardGroup);

      this.store.updatePos(true);
    });

    const debugGroup = this.boardService.debug();
    scene.add(debugGroup);

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

      this.store.updatePosSubject$.subscribe(updatePos => {
        if (updatePos) {
          if (pG) {
            scene.remove(pG);
          }
          this.store.updatePos(false);
          this.updateGamePositions().then((piecesGroup: Group) => {
            pG = piecesGroup;
            scene.add(piecesGroup);
          });
        }
      });

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
    this.store.piecesPositionsSubject$.subscribe(piecesPositions => {
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
    });

    return piecesGroupe;
  }
}
