import type { Store } from '../provider/store.ts';
import type { EventsService } from '../service/events.service.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import { type ShapeController } from '../shapes/ShapeController.ts';

export interface EventWiringCallbacks {
  onSquareHover: (rank: number, file: number) => void;
  onSquareRightClick: (rank: number, file: number, shape: string) => void;
  onLeftClickClear: () => void;
  onResize: () => Promise<void>;
}

export class EventWiring {
  static setup(
    store: Store,
    eventsService: EventsService,
    shapeController: ShapeController,
    shapesService: ShapesService,
  ): void {
    eventsService.onSquareHover = (rank, file) => {
      store.chessboard?.highlightSquareCursor(rank, file);
      // The cursor highlight is a shader uniform: request a frame only when it changes.
      store.requestRender();
    };

    eventsService.onSquareRightClick = shapeController.addRingAt.bind(shapeController);

    eventsService.onLeftClickClear = () => {
      shapesService.clearAll();
      // Rings were cleared outside the controller: ask for one frame.
      store.requestRender();
    };

    eventsService.init();
  }
}
