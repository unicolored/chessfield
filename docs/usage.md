# Usage Guide

This guide covers common usage patterns for Chessfield.

## Basic Configuration

```typescript
import { Chessfield } from 'chessfield';

const chessfield = new Chessfield(document.getElementById('board')!, {
  // Board orientation
  orientation: 'white', // 'white' | 'black'

  // Camera position
  camera: 'white', // 'white' | 'right' | 'black' | 'left' | 'top'
  angle: 'right', // 'left' | 'center' | 'right' (for white/black cameras)

  // Theme
  theme: 'green', // 'blue' | 'green' | 'brown' | 'bw' | 'light' | 'dark' | custom
  mode: 'light', // 'light' | 'dark'

  // Position
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  lastMove: ['e2', 'e4'],
  turnColor: 'white',

  // Display options
  coordinatesOnSquares: false,
  controlsEnabled: true,
  zoomMinDistance: 2,
  zoomMaxDistance: 50,

  // Player names
  playerNames: {
    white: 'Magnus',
    black: 'Hikaru',
  },

  // Text rendering
  text: {
    backend: 'canvas-sprite', // 'canvas-sprite' | 'troika-text'
    fontSize: 0.5,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    color: '#000000',
    offset: 0.3,
    maxWidth: 2,
    outlineWidth: 0,
    outlineColor: '#ffffff',
  },
});
```

## Setting Position (FEN)

```typescript
// Standard starting position
chessfield.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

// Position with last move highlighting
chessfield.setFen(
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  ['e2', 'e4'], // Last move squares
);

// Clear board
chessfield.setFen('8/8/8/8/8/8/8/8 w - - 0 1');
```

## Theme & Appearance

### Built-in Themes

```typescript
// Switch to a specific theme
chessfield.switchTheme('blue');
chessfield.switchTheme('green');
chessfield.switchTheme('brown');
chessfield.switchTheme('bw'); // Black & white
chessfield.switchTheme('light'); // Light minimal
chessfield.switchTheme('dark'); // Dark minimal

// Cycle to next theme
chessfield.switchTheme();

// Get current theme colors
const colors = chessfield.getThemeColors();
// { light, dark, highlight, statusCheck, selected, ring, ringCtrlAlt, ringAlt, ringCtrl }
```

### Light/Dark Mode

```typescript
// Toggle mode
chessfield.switchMode(); // Toggles light ↔ dark
chessfield.switchMode('light'); // Force light
chessfield.switchMode('dark'); // Force dark

// Get current mode
const mode = chessfield.getCurrentMode(); // 'light' | 'dark'
```

### Custom Themes (Plugin System)

```typescript
const chessfield = new Chessfield(container, {
  plugins: {
    themes: {
      'my-theme': {
        light: '#f0d9b5',
        dark: '#b58863',
        highlight: '#ffff00',
        statusCheck: '#ff0000',
        selected: '#00ff00',
        ring: '#00ff00',
        ringCtrlAlt: '#ffa500',
        ringAlt: '#00ffff',
        ringCtrl: '#ff00ff',
      },
    },
  },
  theme: 'my-theme',
});
```

## Camera Control

```typescript
// Switch to specific camera
chessfield.switchCamera('white'); // White's perspective
chessfield.switchCamera('black'); // Black's perspective
chessfield.switchCamera('right'); // Right side
chessfield.switchCamera('left'); // Left side
chessfield.switchCamera('top'); // Top-down

// Cycle cameras
chessfield.switchCamera();

// Get current camera
const camera = chessfield.getCurrentCamera(); // 'white' | 'right' | 'black' | 'left' | 'top'
```

## Game State Management

### Check, Mate, Draw

```typescript
import type { GameState } from 'chessfield';

// Check
chessfield.setState({
  status: 'check',
  check: ['e8'], // Black king in check
  kings: { white: 'e1', black: 'e8' },
});

// Checkmate
chessfield.setState({
  status: 'mate',
  winner: 'w', // White wins
  mate: ['e8'], // Black king checkmated
  kings: { white: 'e1', black: 'e8' },
});

// Draw
chessfield.setState({
  status: 'draw',
  draw: ['e4', 'e5'], // Draw-relevant squares
  drawReason: 'stalemate', // 'agreement' | 'stalemate' | 'material' | '50moves'
  kings: { white: 'e1', black: 'e8' },
});

// Resignation / Timeout
chessfield.setState({
  status: 'resign',
  winner: 'b',
  gameoverReason: 'resign',
});
```

### Deprecated Methods (use `setState`)

```typescript
// These work but are deprecated
chessfield.setCheck({ check: ['e8'], kings: { white: 'e1', black: 'e8' } });
chessfield.setGameOver({ winner: 'w', mate: ['e8'], kings: { white: 'e1', black: 'e8' } });
```

## Shape Overlays (Rings)

Add colored rings to squares for arrows, highlights, or custom markers:

```typescript
// Add a ring at rank/file (0-7, 0 = rank 1 / file a)
chessfield.addRing(0, 0, 'ring'); // a1 - green ring
chessfield.addRing(7, 4, 'ringAlt'); // e8 - blue ring
chessfield.addRing(3, 3, 'ringCtrl'); // d4 - red ring
chessfield.addRing(4, 4, 'ringCtrlAlt'); // e5 - orange ring

// Add ring with shape name
chessfield.addRingAt(0, 0, 'ring');

// Clear specific square
chessfield.clearShape(0, 0); // Clear a1
chessfield.clearShape(0, 0, 'ring'); // Clear only 'ring' shader

// Clear all shapes
chessfield.clearShape(); // Clear all
chessfield.clearShape(undefined, undefined, 'ring'); // Clear all rings
```

**Available shape colors (from theme):**

| Shape         | Theme Key     | Default Color      |
| ------------- | ------------- | ------------------ |
| `ring`        | `ring`        | Green (`#73a45d`)  |
| `ringAlt`     | `ringAlt`     | Blue (`#66799f`)   |
| `ringCtrl`    | `ringCtrl`    | Red (`#b86f60`)    |
| `ringCtrlAlt` | `ringCtrlAlt` | Orange (`#f0b24d`) |

## Player Names

```typescript
// At initialization
const chessfield = new Chessfield(container, {
  playerNames: { white: 'Player 1', black: 'Player 2' },
});

// Update dynamically
await chessfield.configUpdate({
  playerNames: { white: 'New White', black: 'New Black' },
});

// Customize text appearance
await chessfield.configUpdate({
  text: {
    backend: 'troika-text',
    fontSize: 0.6,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: '#333333',
    outlineWidth: 2,
    outlineColor: '#ffffff',
  },
});
```

## Text Backends

| Backend         | Description                                        | Best For              |
| --------------- | -------------------------------------------------- | --------------------- |
| `canvas-sprite` | Canvas-based sprites, fast, lightweight            | Most cases, mobile    |
| `troika-text`   | Troika three-text, high quality, supports outlines | Desktop, custom fonts |

```typescript
// Switch backend at runtime
await chessfield.configUpdate({
  text: { backend: 'troika-text' },
});
```

## Dynamic Configuration Updates

Updates are applied to the existing board in place — the scene, canvas and animation loop are not recreated.

```typescript
// Update multiple settings at once
await chessfield.configUpdate({
  theme: 'blue',
  mode: 'dark',
  camera: 'top',
  angle: 'center',
  fen: 'new fen string',
  lastMove: ['d2', 'd4'],
  playerNames: { white: 'Alice', black: 'Bob' },
  text: { backend: 'troika-text', fontSize: 0.7 },
  controlsEnabled: false,
  coordinatesOnSquares: true,
});
```

## Getting Board Information

```typescript
// Current camera
const camera = chessfield.getCurrentCamera(); // 'white' | 'right' | 'black' | 'left' | 'top'

// Current mode
const mode = chessfield.getCurrentMode(); // 'light' | 'dark'

// Theme colors
const colors = chessfield.getThemeColors();
// {
//   light: '#efd9b5',
//   dark: '#b58863',
//   highlight: '#cdd16a',
//   statusCheck: '#aa0000',
//   selected: '',
//   ring: '#73a45d',
//   ringCtrlAlt: '#f0b24d',
//   ringAlt: '#66799f',
//   ringCtrl: '#b86f60'
// }

// Text service for advanced text manipulation
const textService = chessfield.textService;
textService.removeAll(); // Clear all text
```

## Event Handling (via DOM)

```typescript
const container = document.getElementById('board')!;
const chessfield = new Chessfield(container);

// Listen for clicks on squares
container.addEventListener('click', e => {
  // Use chessfield's internal raycasting via right-click for rings
});

// Resize handling is automatic via window.resize listener
// But you can trigger manually:
window.dispatchEvent(new Event('resize'));
```

## Cleanup

The current API does not expose a `dispose()` method, and `configUpdate({})` does not dispose or restart anything — it is a safe no-op that keeps the current scene. Remove the container element only when you are done with the board.

## Complete Example: Interactive Game

```typescript
import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

const container = document.getElementById('board')!;
const statusEl = document.getElementById('status')!;

const chessfield = new Chessfield(container, {
  theme: 'green',
  camera: 'white',
  angle: 'right',
  playerNames: { white: 'White', black: 'Black' },
  coordinatesOnSquares: true,
});

// Simulate a game
const moves = [
  { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', lastMove: ['e2', 'e4'] },
  { fen: 'rnbqkbnr/pppppppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', lastMove: ['e7', 'e5'] },
  // ... more moves
];

let moveIndex = 0;
document.getElementById('next-move')!.addEventListener('click', () => {
  if (moveIndex < moves.length) {
    const move = moves[moveIndex++];
    chessfield.setFen(move.fen, move.lastMove);
    statusEl.textContent = `Move ${moveIndex}`;
  }
});

// Theme toggle
document.getElementById('toggle-theme')!.addEventListener('click', () => {
  chessfield.switchTheme();
});

// Camera cycle
document.getElementById('cycle-camera')!.addEventListener('click', () => {
  chessfield.switchCamera();
});

// Mode toggle
document.getElementById('toggle-mode')!.addEventListener('click', () => {
  chessfield.switchMode();
});

// Show checkmate
document.getElementById('show-mate')!.addEventListener('click', () => {
  chessfield.setState({
    status: 'mate',
    winner: 'w',
    mate: ['e8'],
    kings: { white: 'e1', black: 'e8' },
  });
  statusEl.textContent = 'Checkmate! White wins';
});
```
