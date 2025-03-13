import { Store } from './store.ts';
import { Mode, Theme, ThemeColors } from '../resource/chessfield.types.ts';

export class ThemeProvider {
  private mode: Mode;
  private theme: Theme;

  constructor(store: Store) {
    this.mode = store.getConfig().mode ?? 'light';
    this.theme = store.getConfig().theme ?? 'blue';
  }

  getThemeColors(): ThemeColors {
    return Store.themes[this.theme];
  }

  getModeColors(): ThemeColors {
    return Store.themes[this.mode];
  }

  getBackgroundColor(): string | number {
    return this.getModeColors().light ?? '#bfcfdd';
  }
}
