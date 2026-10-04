import * as cg from '@lichess-org/chessground/types';
import { tap } from 'rxjs';
import * as THREE from 'three/webgpu';

import { cm, coordToVector2 } from '../helper.ts';
import * as cf from '../resource/chessfield.types.ts';

import { Store } from './store.ts';

export class PieceProvider {
  static getPiece(pieceId: string): cg.Role {
    const stdPiece = pieceId.toLowerCase() as cf.PieceKey;
    return cf.PiecesTypes[stdPiece];
  }

  private piecesPositions!: Map<string, THREE.Vector3>;

  constructor(private readonly store: Store) {}

  updateGamePositions(): THREE.Group {
    const piecesGroup = new THREE.Group();
    piecesGroup.name = '🟢 Pièces Group';

    const squaresVector3: Map<string, THREE.Vector3> = this.getSquaresVector3();
    const piecesObjects: cf.ColorPieceNameObjectMap = this.store.getBoardPiecesObjectsMap();

    this.store.gamePiecesSubject$
      .pipe(
        tap((list: cf.BoardPiece[]) => {
          const matrixes: Map<string, { mesh: THREE.InstancedMesh; pos: THREE.Vector3; coord: string }[]> =
            new Map();

          list.forEach((boardPiece: cf.BoardPiece) => {
            if (boardPiece.coord && boardPiece.objectKey) {
              const pos = squaresVector3.get(boardPiece.coord);
              if (pos) {
                const mesh = piecesObjects.get(boardPiece.objectKey);

                if (mesh) {
                  const instanceMesh = mesh as THREE.Mesh as THREE.InstancedMesh;
                  piecesGroup.add(instanceMesh);
                  if (instanceMesh.count) {
                    // .. instancedMesh
                    const updateMatrix = matrixes.get(boardPiece.objectKey) ?? [];
                    updateMatrix.push({ mesh: instanceMesh, pos, coord: boardPiece.coord });
                    matrixes.set(boardPiece.objectKey, updateMatrix);
                    // } else {
                    //   // mesh.userData['coord'] = boardPiece.coord;
                    //   mesh.position.copy(pos);
                    //   if (mesh.name.startsWith('black')) {
                    //     mesh.rotateY(Math.PI);
                    //   }
                  }
                }
              }
            }
          });

          // Pieces Rotations
          const pieceRotations: { [k: string]: number } = {
            'white-knight-white-knight': -5.5,
            'black-knight-black-knight': -2.5,
            'black-bishop-black-bishop': -3,
            'black-rook-black-rook': -3,
            'black-pawn-black-pawn': -3,
          };

          const coordAttrs = new Map<THREE.InstancedMesh, THREE.InstancedBufferAttribute>();
          matrixes.forEach(meshes => {
            const mesh = meshes[0].mesh;
            const count = mesh.count;
            const attr = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
            mesh.geometry.setAttribute('instanceCoord', attr);
            coordAttrs.set(mesh, attr);
          });

          matrixes.forEach(meshes => {
            let index = 0;
            for (const { mesh, pos, coord } of meshes) {
              const matrix = new THREE.Matrix4();

              // Check if this piece needs rotation
              if (pieceRotations[mesh.name]) {
                const rotationAngle = pieceRotations[mesh.name];
                // Combine position and rotation in one step
                matrix.makeRotationY(rotationAngle);
                matrix.setPosition(pos);
              } else {
                // Just set position for pieces without rotation
                matrix.setPosition(pos);
              }

              if (mesh instanceof THREE.InstancedMesh) {
                mesh.setMatrixAt(index, matrix);

                const coordAttr = coordAttrs.get(mesh);
                if (coordAttr) {
                  const vec = coordToVector2(coord);
                  coordAttr.setXY(index, vec.x, vec.y);
                }

                index++;
              } else {
                const meshM = mesh as THREE.Mesh;
                // meshM.position.set(pos.x, pos.y, pos.z);
                matrix.setPosition(pos);
                meshM.userData['coord'] = coord;
                meshM.userData['pos'] = pos;
                meshM.userData['matrix'] = matrix;
                meshM.applyMatrix4(matrix);
              }
            }
          });
        }),
      )
      .subscribe();

    return piecesGroup;
  }

  private getSquaresVector3(): Map<string, THREE.Vector3> {
    this.piecesPositions = new Map<string, THREE.Vector3>();

    for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
      for (let colInt = 0; colInt < Store.boardSize; colInt++) {
        const coord = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

        const x = cm(rankInt - Store.boardSize / 2 + 0.5);
        const y = cm(Store.squareHeight / 2);
        const z = cm(colInt - Store.boardSize / 2 + 0.5);

        this.piecesPositions.set(coord, new THREE.Vector3(x, y, z));
      }
    }

    return this.piecesPositions;
  }
}
