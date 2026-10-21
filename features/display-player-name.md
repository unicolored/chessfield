# Feature: Display Player Names on Chessboard

## Overview
Display player names on opposite sides of the 3D chessboard (one per side), with support for two rendering backends that can be switched at runtime.

---

## User Stories

### US-1: Show Player Names
**As a** chess application user  
**I want** to see player names displayed on each side of the board  
**So that** I can identify who is playing white and black

**Acceptance Criteria:**
- White player name appears on the south side (bottom) of the board
- Black player name appears on the north side (top) of the board
- Names are readable from the default camera angle
- Names update when configuration changes

### US-2: Switch Text Rendering Backend
**As a** developer  
**I want** to choose between canvas-sprite and troika-three-text rendering  
**So that** I can optimize for performance vs visual quality per deployment

**Acceptance Criteria:**
- Default backend is `canvas-sprite` (zero dependencies)
- Can switch to `troika-text` via config or runtime API
- Switching re-renders existing text with new backend
- No memory leaks when switching

### US-3: Configure Appearance
**As a** developer  
**I want** to customize font, size, color, and position  
**So that** names match the application theme

**Acceptance Criteria:**
- Configurable via `ChessfieldConfig.text` object
- Supports font family, size (world units), color, offset from board
- Respects theme colors when not explicitly overridden

---

## Configuration API

```typescript
interface ChessfieldConfig {
  // ... existing fields

  /** Player names to display */
  playerNames?: {
    white?: string;  // Default: "White"
    black?: string;  // Default: "Black"
  };

  /** Text rendering configuration */
  text?: {
    /** Rendering backend: 'canvas-sprite' | 'troika-text' */
    backend?: TextBackendType;

    /** Font size in world units (centimeters) */
    fontSize?: number;  // Default: cm(0.4)

    /** CSS font family */
    fontFamily?: string;  // Default: 'system-ui, sans-serif'

    /** Font weight */
    fontWeight?: string | number;  // Default: '400'

    /** Text color (CSS color or hex) */
    color?: string | number;  // Default: theme foreground

    /** Distance from board edge along Z axis */
    offset?: number;  // Default: cm(5.5)

    /** Maximum width for text wrapping (troika only) */
    maxWidth?: number;

    /** Outline width (troika only) */
    outlineWidth?: number;

    /** Outline color (troika only) */
    outlineColor?: string | number;
  };
}
```

### Default Configuration
```typescript
const defaults = {
  playerNames: {
    white: 'White',
    black: 'Black',
  },
  text: {
    backend: 'canvas-sprite',
    fontSize: cm(0.4),
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '400',
    color: '#ffffff',
    offset: cm(5.5),
  },
};
```

---

## Runtime API

```typescript
class Chessfield implements ChessfieldApi {
  // ... existing methods

  /** Access to text service for advanced control */
  readonly textService: TextService;
}

class TextService {
  /** Current backend type */
  readonly backendType: TextBackendType;

  /** Switch backend at runtime */
  setBackend(type: TextBackendType): void;

  /** Add custom text at any position */
  add(options: TextOptions): TextInstance;

  /** Remove text by ID */
  remove(id: string): void;

  /** Remove all text */
  removeAll(): void;

  /** Update existing text */
  update(id: string, options: Partial<TextOptions>): void;

  /** Get text instance by ID */
  get(id: string): TextInstance | undefined;

  /** Get all instances */
  getAll(): TextInstance[];

  /** Cleanup */
  dispose(): void;
}
```

---

## Backend Specification

### Common Interface

```typescript
type TextBackendType = 'canvas-sprite' | 'troika-text';

interface TextOptions {
  text: string;
  position: THREE.Vector3;
  fontSize?: number;
  color?: string | number;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'center' | 'bottom';
  rotation?: THREE.Euler;
  maxWidth?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  outlineWidth?: number;
  outlineColor?: string | number;
}

interface TextInstance {
  id: string;
  object: THREE.Object3D;
  backend: TextBackendType;
  options: TextOptions;
  dispose(): void;
  update(options: Partial<TextOptions>): void;
}

interface TextBackend {
  readonly type: TextBackendType;
  create(options: TextOptions): TextInstance;
  dispose(): void;
}
```

---

### Backend 1: Canvas Sprite (`canvas-sprite`)

**Implementation:** `src/service/text/canvas-sprite.backend.ts`

**Approach:** Render text to offscreen `<canvas>` → `THREE.CanvasTexture` → `THREE.Sprite`

**Characteristics:**
| Aspect | Detail |
|--------|--------|
| Dependencies | None (native Canvas API) |
| Bundle impact | ~0 KB |
| Rendering | CPU (canvas 2D context) |
| Sharpness | Good at 1x, pixelates at high zoom |
| Text layout | Manual (measureText, fillText) |
| Wrapping | Not supported |
| RTL/BiDi | Not supported |
| Emoji | Limited (system font dependent) |
| Outlines/Shadows | Manual implementation |

**Positioning:**
- Uses `THREE.Sprite` — always faces camera (billboard)
- Scale computed from canvas dimensions × world unit ratio
- Position = world coordinates from config

**Lifecycle:**
```typescript
create(options): TextInstance {
  const canvas = renderToCanvas(options);      // Draw text
  const texture = new CanvasTexture(canvas);   // GPU upload
  const material = new SpriteMaterial({ map: texture, transparent: true });
  const sprite = new Sprite(material);
  sprite.position.copy(options.position);
  sprite.scale.set(width, height, 1);

  return { id, object: sprite, backend, options, dispose, update };
}
```

**Caching:** Canvas keyed by `(text, fontSize, fontFamily, fontWeight, color)` for reuse.

**Best for:** Simple labels, performance-critical, no extra deps, fixed camera distance.

---

### Backend 2: Troika Text (`troika-text`)

**Implementation:** `src/service/text/troika-text.backend.ts`

**Approach:** Use `troika-three-text` (SDF-based GPU text rendering)

**Dependency:** `troika-three-text` (~15 KB gzipped)

**Characteristics:**
| Aspect | Detail |
|--------|--------|
| Dependencies | `troika-three-text` |
| Bundle impact | +15 KB gz |
| Rendering | GPU (SDF + fragment shader) |
| Sharpness | Perfect at any distance/zoom |
| Text layout | Full (wrapping, alignment, line height) |
| Wrapping | Supported via `maxWidth` |
| RTL/BiDi | Full support |
| Emoji | Full color emoji support |
| Outlines/Shadows | Built-in (`outlineWidth`, `outlineColor`) |

**Positioning:**
- Uses `TroikaText` (extends `THREE.Object3D`)
- `anchorX`, `anchorY` control alignment relative to position
- Rotation applied directly to object

**Lifecycle:**
```typescript
create(options): TextInstance {
  const text = new TroikaText();
  text.text = options.text;
  text.fontSize = options.fontSize ?? 1;
  text.color = options.color ?? 0xffffff;
  text.anchorX = options.anchorX ?? 'center';
  text.anchorY = options.anchorY ?? 'center';
  text.maxWidth = options.maxWidth;
  text.font = options.fontFamily;
  text.fontWeight = options.fontWeight;
  text.outlineWidth = options.outlineWidth ?? 0;
  text.outlineColor = options.outlineColor ?? 0x000000;
  text.position.copy(options.position);
  if (options.rotation) text.rotation.copy(options.rotation);
  text.sync();  // Required after changes

  return { id, object: text, backend, options, dispose, update };
}
```

**Font Loading:** Uses system fonts by default. Custom fonts require preloading via `FontLoader` (troika handles async).

**Best for:** High-quality text, dynamic zoom, wrapping, outlines, emoji, accessibility.

---

## Integration Points

### 1. BoardService Extension
```typescript
// src/service/board.service.ts
class BoardService {
  // ... existing

  /** Add player name labels to scene via TextService */
  addPlayerNames(
    scene: THREE.Scene,
    textService: TextService,
    names: { white: string; black: string },
    textConfig: TextConfig
  ): void;
}
```

**Placement:**
- White (south): `position.set(0, cm(0.5), +offset)`, rotation `Math.PI` on Y
- Black (north): `position.set(0, cm(0.5), -offset)`, rotation `0` on Y
- Y offset `cm(0.5)` lifts slightly above board surface

### 2. Chessfield Integration
```typescript
// src/chessfield.ts
class Chessfield implements ChessfieldApi {
  private textService: TextService;

  constructor(element, config) {
    // ... existing
    this.textService = new TextService(
      config.text?.backend ?? 'canvas-sprite',
      this.store
    );
  }

  private onLoad(camera, scene, renderer, controls, font) {
    // ... existing
    this.textService.setScene(scene);

    if (config.playerNames) {
      this.boardService.addPlayerNames(
        scene,
        this.textService,
        config.playerNames,
        config.text ?? {}
      );
    }
  }

  configUpdate(partialConfig) {
    // ... existing
    if (partialConfig.text?.backend) {
      this.textService.setBackend(partialConfig.text.backend);
    }
    if (partialConfig.playerNames) {
      this.textService.removeAll();
      this.boardService.addPlayerNames(
        this.store.scene!,
        this.textService,
        partialConfig.playerNames,
        { ...this.store.getConfig().text, ...partialConfig.text }
      );
    }
  }
}
```

---

## File Structure

```
src/
├── service/
│   ├── text/
│   │   ├── types.ts                    # Shared types
│   │   ├── text-backend.ts             # Abstract base
│   │   ├── canvas-sprite.backend.ts    # Canvas 2D → Sprite
│   │   └── troika-text.backend.ts      # troika-three-text
│   └── text.service.ts                 # Facade service
├── resource/
│   └── chessfield.config.ts            # Extended config types
└── chessfield.ts                       # Integration
```

---

## Dependencies

```json
{
  "dependencies": {
    "troika-three-text": "^0.49.0"
  }
}
```
*Only required when using `troika-text` backend. Tree-shaking should exclude if unused.*

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Default config | Names "White"/"Black" appear on correct sides |
| Custom names | `playerNames: { white: 'Alice', black: 'Bob' }` shows custom names |
| Switch backend | `configUpdate({ text: { backend: 'troika-text' } })` re-renders |
| Theme change | Text color updates if not explicitly set |
| Resize | Text maintains position relative to board |
| Dispose | No memory leaks (textures, materials, canvases cleaned) |
| WebGPU renderer | Both backends work with `three/webgpu` |

---

## Non-Functional Requirements

- **Performance:** Canvas backend < 1ms per frame; Troika < 2ms
- **Memory:** No leaks on configUpdate, dispose, or backend switch
- **Accessibility:** Troika backend supports screen readers via DOM overlay (future)
- **Bundle:** Canvas backend adds 0 KB; Troika adds 15 KB gz (optional)

---

## Future Enhancements

- [ ] Animated text (fade in/out, slide)
- [ ] Custom font loading (Google Fonts, local files)
- [ ] Text on pieces (captured pieces, promotion)
- [ ] Spectator names, tournament info
- [ ] Localization (RTL languages via troika)