import { Group, Mesh, Vector3 } from 'three';
import * as THREE from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { letters, Theme } from '../interface/board.interface.ts';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Store } from '../provider/store.ts';
import { cm } from '../helper.ts';

export class BoardService {
  public lights(gui: GUI): Group {
    const lightGroup = new THREE.Group();

    const directLight = new THREE.DirectionalLight(0xffffff, 1);
    directLight.castShadow = false;
    directLight.position.set(1, 2, 1);
    lightGroup.add(directLight); // Add the target to the scene
    gui.add(directLight, 'intensity', 0, 200);

    // Add cone light with shadow map
    // const coneLight = new THREE.SpotLight(0xffffff, 100);
    // coneLight.position.set(3, 10, 0); // Position above the scene
    // gui.add(coneLight, 'intensity', 0, 200);

    // Define the target of the light (e.g., center of chessboard)
    // const target = new THREE.Object3D();
    // target.position.set(0, 0, 0);
    // lightGroup.add(target); // Add the target to the scene
    // coneLight.target = target;
    //
    // // Enable shadows
    // coneLight.castShadow = true;
    //
    // // Fine-tune shadow settings for better performance/quality
    // coneLight.shadow.mapSize.width = 1024; // default
    // coneLight.shadow.mapSize.height = 1024; // default
    // coneLight.shadow.camera.near = 0.5; // default
    // coneLight.shadow.camera.far = 100; // default
    // coneLight.shadow.focus = 1; // default
    //
    // // Adjust the cone angle and penumbra for effect
    // coneLight.angle = Math.PI / 4; // Narrow cone angle
    // coneLight.penumbra = 0.1; // Soft edge
    //
    // // const coneLightHelper = new THREE.SpotLightHelper(coneLight);
    //
    // // Add the light to the scene
    // lightGroup.add(coneLight);
    // lightGroup.add(coneLightHelper);

    const light = new THREE.AmbientLight(0x404040, 33); // soft white light
    gui.add(light, 'intensity', 0, 100);
    lightGroup.add(light);

    return lightGroup;
  }

  public decor(): Group {
    const decorGroup = new THREE.Group();

    // // Add an infinite plane as the floor
    // const planeGeometry = new THREE.PlaneGeometry(12, 12);
    // const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    // const floor = new THREE.Mesh(planeGeometry, planeMaterial);
    // // Rotate the plane to make it horizontal and position it at y = 0
    // floor.rotation.x = -Math.PI / 2;
    // floor.position.y = 0;
    // // Optionally, enable shadows on the plane
    // floor.receiveShadow = true;
    // // Add the floor to the decor group
    // decorGroup.add(floor);

    // Create a box geometry and material
    const player1Geometry = new THREE.BoxGeometry(cm(2), cm(0.25), cm(0.25));
    const player1Material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const player1 = new THREE.Mesh(player1Geometry, player1Material);
    // Position the box in the scene
    player1.position.set(0, cm(0.125), cm(4.5));
    // Add the box to the scene
    decorGroup.add(player1);

    // Create a box geometry and material
    const player2Geometry = new THREE.BoxGeometry(cm(2), cm(0.25), cm(0.25));
    const player2Material = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const player2 = new THREE.Mesh(player2Geometry, player2Material);
    // Position the box in the scene
    player2.position.set(0, cm(0.125), cm(-4.5));
    // Add the box to the scene
    decorGroup.add(player2);

    // // Create a box geometry and material
    // const shaderRequests = {
    //   vertex: this.http.get('../../assets/shaders/test/test.vert', { responseType: 'text' }),
    //   fragment: this.http.get('../../assets/shaders/test/test.frag', { responseType: 'text' }),
    // };
    //
    // // Use forkJoin to wait for all requests to complete
    // forkJoin(shaderRequests).subscribe(
    //   (results) => {
    //     const boxGeometry = new THREE.BoxGeometry(1, 1, 2);
    //     const boxMaterial = new THREE.RawShaderMaterial({
    //       vertexShader: results.vertex,
    //       fragmentShader: results.fragment,
    //       side: THREE.DoubleSide,
    //     });
    //     const box = new THREE.Mesh(boxGeometry, boxMaterial);
    //     box.castShadow = true;
    //     // Position the box in the scene
    //     box.position.set(-4.75, 0.5, 0);
    //     // Add the box to the scene
    //     // decorGroup.add(box);
    //   });

    return decorGroup;
  }

  public debug(): Group {
    const debugGroup = new THREE.Group();

    const size = 10;
    const divisions = 10;

    const gridHelper = new THREE.GridHelper(size, divisions);
    debugGroup.add(gridHelper);

    return debugGroup;
  }

  public chessBoard(font: Font): Group {
    // Create the chessboard
    const chessboardGroup = new THREE.Group();

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const coord = letters[rankInt] + (Store.boardSize - colInt);

        // GROUP
        const caseGroup = new THREE.Group();
        caseGroup.name = coord;
        caseGroup.userData['coord'] = coord;

        // SQUARE
        const squareGeometry = new THREE.BoxGeometry(Store.squareSize, Store.squareHeight, Store.squareSize);
        squareGeometry.scale(0.25, 0.25, 0.25);
        const theme = Store.themes['blue'];
        const squareMaterial = new THREE.MeshPhongMaterial({
          color: (rankInt + colInt) % 2 === 0 ? theme.light : theme.dark,
        });

        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        const squarePosition = new Vector3(
          cm(rankInt - Store.boardSize / 2 + 0.5),
          cm(Store.squareHeight / 2),
          cm(colInt - Store.boardSize / 2 + 0.5),
        );

        square.position.set(squarePosition.x, squarePosition.y, squarePosition.z);
        square.castShadow = false;
        square.receiveShadow = false;

        // TEXT
        const textMesh = this.makeCoordText(font, coord, { rankInt, colInt }, theme);

        // ADD
        square.add(textMesh);
        caseGroup.add(square);
        chessboardGroup.add(caseGroup);
      }
    }

    // chessboardGroup.position.set(0, cm(0.5), 0);
    chessboardGroup.name = 'chessboard';

    return chessboardGroup;
  }

  private makeCoordText(
    font: Font,
    text: string,
    pos: { rankInt: number; colInt: number },
    theme: Theme,
  ): Mesh {
    const textMaterial = new THREE.MeshPhongMaterial({
      color: (pos.rankInt + pos.colInt) % 2 !== 0 ? theme.light : theme.dark,
    });
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: cm(0.1),
      depth: cm(0.075),
      // curveSegments: 12,
      // bevelEnabled: true,
      // bevelThickness: 10,
      // bevelSize: 8,
      // bevelOffset: 0,
      // bevelSegments: 5
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    textMesh.position.set(cm(0.25), 0, cm(-0.25));
    textMesh.rotation.x = -Math.PI / 2;

    return textMesh;
  }
}
