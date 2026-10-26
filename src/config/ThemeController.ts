import * as THREE from 'three/webgpu';

import { type Container } from '../core/Container.ts';
import { Store } from '../provider/store.ts';
import type { ThemeColors } from '../resource/chessfield.types.ts';

export class ThemeController {
  constructor(private readonly container: Container) {}

  switchTheme(theme?: string): void {
    let targetTheme: string;
    if (theme) {
      if (!Store.themes[theme]) {
        console.warn(`Theme "${theme}" not found. Available themes: ${Object.keys(Store.themes).join(', ')}`);
        return;
      }
      targetTheme = theme;
    } else {
      targetTheme = this.container.getThemeProvider().getNextTheme();
    }

    this.container.getThemeProvider().setTheme(targetTheme as any);

    const currentConfig = this.container.getStore().getConfig();
    this.container.getStore().setConfig({ ...currentConfig, theme: targetTheme });

    this.applyThemeColors();
  }

  switchMode(mode?: 'light' | 'dark'): void {
    const currentMode = this.container.getStore().getConfig().mode ?? 'light';
    const targetMode = mode ?? (currentMode === 'light' ? 'dark' : 'light');

    this.container.getThemeProvider().setMode(targetMode);

    const currentConfig = this.container.getStore().getConfig();
    this.container.getStore().setConfig({ ...currentConfig, mode: targetMode });

    this.applyThemeColors();
  }

  applyThemeColors(): void {
    const themeColors = this.container.getThemeProvider().getThemeColors();
    const modeColors = this.container.getThemeProvider().getModeColors();

    // 1. Chessboard colors (TSL uniforms)
    this.container.getStore().chessboard?.setSquareColors(themeColors.light, themeColors.dark);
    this.container.getStore().chessboard?.setHighlightColor(themeColors.highlight);

    // 2. Scene background (owned by the mode, not the theme)
    const backgroundColor = this.container.getThemeProvider().getBackgroundColor();
    this.container.getStore().getScene().background = new THREE.Color(backgroundColor);

    // 3. Decor (frame, player indicators) - update via TSL userData
    this.container.getBoardService().updateDecorColors(modeColors);

    // 4. State/Check color
    // this.stateService.updateCheckColor(themeColors.statusCheck);

    // Colours are uniforms: one frame is enough to show the new theme.
    this.container.getStore().requestRender();
  }

  getThemeColors(): ThemeColors {
    return this.container.getThemeProvider().getThemeColors();
  }

  getCurrentMode(): 'light' | 'dark' {
    return this.container.getStore().getConfig().mode ?? 'light';
  }
}
