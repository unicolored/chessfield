# API Reference

Complete TypeScript API documentation for Chessfield v2.2.1.

## Exports

```typescript
import {
  Chessfield,
  type ChessfieldApi,
  type ChessfieldConfig,
  type GameState,
  type Camera,
  type Mode,
  type Theme,
  type Angle,
  type ThemeColors,
  type TextBackendType,
  type Move,
} from 'chessfield';
```

---

## Chessfield Class

### Constructor

```typescript
new Chessfield(container: HTMLElement | null, config?: ChessfieldConfig): Chessfield
```

| Parameter   | Type                  | Required | Description                          |
| ----------- | --------------------- | -------- | ------------------------------------ |
| `container` | `HTMLElement \| null` | Yes      | DOM element to mount the canvas into |
| `config`    | `ChessfieldConfig`    | No       | Initial configuration                |

---

## Methods

### `setFen`

Set the board position from a FEN string.

```typescript
setFen(fen: cg.FEN, lastMove?: cg.Key[]): void
```

| Parameter  | Type       | Description                                                                           |
| ---------- | ---------- | ------------------------------------------------------------------------------------- |
| `fen`      | `cg.FEN`   | Valid FEN string (e.g., `'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'`) |
| `lastMove` | `cg.Key[]` | Optional: two squares for last move highlight (e.g., `['e2', 'e4']`)                  |

```typescript
chessfield.setFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', ['e2', 'e4']);
```

---

### `configUpdate`

Update configuration dynamically. All changes are applied to the existing scene; nothing is recreated.

```typescript
configUpdate(partialConfig: Partial<ChessfieldConfig>): Promise<void>
```

```typescript
// Theme & mode
await chessfield.configUpdate({ theme: 'blue', mode: 'dark' });

// Camera
await chessfield.configUpdate({ camera: 'top', angle: 'center' });

// Position
await chessfield.configUpdate({
  fen: 'new fen',
  lastMove: ['d2', 'd4'],
});

// Player names + text config
await chessfield.configUpdate({
  playerNames: { white: 'Alice', black: 'Bob' },
  text: { backend: 'troika-text', fontSize: 0.7 },
});

// Controls
await chessfield.configUpdate({
  controlsEnabled: false,
  coordinatesOnSquares: true,
});
```

**Notes:**

- Returns a Promise that resolves after asynchronous text work (backend/name changes) completes; changes are drawn on the next animation frame
- Camera/theme/mode changes are instant (no reload)
- FEN, player names and text backend changes are applied to the current scene without rebuilding it
- `loading` and `coordinatesOnSquares` are startup-only options; later updates only change the stored config

---

### `switchTheme`

Switch board theme. Cycles through available themes if no argument provided.

```typescript
switchTheme(theme?: string): void
```

```typescript
chessfield.switchTheme('green'); // Specific theme
chessfield.switchTheme(); // Cycle to next theme
```

**Built-in themes:** `'blue'`, `'green'`, `'brown'`, `'bw'`, `'light'`, `'dark'`

---

### `switchMode`

Toggle or set light/dark mode.

```typescript
switchMode(mode?: Mode): void
```

```typescript
chessfield.switchMode(); // Toggle
chessfield.switchMode('light'); // Force light
chessfield.switchMode('dark'); // Force dark
```

---

### `switchCamera`

Switch camera position. Cycles if no argument.

```typescript
switchCamera(camera?: Camera): void
```

```typescript
chessfield.switchCamera('white'); // White's perspective
chessfield.switchCamera('black'); // Black's perspective
chessfield.switchCamera('right'); // Right side
chessfield.switchCamera('left'); // Left side
chessfield.switchCamera('top'); // Top-down
chessfield.switchCamera(); // Cycle
```

---

### `getCurrentCamera`

```typescript
getCurrentCamera(): Camera
```

Returns: `'white' | 'right' | 'black' | 'left' | 'top'`

---

### `getCurrentMode`

```typescript
getCurrentMode(): Mode
```

Returns: `'light' | 'dark'`

---

### `getThemeColors`

Get current theme color values.

```typescript
getThemeColors(): ThemeColors
```

Returns:

```typescript
{
  light: string | number;      // Light square color
  dark: string | number;       // Dark square color
  highlight: string | number;  // Highlight color
  statusCheck: string | number; // Check indicator color
  selected: string | number;   // Selected square color
  ring?: string | number;      // Default ring color
  ringCtrlAlt?: string | number;
  ringAlt?: string | number;
  ringCtrl?: string | number;
}
```

---

### `setState`

Set game state (check, mate, draw, etc.). **Preferred method.**

```typescript
setState(state: GameState): void
```

```typescript
// Check
chessfield.setState({
  status: 'check',
  check: ['e8'],
  kings: { white: 'e1', black: 'e8' },
});

// Checkmate
chessfield.setState({
  status: 'mate',
  winner: 'w',
  mate: ['e8'],
  kings: { white: 'e1', black: 'e8' },
});

// Draw
chessfield.setState({
  status: 'draw',
  draw: ['e4', 'e5'],
  drawReason: 'stalemate',
  kings: { white: 'e1', black: 'e8' },
});

// Resignation
chessfield.setState({
  status: 'resign',
  winner: 'b',
  gameoverReason: 'resign',
});
```

---

### `setCheck` (Deprecated)

```typescript
setCheck(state: GameState): void
```

> **Deprecated:** Use `setState()` instead.

---

### `setGameOver` (Deprecated)

```typescript
setGameOver(state: GameState): void
```

> **Deprecated:** Use `setState()` instead.

---

### `addRing` / `addRingAt`

Add a colored ring marker to a square.

```typescript
addRing(rank: number, file: number, shape: string): void
addRingAt(rank: number, file: number, shape: string): void
```

| Parameter | Type     | Description                                                           |
| --------- | -------- | --------------------------------------------------------------------- |
| `rank`    | `number` | 0-7 (0 = rank 1, 7 = rank 8)                                          |
| `file`    | `number` | 0-7 (0 = file a, 7 = file h)                                          |
| `shape`   | `string` | Theme color key: `'ring'`, `'ringAlt'`, `'ringCtrl'`, `'ringCtrlAlt'` |

```typescript
chessfield.addRing(0, 0, 'ring'); // a1 - green
chessfield.addRingAt(7, 4, 'ringAlt'); // e8 - blue
chessfield.addRingAt(3, 3, 'ringCtrl'); // d4 - red
```

---

### `clearShape`

Remove shape markers.

```typescript
clearShape(rank?: number, file?: number, shaderName?: string): void
```

```typescript
chessfield.clearShape(); // Clear all shapes
chessfield.clearShape(0, 0); // Clear all shapes on a1
chessfield.clearShape(0, 0, 'ring'); // Clear only 'ring' on a1
chessfield.clearShape(undefined, undefined, 'ring'); // Clear all rings
```

---

## Types

### `ChessfieldConfig`

```typescript
interface ChessfieldConfig {
  mode?: Mode; // 'light' | 'dark'
  theme?: Theme; // Theme name
  fen?: cg.FEN; // Starting position
  lastMove?: cg.Key[] | string[]; // Last move squares
  orientation?: cg.Color; // 'white' | 'black'
  camera?: Camera; // Camera position
  angle?: Angle; // Camera angle for white/black
  turnColor?: cg.Color; // 'white' | 'black'
  coordinatesOnSquares?: boolean; // Show coordinates on squares
  controlsEnabled?: boolean; // Enable orbit controls
  zoomMinDistance?: number; // Min zoom distance
  zoomMaxDistance?: number; // Max zoom distance
  loading?: {
    overlayFadeDuration?: number; // ms
    progressBarHeight?: number; // px
    onLoadingComplete?: () => void; // Callback
  };
  playerNames?: {
    white?: string;
    black?: string;
  };
  text?: {
    backend?: TextBackendType; // 'canvas-sprite' | 'troika-text'
    fontSize?: number; // World units (cm)
    fontFamily?: string; // CSS font family
    fontWeight?: string | number; // CSS font weight
    color?: string | number; // CSS color
    offset?: number; // Distance from board edge
    maxWidth?: number; // Max width (troika only)
    outlineWidth?: number; // Outline width (troika only)
    outlineColor?: string | number; // Outline color (troika only)
  };
  plugins?: {
    themes?: Themes; // Custom themes
  };
}
```

---

### `GameState`

```typescript
interface GameState {
  status?: 'check' | 'mate' | 'draw' | 'resign' | 'timeout';
  kings?: { white?: cg.Key; black?: cg.Key };
  winner?: 'w' | 'b';
  mate?: cg.Key[] | string[]; // Checkmated king square(s)
  check?: cg.Key[] | string[]; // King(s) in check
  draw?: cg.Key[] | string[]; // Draw-relevant squares
  gameoverReason?: 'mate' | 'draw' | 'resign' | 'timeout';
  drawReason?: 'agreement' | 'stalemate' | 'material' | '50moves';
}
```

---

### `Camera`

```typescript
type Camera = 'white' | 'right' | 'black' | 'left' | 'top';
```

| Value     | Description                     |
| --------- | ------------------------------- |
| `'white'` | White's perspective (bottom)    |
| `'black'` | Black's perspective (top)       |
| `'right'` | Right side (white's right)      |
| `'left'`  | Left side (white's left)        |
| `'top'`   | Top-down orthographic-like view |

---

### `Angle`

```typescript
type Angle = 'left' | 'center' | 'right';
```

Only applies to `'white'` and `'black'` cameras.

---

### `Mode`

```typescript
type Mode = 'light' | 'dark';
```

---

### `Theme`

```typescript
type Theme = 'blue' | 'green' | 'brown' | 'bw' | 'light' | 'dark' | string;
```

String allows custom theme names registered via `plugins.themes`.

---

### `ThemeColors`

```typescript
interface ThemeColors {
  light: string | number;
  dark: string | number;
  highlight: string | number;
  statusCheck: string | number;
  selected: string | number;
  ring?: string | number;
  ringCtrlAlt?: string | number;
  ringAlt?: string | number;
  ringCtrl?: string | number;
}
```

Colors can be CSS strings (`'#ff0000'`, `'red'`) or Three.js hex numbers (`0xff0000`).

---

### `TextBackendType`

```typescript
type TextBackendType = 'canvas-sprite' | 'troika-text';
```

---

### `Move`

```typescript
interface Move {
  fen: cg.FEN;
  lastMove?: cg.Key[];
}
```

---

## TextService API

```typescript
interface TextService {
  // Set rendering backend
  setBackend(backend: TextBackendType): Promise<void>;

  // Remove all text objects
  removeAll(): void;

  // Add text (advanced usage)
  addText(options: TextOptions): void;

  // Update text
  updateText(id: string, options: Partial<TextOptions>): void;

  // Remove specific text
  removeText(id: string): void;
}
```

---

## Events

Chessfield doesn't emit custom events directly. Use standard DOM events on the container:

```typescript
const container = document.getElementById('board')!;

// Mouse interactions are handled internally for:
// - Hover highlighting
// - Right-click: add ring
// - Left-click: clear shapes
// - Drag: orbit camera
// - Scroll: zoom

// Listen for resize (handled automatically)
window.addEventListener('resize', () => {
  // Chessfield auto-resizes
});
```

---

## Constants

```typescript
// Default FEN
Store.initialFen; // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// Board constants
Store.boardSize; // 8
Store.squareSize; // 0.04 (4cm in meters)
Store.squareHeight; // 0.003 (0.3cm in meters)

// Built-in themes
Store.themes; // { default, light, dark, blue, brown, green, bw, ... }
```

---

## Error Handling

Invalid input is logged and ignored; the current board state is kept. These calls do not throw.

```typescript
// Unknown themes are rejected by the theme controller (console warning).
await chessfield.configUpdate({ theme: 'invalid-theme' });

// Invalid FEN strings are rejected by the store (console error).
chessfield.setFen('invalid fen');
```

---

## Version

```typescript
import { version } from 'chessfield/package.json';
// Or at runtime:
console.log(__VERSION__); // If built with define
```

Current version: **2.2.1**
