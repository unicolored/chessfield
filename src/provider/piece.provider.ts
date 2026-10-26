import type * as cg from '@lichess-org/chessground/types';
import { userData } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { cm, objKey } from '../helper.ts';
import * as cf from '../resource/chessfield.types.ts';
import { stateSprite } from '../shader/stateSprite.ts';

import type { GameProvider } from './game.provider.ts';
import { type Store } from './store.ts';

type FreeMesh = {
  square: cg.Key;
  mesh: THREE.Mesh;
};

export class PieceProvider {
  private readonly spriteGeometry = new THREE.BoxGeometry(cm(0.5), cm(0.5), cm(0.5));
  private spriteMaterial?: THREE.SpriteNodeMaterial;

  static getPiece(pieceId: string): cg.Role {
    const stdPiece = pieceId.toLowerCase() as cf.PieceKey;
    return cf.PiecesTypes[stdPiece];
  }

  constructor(
    private readonly store: Store,
    private readonly gameProvider: GameProvider,
  ) {}

  /**
   * Reconcile the rendered pieces with the desired board.
   *
   * The mesh registry is the actual state and the given board pieces are the
   * desired state, so only the necessary move/replace/remove/create operations
   * are performed. Calling it twice with the same position is a no-op.
   */
  sync(boardPieces: cf.BoardPiece[]): void {
    const group = this.store.getPiecesGroup();
    const actual = this.store.getBoardPiecesObjectsMap();

    const desired = new Map<cg.Key, cf.BoardPiece>();
    for (const piece of boardPieces) {
      if (piece.square && piece.objectKey) {
        desired.set(piece.square, piece);
      }
    }

    const free: FreeMesh[] = [];
    for (const [square, mesh] of actual) {
      const wanted = desired.get(square);
      if (wanted && this.matches(wanted, mesh)) {
        continue;
      }
      if (!wanted) {
        free.push({ square, mesh });
      }
    }

    const pending: cf.BoardPiece[] = [];
    for (const piece of desired.values()) {
      const mesh = actual.get(piece.square as cg.Key);
      if (mesh && this.matches(piece, mesh)) {
        continue;
      }
      pending.push(piece);
    }

    // Move a free mesh that is already the exact same piece (quiet move,
    // capture, castling, en passant origin).
    const unmatched: cf.BoardPiece[] = [];
    for (const piece of pending) {
      const index = free.findIndex(candidate => this.matches(piece, candidate.mesh));
      if (index === -1) {
        unmatched.push(piece);
        continue;
      }
      const [candidate] = free.splice(index, 1);
      this.moveMesh(candidate, piece, actual);
    }

    // Move a free mesh of the same colour and retarget it (promotion).
    const remaining: cf.BoardPiece[] = [];
    for (const piece of unmatched) {
      const index = free.findIndex(candidate => candidate.mesh.userData['color'] === piece.color);
      if (index === -1) {
        remaining.push(piece);
        continue;
      }
      const [candidate] = free.splice(index, 1);
      this.moveMesh(candidate, piece, actual);
    }

    // Replace the piece already on that square, or create a new mesh.
    for (const piece of remaining) {
      const square = piece.square as cg.Key;
      const mesh = actual.get(square);
      if (mesh) {
        this.applyMesh(mesh, piece, true);
      } else {
        const created = this.createMesh(piece);
        group.add(created);
        actual.set(square, created);
        this.applyMesh(created, piece, false);
      }
    }

    for (const { square, mesh } of free) {
      this.removeMesh(mesh);
      actual.delete(square);
    }

    // Pieces changed: ask the idle animation loop for one frame.
    this.store.requestRender();
  }

  /** Clear the state sprite flags, e.g. before applying a new game state. */
  clearStateFlags(): void {
    for (const mesh of this.store.getBoardPiecesObjectsMap().values()) {
      const sprite = mesh.children.find(child => child.name === 'stateSprite');
      if (!sprite) {
        continue;
      }
      sprite.userData['showSprite'] = false;
      sprite.userData['lostState'] = false;
      // Hidden sprites are not submitted, saving one draw call per piece.
      sprite.visible = false;
    }
  }

  private matches(piece: cf.BoardPiece, mesh: THREE.Mesh): boolean {
    return this.meshKey(mesh) === objKey(piece.color, piece.role);
  }

  private meshKey(mesh: THREE.Mesh): string {
    return objKey(mesh.userData['color'] as cg.Color, mesh.userData['role'] as cg.Role);
  }

  private moveMesh(candidate: FreeMesh, piece: cf.BoardPiece, actual: cf.SquareMeshMap): void {
    const square = piece.square as cg.Key;
    const occupant = actual.get(square);
    if (occupant && occupant !== candidate.mesh) {
      this.removeMesh(occupant);
    }

    actual.delete(candidate.square);
    actual.set(square, candidate.mesh);
    this.applyMesh(candidate.mesh, piece, true);
  }

  private createMesh(piece: cf.BoardPiece): THREE.Mesh {
    const geometry = this.store.getPiecesGeometriesGltfMap().get(piece.role);
    const material = this.gameProvider.pieceMaterials[piece.color] ?? this.gameProvider.fallbackMaterial;
    const mesh = new THREE.Mesh(geometry, material);

    const sprite = new THREE.Mesh(this.spriteGeometry, this.getSpriteMaterial());
    sprite.name = 'stateSprite';
    sprite.userData['showSprite'] = false;
    sprite.userData['lostState'] = false;
    // Hidden until a state is applied: the shader discards it anyway, so skip the draw call.
    sprite.visible = false;
    // Sprites are decoration only and must never win a board raycast.
    sprite.raycast = () => {};
    mesh.add(sprite);

    this.positionStateSprite(mesh);

    return mesh;
  }

  private applyMesh(mesh: THREE.Mesh, piece: cf.BoardPiece, retarget: boolean): void {
    const square = piece.square as cg.Key;
    const key = objKey(piece.color, piece.role);

    if (retarget && this.meshKey(mesh) !== key) {
      const geometry = this.store.getPiecesGeometriesGltfMap().get(piece.role);
      if (geometry) {
        mesh.geometry = geometry;
      }
      mesh.material = this.gameProvider.pieceMaterials[piece.color] ?? this.gameProvider.fallbackMaterial;
      this.positionStateSprite(mesh);
    }

    const position = this.store.getSquarePositionsVec3().get(square);
    if (position) {
      mesh.position.set(position.x, position.y, position.z);
    }

    mesh.name = `${key}-${square}`;
    mesh.userData['color'] = piece.color;
    mesh.userData['role'] = piece.role;
    mesh.userData['square'] = square;
    mesh.userData['pos'] = position;
  }

  private positionStateSprite(mesh: THREE.Mesh): void {
    const sprite = mesh.children.find(child => child.name === 'stateSprite');
    if (!sprite) {
      return;
    }

    mesh.geometry?.computeBoundingBox();
    const highestY = mesh.geometry?.boundingBox?.max.y ?? 0;
    sprite.position.set(0, highestY + cm(0.33), 0);
  }

  private removeMesh(mesh: THREE.Mesh): void {
    mesh.removeFromParent();
  }

  private getSpriteMaterial(): THREE.SpriteNodeMaterial {
    if (!this.spriteMaterial) {
      const material = new THREE.SpriteNodeMaterial({ transparent: true });
      material.colorNode = stateSprite({
        lost: userData('lostState', 'bool'),
        show: userData('showSprite', 'bool'),
      });
      this.spriteMaterial = material;
    }

    return this.spriteMaterial;
  }
}
