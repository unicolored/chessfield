import { FenParser } from '@chess-fu/fen-parser';
import * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import piecesLiteModel from '../assets/models/pieces.lite.glb?url';
import { objKey } from '../helper.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { BoardPiece, PieceColorRole } from '../resource/chessfield.types.ts';

import { PieceProvider } from './piece.provider';
import { Store } from './store.ts';

export class GameProvider {
  static readonly whiteKeys = Array.from('RNBQKP');

  pieceMaterials: cf.ColorMaterial = {
    white: null,
    black: null,
  };

  constructor(private store: Store) {}

  initGamePieces(move: cf.Move): void {
    // const gamePiecesMap: GamePieces = new Map();
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
          const coord: cg.Key = `${letters[index]}${rankIndex}` as cg.Key; // A1, B2, G5, H8, etc.

          const color: cg.Color = (GameProvider.whiteKeys.includes(pieceStr) ? 'white' : 'black') as cg.Color;

          const role: cg.Role = PieceProvider.getPiece(pieceStr as cf.PieceKey);
          // const pieceGroup = this.getOnePiece(pieceGeometries[pieceKey], pieceMaterials[color]);

          if (color === 'white') {
            whitePiecesListMap.set(coord, role);
          } else if (color === 'black') {
            blackPiecesListMap.set(coord, role);
          }

          boardPieces.push({
            coord,
            role,
            color,
            objectKey: objKey(color, role),
            count: 0,
          });
          // }
        }
      });
    });

    const whiteCountsMap = this.countPieces(whitePiecesListMap, 'white');
    const blackCountsMap = this.countPieces(blackPiecesListMap, 'black');
    const mergedMap = new Map([...whiteCountsMap, ...blackCountsMap]);

    const pieceGeometriesMap = this.store.getPiecesGeometriesGltfMap();

    const boardPiecesObjectsMap: cf.ColorPieceNameObjectMap = new Map();

    const fallbackMaterial = new THREE.MeshBasicMaterial({
      color: 0xff_00_00,
    });

    mergedMap.forEach((value: BoardPiece, key: PieceColorRole) => {
      const baseGeometry: THREE.BufferGeometry | undefined = pieceGeometriesMap.get(value.role);
      const geometry = baseGeometry ? baseGeometry.clone() : undefined;
      const material = this.pieceMaterials[value.color] ?? fallbackMaterial;
      const mesh =
        value.count > 1
          ? new THREE.InstancedMesh(geometry, material, value.count)
          : new THREE.Mesh(geometry, material);

      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.name = `${key}-${value.color}-${value.role}`;

      boardPiecesObjectsMap.set(key, mesh);
    });

    this.store.setBoardPiecesObjectsMap(boardPiecesObjectsMap);
    this.store.updategamePieces(boardPieces);
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

  private countPieces(listeMap: cf.CoordPieceNameMap, color: cg.Color): Map<PieceColorRole, BoardPiece> {
    const map = new Map<PieceColorRole, BoardPiece>();
    listeMap.forEach(pieceName => {
      const oK = objKey(color, pieceName);
      const count = map.get(oK)?.count || 0;
      map.set(oK, { count: count + 1, color, role: pieceName, coord: null, objectKey: null });
    });
    return map;
  }
}
