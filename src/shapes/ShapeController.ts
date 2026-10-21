import type { ThemeProvider } from '../provider/theme.provider.ts';
import type * as cf from '../resource/chessfield.types.ts';
import type { ShapesService } from '../service/shapes.service.ts';

export class ShapeController {
  constructor(
    private shapesService: ShapesService,
    private themeProvider: ThemeProvider,
  ) {}

  addRing(rank: number, file: number, shape: string): void {
    this.addRingAt(rank, file, shape);
  }

  addRingAt(rank: number, file: number, shape: string): void {
    const index = rank * 8 + file;
    const isVisible = this.shapesService.getVisible(index, 'ring');

    const theme: cf.ThemeColors = this.themeProvider.getThemeColors();

    const color =
      (theme as unknown as Record<string, string | number | undefined>)[shape]?.toString() ?? '#000000';

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
  }

  clearShape(rank?: number, file?: number, shaderName?: string): void {
    if (rank !== undefined && file !== undefined) {
      this.shapesService.clearShape(rank * 8 + file, shaderName);
    } else {
      this.shapesService.clearAll(shaderName ? [shaderName] : undefined);
    }
  }
}
