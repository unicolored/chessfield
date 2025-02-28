import * as THREE from 'three';
import { BufferGeometry, Group } from 'three';
import FenParser from '@chess-fu/fen-parser';
import { PieceProvider } from './piece.provider';
import { LichessMoves, LichessStreamData } from '../interface/lichess.interface.ts';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { letters, PieceKey, PiecesEnum } from '../interface/board.interface.ts';
import { Store } from './store.ts';
import { FEN } from 'chessground/types';

export class GameProvider {
  static readonly whiteKeys = Array.from('RNBQKP');

  private loader: GLTFLoader;

  constructor(private store: Store) {
    this.loader = new GLTFLoader();
  }

  initGamePieces(lichessMoves: LichessMoves) {
    const gamePiecesMap = new Map<string, Group>();

    const lastMoveFen = GameProvider.findLastMoveFen(lichessMoves.moves);

    if (!lastMoveFen) {
      return;
    }

    const fenParsed = new FenParser(lastMoveFen);

    fenParsed.ranks.forEach((rank: string, index: number) => {
      const rankIndex = Store.boardSize - index;
      Array.from(rank).forEach((pieceStr: string, index: number) => {
        if (pieceStr !== '-' && pieceStr in PiecesEnum) {
          const coord = `${letters[index]}${rankIndex}`;

          const color = GameProvider.whiteKeys.includes(pieceStr) ? 'white' : 'black';

          const piece = this.getOnePiece(pieceStr as PieceKey, color);

          gamePiecesMap.set(coord, piece);
        }
      });
    });

    this.store.updategamePieces(gamePiecesMap);
  }

  public async getOnePieceGltf(pieceKey: PieceKey, color: 'white' | 'black' = 'white'): Promise<Group> {
    const pieceGroup = new THREE.Group();
    console.log(color);

    // Create and add a cylinder to the scene
    // const pieceMaterial =
    //   color === 'white'
    //     ? new THREE.MeshPhongMaterial({
    //         color: 0xdddddd,
    //         specular: 0x474747,
    //         shininess: 1,
    //         flatShading: true,
    //       })
    //     : new THREE.MeshPhongMaterial({
    //         color: 0x222222,
    //         specular: 0x474747,
    //         shininess: 1,
    //         flatShading: true,
    //       });

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

      // const mesh = new THREE.Mesh(geometry, pieceMaterial);

      // group.position.set(0, 0, 0);
      // group.scale.set(1, 1, 1);
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

  public getOnePiece(pieceKey: PieceKey, color: 'white' | 'black' = 'white'): Group {
    const pieceGroup = new THREE.Group();
    // Create and add a cylinder to the scene
    const pieceMaterial =
      color === 'white'
        ? new THREE.MeshPhongMaterial({
            color: 0xdddddd,
            specular: 0x474747,
            shininess: 1,
            flatShading: true,
          })
        : new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x474747,
            shininess: 1,
            flatShading: true,
          });

    const piece = PieceProvider.getPiece(pieceKey);

    let geometry: BufferGeometry;
    switch (piece) {
      case PiecesEnum.k:
        geometry = new THREE.BoxGeometry(0.5, 1.33, 0.5, 4);
        break;
      case PiecesEnum.q:
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 4);
        break;
      case PiecesEnum.b:
        geometry = new THREE.CylinderGeometry(0.1, 0.33, 1, 4);
        break;
      case PiecesEnum.n:
        geometry = new THREE.CylinderGeometry(0.33, 0.1, 1, 4);
        break;
      case PiecesEnum.r:
        geometry = new THREE.CylinderGeometry(0.33, 0.33, 0.85, 12);
        break;
      case PiecesEnum.p:
        geometry = new THREE.SphereGeometry(0.2, 4, 4);
        break;
      default:
        geometry = new THREE.CylinderGeometry(0.1, 0.33, 1, 4);
    }

    const mesh = new THREE.Mesh(geometry, pieceMaterial);

    // Position the cylinder above the chessboard
    mesh.position.set(0, 0.6 + 0.5, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    pieceGroup.name = piece;

    pieceGroup.add(mesh);

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
}
