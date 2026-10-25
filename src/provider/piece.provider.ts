import * as cg from '@lichess-org/chessground/types';
import * as THREE from 'three/webgpu';

import { cm } from '../helper.ts';
import * as cf from '../resource/chessfield.types.ts';

import { Store } from './store.ts';

export class PieceProvider {
  static getPiece(pieceId: string): cg.Role {
    const stdPiece = pieceId.toLowerCase() as cf.PieceKey;
    return cf.PiecesTypes[stdPiece];
  }

  private piecesPositions!: Map<string, THREE.Vector3>;

  constructor(private readonly store: Store) {}

  updateGamePositions(boardPieces: cf.BoardPiece[]): THREE.Group {
    const piecesGroup = new THREE.Group();
    piecesGroup.name = '🟢 Pièces Group';

    const squaresVector3: Map<string, THREE.Vector3> = this.getSquaresVector3();
    const piecesObjects: cf.ColorPieceNameObjectMap = this.store.getBoardPiecesObjectsMap();

    // const matrixes: Map<string, { mesh: THREE.Mesh; pos: THREE.Vector3; square: cg.Key }[]> = new Map();

    const coordAttrs = new Map<THREE.Mesh, THREE.InstancedBufferAttribute>();

    // Pieces Rotations
    const pieceRotations: { [k: string]: number } = {
      'white-knight-white-knight': -5.5,
      'black-knight-black-knight': -2.5,
      'black-bishop-black-bishop': -3,
      'black-rook-black-rook': -3,
      'black-pawn-black-pawn': -3,
    };

    boardPieces.forEach((boardPiece: cf.BoardPiece) => {
      if (boardPiece.square && boardPiece.objectKey) {
        const pos = squaresVector3.get(boardPiece.square);
        if (pos) {
          const mesh = piecesObjects.get(`${boardPiece.objectKey}-${boardPiece.square}`) as THREE.Mesh;

          if (mesh) {
            piecesGroup.add(mesh);

            const count = mesh.count;
            const attr = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
            mesh.geometry.setAttribute('instanceCoord', attr);
            coordAttrs.set(mesh, attr);
            // const updateMatrix = matrixes.get(boardPiece.objectKey) ?? [];
            // updateMatrix.push({ mesh, pos, square: boardPiece.square });
            // matrixes.set(boardPiece.objectKey, updateMatrix);

            // Check if this piece needs rotation
            if (pieceRotations[mesh.name]) {
              const rotationAngle = pieceRotations[mesh.name];
              // Combine position and rotation in one step
              mesh.rotateX(rotationAngle);
            }
            mesh.position.set(pos.x, pos.y, pos.z);

            mesh.userData['square'] = boardPiece.square;
            mesh.userData['pos'] = pos;
          }
        }
      }
    });

    // console.log('matrixes', matrixes);

    // const coordAttrs = new Map<THREE.Mesh, THREE.InstancedBufferAttribute>();
    // matrixes.forEach(meshes => {
    //   const mesh = meshes[0].mesh;
    //   const count = mesh.count;
    //   const attr = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    //   mesh.geometry.setAttribute('instanceCoord', attr);
    //   coordAttrs.set(mesh, attr);
    // });

    // matrixes.forEach(meshes => {
    //   for (const { mesh, pos, square } of meshes) {
    //     const matrix = new THREE.Matrix4();
    //
    //     // Check if this piece needs rotation
    //     if (pieceRotations[mesh.name]) {
    //       const rotationAngle = pieceRotations[mesh.name];
    //       // Combine position and rotation in one step
    //       matrix.makeRotationY(rotationAngle);
    //       matrix.setPosition(pos);
    //     } else {
    //       // Just set position for pieces without rotation
    //       matrix.setPosition(pos);
    //     }
    //
    //     const meshM = mesh as THREE.Mesh;
    //     matrix.setPosition(pos);
    //     meshM.userData['square'] = square;
    //     meshM.userData['pos'] = pos;
    //     meshM.userData['matrix'] = matrix;
    //     meshM.applyMatrix4(matrix);
    //   }
    // });

    return piecesGroup;
  }

  private getSquaresVector3(): Map<string, THREE.Vector3> {
    this.piecesPositions = new Map<string, THREE.Vector3>();

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const square = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

        const x = cm(rankInt - Store.boardSize / 2 + 0.5);
        const y = cm(Store.squareHeight / 2);
        const z = cm(colInt - Store.boardSize / 2 + 0.5);

        this.piecesPositions.set(square, new THREE.Vector3(x, y, z));
      }
    }

    return this.piecesPositions;
  }
}
