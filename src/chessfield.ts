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
import { cm, fadeAlpha, hexToRgb, lmToCoordinates } from './helper.ts';
import * as cf from './resource/chessfield.types';
import { Move, Moves } from './resource/chessfield.types';
import helvetikerFont from './assets/fonts/helvetiker_regular.typeface.json?url';
import bakedTexture from './assets/models/baked.jpg?url';
import bakedBlackTexture from './assets/models/baked-black.jpg?url';
import { ChessfieldApi } from './resource/chessfield.api.ts';
import { ThemeProvider } from './provider/theme.provider.ts';

export class Chessfield implements ChessfieldApi {
  private readonly store: Store;
  private gameProvider!: GameProvider;
  private boardService!: BoardService;
  private themeProvider!: ThemeProvider;

  state!: ChessfieldState;
  private canvas!: HTMLCanvasElement;
  private foundLastMove!: Move | null;

  constructor(
    private cfElement: HTMLElement | null,
    config?: ChessfieldConfig,
  ) {
    // TODO: merge config params with defaults state config
    // const maybeState: ChessfieldState | HeadlessState = defaults();
    // configure(maybeState, this.config || {});
    this.store = new Store(config);

    // this.store.setFen(this.config?.fen ?? Store.initialFen);
    // this.setFen(this.config?.fen ?? Store.initialFen);
    this.setFen(this.store.getConfig().fen ?? Store.initialFen);
    this.start();
  }

  setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.store.setFen(fen, lastMove);
  }

  configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    const currentConfig = this.store.getConfig();
    const updatedConfig = { ...currentConfig, ...partialConfig };
    this.store.setConfig(updatedConfig);
    this.canvas.remove();
    this.start();
  }

  toggleView(): void {
    throw new Error('Method not implemented.');
  }

  async start() {
    this.boardService = new BoardService();
    this.gameProvider = new GameProvider(this.store);
    this.themeProvider = new ThemeProvider(this.store);

    const chessfieldElement = this.cfElement;

    if (!chessfieldElement || !(chessfieldElement instanceof HTMLElement)) {
      throw new Error('Container not found');
    }

    chessfieldElement.classList.add('cf-chessfield-container');

    this.canvas = document.createElement('canvas') as HTMLCanvasElement;

    // const gui: GUI = new GUI();

    const sizes = {
      width: chessfieldElement.clientWidth, // 500
      height: chessfieldElement.clientHeight, // 500
    };

    // Camera
    const camGroup = new THREE.Group();
    const cameraPositionsMap = new Map<cf.Camera, Vector3>();
    cameraPositionsMap.set('white', new Vector3(0, cm(14), cm(14)));
    // cameraPositionsMap.set('white', new Vector3(0, cm(12), cm(12)));
    // cameraPositionsMap.set('black', new Vector3(0, cm(12), cm(-12)));
    // cameraPositionsMap.set('right', new Vector3(cm(12), cm(12), 0));
    // cameraPositionsMap.set('left', new Vector3(cm(-12), cm(12), 0));

    const cameraGroupRotationMap = new Map<string, Vector3>();
    const qcd = Math.PI / 4;
    cameraGroupRotationMap.set('white', new Vector3(0, 0, 0));
    cameraGroupRotationMap.set('white-left', new Vector3(0, -qcd - 0.05, 0));
    cameraGroupRotationMap.set('white-right', new Vector3(0, qcd + 0.05, 0));
    cameraGroupRotationMap.set('black', new Vector3(0, qcd * 4, 0));
    cameraGroupRotationMap.set('black-left', new Vector3(0, qcd * 3, 0));
    cameraGroupRotationMap.set('black-right', new Vector3(0, qcd * 5, 0));
    cameraGroupRotationMap.set('right', new Vector3(0, qcd * 2, 0));
    cameraGroupRotationMap.set('left', new Vector3(0, qcd * 6, 0));

    const orientation = this.store.getConfig().orientation ?? 'white';
    const viewOrientation = orientation === 'white' ? 0.01 : -0.01;
    cameraPositionsMap.set('top', new Vector3(0, cm(16), cm(viewOrientation)));

    const viewPosition =
      cameraPositionsMap.get(this.store.getConfig().camera ?? 'white') ?? new Vector3(0, cm(12), cm(12));

    let angle = '';
    if (this.store.getConfig().camera === 'white' || this.store.getConfig().camera === 'black') {
      const configAngle = this.store.getConfig().angle;
      if (configAngle === 'left' || configAngle === 'right') {
        angle = this.store.getConfig().angle ? '-' + this.store.getConfig().angle : '';
      }
    }
    const cameraAngle = `${this.store.getConfig().camera}${angle}`;
    const viewRotation = cameraGroupRotationMap.get(cameraAngle) ?? new Vector3(0, cm(12), cm(12));

    const camera = new THREE.PerspectiveCamera(33, sizes.width / sizes.height, cm(0.1), 3);
    camera.name = '🎥 Main Camera';

    camGroup.add(camera);
    // scene.add(camera);

    camera.position.set(viewPosition.x, viewPosition.y, viewPosition.z);
    camGroup.rotation.set(viewRotation.x, viewRotation.y, viewRotation.z);

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
    const backgroundColor = this.themeProvider.getBackgroundColor();
    const invertColor = this.themeProvider.getInvertColor();
    scene.background = new THREE.Color(backgroundColor); // Gray background

    scene.add(camGroup);

    /**
     * Loader Overlay
     */
    const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const overlayMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uAlpha: { value: 1 },
        uColor: { value: hexToRgb(backgroundColor) },
      },
      vertexShader: `
        void main()
        {
          gl_Position = vec4(position, 1.0);
        }
    `,
      fragmentShader: `
      uniform float uAlpha;
      uniform vec3 uColor;
      
        void main()
        {
          gl_FragColor = vec4(uColor, uAlpha);
        }
      `,
    });
    const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
    scene.add(overlay);

    const progressGeometry = new THREE.PlaneGeometry(2, 0.01, 1, 1);
    const progressMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: hexToRgb(invertColor) },
        uPosition: { value: new THREE.Vector3(0, 0, 0) },
        uTime: { value: -1 },
        uAlpha: { value: 1 },
      },
      vertexShader: `
        uniform vec3 uPosition;
        uniform float uTime;
        
        void main()
        {
            // Add the vertex position to see the actual geometry
            vec3 animatedPosition = position + uPosition;
            animatedPosition.x += uTime * 20.0 * 0.1; 
            
            gl_Position = vec4(animatedPosition, 1.0);
        }
    `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAlpha;
        
        void main()
        {
            gl_FragColor = vec4(uColor, uAlpha);
        }
    `,
    });
    const progress = new THREE.Mesh(progressGeometry, progressMaterial);
    scene.add(progress);

    const loadingManager = new THREE.LoadingManager();

    const textureLoader = new THREE.TextureLoader(loadingManager);

    // Load the texture and apply it to the material
    textureLoader.load(
      bakedTexture,
      texture => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.gameProvider.pieceMaterials.white = new THREE.MeshBasicMaterial({
          // color: Store.themes['bw'].light,
          map: texture,
        });
      },
      undefined,
      (e: unknown) => {
        console.error('error', e);
      },
    );
    textureLoader.load(
      bakedBlackTexture,
      texture => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        this.gameProvider.pieceMaterials.black = new THREE.MeshBasicMaterial({
          // color: Store.themes['bw'].dark,
          map: texture,
        });
      },
      undefined,
      (e: unknown) => {
        console.error('error', e);
      },
    );

    this.gameProvider.loadGltfGeometries(loadingManager);

    let helvetiker: Font | null = null;
    if (this.store.getConfig().coordinatesOnSquares) {
      new FontLoader(loadingManager).load(helvetikerFont, async (font: any) => {
        helvetiker = font;
      });
    }

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
    // scene.add(lightGroup);
    const decorGroup = this.boardService.decor(this.themeProvider.getModeColors());
    decorGroup.name = '🔵 Décor';
    scene.add(decorGroup);

    // let pG = await this.updateGamePositions();
    // scene.add(pG)

    // this.store.updatePos(true)

    chessfieldElement.appendChild(renderer.domElement);

    // function logObjectCount(scene: THREE.Scene) {
    //   const count = scene.children.length;
    //   console.log(`Current object count: ${count}`);
    //
    //   // scene.children.forEach((child, index) => {
    //   //   console.log(`Object ${index}:`, child);
    //   // });
    // }

    loadingManager.onError = () => {
      console.log('error');
    };

    loadingManager.onProgress = (_itemUrl, itemsNumber, itemsTotal) => {
      progressMaterial.uniforms['uTime'] = { value: itemsNumber / itemsTotal };
    };

    loadingManager.onLoad = () => {
      setTimeout(() => {
        // Example usage:
        fadeAlpha(overlayMaterial.uniforms['uAlpha'], 500);
        progressMaterial.uniforms['uAlpha'] = { value: 0 };
      }, 200);

      // FIXME: keep createChessboard() in onLoad() and load shaders from files inside createChessboard()
      const chessboard = this.boardService.createChessboard();
      const themeColors = this.themeProvider.getThemeColors();
      chessboard.setHighlightColor(themeColors.highlight);
      chessboard.setSquareColors(themeColors.light, themeColors.dark);
      chessboardGroup.add(chessboard);

      const casesGroup = this.boardService.createCases(helvetiker);
      chessboardGroup.add(casesGroup);

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

        piecesGroup = this.updateGamePositions();
        scene.add(piecesGroup);

        // logObjectCount(scene);
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
      // camGroup.rotation.y += 0.001;

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);
      // renderer.shadowMap.autoUpdate = false;
      // renderer.shadowMap.needsUpdate = true;

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
                const mesh = piecesObjects.get(boardPiece.objectKey);

                if (mesh) {
                  const instanceMesh = mesh as Mesh as InstancedMesh;
                  piecesGroup.add(instanceMesh);
                  if (instanceMesh.count) {
                    // .. instancedMesh
                    const updateMatrix = matrixes.get(boardPiece.objectKey) ?? [];
                    updateMatrix.push({ mesh: instanceMesh, pos });
                    matrixes.set(boardPiece.objectKey, updateMatrix);
                  } else {
                    mesh.position.copy(pos);
                    if (mesh.name.startsWith('black')) {
                      mesh.rotateY(Math.PI);
                    }
                  }
                }
              }
            }
          });

          // Pieces Rotations
          const pieceRotations: { [k: string]: number } = {
            'white-knight-white-knight': -5.5,
            'black-knight-black-knight': -2.5,
            'black-bishop-black-bishop': -3,
            'black-rook-black-rook': -3,
            'black-pawn-black-pawn': -3,
          };

          matrixes.forEach(meshes => {
            let index = 0;
            for (const { mesh, pos } of meshes) {
              const matrix = new THREE.Matrix4();

              // Check if this piece needs rotation
              const rotationAngle = pieceRotations[mesh.name];
              if (rotationAngle !== undefined) {
                // Combine position and rotation in one step
                matrix.makeRotationY(rotationAngle);
                matrix.setPosition(pos);
              } else {
                // Just set position for pieces without rotation
                matrix.setPosition(pos);
              }

              mesh.setMatrixAt(index, matrix);

              index++;
            }
          });
        }),
      )
      .subscribe();

    return piecesGroup;
  }
}
