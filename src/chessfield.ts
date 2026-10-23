import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';

import { ChessfieldCore } from './core/ChessfieldCore.ts';
import { Store } from './provider/store.ts';
import { type ChessfieldApi } from './resource/chessfield.api.ts';
import { type ChessfieldConfig } from './resource/chessfield.config.ts';
import { type GameState } from './resource/chessfield.state.ts';
import { Container } from './core/Container.ts';

export type { ChessfieldApi, ChessfieldConfig, GameState };
export * from './resource/chessfield.types';

export class Chessfield implements ChessfieldApi {
  private readonly container!: Container;

  constructor(
    private cfElement: HTMLElement | null,
    config: ChessfieldConfig = {},
  ) {
    if (!this.cfElement || this.cfElement instanceof HTMLElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    this.container = new Container(config);

    // Core
    const core = new ChessfieldCore(this.container, this.cfElement);

    // this.core = core;
    // this.themeController = themeController;
    // this.configManager = configManager;
    // this.gameStateManager = gameStateManager;
    // this.shapeController = shapeController;
    // this.textService = textService;

    // Set initial FEN
    const initialFen = container.getStore().getConfig().fen ?? Store.initialFen;
    const initialLastMove = container.getStore().getConfig().lastMove ?? [];
    container.getGameStateManger().setFen(initialFen, initialLastMove);
    // store.setFen(initialFen, initialLastMove);

    core.start();
  }

  public setFen(fen: cg.FEN, lastMove?: cg.Key[]) {
    this.container.getGameStateManger().setFen(fen, lastMove);
  }

  public async configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    await this.configManager.configUpdate(partialConfig);
  }

  public switchTheme(theme?: string): void {
    this.themeController.switchTheme(theme);
  }

  public getThemeColors() {
    return this.themeController.getThemeColors();
  }

  public getCurrentCamera() {
    return this.cameraController.getCurrentCamera();
  }

  public getCurrentMode() {
    return this.themeController.getCurrentMode();
  }

  public switchMode(mode?: 'light' | 'dark'): void {
    this.themeController.switchMode(mode);
  }

  public switchCamera(camera?: string): void {
    this.cameraController.switchCamera(camera as any);
  }

  public setState(state: GameState): void {
    this.gameStateManager.setState(state);
  }

  public addRing(rank: number, file: number, shape: string): void {
    this.shapeController.addRing(rank, file, shape);
  }

  public clearShape(rank?: number, file?: number, shaderName?: string): void {
    this.shapeController.clearShape(rank, file, shaderName);
  }

  public setPlayers(players: unknown): void {
    this.textService.setPlayers(players);
  }
}
