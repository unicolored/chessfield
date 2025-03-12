import { HeadlessState } from './chessfield.state.js';

export function toggleView(state: HeadlessState): void {
  if (state.camera === 'white') {
    state.camera = 'right';
  } else if (state.camera === 'right') {
    state.camera = 'black';
  } else if (state.camera === 'black') {
    state.camera = 'left';
  } else if (state.camera === 'left') {
    state.camera = 'white';
  }
}
