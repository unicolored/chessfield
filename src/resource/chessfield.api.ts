import { ChessfieldState } from './chessfield.state.ts';
import * as board from './chessfield.board.ts';
import * as field from './chessfield.field.ts';
import { write as fenWrite } from 'chessground/fen';
import * as cg from 'chessground/types';
import { ChessfieldConfig } from './chessfield.config.ts';

export interface ChessfieldApi {
  // reconfigure the instance. Accepts all config options, except for viewOnly & drawable.visible.
  // board will be animated accordingly, if animations are enabled.
  set(config: ChessfieldConfig): void;

  // read chessfield state; write at your own risks.
  state: ChessfieldState;

  // get the position as a FEN string (only contains pieces, no flags)
  // e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
  getFen(): cg.FEN;

  // get the position as a FEN string (only contains pieces, no flags)
  // e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
  setFen(fen: cg.FEN): void;

  // change the view angle
  toggleView(): void;

  // click a square programmatically
  selectSquare(key: cg.Key | null): void;
}

// see API types and documentations in dts/api.d.ts
export function start(state: ChessfieldState, redrawAll: cg.Redraw): ChessfieldApi {
  function toggleView(): void {
    field.toggleView(state);
    redrawAll();
  }

  return {
    set(config: ChessfieldConfig): void {
      if (config.view && config.view !== state.view) toggleView();
    },

    state,

    getFen: () => fenWrite(state.pieces),

    setFen: (fen: cg.FEN): void => {
      console.log(fen);
    },

    toggleView,

    selectSquare(key): void {
      if (key) board.selectSquare(state, key);
      else if (state.selected) {
        board.unselect(state);
        state.dom.redraw();
      }
    },
  };
}
