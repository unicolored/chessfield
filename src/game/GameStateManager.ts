import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';

import { coordToVector2, lmToCoordinates } from '../helper.ts';
import { GameProvider } from '../provider/game.provider.ts';
import type { PieceProvider } from '../provider/piece.provider.ts';
import type { Store } from '../provider/store.ts';
import type { GameState } from '../resource/chessfield.state.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import type { StateService } from '../service/state.service.ts';

export class GameStateManager {
  private movesSubscription: (() => void) | null = null;
  private foundLastMove: { lastMove: cg.Key[] } | null = null;

  constructor(
    private store: Store,
    private gameProvider: GameProvider,
    private pieceProvider: PieceProvider,
    private stateService: StateService,
    private shapesService: ShapesService,
  ) {}

  setFen(fen: cg.FEN, lastMove?: cg.Key[]): void {
    this.store.gameState = null;
    this.store.setFen(fen, lastMove);
  }

  setState(state: GameState): void {
    this.store.gameState = state;
    this.updatePieces();
  }

  /** @deprecated Use setState instead */
  setCheck(state: GameState): void {
    this.setState(state);
  }

  /** @deprecated Use setState instead */
  setGameOver(state: GameState): void {
    this.setState(state);
  }

  getMovesSubscription(): (() => void) | null {
    return this.movesSubscription;
  }

  setMovesSubscription(sub: (() => void) | null): void {
    this.movesSubscription = sub;
  }

  getFoundLastMove(): { lastMove: cg.Key[] } | null {
    return this.foundLastMove;
  }

  updatePieces(): void {
    if (this.movesSubscription) {
      this.movesSubscription();
    }

    this.movesSubscription = this.store.movesSubject$.subscribe((moves: any) => {
      // Robust cleanup: remove previous pieces group from scene
      if (this.store.piecesGroup) {
        this.store.scene?.remove(this.store.piecesGroup);
        this.store.piecesGroup.clear();
      }

      this.foundLastMove = GameProvider.findLastMove(moves.moves);

      let boardPieces: any[] = [];

      if (this.foundLastMove) {
        boardPieces = this.gameProvider.initGamePieces(this.foundLastMove);

        const lastMoveToCoordinates = lmToCoordinates(this.foundLastMove.lastMove);
        if (lastMoveToCoordinates.length > 1) {
          this.store.chessboard?.highlightSquareStart(lastMoveToCoordinates[0].x, lastMoveToCoordinates[0].y);
          this.store.chessboard?.highlightSquareEnd(lastMoveToCoordinates[1].x, lastMoveToCoordinates[1].y);
        }
      }

      const piecesGroup = this.pieceProvider.updateGamePositions(boardPieces);
      this.store.piecesGroup = piecesGroup;
      this.store.boardPieces = boardPieces;
      this.store.piecesObjects = this.store.getBoardPiecesObjectsMap();
      this.store.scene?.add(piecesGroup);

      // Handle game state
      if (this.store.gameState) {
        if (this.store.gameState.mate || this.store.gameState.draw) {
          this.addShapes(this.store.gameState);
        }
        if (this.store.gameState.check) {
          console.log('Check!!!');
          this.store.gameState.check.forEach((key: cg.Key) => {
            if (key) {
              const kingVec = coordToVector2(key);
              this.stateService.setStateAt(kingVec.x, kingVec.y);
            }
          });
        }
      } else {
        this.stateService.clearAll(['check']);
      }
    });
  }

  addShapes(state: GameState | null): void {
    if (!state) {
      return;
    }

    const boardPieces = this.store.boardPieces ?? [];
    const piecesObjects = this.store.piecesObjects;

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
        mateKey = state.kings.black;
      } else {
        mateKey = state.kings.white;
      }
      if (mateKey) {
        const squareVec2 = coordToVector2(mateKey);
        this.stateService.setStateAt(squareVec2.x, squareVec2.y);

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
      state.draw.forEach((key: cg.Key) => {
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
}
