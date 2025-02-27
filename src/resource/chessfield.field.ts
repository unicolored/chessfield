import { HeadlessState } from './chessfield.state.js';

export function toggleView(state: HeadlessState): void {
  if (state.view === 'white') {
    state.view = 'right';
  } else if (state.view === 'right') {
    state.view = 'black';
  } else if (state.view === 'black') {
    state.view = 'left';
  } else if (state.view === 'left') {
    state.view = 'white';
  }
}
