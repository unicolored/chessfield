import * as cg from 'chessground/types';
import * as cf from '../resource/chessfield.types.ts';
import { Group, InstancedMesh, Matrix4, Mesh, Vector3 } from 'three';
// import * as THREE from 'three';
import { tap } from 'rxjs';
import { cm } from '../helper.ts';
import { Store } from './store.ts';

export class PieceProvider {
  static getPiece(pieceId: string): cg.Role {
    const stdPiece = pieceId.toLowerCase() as cf.PieceKey;
    return cf.PiecesTypes[stdPiece];
  }

  private piecesPositions!: Map<string, Vector3>;

  constructor(private readonly store: Store) {}

  updateGamePositions(): Group {
    const piecesGroup = new Group();
    piecesGroup.name = '🟢 Pièces Group';

    const squaresVector3: Map<string, Vector3> = this.getSquaresVector3();
    const piecesObjects: cf.ColorPieceNameObjectMap = this.store.getBoardPiecesObjectsMap();

    this.store.gamePiecesSubject$
      .pipe(
        tap((list: cf.BoardPiece[]) => {
          const matrixes: Map<string, { mesh: InstancedMesh; pos: Vector3 }[]> = new Map();

          list.forEach((boardPiece: cf.BoardPiece) => {
            if (boardPiece.coord && boardPiece.objectKey) {
              const pos = squaresVector3.get(boardPiece.coord);
              if (pos) {
                const mesh = piecesObjects.get(boardPiece.objectKey);

                if (mesh) {
                  const instanceMesh = mesh as Mesh as InstancedMesh;
                  piecesGroup.add(instanceMesh);
                  if (instanceMesh.count) {
                    // .. instancedMesh
                    const updateMatrix = matrixes.get(boardPiece.objectKey) ?? [];
                    updateMatrix.push({ mesh: instanceMesh, pos });
                    matrixes.set(boardPiece.objectKey, updateMatrix);
                  } else {
                    mesh.position.copy(pos);
                    if (mesh.name.startsWith('black')) {
                      mesh.rotateY(Math.PI);
                    }
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

          matrixes.forEach(meshes => {
            let index = 0;
            for (const { mesh, pos } of meshes) {
              const matrix = new Matrix4();

              // Check if this piece needs rotation
              const rotationAngle = pieceRotations[mesh.name];
              if (rotationAngle !== undefined) {
                // Combine position and rotation in one step
                matrix.makeRotationY(rotationAngle);
                matrix.setPosition(pos);
              } else {
                // Just set position for pieces without rotation
                matrix.setPosition(pos);
              }

              mesh.setMatrixAt(index, matrix);

              index++;
            }
          });
        }),
      )
      .subscribe();

    return piecesGroup;
  }

  private getSquaresVector3(): Map<string, Vector3> {
    if (!this.piecesPositions) {
      this.piecesPositions = new Map<string, Vector3>();

      for (let rankInt = 0; rankInt < Store.boardSize; rankInt++) {
        for (let colInt = 0; colInt < Store.boardSize; colInt++) {
          const coord = Object.values(cg.files)[rankInt] + (Store.boardSize - colInt);

          const x = cm(rankInt - Store.boardSize / 2 + 0.5);
          const y = cm(Store.squareHeight / 2);
          const z = cm(colInt - Store.boardSize / 2 + 0.5);

          this.piecesPositions.set(coord, new Vector3(x, y, z));
        }
      }
    }

    return this.piecesPositions;
  }
}
