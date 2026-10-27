import { type Mode, type Theme, type ThemeColors } from '../resource/chessfield.types.ts';

import { Store } from './store.ts';

export class ThemeProvider {
  constructor(
    private mode: Mode = 'light',
    private theme: Theme = 'blue',
  ) {}

  getThemeColors(): ThemeColors {
    const mergeTheme = { ...Store.themes['default'], ...Store.themes[this.theme] };
    return mergeTheme;
  }

  getModeColors(): ThemeColors {
    return Store.modes[this.mode];
  }

  getBackgroundColor(): string | number {
    return this.getModeColors().light ?? '#bfcfdd';
  }

  /**
   * Text color contrasting with the mode background.
   * The mode owns it explicitly, so a background tweak cannot wash the labels out.
   */
  getTextColor(): string | number {
    return this.mode === 'light' ? Store.modes['dark'].light : Store.modes['light'].light;
  }

  getCurrentTheme(): Theme {
    return this.theme;
  }

  getCurrentMode(): Mode {
    return this.mode;
  }

  setTheme(theme: Theme): void {
    if (Store.themes[theme]) {
      this.theme = theme;
    }
  }

  setMode(mode: Mode): void {
    this.mode = mode;
  }

  getAvailableThemes(): string[] {
    return Object.keys(Store.themes).filter(k => !['light', 'dark', 'default'].includes(k));
  }

  getNextTheme(): Theme {
    const themes = this.getAvailableThemes();
    const currentIndex = themes.indexOf(this.theme as string);
    const nextIndex = (currentIndex + 1) % themes.length;
    return themes[nextIndex] as Theme;
  }
}
