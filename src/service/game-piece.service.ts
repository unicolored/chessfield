import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';

import { type Container } from '../core/Container.ts';
import { coordToVector2, lmToCoordinates } from '../helper.ts';
import { GameProvider } from '../provider/game.provider.ts';
import type { GameState } from '../resource/chessfield.state.ts';

export class GamePieceService {
  private movesSubscription: (() => void) | null = null;
  // private foundLastMove: { lastMove: cg.Key[] } | null = null;

  constructor(private container: Container) {}

  getMovesSubscription(): (() => void) | null {
    return this.movesSubscription;
  }

  setMovesSubscription(sub: (() => void) | null): void {
    this.movesSubscription = sub;
  }

  // getFoundLastMove(): { lastMove: cg.Key[] } | null {
  //   return this.foundLastMove;
  // }
  //
  // setFoundLastMove(move: { lastMove: cg.Key[] } | null): void {
  //   this.foundLastMove = move;
  // }

  updatePieces(): void {
    if (this.movesSubscription) {
      this.movesSubscription();
    }

    this.movesSubscription = this.container.getStore().movesSubject$.subscribe((moves: any) => {
      // Robust cleanup: remove previous pieces group from scene
      const piecesGroup = this.container.getStore().piecesGroup;
      if (piecesGroup) {
        this.container.getStore().scene?.remove(piecesGroup);
        piecesGroup.clear();
      }

      const move = GameProvider.findLastMove(moves.moves);
      // this.foundLastMove = move?.lastMove ? { lastMove: move.lastMove } : null;

      let boardPieces: any[] = [];

      if (move) {
        boardPieces = this.container.getGameProvider().initGamePieces(move);

        const lastMoveToCoordinates = lmToCoordinates(move.lastMove);
        if (lastMoveToCoordinates.length > 1) {
          this.container
            .getStore()
            .chessboard?.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
          this.container
            .getStore()
            .chessboard?.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
        }
      }

      const newPiecesGroup = this.container.getPieceProvider().updateGamePositions(boardPieces);
      this.container.getStore().piecesGroup = newPiecesGroup;
      this.container.getStore().boardPieces = boardPieces;
      this.container.getStore().piecesObjects = this.container.getStore().getBoardPiecesObjectsMap();
      this.container.getStore().scene?.add(newPiecesGroup);

      // Handle game state
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
    });
  }

  addShapes(state: GameState | null): void {
    if (!state) {
      return;
    }

    const boardPieces = this.container.getStore().boardPieces ?? [];
    const piecesObjects = this.container.getStore().piecesObjects;

    const findPieceMesh = (mateKey: string): THREE.Object3D | null => {
      if (!piecesObjects) return null;
      const boardPiece = boardPieces.find((bp: any) => bp.coord === mateKey);
      if (!boardPiece || !boardPiece.objectKey) return null;
      return piecesObjects.get(boardPiece.objectKey) ?? null;
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
