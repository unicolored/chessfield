# Installation

## Peer Dependencies

Chessfield requires Three.js and chessground types as peer dependencies:

```bash
npm install chessfield @lichess-org/chessground three
```

Or with pnpm/yarn:

```bash
pnpm add chessfield @lichess-org/chessground three
# or
yarn add chessfield @lichess-org/chessground three
```

## CSS Import

Import the default styles for proper rendering:

```typescript
import 'chessfield/style.css';
// or
import 'chessfield/dist/chessfield.css';
```

```html
<!-- Or via HTML -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield/dist/chessfield.css" />
```

## CDN Usage

No build step required — use directly in the browser:

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield@2.2.1/dist/chessfield.css" />

<!-- UMD Bundle (global `Chessfield` variable) -->
<script src="https://cdn.jsdelivr.net/npm/chessfield@2.2.1/dist/chessfield.umd.js"></script>

<!-- ES Module -->
<script type="module">
  import { Chessfield } from 'https://cdn.jsdelivr.net/npm/chessfield@2.2.1/dist/chessfield.js';
  const field = new Chessfield(document.getElementById('board'), { theme: 'green' });
</script>
```

**Available CDN files:**

| File                | Purpose                                |
| ------------------- | -------------------------------------- |
| `chessfield.umd.js` | UMD bundle for `<script>` tag          |
| `chessfield.js`     | ES Module for `<script type="module">` |
| `chessfield.css`    | Required styles                        |
| `chessfield.d.ts`   | TypeScript definitions                 |

## Framework Integration

### React

```tsx
import { useEffect, useRef } from 'react';
import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

interface ChessboardProps {
  fen?: string;
  theme?: string;
  camera?: 'white' | 'right' | 'black' | 'left' | 'top';
  playerNames?: { white: string; black: string };
}

export function Chessboard({ fen, theme = 'green', camera = 'white', playerNames }: ChessboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<Chessfield>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    fieldRef.current = new Chessfield(containerRef.current, {
      fen,
      theme,
      camera,
      playerNames,
    });

    return () => {
      fieldRef.current?.dispose?.();
      fieldRef.current = null;
    };
  }, [fen, theme, camera, playerNames]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px', maxWidth: '600px' }} />;
}
```

### Vue 3

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

interface Props {
  fen?: string;
  theme?: string;
  camera?: 'white' | 'right' | 'black' | 'left' | 'top';
  playerNames?: { white: string; black: string };
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'green',
  camera: 'white',
});

const boardRef = ref<HTMLDivElement>();
let chessfield: Chessfield | null = null;

onMounted(() => {
  chessfield = new Chessfield(boardRef.value!, {
    fen: props.fen,
    theme: props.theme,
    camera: props.camera,
    playerNames: props.playerNames,
  });
});

watch([() => props.fen, () => props.theme, () => props.camera], ([fen, theme, camera]) => {
  if (chessfield) {
    if (fen) chessfield.setFen(fen);
    if (theme) chessfield.switchTheme(theme);
    if (camera) chessfield.switchCamera(camera);
  }
});

onUnmounted(() => {
  chessfield?.dispose?.();
});
</script>

<template>
  <div ref="boardRef" style="width: 100%; height: 600px; max-width: 600px" />
</template>
```

### Angular

```typescript
// chessboard.component.ts
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input } from '@angular/core';
import { Chessfield } from 'chessfield';

@Component({
  selector: 'app-chessboard',
  template: '<div #board style="width: 100%; height: 600px; max-width: 600px"></div>',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: 600px;
      }
    `,
  ],
})
export class ChessboardComponent implements OnInit, OnDestroy {
  @ViewChild('board') boardRef!: ElementRef<HTMLDivElement>;

  @Input() fen?: string;
  @Input() theme = 'green';
  @Input() camera: 'white' | 'right' | 'black' | 'left' | 'top' = 'white';
  @Input() playerNames?: { white: string; black: string };

  private chessfield!: Chessfield;

  ngOnInit() {
    this.chessfield = new Chessfield(this.boardRef.nativeElement, {
      fen: this.fen,
      theme: this.theme,
      camera: this.camera,
      playerNames: this.playerNames,
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.chessfield) return;
    if (changes['fen']) this.chessfield.setFen(changes['fen'].currentValue);
    if (changes['theme']) this.chessfield.switchTheme(changes['theme'].currentValue);
    if (changes['camera']) this.chessfield.switchCamera(changes['camera'].currentValue);
    if (changes['playerNames'] && changes['playerNames'].currentValue) {
      this.chessfield.configUpdate({ playerNames: changes['playerNames'].currentValue });
    }
  }

  ngOnDestroy() {
    this.chessfield?.dispose?.();
  }
}
```

```typescript
// app.module.ts (or standalone component imports)
import { NgModule } from '@angular/core';
import { ChessboardComponent } from './chessboard.component';

@NgModule({
  declarations: [ChessboardComponent],
  exports: [ChessboardComponent],
})
export class ChessboardModule {}
```

### Svelte

```svelte
<!-- Chessboard.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chessfield } from 'chessfield';
  import 'chessfield/style.css';

  export let fen: string;
  export let theme = 'green';
  export let camera: 'white' | 'right' | 'black' | 'left' | 'top' = 'white';
  export let playerNames: { white: string; black: string };

  let boardRef: HTMLDivElement;
  let chessfield: Chessfield;

  onMount(() => {
    chessfield = new Chessfield(boardRef, { fen, theme, camera, playerNames });
  });

  $: if (chessfield) {
    if (fen) chessfield.setFen(fen);
    if (theme) chessfield.switchTheme(theme);
    if (camera) chessfield.switchCamera(camera);
  }

  onDestroy(() => chessfield?.dispose?.());
</script>

<div bind:this={boardRef} style="width: 100%; height: 600px; max-width: 600px" />
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Version Pinning

For production, pin to a specific version:

```bash
npm install chessfield@2.2.1 @lichess-org/chessground@10.4.0 three@0.186.1
```

CDN with version:

```html
<script src="https://cdn.jsdelivr.net/npm/chessfield@2.2.1/dist/chessfield.umd.js"></script>
```
