import type { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three/webgpu';

import { type Store } from '../provider/store.ts';
import { type ThemeProvider } from '../provider/theme.provider.ts';
import { type BoardService } from '../service/board.service.ts';
import { type ShapesService } from '../service/shapes.service.ts';
import { type StateService } from '../service/state.service.ts';
import { type TextService } from '../service/text/text.service.ts';

export interface SceneCompositionResult {
  chessboardGroup: THREE.Group;
  stateGroup: THREE.Group;
  shapesGroup: THREE.Group;
  decorGroup: THREE.Group;
  loaderGroup: THREE.Group;
  textGroup: THREE.Group;
}

export class SceneComposer {
  static compose(
    // container: Container,
    store: Store,
    themeProvider: ThemeProvider,
    boardService: BoardService,
    shapesService: ShapesService,
    stateService: StateService,
    textService: TextService,
    scene: THREE.Scene,
    font: Font | null,
  ): SceneCompositionResult {
    const themeColors = themeProvider.getThemeColors();
    const modeColors = themeProvider.getModeColors();

    // Chessboard Group
    const chessboardGroup = new THREE.Group();
    chessboardGroup.name = '🟣 Chessboard Group';
    scene.add(chessboardGroup);

    // State Group
    const stateGroup = new THREE.Group();
    stateGroup.name = '🟣 State Group';
    scene.add(stateGroup);

    // Shapes Group
    const shapesGroup = new THREE.Group();
    shapesGroup.name = '🟣 Shapes Group';
    scene.add(shapesGroup);

    const textGroup = store.getTextGroup();

    // Chessboard
    store.chessboard = boardService.createChessboard();
    store.chessboard.setSquareColors(themeColors.light, themeColors.dark);
    store.chessboard.setHighlightColor(themeColors.highlight);
    chessboardGroup.add(store.chessboard);

    // Cases
    store.casesGroup = boardService.createCases(font);
    chessboardGroup.add(store.casesGroup);

    // Shapes / Rings
    store.shapesRing = shapesService.getMesh('ring');
    store.shapesRing.name = '🟢 Shapes (ring)';
    shapesGroup.add(store.shapesRing);

    // Shapes / Arrows
    shapesGroup.add(shapesService.getArrowsGroup());

    // Shapes / Checks
    store.state = stateService.getMesh('check');
    store.state.name = '🟢 Shapes (check)';
    shapesGroup.add(store.state);

    // Text Service
    if (store.getConfig().playerNames) {
      const textConfig = { ...store.getConfig().text };
      // An explicit text color wins; otherwise use the mode-contrasting default.
      textConfig.color ??= themeProvider.getTextColor();

      boardService.addPlayerNames(
        textService,
        {
          white: store.getConfig().playerNames?.white ?? 'White',
          black: store.getConfig().playerNames?.black ?? 'Black',
        },
        textConfig,
        textGroup,
      );
    }

    // Décor
    const decorGroup = boardService.decor(modeColors);
    decorGroup.name = '🔵 Décor';
    scene.add(decorGroup);

    // Loader Group
    const loaderGroup = new THREE.Group();
    scene.add(loaderGroup);

    return {
      chessboardGroup,
      stateGroup,
      shapesGroup,
      decorGroup,
      loaderGroup,
      textGroup,
    };
  }
}
