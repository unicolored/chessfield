import { FenParser } from '@chess-fu/fen-parser';
import * as cg from '@lichess-org/chessground/types';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three/webgpu';

import piecesLiteModel from '../assets/models/pieces.lite.glb?url';
import { objKey } from '../helper.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { BoardPiece } from '../resource/chessfield.types.ts';

import { PieceProvider } from './piece.provider';
import { Store } from './store.ts';

export class GameProvider {
  static readonly whiteKeys = Array.from('RNBQKP');

  pieceMaterials: cf.ColorMaterial = {
    white: null,
    black: null,
  };

  fallbackMaterial = new THREE.MeshBasicMaterial({
    color: 0xff_00_00,
  });

  constructor(private store: Store) {}

  setBoardPieces(move?: cf.Move | null): BoardPiece[] {
    if (!move) {
      return [];
    }

    const fen = move.fen;

    // const useGltf = false;
    // const pieceGeometriesMap = useGltf ? this.store.getPiecesGeometriesGltfMap() : this.getGeometries();

    // TODO: Check if i can replace FenParser with the fen reader of chessground
    const fenParsed = new FenParser(fen);

    const boardPieces: cf.BoardPiece[] = [];
    // Hoisted: the file letters are constant and were rebuilt for every square before.
    const files = cg.files;

    fenParsed.ranks.forEach((rank: string, index: number) => {
      const rankIndex = Store.boardSize - index;

      // Walk the 8-character rank directly instead of allocating an array per rank.
      for (let file = 0; file < rank.length; file++) {
        const pieceStr = rank[file];

        if (pieceStr === '-') {
          continue;
        }

        const square: cg.Key = `${files[file]}${rankIndex}` as cg.Key; // A1, B2, G5, H8, etc.

        const color: cg.Color = (GameProvider.whiteKeys.includes(pieceStr) ? 'white' : 'black') as cg.Color;

        const role: cg.Role = PieceProvider.getPiece(pieceStr as cf.PieceKey);

        // The per-colour square lists were never read (counting is disabled), so they are gone.
        boardPieces.push({
          square,
          role,
          color,
          objectKey: objKey(color, role),
          count: 1,
        });
      }
    });

    return boardPieces;
  }

  public loadGlbGeometry(loadingManager: THREE.LoadingManager): Promise<void> {
    return new Promise<void>(resolve => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      const loader = new GLTFLoader(loadingManager);
      loader.setDRACOLoader(dracoLoader);

      const piecesGeometriesGltfMap = new Map<cf.PiecesEnum, THREE.BufferGeometry>();

      this.store.setPiecesGeometriesGltfMap(piecesGeometriesGltfMap);

      loader.load(
        piecesLiteModel,
        (gltf: GLTF) => {
          gltf.scene.children.forEach((obj: THREE.Object3D) => {
            const mesh = obj as THREE.Mesh;
            mesh.geometry.scale(0.2, 0.2, 0.2);

            piecesGeometriesGltfMap.set(obj.name as cf.PiecesEnum, mesh.geometry);
          });
          resolve();
        }, // Success: resolve with the loaded gltf
        undefined, // Progress: optional, omitted here
        error => {
          console.error(`Failed to load pieces:`, error);
          resolve();
        },
      );
    });
  }
}
