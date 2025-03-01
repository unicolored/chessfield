import * as THREE from 'three';
import { BufferGeometry, Group } from 'three';
import FenParser from '@chess-fu/fen-parser';
import { PieceProvider } from './piece.provider';
import { LichessMoves, LichessStreamData } from '../interface/lichess.interface.ts';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  BoardPiece,
  ColorMaterial,
  ColorPieceNameObjectMap,
  COORD,
  CoordPieceNameMap,
  letters,
  PieceKey,
  PiecesEnum,
} from '../interface/board.interface.ts';
import { Store } from './store.ts';
import { Color, FEN } from 'chessground/types';
import { objKey } from '../helper.ts';

export class GameProvider {
  static readonly whiteKeys = Array.from('RNBQKP');
  static readonly pieceMaterials: ColorMaterial = {
    white: new THREE.MeshPhongMaterial({
      color: 0xdddddd,
      specular: 0x474747,
      shininess: 1,
      flatShading: true,
    }),
    black: new THREE.MeshPhongMaterial({
      color: 0x222222,
      specular: 0x474747,
      shininess: 1,
      flatShading: true,
    }),
  };

  private loader: GLTFLoader;

  constructor(private store: Store) {
    this.loader = new GLTFLoader();
  }

  initGamePieces(lichessMoves: LichessMoves) {
    // const gamePiecesMap: GamePieces = new Map();
    const whitePiecesListMap: CoordPieceNameMap = new Map();
    const blackPiecesListMap: CoordPieceNameMap = new Map();

    const lastMoveFen = GameProvider.findLastMoveFen(lichessMoves.moves);

    if (!lastMoveFen) {
      return;
    }

    const pieceGeometriesMap = new Map<PiecesEnum, BufferGeometry>();
    pieceGeometriesMap.set(PiecesEnum.k, new THREE.BoxGeometry(0.5, 1.33, 0.5, 4).translate(0, 0.5, 0));
    pieceGeometriesMap.set(PiecesEnum.q, new THREE.CylinderGeometry(0.2, 0.2, 1.2, 4).translate(0, 0.5, 0));
    pieceGeometriesMap.set(PiecesEnum.b, new THREE.CylinderGeometry(0.1, 0.33, 1, 4).translate(0, 0.5, 0));
    pieceGeometriesMap.set(PiecesEnum.n, new THREE.CylinderGeometry(0.33, 0.1, 1, 4).translate(0, 0.5, 0));
    pieceGeometriesMap.set(
      PiecesEnum.r,
      new THREE.CylinderGeometry(0.33, 0.33, 0.85, 12).translate(0, 0.5, 0),
    );
    pieceGeometriesMap.set(PiecesEnum.p, new THREE.SphereGeometry(0.2, 4, 4).translate(0, 0.5, 0));

    const fenParsed = new FenParser(lastMoveFen);

    const boardPieces: BoardPiece[] = [];
    fenParsed.ranks.forEach((rank: string, index: number) => {
      const rankIndex = Store.boardSize - index;

      Array.from(rank).forEach((pieceStr: string, index: number) => {
        if (pieceStr !== '-' && pieceStr in PiecesEnum) {
          const coord: COORD = `${letters[index]}${rankIndex}` as COORD; // A1, B2, G5, H8, etc.

          const color: Color = (GameProvider.whiteKeys.includes(pieceStr) ? 'white' : 'black') as Color;

          const name: PiecesEnum = PieceProvider.getPiece(pieceStr as PieceKey);
          // const pieceGroup = this.getOnePiece(pieceGeometries[pieceKey], pieceMaterials[color]);

          if (color === 'white') {
            whitePiecesListMap.set(coord, name);
          } else if (color === 'black') {
            blackPiecesListMap.set(coord, name);
          }

          boardPieces.push({
            coord,
            name,
            color,
            objectKey: objKey(color, name),
          });
          // }
        }
      });
    });

    const whiteCountsMap = this.countPieces(whitePiecesListMap, 'white');
    const blackCountsMap = this.countPieces(blackPiecesListMap, 'black');
    const mergedMap = new Map([...whiteCountsMap, ...blackCountsMap]);

    const boardPiecesObjectsMap: ColorPieceNameObjectMap = new Map();
    mergedMap.forEach((value, key: string) => {
      if (value.count > 0) {
        const geometry: BufferGeometry | undefined = pieceGeometriesMap.get(value.name);

        if (geometry) {
          geometry.scale(0.1, 0.1, 0.1);

          const mesh =
            value.count > 1
              ? new THREE.InstancedMesh(
                  pieceGeometriesMap.get(value.name),
                  GameProvider.pieceMaterials[value.color],
                  value.count,
                )
              : new THREE.Mesh(pieceGeometriesMap.get(value.name), GameProvider.pieceMaterials[value.color]);

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.name = `${key}-${value.color}-${value.name}`;

          boardPiecesObjectsMap.set(key, mesh);
        }
      }
    });

    this.store.setBoardPiecesObjectsMap(boardPiecesObjectsMap);
    this.store.updategamePieces(boardPieces);
  }

  public async getOnePieceGltf(pieceKey: PieceKey, color: 'white' | 'black' = 'white'): Promise<Group> {
    const pieceGroup = new THREE.Group();
    console.log(color);

    const piece = PieceProvider.getPiece(pieceKey);

    console.log(pieceKey);
    const piecesUrl = new Map();
    piecesUrl.set(PiecesEnum.p, './../../../assets/pawn.glb');
    piecesUrl.set(PiecesEnum.q, './../../../assets/queen.glb');
    piecesUrl.set(PiecesEnum.k, './../../../assets/king.glb');
    piecesUrl.set(PiecesEnum.n, './../../../assets/knight.glb');
    piecesUrl.set(PiecesEnum.b, './../../../assets/bishop.glb');
    piecesUrl.set(PiecesEnum.r, './../../../assets/rook.glb');

    if (piecesUrl.has(piece)) {
      const group = await this.loadGLTF(piecesUrl.get(piece));

      // Position the cylinder above the chessboard
      group.scale.set(10, 10, 10);
      group.position.set(0, 0.6 + 0.5, 0);
      group.castShadow = true;
      group.receiveShadow = true;

      pieceGroup.name = piece;

      pieceGroup.add(group);
    }

    return pieceGroup;
  }

  private loadGLTF(url: string): Promise<Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf: GLTF) => resolve(gltf.scene), // Success: resolve with the loaded gltf
        undefined, // Progress: optional, omitted here
        error => reject(error), // Error: reject with the error
      );
    });
  }

  private static findLastMoveFen(moves: LichessStreamData[]): FEN | null {
    for (let i = moves.length - 1; i >= 0; i--) {
      const move = moves[i];
      if (FenParser.isFen(move.fen ?? move.initialFen)) {
        return move.fen;
      }
    }

    return null;
  }

  private countPieces(
    listeMap: CoordPieceNameMap,
    color: Color,
  ): Map<string, { count: number; color: Color; name: PiecesEnum }> {
    const map = new Map<string, { count: number; color: Color; name: PiecesEnum }>();
    listeMap.forEach(pieceName => {
      const oK = objKey(color, pieceName);
      const count = map.get(oK)?.count || 0;
      map.set(oK, { count: count + 1, color, name: pieceName });
    });
    return map;
  }
}
