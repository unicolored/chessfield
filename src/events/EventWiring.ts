import type { Store } from '../provider/store.ts';
import type { EventsService } from '../service/events.service.ts';
import { type ShapeController } from '../shapes/ShapeController.ts';

export interface EventWiringCallbacks {
  onSquareHover: (rank: number, file: number) => void;
  onSquareRightClick: (rank: number, file: number, shape: string) => void;
  onSquareRightDrag: (
    fromRank: number,
    fromFile: number,
    toRank: number,
    toFile: number,
    shape: string,
  ) => void;
  onSquareRightDragPreview: (
    fromRank: number,
    fromFile: number,
    toRank: number,
    toFile: number,
    shape: string,
  ) => void;
  onSquareRightDragCancel: () => void;
  onLeftClickClear: () => void;
  onResize: () => Promise<void>;
}

export class EventWiring {
  static setup(store: Store, eventsService: EventsService, shapeController: ShapeController): void {
    eventsService.onSquareHover = (rank, file) => {
      store.chessboard?.highlightSquareCursor(rank, file);
      // The cursor highlight is a shader uniform: request a frame only when it changes.
      store.requestRender();
    };

    eventsService.onSquareRightClick = shapeController.addRingAt.bind(shapeController);
    eventsService.onSquareRightDrag = shapeController.addArrow.bind(shapeController);
    eventsService.onSquareRightDragPreview = shapeController.previewArrow.bind(shapeController);
    eventsService.onSquareRightDragCancel = shapeController.clearArrowPreview.bind(shapeController);

    eventsService.onLeftClickClear = () => {
      shapeController.clearShape();
    };

    eventsService.init();
  }
}
