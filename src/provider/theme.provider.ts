import { type Mode, type Theme, type ThemeColors } from '../resource/chessfield.types.ts';

import { Store } from './store.ts';

export class ThemeProvider {
  constructor(
    private readonly mode: Mode = 'light',
    private readonly theme: Theme = 'blue',
  ) {}

  getThemeColors(): ThemeColors {
    return Store.themes[this.theme];
  }

  getModeColors(): ThemeColors {
    return Store.themes[this.mode];
  }

  getBackgroundColor(): string | number {
    return this.getModeColors().light ?? '#bfcfdd';
  }

  getInvertColor(): string | number {
    const invertMode = this.mode === 'light' ? 'dark' : 'light';
    return Store.themes[invertMode].light ?? '#bfcfdd';
  }
}
