import * as cg from '@lichess-org/chessground/types';
import { type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { uniform, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import { Store } from '../provider/store.ts';
import type * as cf from '../resource/chessfield.types.ts';
import { type ThemeColors } from '../resource/chessfield.types.ts';
import { cbShader } from '../shader/cbShader.ts';

import { type TextConfig, type TextService } from './text/text.service.ts';

const TURN_SWITCH_X = cm(-4.5);
const TURN_SWITCH_CENTER_Y = cm(0.32);
const TURN_SWITCH_WIDTH = cm(0.4);
const TURN_SWITCH_THICKNESS = cm(0.1);
const TURN_SWITCH_LENGTH = cm(7);
const TURN_SWITCH_TILT = 0.08;

export class BoardService {
  // Shared with the frame material's uniform: mutating it needs no shader rebuild.
  private frameColor = new THREE.Color();

  // One rocker on the left edge, coloured like the current scene background.
  private readonly switchColor = new THREE.Color('#000000');
  private turnSwitch: THREE.Mesh | null = null;
  private turn: cg.Color = 'white';

  public decor(mode: ThemeColors, turn: cg.Color = 'white'): THREE.Group {
    const decorGroup = new THREE.Group();

    // Create a box geometry and material
    const frameGeometry = new THREE.BoxGeometry(cm(10), cm(0.025), cm(10));
    this.frameColor.set(mode.dark);
    const frameMaterial = new THREE.MeshBasicNodeMaterial();
    frameMaterial.colorNode = vec4(uniform(this.frameColor), 1.0);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    // Position the box in the scene
    frame.position.set(0, cm(-0.1), cm(0));
    // Add the box to the scene
    decorGroup.add(frame);

    // const gridHelper = new GridHelper(0.1, 10, gridColor, gridColor);
    // gridHelper.position.y = cm(0.045);
    // decorGroup.add(gridHelper);

    // One clock-style rocker on the left edge (from White's view). The end on the side
    // of the player to move is raised; the other end rests near the frame.
    this.switchColor.set(mode.light);
    const switchMaterial = new THREE.MeshBasicNodeMaterial();
    switchMaterial.colorNode = vec4(uniform(this.switchColor), 1.0);

    const switchGeometry = new THREE.BoxGeometry(
      TURN_SWITCH_WIDTH,
      TURN_SWITCH_THICKNESS,
      TURN_SWITCH_LENGTH,
    );
    const turnSwitch = new THREE.Mesh(switchGeometry, switchMaterial);
    turnSwitch.name = 'cf-turn-switch';
    turnSwitch.position.set(TURN_SWITCH_X, TURN_SWITCH_CENTER_Y, 0);
    this.turnSwitch = turnSwitch;
    decorGroup.add(turnSwitch);

    // A small fixed fulcrum makes the bar read as a rocker rather than a floating plank.
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.12), cm(0.12), cm(0.3), 12), switchMaterial);
    pivot.name = 'cf-turn-switch-pivot';
    pivot.position.set(TURN_SWITCH_X, cm(0.15), 0);
    decorGroup.add(pivot);

    this.turn = turn;
    this.applyTurn();

    return decorGroup;
  }

  /** Rock the switch toward the side to move. No-op when the turn did not change. */
  public setTurn(turn: cg.Color): void {
    if (this.turn === turn) {
      return;
    }

    this.turn = turn;
    this.applyTurn();
  }

  private applyTurn(): void {
    if (!this.turnSwitch) {
      return;
    }

    // White is +Z: a negative rotation around X raises that end.
    this.turnSwitch.rotation.x = this.turn === 'white' ? -TURN_SWITCH_TILT : TURN_SWITCH_TILT;
  }

  // The frame follows the mode; the rocker matches the current background colour.
  public updateDecorColors(modeColors: ThemeColors): void {
    this.frameColor.set(modeColors.dark);
    this.switchColor.set(modeColors.light);
  }

  public createCases(font: Font | null): THREE.Group {
    // The unused ShapesService/shader instantiated here was removed: shapes are created once by the container.

    // Create the chessboard
    const casesGroup = new THREE.Group();
    casesGroup.name = '🔲🔳 Cases';
    // const checkCoord = vec2(2, 5);
    // Hoisted: the file letters are constant and were rebuilt for every square before.
    const files = cg.files;

    // One shared geometry and material for all 64 hit-boxes (they are invisible and only serve raycasts).
    const squareGeometry = new THREE.PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);
    squareGeometry.scale(0.25, 0.25, 0.25);
    const squareMaterial = new THREE.MeshBasicMaterial();

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const square = files[rankInt] + (Store.boardSize - colInt);

        const squarePosition = new THREE.Vector3(
          cm(rankInt - Store.boardSize / 2 + 0.5),
          0.0001,
          cm(colInt - Store.boardSize / 2 + 0.5),
        );

        // A flat mesh carries its square: the previous per-square Group wrapper is no longer needed.
        const squareMesh = new THREE.Mesh(squareGeometry, squareMaterial);
        squareMesh.name = square;
        squareMesh.userData['square'] = square;
        squareMesh.rotation.x = -Math.PI / 2;
        squareMesh.position.set(squarePosition.x, squarePosition.y, squarePosition.z);
        squareMesh.castShadow = false;
        squareMesh.receiveShadow = false;
        // Hidden from rendering (saves 64 draw calls) while remaining raycastable.
        squareMesh.visible = false;

        casesGroup.add(squareMesh);
      }
    }

    return casesGroup;
  }

  // private makeCoordText(
  //   font: Font,
  //   text: string,
  //   pos: { rankInt: number; colInt: number },
  //   theme: cf.ThemeColors,
  // ): THREE.Mesh {
  //   const textMaterial = new THREE.MeshPhongMaterial({
  //     color: (pos.rankInt + pos.colInt) % 2 !== 0 ? theme.light : theme.dark,
  //   });
  //   const textGeometry = new TextGeometry(text, {
  //     font,
  //     size: cm(0.1),
  //     depth: cm(0.01),
  //     // curveSegments: 12,
  //     // bevelEnabled: true,
  //     // bevelThickness: 10,
  //     // bevelSize: 8,
  //     // bevelOffset: 0,
  //     // bevelSegments: 5
  //   });
  //   const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  //
  //   textMesh.position.set(cm(0.25), cm(0.25), cm(0.005));
  //   // textMesh.rotation.x = Math.PI * 60;
  //
  //   return textMesh;
  // }

  createChessboard(): cf.ExtendedMesh {
    const geometry = new THREE.PlaneGeometry(0.08, 0.08);
    const material = new THREE.MeshBasicNodeMaterial();

    const uHighlightPosStart = uniform(new THREE.Vector2(-1, -1)); // -1 to hide initially
    const uHighlightPosEnd = uniform(new THREE.Vector2(-1, -1)); // -1 to hide initially

    const uHighlightColor = uniform(new THREE.Color(0, 0, 1));
    const uLightColor = uniform(new THREE.Color(1, 0, 0));
    const uDarkColor = uniform(new THREE.Color(0, 1, 0));

    const uHighlightPosCursor = uniform(new THREE.Vector2(-1, -1)); // -1 to hide initially

    const cbConfig = {
      lightColor: uLightColor,
      darkColor: uDarkColor,
      highlightColor: uHighlightColor,
      posStart: uHighlightPosStart,
      posEnd: uHighlightPosEnd,
      posCursor: uHighlightPosCursor,
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

    chessboard.highlightSquareCursor = function (x: number, y: number) {
      uHighlightPosCursor.value.set(x, y);
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
    textGroup: THREE.Group,
  ): Promise<void> {
    const offset = textConfig.offset ?? cm(5.5);
    const fontSize = textConfig.fontSize ?? cm(0.4);
    const color = textConfig.color ?? '#ffffff';
    const fontFamily = textConfig.fontFamily ?? 'system-ui, sans-serif';
    const fontWeight = textConfig.fontWeight ?? '400';

    // White player name - South side (bottom), facing the white side
    const whiteName = await textService.add({
      text: names.white ?? 'White',
      position: new THREE.Vector3(0, cm(0.5), offset),
      fontSize,
      color,
      fontFamily,
      fontWeight,
      anchorX: 'center',
      anchorY: 'center',
      rotation: new THREE.Euler(0, 0, 0),
    });
    textGroup.add(whiteName.object);

    // Black player name - North side (top), facing the black side
    const blackName = await textService.add({
      text: names.black ?? 'Black',
      position: new THREE.Vector3(0, cm(0.5), -offset),
      fontSize,
      color,
      fontFamily,
      fontWeight,
      anchorX: 'center',
      anchorY: 'center',
      rotation: new THREE.Euler(0, Math.PI, 0),
    });

    textGroup.add(blackName.object);
  }
}
