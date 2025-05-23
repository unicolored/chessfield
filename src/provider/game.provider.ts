import { BufferGeometry, InstancedMesh, LoadingManager, Mesh, MeshBasicMaterial, Object3D } from 'three';
import FenParser from '@chess-fu/fen-parser';
import { PieceProvider } from './piece.provider';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Store } from './store.ts';
import { objKey } from '../helper.ts';
import piecesLiteModel from '../assets/models/pieces.lite.glb?url';
import * as cg from 'chessground/types';
import * as cf from '../resource/chessfield.types.ts';
import { BoardPiece, PieceColorRole } from '../resource/chessfield.types.ts';

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

    const fallbackMaterial = new MeshBasicMaterial({
      color: 0xff0000,
    });

    mergedMap.forEach((value: BoardPiece, key: PieceColorRole) => {
      const geometry: BufferGeometry | undefined = pieceGeometriesMap.get(value.role);
      const material = this.pieceMaterials[value.color] ?? fallbackMaterial;
      const mesh =
        value.count > 1 ? new InstancedMesh(geometry, material, value.count) : new Mesh(geometry, material);

      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.name = `${key}-${value.color}-${value.role}`;

      boardPiecesObjectsMap.set(key, mesh);
    });

    this.store.setBoardPiecesObjectsMap(boardPiecesObjectsMap);
    this.store.updategamePieces(boardPieces);
  }

  public loadGlbGeometry(loadingManager: LoadingManager): void {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader(loadingManager);
    loader.setDRACOLoader(dracoLoader);

    const piecesGeometriesGltfMap = new Map<cf.PiecesEnum, BufferGeometry>();

    loader.load(
      piecesLiteModel,
      (gltf: GLTF) => {
        gltf.scene.children.forEach((obj: Object3D) => {
          const mesh = obj as Mesh;
          mesh.geometry.scale(0.2, 0.2, 0.2);

          piecesGeometriesGltfMap.set(obj.name as cf.PiecesEnum, mesh.geometry);
        });
      }, // Success: resolve with the loaded gltf
      undefined, // Progress: optional, omitted here
      error => error, // Error: reject with the error
    );

    this.store.setPiecesGeometriesGltfMap(piecesGeometriesGltfMap);
  }

  // /**
  //  * @deprecated Use loadGlbGeometry() to load all pieces at once
  //  * @param loadingManager
  //  */
  // public loadGltfGeometries(loadingManager: LoadingManager): void {
  //   const piecesUrl = new Map();
  //   piecesUrl.set(cf.PiecesEnum.p, pawnModel);
  //   piecesUrl.set(cf.PiecesEnum.q, queenModel);
  //   piecesUrl.set(cf.PiecesEnum.k, kingModel);
  //   piecesUrl.set(cf.PiecesEnum.n, knightModel);
  //   piecesUrl.set(cf.PiecesEnum.b, bishopModel);
  //   piecesUrl.set(cf.PiecesEnum.r, rookModel);
  //
  //   // Here i disabled the DracoLoader since i did not export
  //   // const dracoLoader = new DRACOLoader();
  //   // dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  //   const loader = new GLTFLoader(loadingManager);
  //   // loader.setDRACOLoader(dracoLoader);
  //
  //   const piecesGeometriesGltfMap = new Map<cf.PiecesEnum, BufferGeometry>();
  //   piecesUrl.forEach((url: string, pieceName: cf.PiecesEnum) => {
  //     loader.load(
  //       url,
  //       (gltf: GLTF) => {
  //         if (gltf.scene.children[0]) {
  //           const mesh = gltf.scene.children[0] as Mesh;
  //           mesh.geometry.scale(0.2, 0.2, 0.2);
  //
  //           mesh.position.set(0, 0, 0);
  //           piecesGeometriesGltfMap.set(pieceName, mesh.geometry);
  //         } else {
  //           console.error('No children found');
  //         }
  //       }, // Success: resolve with the loaded gltf
  //       undefined, // Progress: optional, omitted here
  //       error => error, // Error: reject with the error
  //     );
  //   });
  //
  //   this.store.setPiecesGeometriesGltfMap(piecesGeometriesGltfMap);
  // }

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

  // /**
  //  * @deprecated Using glb instead
  //  * @private
  //  */
  // private getGeometries(): Map<cf.PiecesEnum, BufferGeometry> {
  //   const pieceGeometriesMap = new Map<cf.PiecesEnum, BufferGeometry>();
  //
  //   const kingGeometry = new THREE.BoxGeometry(0.5, 1.33, 0.5, 4).translate(0, 0.5, 0);
  //   const queenGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 4).translate(0, 0.5, 0);
  //   const bishopGeometry = new THREE.CylinderGeometry(0.1, 0.33, 1, 4).translate(0, 0.5, 0);
  //   const knightGeometry = new THREE.CylinderGeometry(0.33, 0.1, 1, 4).translate(0, 0.5, 0);
  //   const rookGeometry = new THREE.CylinderGeometry(0.33, 0.33, 0.85, 12).translate(0, 0.5, 0);
  //   const pawnGeometry = new THREE.SphereGeometry(0.2, 4, 4).translate(0, 0.5, 0);
  //
  //   pieceGeometriesMap.set(cf.PiecesEnum.k, kingGeometry.scale(0.2, 0.2, 0.2));
  //   pieceGeometriesMap.set(cf.PiecesEnum.q, queenGeometry.scale(0.2, 0.2, 0.2));
  //   pieceGeometriesMap.set(cf.PiecesEnum.b, bishopGeometry.scale(0.2, 0.2, 0.2));
  //   pieceGeometriesMap.set(cf.PiecesEnum.n, knightGeometry.scale(0.2, 0.2, 0.2));
  //   pieceGeometriesMap.set(cf.PiecesEnum.r, rookGeometry.scale(0.2, 0.2, 0.2));
  //   pieceGeometriesMap.set(cf.PiecesEnum.p, pawnGeometry.scale(0.2, 0.2, 0.2));
  //
  //   return pieceGeometriesMap;
  // }
}
