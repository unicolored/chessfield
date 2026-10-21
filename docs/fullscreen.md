# Fullscreen Mode

Chessfield does not include a built-in fullscreen API — the canvas is yours to control.

## Accessing the Canvas

```typescript
import { Chessfield } from 'chessfield';

const container = document.getElementById('board')!;
const field = new Chessfield(container, { camera: 'white', angle: 'right' });

// The canvas is created as a child of your container
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
const fsBtn = document.getElementById('fs-btn')!;
fsBtn.addEventListener('click', () => toggleFullscreen(canvas));
```

## Fullscreen Change Events

Sync UI (button icon, toolbar visibility) when fullscreen state changes:

```typescript
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = document.fullscreenElement === canvas;

  // Update button icon
  fsBtn.textContent = isFullscreen ? '⛶' : '⛶';
  fsBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');

  // Hide/show toolbars
  document.querySelector('.toolbar')!.hidden = isFullscreen;
  document.querySelector('.app-header')!.hidden = isFullscreen;
});
```

## CSS Tips: Hiding Chrome in Fullscreen

```css
/* Hide app chrome when the canvas is fullscreen */
#board:fullscreen ~ .app-header,
#board:fullscreen ~ .toolbar {
  display: none;
}

/* Or target the container class */
.chessfield-container:fullscreen .toolbar {
  display: none;
}

/* Fullscreen-specific canvas styling */
canvas:fullscreen {
  background: #000; /* Black background for letterboxing */
}
```

## Container vs Canvas Fullscreen

Two approaches depending on your layout:

### Option 1: Canvas Fullscreen (Recommended)

```typescript
// Only the canvas goes fullscreen - cleanest for chess
canvas.requestFullscreen();
```

### Option 2: Container Fullscreen

```typescript
// The entire container (board + UI) goes fullscreen
container.requestFullscreen();

// Canvas will resize automatically via window.resize listener
```

## Keyboard Exit

```typescript
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.fullscreenElement === canvas) {
    document.exitFullscreen();
  }
});
```

## Mobile Considerations

```typescript
// iOS Safari requires specific meta tag
// <meta name="apple-mobile-web-app-capable" content="yes">

// Handle orientation change
window.addEventListener('orientationchange', () => {
  // Canvas auto-resizes, but you may need to trigger a manual resize
  setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
});
```

## Complete Example

```html
<div id="board" style="width: 600px; height: 600px;"></div>
<button id="fs-btn" aria-label="Enter fullscreen">⛶</button>

<script type="module">
  import { Chessfield } from 'https://cdn.jsdelivr.net/npm/chessfield/dist/chessfield.js';

  const container = document.getElementById('board')!;
  const fsBtn = document.getElementById('fs-btn')!;

  const field = new Chessfield(container, {
    camera: 'white',
    angle: 'right',
    theme: 'green'
  });

  const canvas = container.querySelector('canvas')!;

  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement === canvas) {
      document.exitFullscreen();
    } else {
      canvas.requestFullscreen({ navigationUI: 'hide' }).catch(console.error);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement === canvas;
    fsBtn.textContent = isFullscreen ? '⛶' : '⛶';
    fsBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement === canvas) {
      document.exitFullscreen();
    }
  });
</script>
```

> **Note:** `requestFullscreen()` must be called from a user gesture (click, keydown). It will reject if called from a timer or async callback.
