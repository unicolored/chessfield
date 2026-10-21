# Fullscreen Mode

Chessfield does not include a built-in fullscreen API — the canvas is yours to control.

## Accessing the Canvas

```typescript
import { Chessfield } from 'chessfield';

const container = document.getElementById('board')!;
const field = Chessfield(container, { camera: 'white', angle: 'right' });

const canvas = container.querySelector('canvas')!; // HTMLCanvasElement
```

## Minimal Toggle (5 lines)

```typescript
function toggleFullscreen(canvas: HTMLCanvasElement) {
  if (document.fullscreenElement === canvas) {
    document.exitFullscreen();
  } else {
    canvas.requestFullscreen({ navigationUI: 'hide' }).catch(console.error);
  }
}

// Usage
document.getElementById('fs-btn')?.addEventListener('click', () => toggleFullscreen(canvas));
```

## Fullscreen Change Events

Sync UI (button icon, toolbar visibility) when fullscreen state changes:

```typescript
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement === canvas;
  // Update button: isFullscreen ? '⛶' : '⛶'
  // Hide/show toolbars: toolbar.hidden = isFullscreen;
});
```

## CSS Tips: Hiding Chrome in Fullscreen

```css
/* Hide app chrome when the canvas is fullscreen */
#board:fullscreen ~ .app-header,
#board:fullscreen ~ .toolbar {
  display: none;
}

/* Or target the container */
.chessfield-container:fullscreen .toolbar {
  display: none;
}
```

> **Note:** `requestFullscreen()` must be called from a user gesture (click, keydown). It will reject if called from a timer or async callback.