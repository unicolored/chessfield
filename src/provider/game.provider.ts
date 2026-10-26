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

    const whitePiecesListMap: cf.CoordPieceNameMap = new Map();
    const blackPiecesListMap: cf.CoordPieceNameMap = new Map();

    const fen = move.fen;

    // const useGltf = false;
    // const pieceGeometriesMap = useGltf ? this.store.getPiecesGeometriesGltfMap() : this.getGeometries();

    // TODO: Check if i can replace FenParser with the fen reader of chessground
    const fenParsed = new FenParser(fen);

    const boardPieces: cf.BoardPiece[] = [];
    fenParsed.ranks.forEach((rank: string, index: number) => {
      const rankIndex = Store.boardSize - index;

      Array.from(rank).forEach((pieceStr: string, index: number) => {
        if (pieceStr !== '-') {
          const letters = Object.values(cg.files);
          const square: cg.Key = `${letters[index]}${rankIndex}` as cg.Key; // A1, B2, G5, H8, etc.

          const color: cg.Color = (GameProvider.whiteKeys.includes(pieceStr) ? 'white' : 'black') as cg.Color;

          const role: cg.Role = PieceProvider.getPiece(pieceStr as cf.PieceKey);
          // const pieceGroup = this.getOnePiece(pieceGeometries[pieceKey], pieceMaterials[color]);

          if (color === 'white') {
            whitePiecesListMap.set(square, role);
          } else if (color === 'black') {
            blackPiecesListMap.set(square, role);
          }

          boardPieces.push({
            square,
            role,
            color,
            objectKey: objKey(color, role),
            count: 1,
          });
          // }
        }
      });
    });

    // const whiteCountsMap = this.countPieces(whitePiecesListMap, 'white');
    // const blackCountsMap = this.countPieces(blackPiecesListMap, 'black');
    // const mergedMap = new Map([...whiteCountsMap, ...blackCountsMap]);

    return boardPieces;
  }

  public loadGlbGeometry(loadingManager: THREE.LoadingManager): void {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader(loadingManager);
    loader.setDRACOLoader(dracoLoader);

    const piecesGeometriesGltfMap = new Map<cf.PiecesEnum, THREE.BufferGeometry>();

    loader.load(
      piecesLiteModel,
      (gltf: GLTF) => {
        gltf.scene.children.forEach((obj: THREE.Object3D) => {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.scale(0.2, 0.2, 0.2);

          piecesGeometriesGltfMap.set(obj.name as cf.PiecesEnum, mesh.geometry);
        });
      }, // Success: resolve with the loaded gltf
      undefined, // Progress: optional, omitted here
      error => {
        console.error(`Failed to load pieces:`, error);
      },
    );

    this.store.setPiecesGeometriesGltfMap(piecesGeometriesGltfMap);
  }

  static findLastMove(moves: cf.Move[]): cf.Move | null {
    for (let i = moves.length - 1; i >= 0; i--) {
      const move = moves[i];
      if (FenParser.isFen(move.fen)) {
        return move;
      }
    }

    return null;
  }
}
