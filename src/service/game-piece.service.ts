import type * as cg from '@lichess-org/chessground/types';
import type * as THREE from 'three/webgpu';

import { type Container } from '../core/Container.ts';
import { coordToVector2, lmToCoordinates } from '../helper.ts';
import type { GameState } from '../resource/chessfield.state.ts';
import type * as cf from '../resource/chessfield.types.ts';

export class GamePieceService {
  private moveSubscription: (() => void) | null = null;
  // Last FEN sent to the piece reconciler, so state-only updates skip the parse/sync.
  private lastRenderedFen: cg.FEN | null = null;

  constructor(private container: Container) {}

  /** Subscribe to FEN updates once, and render the current position. */
  start(): void {
    if (this.moveSubscription) {
      return;
    }

    // The subject now emits the single current move instead of a move history.
    this.moveSubscription = this.container.getStore().moveSubject$.subscribe((move: cf.Move | null) => {
      this.render(move);
    });
  }

  /** Re-render the current position and game state, e.g. after setState(). */
  refresh(): void {
    if (!this.moveSubscription) {
      return;
    }

    this.render(this.container.getStore().moveSubject$.value);
  }

  private render(move: cf.Move | null): void {
    if (!move) {
      return;
    }

    const pieceProvider = this.container.getPieceProvider();

    // Position work only when the FEN changed; setState() alone must not re-parse the board.
    if (move.fen !== this.lastRenderedFen) {
      this.lastRenderedFen = move.fen;

      const boardPieces = this.container.getGameProvider().setBoardPieces(move);
      // Reconcile meshes with the parsed board; the provider applies only the needed deltas.
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

    // Highlights, check and sprites changed: ask for one frame on the idle animation loop.
    this.container.getStore().requestRender();
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
            // Sprites stay hidden (no draw call) until a state actually shows them.
            spriteFound.visible = true;
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
              // Sprites stay hidden (no draw call) until a state actually shows them.
              spriteFound.visible = true;
            }
          }
        }
      });
    }
  }
}
