import {
  PieceKey,
  PiecesEnum,
  PiecesTypes,
} from "../interface/board.interface.ts";

export class PieceProvider {
  static getPiece(pieceId: PieceKey): PiecesEnum {
    // return PiecesEnum[pieceId];
    // return PiecesEnum[pieceId] as PiecesEnum;
    return PiecesTypes[pieceId];
  }
}
