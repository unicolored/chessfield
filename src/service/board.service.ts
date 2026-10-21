import * as cg from '@lichess-org/chessground/types';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { uniform, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import { Store } from '../provider/store.ts';
import type * as cf from '../resource/chessfield.types.ts';
import { type ThemeColors } from '../resource/chessfield.types.ts';
import { cbShader } from '../shader/cbShader.ts';

import { ShapesService } from './shapes.service.ts';
import { type TextService, type TextConfig } from './text/text.service.ts';

export class BoardService {
  private decorGroup: THREE.Group | null = null;
  private decorMeshes: THREE.Mesh[] = [];

  public decor(mode: ThemeColors): THREE.Group {
    const decorGroup = new THREE.Group();
    this.decorGroup = decorGroup;
    this.decorMeshes = [];

    // Create a box geometry and material
    const frameGeometry = new THREE.BoxGeometry(cm(10), cm(0.025), cm(10));
    const frameColor = mode.dark;
    const frameMaterial = new THREE.MeshBasicNodeMaterial({ color: frameColor });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.userData['decorType'] = 'frame';
    // Position the box in the scene
    frame.position.set(0, cm(-0.1), cm(0));
    // Add the box to the scene
    decorGroup.add(frame);
    this.decorMeshes.push(frame);

    // const gridHelper = new GridHelper(0.1, 10, gridColor, gridColor);
    // gridHelper.position.y = cm(0.045);
    // decorGroup.add(gridHelper);

    // Create a box geometry and material
    const playerGeometry = new THREE.BoxGeometry(cm(8), cm(0.025), cm(0.025));

    const player1Material = new THREE.MeshBasicNodeMaterial({ color: Store.themes['light'].dark });
    const player1 = new THREE.Mesh(playerGeometry, player1Material);
    player1.userData['decorType'] = 'player1';
    // Position the box in the scene
    player1.position.set(0, cm(0), cm(4.5));
    // Add the box to the scene
    decorGroup.add(player1);
    this.decorMeshes.push(player1);

    // Create a box geometry and material
    const player2Material = new THREE.MeshBasicNodeMaterial({ color: Store.themes['dark'].dark });
    const player2 = new THREE.Mesh(playerGeometry, player2Material);
    player2.userData['decorType'] = 'player2';
    // Position the box in the scene
    player2.position.set(0, cm(0), cm(-4.5));
    // Add the box to the scene
    decorGroup.add(player2);
    this.decorMeshes.push(player2);

    return decorGroup;
  }

  public updateDecorColors(modeColors: ThemeColors): void {
    if (!this.decorGroup) return;

    for (const mesh of this.decorMeshes) {
      const material = mesh.material as THREE.MeshBasicNodeMaterial;
      if (!material) continue;

      const decorType = mesh.userData['decorType'] as string | undefined;
      switch (decorType) {
        case 'frame':
          material.colorNode = vec4(new THREE.Color(modeColors.dark), 1.0);
          break;
        case 'player1':
          material.colorNode = vec4(new THREE.Color(Store.themes['light'].dark), 1.0);
          break;
        case 'player2':
          material.colorNode = vec4(new THREE.Color(Store.themes['dark'].dark), 1.0);
          break;
      }
    }
  }

  public createCases(font: Font | null): THREE.Group {
    const shapesService = new ShapesService(['ring']);
    shapesService.createShaderMaterial('ring');
    // shapesService.createShaderMaterial('check');

    // Create the chessboard
    const casesGroup = new THREE.Group();
    casesGroup.name = '🔲🔳 Cases';
    // const checkCoord = vec2(2, 5);

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

        const squarePosition = new THREE.Vector3(
          cm(rankInt - Store.boardSize / 2 + 0.5),
          0.0001,
          cm(colInt - Store.boardSize / 2 + 0.5),
        );
        // const instanceVisible = select(
        //   checkCoord.x.equal(rankInt).and(checkCoord.y.equal(colInt)),
        //   float(1.0),
        //   float(0.0),
        // );

        // const instanceColor = new THREE.Color(0, 1, 1);
        // const pattern = uv().sub(0.5).length().smoothstep(0.5, 0.33);
        // const shader = new THREE.Color('crimson');
        // squareMaterial.opacityNode = float(pattern);
        // squareMaterial.colorNode = vec4(shader, instanceVisible);

        const square = new THREE.Mesh(squareGeometry, squareMaterial);
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
    const material = new THREE.MeshBasicNodeMaterial();

    const uHighlightPosStart = uniform(new THREE.Vector2(-1, -1)); // -1 to hide initially
    const uHighlightPosEnd = uniform(new THREE.Vector2(-1, -1)); // -1 to hide initially

    const uHighlightColor = uniform(new THREE.Color(0, 0, 1));
    const uLightColor = uniform(new THREE.Color(1, 0, 0));
    const uDarkColor = uniform(new THREE.Color(0, 1, 0));

    const cbConfig = {
      lightColor: uLightColor,
      darkColor: uDarkColor,
      highlightColor: uHighlightColor,
      posStart: uHighlightPosStart,
      posEnd: uHighlightPosEnd,
    };

    material.colorNode = vec4(cbShader(cbConfig), 1.0);

    const chessboard = new THREE.Mesh(geometry, material);

    // Add custom methods
    chessboard.setSquareColors = function (light: string | number, dark: string | number) {
      uLightColor.value.set(new THREE.Color(light));
      uDarkColor.value.set(new THREE.Color(dark));
    };

    chessboard.highlightSquareStart = function (x: number, y: number) {
      uHighlightPosStart.value.set(x, y);
    };

    chessboard.highlightSquareEnd = function (x: number, y: number) {
      uHighlightPosEnd.value.set(x, y);
    };

    chessboard.setHighlightColor = function (hex: string | number) {
      uHighlightColor.value.set(new THREE.Color(hex));
    };

    // chessboard.setHighlightStatusMateColor = function (hex: string | number = '#aa0000') {
    //   const [r, g, b] = hexToRgb(hex);
    //   material.userData['u_highlightStatusMateColor'] = vec3(r, g, b);
    // };

    chessboard.highlightSquareCursor = function (x: number, y: number) {
      material.userData['u_highlightPosCursor'] = vec2(x, y);
    };

    chessboard.rotation.x = -Math.PI / 2;
    chessboard.position.y = 0.00005;

    return chessboard as cf.ExtendedMesh;
  }

  /** Add player name labels to scene via TextService */
  public async addPlayerNames(
    textService: TextService,
    names: { white: string; black: string },
    textConfig: TextConfig,
  ): Promise<void> {
    const offset = textConfig.offset ?? cm(5.5);
    const fontSize = textConfig.fontSize ?? cm(0.4);
    const color = textConfig.color ?? '#ffffff';
    const fontFamily = textConfig.fontFamily ?? 'system-ui, sans-serif';
    const fontWeight = textConfig.fontWeight ?? '400';

    // White player name - South side (bottom), facing camera
    await textService.add({
      text: names.white ?? 'White',
      position: new THREE.Vector3(0, cm(0.5), offset),
      fontSize,
      color,
      fontFamily,
      fontWeight,
      anchorX: 'center',
      anchorY: 'center',
      rotation: new THREE.Euler(0, Math.PI, 0),
    });

    // Black player name - North side (top), facing camera
    await textService.add({
      text: names.black ?? 'Black',
      position: new THREE.Vector3(0, cm(0.5), -offset),
      fontSize,
      color,
      fontFamily,
      fontWeight,
      anchorX: 'center',
      anchorY: 'center',
      rotation: new THREE.Euler(0, 0, 0),
    });
  }
}
