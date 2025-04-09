import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Store } from '../provider/store.ts';
import { cm, hexToRgb } from '../helper.ts';
import * as cg from 'chessground/types';
import * as cf from '../resource/chessfield.types.ts';
import { ThemeColors } from '../resource/chessfield.types.ts';

export class BoardService {
  public decor(mode: ThemeColors): Group {
    const decorGroup = new Group();

    // Create a box geometry and material
    const frameGeometry = new BoxGeometry(cm(10), cm(0.025), cm(10));
    const frameColor = mode.dark;
    const frameMaterial = new MeshBasicMaterial({ color: frameColor });
    const frame = new Mesh(frameGeometry, frameMaterial);
    // Position the box in the scene
    frame.position.set(0, cm(-0.1), cm(0));
    // Add the box to the scene
    decorGroup.add(frame);

    // const gridHelper = new GridHelper(0.1, 10, gridColor, gridColor);
    // gridHelper.position.y = cm(0.045);
    // decorGroup.add(gridHelper);

    // Create a box geometry and material
    const playerGeometry = new BoxGeometry(cm(8), cm(0.025), cm(0.025));

    const player1Material = new MeshBasicMaterial({ color: Store.themes['light'].dark });
    const player1 = new Mesh(playerGeometry, player1Material);
    // Position the box in the scene
    player1.position.set(0, cm(0), cm(4.5));
    // Add the box to the scene
    decorGroup.add(player1);

    // Create a box geometry and material
    const player2Material = new MeshBasicMaterial({ color: Store.themes['dark'].dark });
    const player2 = new Mesh(playerGeometry, player2Material);
    // Position the box in the scene
    player2.position.set(0, cm(0), cm(-4.5));
    // Add the box to the scene
    decorGroup.add(player2);

    return decorGroup;
  }

  public createCases(font: Font | null): Group {
    // Create the chessboard
    const casesGroup = new Group();
    casesGroup.name = '🔲🔳 Cases';

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const coord = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

        // GROUP
        const caseGroup = new Group();
        caseGroup.name = coord;
        caseGroup.userData['coord'] = coord;

        // SQUARE
        const squareGeometry = new PlaneGeometry(Store.squareSize, Store.squareSize, 1, 1);
        squareGeometry.scale(0.25, 0.25, 0.25);
        const theme = Store.themes['blue'];
        const squareMaterial = new MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
          transparent: true,
          opacity: 0,
        });

        const square = new Mesh(squareGeometry, squareMaterial);
        const squarePosition = new Vector3(
          cm(rankInt - Store.boardSize / 2 + 0.5),
          cm(0.055),
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
  ): Mesh {
    const textMaterial = new MeshPhongMaterial({
      color: (pos.rankInt + pos.colInt) % 2 !== 0 ? theme.light : theme.dark,
    });
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: cm(0.1),
      depth: cm(0.01),
      // curveSegments: 12,
      // bevelEnabled: true,
      // bevelThickness: 10,
      // bevelSize: 8,
      // bevelOffset: 0,
      // bevelSegments: 5
    });
    const textMesh = new Mesh(textGeometry, textMaterial);

    textMesh.position.set(cm(0.25), cm(0.25), cm(0.005));
    // textMesh.rotation.x = Math.PI * 60;

    return textMesh;
  }

  createChessboard(): cf.ExtendedMesh {
    // Updated shader with highlight capability
    const chessboardShader = {
      uniforms: {
        u_resolution: { value: new Vector2() },
        u_squareSize: { value: 0.01 },
        u_highlightPosStart: { value: new Vector2(-1, -1) }, // Target square coordinates
        u_highlightPosEnd: { value: new Vector2(-1, -1) }, // Target square coordinates
        u_highlightColor: { value: new Vector3(1, 1, 0) }, // Highlight color (yellow in this case)
        // u_squareLightColor: Store.themes['blue'].light,
        // u_squareDarkColor: Store.themes['blue'].dark,
        u_squareLightColor: { value: new Vector3(0.9, 0.9, 0.9) }, // Light gray by default
        u_squareDarkColor: { value: new Vector3(0.3, 0.3, 0.3) },
      },

      vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

      fragmentShader: `
        uniform vec2 u_resolution;
        uniform float u_squareSize;
        uniform vec2 u_highlightPosStart;
        uniform vec2 u_highlightPosEnd;
        uniform vec3 u_highlightColor;
        uniform vec3 u_squareLightColor;
        uniform vec3 u_squareDarkColor;
        varying vec2 vUv;
        
        void main() {
            vec2 coord = vUv * u_resolution / u_squareSize;
            vec2 gridPos = floor(coord);
            
            // Basic chessboard pattern
            float chess = mod(floor(coord.x) + floor(coord.y), 2.0);
            // vec3 baseColor = vec3(chess);
            
            // Base color based on light/dark squares
            vec3 baseColor = mix(u_squareDarkColor, u_squareLightColor, chess);
            
            // Check if current square matches highlight position
            float isHighlightedStart = step(0.0, 0.0 - length(gridPos - u_highlightPosStart));
            float isHighlightedEnd = step(0.0, 0.0 - length(gridPos - u_highlightPosEnd));
            
            // Mix base color with highlight color
            vec3 color = baseColor;
            color = mix(color, u_highlightColor, isHighlightedStart * 0.8);
            color = mix(color, u_highlightColor, isHighlightedEnd * 0.8);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    };

    const geometry = new PlaneGeometry(0.08, 0.08);
    const material = new ShaderMaterial({
      uniforms: chessboardShader.uniforms,
      vertexShader: chessboardShader.vertexShader,
      fragmentShader: chessboardShader.fragmentShader,
    });

    const chessboard = new Mesh(geometry, material);

    material.uniforms['u_resolution'].value.set(0.08, 0.08);

    // Add custom methods
    chessboard.setSquareColors = function (light: string | number, dark: string | number) {
      const [lightR, lightG, lightB] = hexToRgb(light); // light: 0xbfcfdd,
      const [darkR, darkG, darkB] = hexToRgb(dark); // dark: 0x9dabb6
      const material = this.material as ShaderMaterial;
      material.uniforms['u_squareLightColor'].value.set(lightR, lightG, lightB);
      material.uniforms['u_squareDarkColor'].value.set(darkR, darkG, darkB);
    };

    chessboard.highlightSquareStart = function (x: number, y: number) {
      this.material.uniforms['u_highlightPosStart'].value.set(x, y);
    };

    chessboard.highlightSquareEnd = function (x: number, y: number) {
      this.material.uniforms['u_highlightPosEnd'].value.set(x, y);
    };

    chessboard.setHighlightColor = function (hex: string | number) {
      const [r, g, b] = hexToRgb(hex);
      this.material.uniforms['u_highlightColor'].value.set(r, g, b);
    };

    chessboard.rotation.x = -Math.PI / 2;
    chessboard.position.y = 0.0005;

    return chessboard as cf.ExtendedMesh;
  }
}
