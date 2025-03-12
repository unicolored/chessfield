import * as cg from 'chessground/types';
import * as cf from '../resource/chessfield.types.ts';

export class PieceProvider {
  static getPiece(pieceId: string): cg.Role {
    const stdPiece = pieceId.toLowerCase() as cf.PieceKey;
    return cf.PiecesTypes[stdPiece];
  }
}
