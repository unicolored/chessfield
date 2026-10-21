import type { ChessfieldCore } from '../core/ChessfieldCore.ts';
import type { Store } from '../provider/store.ts';
import type { EventsService } from '../service/events.service.ts';
import type { ShapesService } from '../service/shapes.service.ts';

export interface EventWiringCallbacks {
  onSquareHover: (rank: number, file: number) => void;
  onSquareRightClick: (rank: number, file: number, shape: string) => void;
  onLeftClickClear: () => void;
  onResize: () => Promise<void>;
}

export class EventWiring {
  static setup(
    eventsService: EventsService,
    core: ChessfieldCore,
    store: Store,
    shapesService: ShapesService,
  ): void {
    eventsService.onSquareHover = (rank, file) => {
      store.chessboard?.highlightSquareCursor(rank, file);
    };

    eventsService.onSquareRightClick = core.addRingAt.bind(core);

    eventsService.onLeftClickClear = () => shapesService.clearAll();

    eventsService.onResize = async () => {
      if (!core.getCfElement()) {
        return;
      }

      const rect = core.getCfElement()!.getBoundingClientRect();
      const sizes = { width: rect.width, height: rect.height };
      core.getRenderer().setSize(sizes.width, sizes.height);
      core.getCamera().aspect = sizes.width / sizes.height;
      core.getCamera().updateProjectionMatrix();
    };

    eventsService.init();
  }
}
