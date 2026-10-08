import * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { type Font } from 'three/examples/jsm/loaders/FontLoader.js';

import { cm, hexToRgb } from '../helper.ts';
import { Store } from '../provider/store.ts';
import type * as cf from '../resource/chessfield.types.ts';
import { type ThemeColors } from '../resource/chessfield.types.ts';
import { ShapesService } from './shapes.service.ts';
import {
  cameraProjectionMatrix,
  checker,
  float,
  floor,
  mix,
  mod,
  modelViewMatrix,
  select,
  userData,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { positionLocal } from 'three/src/nodes/TSL.js';
// import { chessboardShader } from '../shader/chessboard.shader.ts';

export class BoardService {
  public decor(mode: ThemeColors): THREE.Group {
    const decorGroup = new THREE.Group();

    // Create a box geometry and material
    const frameGeometry = new THREE.BoxGeometry(cm(10), cm(0.025), cm(10));
    const frameColor = mode.dark;
    const frameMaterial = new THREE.MeshBasicNodeMaterial({ color: frameColor });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    // Position the box in the scene
    frame.position.set(0, cm(-0.1), cm(0));
    // Add the box to the scene
    decorGroup.add(frame);

    // const gridHelper = new GridHelper(0.1, 10, gridColor, gridColor);
    // gridHelper.position.y = cm(0.045);
    // decorGroup.add(gridHelper);

    // Create a box geometry and material
    const playerGeometry = new THREE.BoxGeometry(cm(8), cm(0.025), cm(0.025));

    const player1Material = new THREE.MeshBasicNodeMaterial({ color: Store.themes['light'].dark });
    const player1 = new THREE.Mesh(playerGeometry, player1Material);
    // Position the box in the scene
    player1.position.set(0, cm(0), cm(4.5));
    // Add the box to the scene
    decorGroup.add(player1);

    // Create a box geometry and material
    const player2Material = new THREE.MeshBasicNodeMaterial({ color: Store.themes['dark'].dark });
    const player2 = new THREE.Mesh(playerGeometry, player2Material);
    // Position the box in the scene
    player2.position.set(0, cm(0), cm(-4.5));
    // Add the box to the scene
    decorGroup.add(player2);

    return decorGroup;
  }

  public createCases(font: Font | null): THREE.Group {
    const shapesService = new ShapesService();
    shapesService.createShaderMaterial('ring');

    // Create the chessboard
    const casesGroup = new THREE.Group();
    casesGroup.name = '🔲🔳 Cases';

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const coord = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

        // GROUP
        const caseGroup = new THREE.Group();
        caseGroup.name = coord;
        caseGroup.userData['coord'] = coord;

        // SQUARE
        const squareGeometry = new THREE.PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);
        squareGeometry.scale(0.25, 0.25, 0.25);
        const theme = Store.themes['blue'];
        const squareMaterial = new THREE.MeshBasicNodeMaterial({
          color: 0xff_00_00,
          wireframe: true,
          transparent: true,
          opacity: 0,
        });

        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        const squarePosition = new THREE.Vector3(
          cm(rankInt - Store.boardSize / 2 + 0.5),
          cm(0.05),
          cm(colInt - Store.boardSize / 2 + 0.5),
        );
        square.rotation.x = -Math.PI / 2;

        square.position.set(squarePosition.x, squarePosition.y, squarePosition.z);
        square.castShadow = false;
        square.receiveShadow = false;

        // TEXT
        if (font) {
          const textMesh = this.makeCoordText(font, coord, { rankInt, colInt }, theme);

          // ADD
          square.add(textMesh);
        }
        caseGroup.add(square);
        casesGroup.add(caseGroup);
      }
    }

    return casesGroup;
  }

  private makeCoordText(
    font: Font,
    text: string,
    pos: { rankInt: number; colInt: number },
    theme: cf.ThemeColors,
  ): THREE.Mesh {
    const textMaterial = new THREE.MeshPhongMaterial({
      color: (pos.rankInt + pos.colInt) % 2 !== 0 ? theme.light : theme.dark,
    });
    const textGeometry = new TextGeometry(text, {
      font,
      size: cm(0.1),
      depth: cm(0.01),
      // curveSegments: 12,
      // bevelEnabled: true,
      // bevelThickness: 10,
      // bevelSize: 8,
      // bevelOffset: 0,
      // bevelSegments: 5
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    textMesh.position.set(cm(0.25), cm(0.25), cm(0.005));
    // textMesh.rotation.x = Math.PI * 60;

    return textMesh;
  }

  createChessboard(): cf.ExtendedMesh {
    const geometry = new THREE.PlaneGeometry(0.08, 0.08);
    const material = new THREE.MeshBasicNodeMaterial({
      // uniforms: chessboardShader.uniforms,
      // vertexShader: chessboardShader.vertexShader,
      // fragmentShader: chessboardShader.fragmentShader,
    });
    // const uv1 = uv().mul(4).toVar('uv1').debug().toInspector('UV1');
    // const checker1 = checker(uv1).toVar('checker').toInspector('CHECKER');
    const lightColor = vec3(userData('u_squareLightColor', ''));
    const darkColor = vec3(userData('u_squareDarkColor', ''));
    const posStart = vec2(userData('u_highlightPosStart', ''));
    console.log('posStart', posStart);
    // const posEnd = vec2(userData('u_highlightPosEnd', ''));
    // const highlightColor = vec3(userData('u_highlightColor'));

    // 1. Define colors and grid settings
    const targetColor = vec3(0, 0, 1); // Blue
    const squareSize = float(0.125); // 1 / 8 for an 8x8 grid

    // 2. Scale UV coordinates to grid space (0.0 to 8.0)
    const coord = uv().div(squareSize);

    // 3. Calculate checkerboard pattern
    const chess = floor(coord.x).add(floor(coord.y)).mod(2);
    const baseMix = mix(lightColor, darkColor, chess);

    // 4. Check if current pixel is at x = 3 and y = 4 (0-indexed)
    const isTargetX = floor(coord.x).equal(posStart.x).debug();
    const isTargetY = floor(coord.y).equal(posStart.y);
    const isTargetSquare = isTargetX.and(isTargetY);

    // 5. Override color with blue if condition is met
    const finalMix = select(isTargetSquare, targetColor, baseMix);
    const colorNode = vec4(finalMix, 1.0);

    material.colorNode = colorNode;
    // material.vertexNode = chessboardShader.vertexShader;
    // material.fragmentNode = chessboardShader.fragmentShader;

    const chessboard = new THREE.Mesh(geometry, material);

    // material.uniforms['u_resolution'].value.set(0.08, 0.08);
    // const material = this.material as THREE.MeshBasicNodeMaterial;

    // Add custom methods
    chessboard.setSquareColors = function (light: string | number, dark: string | number) {
      this.userData['u_squareLightColor'] = new THREE.Color(light);
      this.userData['u_squareDarkColor'] = new THREE.Color(dark);
      // this.userData['u_resolution'] = vec2(0.08);
    };

    chessboard.highlightSquareStart = function (x: number, y: number) {
      // this.material.uniforms['u_highlightPosStart'].value.set(x, y);
      this.userData['u_highlightPosStart'] = { x: x, y: y };
    };

    chessboard.highlightSquareEnd = function (x: number, y: number) {
      // this.material.uniforms['u_highlightPosEnd'].value.set(x, y);
      this.userData['u_highlightPosEnd'] = { x: x, y: y };
    };

    chessboard.setHighlightColor = function (hex: string | number) {
      const [r, g, b] = hexToRgb(hex);
      // this.material.uniforms['u_highlightColor'].value.set(r, g, b);
      this.userData['u_highlightColor'] = vec3(r, g, b);
    };

    chessboard.setHighlightStatusMateColor = function (hex: string | number = '#aa0000') {
      const [r, g, b] = hexToRgb(hex);
      // this.material.uniforms['u_highlightStatusMateColor'].value.set(r, g, b);
      material.userData['u_highlightStatusMateColor'] = vec3(r, g, b);
    };

    chessboard.highlightSquareCursor = function (x: number, y: number) {
      // this.material.uniforms['u_highlightPosCursor'].value.set(x, y);
      material.userData['u_highlightPosCursor'] = vec2(x, y);
    };

    chessboard.setStatusMate = function (x: number, y: number) {
      console.log('mate', x, y);
      // this.material.uniforms['u_highlightStatusMate'].value.set(x, y);
      material.userData['u_highlightStatusMate'] = vec2(x, y);
      // this.traverse((child: Object3D) => {
      //   // console.log('statusMate', child);
      //
      //   if (child.name === 'haha') {
      //     console.log('child found', child);
      //   }
      // });
    };

    chessboard.rotation.x = -Math.PI / 2;
    chessboard.position.y = 0.00005;

    return chessboard as cf.ExtendedMesh;
  }
}
