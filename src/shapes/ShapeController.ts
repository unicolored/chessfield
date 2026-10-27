import type { Store } from '../provider/store.ts';
import type { ThemeProvider } from '../provider/theme.provider.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { ShapesService } from '../service/shapes.service.ts';
import { type ShaderName } from '../shader/index.ts';

export class ShapeController {
  constructor(
    private shapesService: ShapesService,
    private themeProvider: ThemeProvider,
    private store: Store,
  ) {}

  addRing(rank: number, file: number, shape: string): void {
    this.addRingAt(rank, file, shape);
  }

  addRingAt(rank: number, file: number, shape: string): void {
    const index = rank * 8 + file;
    const isVisible = this.shapesService.getVisible(index, 'ring');

    const color = this.getShapeColor(shape);

    if (!isVisible) {
      this.shapesService.setShapeAt(rank, file, color, true, 'ring');
    } else {
      const currentColor = this.shapesService.getColor(index, 'ring');
      if (currentColor.toLowerCase() === color.toLowerCase()) {
        this.shapesService.clearShape(index, 'ring');
      } else {
        this.shapesService.setShapeAt(rank, file, color, true, 'ring');
      }
    }

    // Ring attributes are GPU buffers: draw one frame to show the change on an idle board.
    this.store.requestRender();
  }

  addArrow(fromRank: number, fromFile: number, toRank: number, toFile: number, shape: string): void {
    this.shapesService.addArrow(fromRank, fromFile, toRank, toFile, this.getShapeColor(shape));
    this.store.requestRender();
  }

  previewArrow(fromRank: number, fromFile: number, toRank: number, toFile: number, shape: string): void {
    this.shapesService.setArrowPreview(fromRank, fromFile, toRank, toFile, this.getShapeColor(shape));
    this.store.requestRender();
  }

  clearArrowPreview(): void {
    this.shapesService.clearArrowPreview();
    this.store.requestRender();
  }

  clearShape(rank?: number, file?: number, shaderName?: ShaderName): void {
    if (shaderName) {
      if (rank !== undefined && file !== undefined) {
        this.shapesService.clearShape(rank * 8 + file, shaderName);
      } else {
        this.shapesService.clearAll([shaderName]);
      }
    } else if (rank !== undefined && file !== undefined) {
      this.shapesService.clearShape(rank * 8 + file);
    } else {
      this.shapesService.clearAll();
    }

    // Clearing shapes also changes GPU buffers, so request a frame.
    this.store.requestRender();
  }

  private getShapeColor(shape: string): string {
    const theme: cf.ThemeColors = this.themeProvider.getThemeColors();

    return (theme as unknown as Record<string, string | number | undefined>)[shape]?.toString() ?? '#000000';
  }
}
