import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';

import { type BoardPiece } from '../chessfield.ts';
import { type Container } from '../core/Container.ts';
import { coordToVector2, lmToCoordinates } from '../helper.ts';
import { GameProvider } from '../provider/game.provider.ts';
// import { GameProvider } from '../provider/game.provider.ts';
import type { GameState } from '../resource/chessfield.state.ts';

export class GamePieceService {
  private fenSubscription: (() => void) | null = null;
  // private movesSubscription: (() => void) | null = null;
  // private foundLastMove: { lastMove: cg.Key[] } | null = null;

  constructor(private container: Container) {}

  getFenSubscription(): (() => void) | null {
    return this.fenSubscription;
  }

  setFenSubscription(sub: (() => void) | null): void {
    this.fenSubscription = sub;
  }
  //
  // getMovesSubscription(): (() => void) | null {
  //   return this.movesSubscription;
  // }
  //
  // setMovesSubscription(sub: (() => void) | null): void {
  //   this.movesSubscription = sub;
  // }

  // getFoundLastMove(): { lastMove: cg.Key[] } | null {
  //   return this.foundLastMove;
  // }
  //
  // setFoundLastMove(move: { lastMove: cg.Key[] } | null): void {
  //   this.foundLastMove = move;
  // }

  updatePieces(): void {
    if (this.fenSubscription) {
      this.fenSubscription();
    }

    this.fenSubscription = this.container.getStore().fenSubject$.subscribe((moves: cf.Moves) => {
      console.log(moves);
      // TODO: create a unique fen id, linked to lichess game
      // and that will allow to save all the moves
      // so an UI on chesspop will allow to go back and forth into the moves list

      // const piecesGroup = this.container.getStore().piecesGroup;
      // if (piecesGroup) {
      //   this.container.getStore().getScene()?.remove(piecesGroup);
      //   piecesGroup.clear();
      // }

      const move = GameProvider.findLastMove(moves.moves);
      const previousMove = GameProvider.findPreviousMove(moves.moves);
      console.log('updatePices sub previousMove', previousMove);
      // this.foundLastMove = move?.lastMove ? { lastMove: move.lastMove } : null;

      let boardPieces: any[] = [];
      let previousBoardPieces: any[] = [];
      let removePieces: any[] = [];

      if (move) {
        const compareBoardPieces = this.container.getGameProvider().compareToPreviousFen(previousMove, move);
        console.log('compareBoardPieces', compareBoardPieces);

        boardPieces = this.container.getGameProvider().initGamePieces(move);
        console.log('boardPieces now', boardPieces);
        if (previousMove) {
          previousBoardPieces = this.container.getGameProvider().setBoardPieces(previousMove);
          console.log('boardPieces previous', boardPieces);
        }
        console.log('cBP', compareBoardPieces.size);
        if (compareBoardPieces.size > 0) {
          // compareBoardPieces.forEach((b: BoardPiece) => {
          //   console.log(compareBoardPieces, b);
          //   const compared = compareBoardPieces.get(`${b.square}`);
          //   console.log(compared);
          //   if (compared && compared.now === undefined) {
          //     removePieces.push(b);
          //   }
          // });
          removePieces = previousBoardPieces.filter((p: BoardPiece) => {
            if (!p.square) {
              return false;
            }
            const compared = compareBoardPieces.get(p.square);
            // console.log(p.square, compared);
            if (!compared) {
              return false;
            }
            return compared.now === undefined;
          });
          boardPieces.forEach((b: BoardPiece) => {
            const checkSquare = b.square;
            const previousPieceOnThatSquare = previousBoardPieces.find(
              (b: BoardPiece) => b.square === checkSquare,
            );
            if (previousPieceOnThatSquare) {
              removePieces.push(previousBoardPieces);
            }
          });
          console.log('boardPieces to remove', removePieces);
          boardPieces = boardPieces.filter((p: BoardPiece) => compareBoardPieces.has(`${p.square}`));
          console.log('boardPieces to move', boardPieces);
        }

        // } else {
        //   // TODO: just move pieces that are different between move and previousMove
        //   boardPieces = this.container.getGameProvider().moveGamePieces(move, previousMove);
        //   console.log('boardPieces next move', boardPieces);
        // }

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

      this.container.getPieceProvider().updateGamePositions(boardPieces, removePieces);
      // this.container.getStore().piecesGroup = newPiecesGroup;
      // this.container.getStore().boardPieces = boardPieces;
      this.container.getStore().piecesObjects = this.container.getStore().getBoardPiecesObjectsMap();
      // this.container.getStore().getScene().add(this.container.getStore().piecesGroup);

      // Handle game state
      const gameState = this.container.getStore().gameState;

      if (gameState) {
        if (gameState.mate || gameState.draw) {
          this.addShapes(gameState);
          console.log('All moves', this.container.getStore().moves);
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

    const boardPieces = this.container.getStore().getBoardPieces() ?? [];
    const piecesObjects = this.container.getStore().piecesObjects;

    const findPieceMesh = (mateKey: string): THREE.Object3D | null => {
      if (!piecesObjects) return null;
      const boardPiece = boardPieces.find((bp: BoardPiece) => bp.square === mateKey);
      if (!boardPiece || !boardPiece.objectKey) return null;
      return piecesObjects.get(`${boardPiece.objectKey}-${boardPiece.square}`) ?? null;
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
