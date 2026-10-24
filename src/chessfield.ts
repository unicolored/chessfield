import './chessfield.css';

import type * as cg from '@lichess-org/chessground/types';

import { Container } from './core/Container.ts';
import { type ChessfieldApi } from './resource/chessfield.api.ts';
import { type ChessfieldConfig } from './resource/chessfield.config.ts';
import { type GameState } from './resource/chessfield.state.ts';
import { type ShaderName } from './shader/index.ts';

export type { ChessfieldApi, ChessfieldConfig, GameState };
export * from './resource/chessfield.types';

export class Chessfield implements ChessfieldApi {
  private readonly container!: Container;

  constructor(
    private cfElement: HTMLElement | null,
    config: ChessfieldConfig = {},
  ) {
    if (!this.cfElement) {
      console.error('Start: Chessfield HtmlElement is missing.');
      return;
    }

    this.container = new Container(this.cfElement, config);

    this.container.getCore().start();

    // // Set initial FEN
    // const initialFen = this.container.getStore().getConfig().fen ?? Store.initialFen;
    // const initialLastMove = this.container.getStore().getConfig().lastMove ?? [];
    //
    // this.setFen(initialFen, initialLastMove);
  }

  public setFen(fen: cg.FEN, lastMove?: cg.Key[] | string[]) {
    this.container.getStore().gameState = null;
    this.container.getStore().setFen(fen, lastMove);
  }

  public setMove(lastMove?: cg.Key[] | string[], fen: cg.FEN) {
    this.container.getStore().gameState = null;
    this.container.getStore().setMove(lastMove, fen);
  }

  public setState(state: GameState): void {
    this.container.getStore().gameState = state;
    this.container.getGamePieceService().updatePieces();
  }

  public async configUpdate(partialConfig: Partial<ChessfieldConfig>) {
    await this.container.getConfigManager().configUpdate(partialConfig);
  }

  public switchTheme(theme?: string): void {
    this.container.getThemeController().switchTheme(theme);
  }

  public getThemeColors() {
    return this.container.getThemeController().getThemeColors();
  }

  public getCurrentMode() {
    return this.container.getThemeController().getCurrentMode();
  }

  public switchMode(mode?: 'light' | 'dark'): void {
    this.container.getThemeController().switchMode(mode);
  }

  public getCurrentCamera() {
    return this.container.getCameraController().getCurrentCamera();
  }

  public switchCamera(camera?: string): void {
    this.container.getCameraController().switchCamera(camera as any);
  }

  public addRing(rank: number, file: number, shape: string): void {
    this.container.getShapeController().addRing(rank, file, shape);
  }

  public clearShape(rank?: number, file?: number, shaderName?: ShaderName): void {
    this.container.getShapeController().clearShape(rank, file, shaderName);
  }
}
