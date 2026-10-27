import type * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';
import { beforeEach, describe, expect, it } from 'vitest';

import { GameProvider } from './game.provider.ts';
import { PieceProvider } from './piece.provider.ts';
import { Store } from './store.ts';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const afterE3Fen = 'rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const castlingBeforeFen = 'rnbqk2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1';
const castlingAfterFen = 'rnbqk2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1';
const enPassantBeforeFen = '8/8/8/3pP3/8/8/8/4K2k w - d6 0 1';
const enPassantAfterFen = '8/8/3P4/8/8/8/8/4K2k b - - 0 1';
const promotionBeforeFen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
const promotionAfterFen = '4Q3/8/8/8/8/8/8/4K2k b - - 0 1';
const emptyFen = '8/8/8/8/8/8/8/8 w - - 0 1';

describe('PieceProvider', () => {
  let store: Store;
  let gameProvider: GameProvider;
  let provider: PieceProvider;

  const syncFen = (fen: string): void => {
    provider.sync(gameProvider.setBoardPieces({ fen }));
  };

  beforeEach(() => {
    store = new Store();
    store.initSquarePositionsVec3();

    const geometries = new Map<cg.Role, THREE.BufferGeometry>();
    for (const role of ['pawn', 'king', 'queen', 'knight', 'bishop', 'rook'] as cg.Role[]) {
      geometries.set(role, new THREE.BoxGeometry(0.01, 0.05, 0.01));
    }
    store.setPiecesGeometriesGltfMap(geometries);

    gameProvider = new GameProvider(store);
    gameProvider.pieceMaterials.white = new THREE.MeshBasicMaterial({ color: 0xff_ff_ff });
    gameProvider.pieceMaterials.black = new THREE.MeshBasicMaterial({ color: 0x00_00_00 });

    provider = new PieceProvider(store, gameProvider);
  });

  it('creates the whole board on the first sync', () => {
    syncFen(initialFen);

    const pieces = store.getBoardPiecesObjectsMap();
    expect(pieces.size).toBe(32);
    expect(store.getPiecesGroup().children).toHaveLength(32);
    for (const mesh of pieces.values()) {
      expect(mesh.parent).toBe(store.getPiecesGroup());
    }
  });

  it('moves a piece and reuses its mesh', () => {
    syncFen(initialFen);
    const pawn = store.getBoardPiecesObjectsMap().get('e2');

    syncFen(afterE3Fen);

    const pieces = store.getBoardPiecesObjectsMap();
    expect(pieces.size).toBe(32);
    expect(pieces.has('e2')).toBe(false);
    expect(pieces.get('e3')).toBe(pawn);
    expect(pawn?.name).toBe('white-pawn-e3');
    expect(pawn?.userData['square']).toBe('e3');

    const position = store.getSquarePositionsVec3().get('e3');
    expect(pawn?.position.x).toBe(position?.x);
    expect(pawn?.position.y).toBe(position?.y);
    expect(pawn?.position.z).toBe(position?.z);
  });

  it('removes the captured piece and moves the capturer', () => {
    syncFen('8/8/8/3p4/4P3/8/8/4K2k w - - 0 1');
    const piecesBefore = store.getBoardPiecesObjectsMap();
    const capturer = piecesBefore.get('e4');
    const captured = piecesBefore.get('d5');

    syncFen('8/8/8/3P4/8/8/8/4K2k b - - 0 1');

    const piecesAfter = store.getBoardPiecesObjectsMap();
    expect(piecesAfter.size).toBe(3);
    expect(piecesAfter.get('d5')).toBe(capturer);
    expect(piecesAfter.has('e4')).toBe(false);
    expect(captured?.parent).toBeNull();
  });

  it('moves both pieces when castling', () => {
    syncFen(castlingBeforeFen);
    const piecesBefore = store.getBoardPiecesObjectsMap();
    const king = piecesBefore.get('e1');
    const rook = piecesBefore.get('h1');

    syncFen(castlingAfterFen);

    const piecesAfter = store.getBoardPiecesObjectsMap();
    expect(piecesAfter.size).toBe(28);
    expect(piecesAfter.get('g1')).toBe(king);
    expect(piecesAfter.get('f1')).toBe(rook);
    expect(piecesAfter.has('e1')).toBe(false);
    expect(piecesAfter.has('h1')).toBe(false);
  });

  it('moves the pawn and removes the captured pawn on en passant', () => {
    syncFen(enPassantBeforeFen);
    const piecesBefore = store.getBoardPiecesObjectsMap();
    const mover = piecesBefore.get('e5');
    const captured = piecesBefore.get('d5');

    syncFen(enPassantAfterFen);

    const piecesAfter = store.getBoardPiecesObjectsMap();
    expect(piecesAfter.size).toBe(3);
    expect(piecesAfter.get('d6')).toBe(mover);
    expect(piecesAfter.has('e5')).toBe(false);
    expect(captured?.parent).toBeNull();
  });

  it('moves the pawn and replaces its role on promotion', () => {
    syncFen(promotionBeforeFen);
    const pawn = store.getBoardPiecesObjectsMap().get('e7');

    syncFen(promotionAfterFen);

    const piecesAfter = store.getBoardPiecesObjectsMap();
    const queen = piecesAfter.get('e8');
    expect(piecesAfter.size).toBe(3);
    expect(queen).toBe(pawn);
    expect(queen?.userData['role']).toBe('queen');
    expect(queen?.name).toBe('white-queen-e8');
    expect(queen?.geometry).toBe(store.getPiecesGeometriesGltfMap().get('queen'));
    expect(piecesAfter.has('e7')).toBe(false);
  });

  it('replaces the piece in place when the square keeps a different piece', () => {
    syncFen('8/8/8/8/4P3/8/8/4K2k w - - 0 1');
    const pawn = store.getBoardPiecesObjectsMap().get('e4');

    syncFen('8/8/8/8/4n3/8/8/4K2k b - - 0 1');

    const piecesAfter = store.getBoardPiecesObjectsMap();
    const knight = piecesAfter.get('e4');
    expect(piecesAfter.size).toBe(3);
    expect(knight).toBe(pawn);
    expect(knight?.userData['role']).toBe('knight');
    expect(knight?.userData['color']).toBe('black');
    expect(knight?.name).toBe('black-knight-e4');
    expect(knight?.geometry).toBe(store.getPiecesGeometriesGltfMap().get('knight'));
  });

  it('is a no-op when the position has not changed', () => {
    syncFen(initialFen);
    const before = new Map(store.getBoardPiecesObjectsMap());

    syncFen(initialFen);

    const after = store.getBoardPiecesObjectsMap();
    expect(after.size).toBe(before.size);
    for (const [square, mesh] of before) {
      expect(after.get(square)).toBe(mesh);
    }
  });

  it('removes every piece for an empty board', () => {
    syncFen(initialFen);

    syncFen(emptyFen);

    expect(store.getBoardPiecesObjectsMap().size).toBe(0);
    expect(store.getPiecesGroup().children).toHaveLength(0);
  });
});
