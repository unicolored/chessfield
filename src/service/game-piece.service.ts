import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';

import { type Container } from '../core/Container.ts';
import { coordToVector2, lmToCoordinates } from '../helper.ts';
import { GameProvider } from '../provider/game.provider.ts';
import type { GameState } from '../resource/chessfield.state.ts';
import type * as cf from '../resource/chessfield.types.ts';

export class GamePieceService {
  private fenSubscription: (() => void) | null = null;

  constructor(private container: Container) {}

  /** Subscribe to FEN updates once, and render the current position. */
  start(): void {
    if (this.fenSubscription) {
      return;
    }

    this.fenSubscription = this.container.getStore().fenSubject$.subscribe((moves: cf.Moves | null) => {
      this.render(moves);
    });
  }

  /** Re-render the current position and game state, e.g. after setState(). */
  refresh(): void {
    if (!this.fenSubscription) {
      return;
    }

    this.render(this.container.getStore().fenSubject$.value);
  }

  private render(moves: cf.Moves | null): void {
    if (!moves) {
      return;
    }

    const move = GameProvider.findLastMove(moves.moves);
    if (!move) {
      return;
    }

    const pieceProvider = this.container.getPieceProvider();
    const boardPieces = this.container.getGameProvider().setBoardPieces(move);
    pieceProvider.sync(boardPieces);

    const lastMoveToCoordinates = lmToCoordinates(move.lastMove);
    if (lastMoveToCoordinates.length > 1) {
      this.container
        .getStore()
        .chessboard?.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
      this.container
        .getStore()
        .chessboard?.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
    }

    // State flags are presentation of the current game state, not of the position.
    pieceProvider.clearStateFlags();

    const gameState = this.container.getStore().gameState;

    if (gameState) {
      if (gameState.mate || gameState.draw) {
        this.addShapes(gameState);
      }

      if (gameState.check) {
        gameState.check.forEach((key: cg.Key | string) => {
          if (key) {
            const kingVec = coordToVector2(key);
            this.container.getStateService().setStateAt(kingVec.x, kingVec.y);
          }
        });
      }
    } else {
      this.container.getStateService().clearAll(['check']);
    }
  }

  addShapes(state: GameState | null): void {
    if (!state) {
      return;
    }

    const piecesObjects = this.container.getStore().getBoardPiecesObjectsMap();

    const findPieceMesh = (key: string): THREE.Mesh | null => {
      return piecesObjects.get(key as cg.Key) ?? null;
    };

    const findStateSprite = (piece: THREE.Object3D) => {
      return piece.children.find(c => c.name === 'stateSprite');
    };

    if (state.winner) {
      let mateKey;
      if (state.winner === 'w') {
        mateKey = state.kings?.black;
      } else {
        mateKey = state.kings?.white;
      }
      if (mateKey) {
        const squareVec2 = coordToVector2(mateKey);
        this.container.getStateService().setStateAt(squareVec2.x, squareVec2.y);

        const pieceFound = findPieceMesh(mateKey);
        if (pieceFound) {
          const spriteFound = findStateSprite(pieceFound);
          if (spriteFound) {
            spriteFound.userData['showSprite'] = true;
            spriteFound.userData['lostState'] = true;
          }
        }
      }
    }

    if (state.draw) {
      state.draw.forEach((key: cg.Key | string) => {
        if (key) {
          const pieceFound = findPieceMesh(key);
          if (pieceFound) {
            const spriteFound = findStateSprite(pieceFound);
            if (spriteFound) {
              spriteFound.userData['showSprite'] = true;
              spriteFound.userData['lostState'] = false;
            }
          }
        }
      });
    }
  }

  addRingAt(rank: number, file: number, shape: string): void {
    const shapesService = this.container.getShapesService();
    const themeColors = this.container.getThemeProvider().getThemeColors();

    const index = rank * 8 + file;

    const color =
      (themeColors as unknown as Record<string, string | number | undefined>)[shape]?.toString() ?? '#000000';

    const isVisible = shapesService.getVisible(index, 'ring');

    if (!isVisible) {
      shapesService.setShapeAt(rank, file, color, true, 'ring');
    } else {
      const currentColor = shapesService.getColor(index, 'ring');
      if (currentColor.toLowerCase() === color.toLowerCase()) {
        shapesService.clearShape(index, 'ring');
      } else {
        shapesService.setShapeAt(rank, file, color, true, 'ring');
      }
    }
  }
}
