import type { SceneProvider } from '../provider/scene.provider.ts';
import type { Store } from '../provider/store.ts';
import type { ThemeProvider } from '../provider/theme.provider.ts';
import type { ThemeColors } from '../resource/chessfield.types.ts';
import type { BoardService } from '../service/board.service.ts';
import type { StateService } from '../service/state.service.ts';

export class ThemeController {
  constructor(
    private themeProvider: ThemeProvider,
    private store: Store,
    private boardService: BoardService,
    private stateService: StateService,
    private sceneProvider: SceneProvider,
  ) {}

  switchTheme(theme?: string): void {
    let targetTheme: string;
    if (theme) {
      if (!Store.themes[theme]) {
        console.warn(`Theme "${theme}" not found. Available themes: ${Object.keys(Store.themes).join(', ')}`);
        return;
      }
      targetTheme = theme;
    } else {
      targetTheme = this.themeProvider.getNextTheme();
    }

    this.themeProvider.setTheme(targetTheme as any);

    const currentConfig = this.store.getConfig();
    this.store.setConfig({ ...currentConfig, theme: targetTheme });

    this.applyThemeColors();
  }

  switchMode(mode?: 'light' | 'dark'): void {
    const currentMode = this.store.getConfig().mode ?? 'light';
    const targetMode = mode ?? (currentMode === 'light' ? 'dark' : 'light');

    this.themeProvider.setMode(targetMode);

    const currentConfig = this.store.getConfig();
    this.store.setConfig({ ...currentConfig, mode: targetMode });

    this.applyThemeColors();
  }

  applyThemeColors(): void {
    const themeColors = this.themeProvider.getThemeColors();
    const modeColors = this.themeProvider.getModeColors();

    // 1. Chessboard colors (TSL uniforms)
    this.store.chessboard?.setSquareColors(themeColors.light, themeColors.dark);
    this.store.chessboard?.setHighlightColor(themeColors.highlight);

    // 2. Scene background
    const bgColor = this.themeProvider.getBackgroundColor();
    this.sceneProvider.updateBackground(this.store.scene!, bgColor);

    // 3. Decor (frame, player indicators) - update via TSL userData
    this.boardService.updateDecorColors(modeColors);

    // 4. State/Check color
    // this.stateService.updateCheckColor(themeColors.statusCheck);
  }

  getThemeColors(): ThemeColors {
    return this.themeProvider.getThemeColors();
  }

  getCurrentMode(): 'light' | 'dark' {
    return this.store.getConfig().mode ?? 'light';
  }
}
