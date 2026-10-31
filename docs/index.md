<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield/dist/chessfield.css" />

<style>
    .chessfield-home {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }
    .chessfield-home .flex {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
    }
    .chessfield-home .chessfield {
        width: 100%;
        max-width: 740px;
        height: 740px;
        margin: 0 auto;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }
    .chessfield-home h1, .chessfield-home h2, .chessfield-home h3 {
        color: #1a1a2e;
    }
    .chessfield-home code {
        background: #f4f4f4;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    .chessfield-home pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
    }
    .chessfield-home pre code,
    .chessfield-home .md-typeset pre code {
        background: transparent;
        padding: 0;
        color: #d4d4d4;
    }
    .chessfield-home .md-typeset pre,
    .chessfield-home .md-typeset pre > code {
        color: #d4d4d4;
    }
    .chessfield-home .demo-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-bottom: 12px;
    }
    .chessfield-home .demo-controls button {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #f5f5f5;
        cursor: pointer;
    }
    .chessfield-home .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin: 24px 0;
    }
    .chessfield-home .feature-card {
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
    }
    .chessfield-home .feature-card h3 {
        margin-top: 0;
    }
    .chessfield-home .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 8px;
    }
    .chessfield-home .badge-npm { background: #e3f2fd; color: #1565c0; }
    .chessfield-home .badge-cdn { background: #f3e5f5; color: #7b1fa2; }
    .chessfield-home .badge-browser { background: #e8f5e9; color: #2e7d32; }
    .chessfield-home .toc {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        margin: 24px 0;
    }
    .chessfield-home .toc ul {
        margin: 0;
        padding-left: 20px;
    }
    .chessfield-home .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }
    .chessfield-home .tab {
        padding: 8px 16px;
        border: 1px solid #ddd;
        background: #f5f5f5;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        font-weight: 500;
    }
    .chessfield-home .tab.active {
        background: white;
        border-bottom-color: white;
        margin-bottom: -1px;
    }
    .chessfield-home .tab-panel {
        display: none;
    }
    .chessfield-home .tab-panel.active {
        display: block;
    }
</style>

<div class="chessfield-home">

<h1>Chessfield: Interactive 3D Chessboards</h1>

<p>Chessfield is a lightweight TypeScript library for rendering interactive 3D chessboards in the browser. Built with <a href="https://threejs.org/" target="_blank">Three.js</a> (WebGPU), it provides smooth 60fps rendering, customizable themes, camera controls, and a clean API for integration into any web project.</p>

<div class="toc">
  <h3>Table of Contents</h3>
  <ul>
    <li><a href="#features">Features</a></li>
    <li><a href="#demo">Live Demo</a></li>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="installation.md">Installation Guide</a></li>
    <li><a href="usage.md">Usage Guide</a></li>
    <li><a href="api-reference.md">API Reference</a></li>
    <li><a href="fullscreen.md">Fullscreen Mode</a></li>
    <li><a href="#links">Links</a></li>
  </ul>
</div>

<h2 id="features">Features</h2>

<div class="feature-grid">
  <div class="feature-card">
    <h3>🎮 WebGPU Rendering</h3>
    <p>Modern WebGPU backend via Three.js for smooth 60fps performance with hardware acceleration.</p>
  </div>
  <div class="feature-card">
    <h3>🎨 Customizable Themes</h3>
    <p>Built-in themes (blue, green, brown, bw, light, dark) plus custom theme support via plugin system.</p>
  </div>
  <div class="feature-card">
    <h3>📷 Camera Controls</h3>
    <p>5 camera positions (white, right, black, left, top) with orbit controls for free exploration.</p>
  </div>
  <div class="feature-card">
    <h3>♟️ Full Game State</h3>
    <p>FEN support, last move highlighting, check/mate/draw states, player names, and coordinate display.</p>
  </div>
  <div class="feature-card">
    <h3>⏳ Loading State</h3>
    <p>Built-in loading overlay with progress events and a whenReady() promise.</p>
  </div>
  <div class="feature-card">
    <h3>🔧 Programmatic Control</h3>
    <p>Rich API for theme switching, camera changes, shape overlays (rings and arrows), and dynamic configuration.</p>
  </div>
  <div class="feature-card">
    <h3>📦 Zero Dependencies</h3>
    <p>Only peer dependencies on Three.js and chessground types. No runtime framework lock-in.</p>
  </div>
</div>

<h2 id="demo">Live Demo</h2>
<p>Drag to orbit, scroll to zoom, right-click squares to add rings, or right-drag between squares to draw arrows:</p>
<div class="demo-controls">
  <button id="switch-theme-btn">Switch Theme</button>
  <button id="switch-camera-btn">Camera: white</button>
  <button id="switch-mode-btn">Mode: light</button>
  <button id="switch-projection-btn">Projection: perspective</button>
</div>
<div class="flex">
    <div class="chessfield" id="board1"></div>
</div>

<h2 id="quick-start">Quick Start</h2>

<div class="tabs" id="quickstart-tabs">
  <button class="tab active" data-tab="cdn">CDN (No Build)</button>
  <button class="tab" data-tab="npm">npm (ES Modules)</button>
  <button class="tab" data-tab="framework">Frameworks</button>
</div>

<div class="tab-panel active" id="panel-cdn">
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield@2.5.5/dist/chessfield.css"&gt;
  &lt;script type="importmap"&gt;
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
      "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
      "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.tsl.js",
      "three/": "https://cdn.jsdelivr.net/npm/three@0.186.1/"
    }
  }
  &lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;div id="board" style="width: 600px; height: 600px;"&gt;&lt;/div&gt;
  &lt;script type="module"&gt;
    import { Chessfield } from 'https://cdn.jsdelivr.net/npm/chessfield@2.5.5/dist/chessfield.js';
    const chessfield = new Chessfield(document.getElementById('board'), {
      camera: 'white',
      angle: 'right',
      theme: 'green'
    });
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>
</div>

<div class="tab-panel" id="panel-npm">
<pre><code>npm install chessfield @lichess-org/chessground three
</code></pre>
<pre><code>import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

const chessfield = new Chessfield(document.getElementById('board')!, {
camera: 'white',
angle: 'right',
theme: 'green',
fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
lastMove: ['e2', 'e4'],
playerNames: { white: 'Magnus', black: 'Hikaru' }
});
</code></pre>
</div>

<div class="tab-panel" id="panel-framework">
<pre><code>// React
import { useEffect, useRef } from 'react';
import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

export function Chessboard({ fen, theme }) {
const ref = useRef&lt;HTMLDivElement&gt;(null);
const fieldRef = useRef&lt;Chessfield&gt;(null);

useEffect(() =&gt; {
if (!ref.current) return;
fieldRef.current = new Chessfield(ref.current, { fen, theme });
}, [fen, theme]);

return &lt;div ref={ref} style={{ width: 600, height: 600 }} /&gt;;
}
</code></pre>
<pre><code>// Vue 3
import { onMounted, ref } from 'vue';
import { Chessfield } from 'chessfield';
import 'chessfield/style.css';

const boardRef = ref&lt;HTMLDivElement&gt;();
let chessfield: Chessfield;

onMounted(() =&gt; {
  chessfield = new Chessfield(boardRef.value!, { theme: 'blue' });
});

// Template: &lt;div ref="boardRef" style="width: 600px; height: 600px" /&gt;
</code></pre>
<pre><code>// Angular
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Chessfield } from 'chessfield';

@Component({
  template: '&lt;div #board style="width: 600px; height: 600px"&gt;&lt;/div&gt;'
})
export class ChessboardComponent implements OnInit {
  @ViewChild('board') boardRef!: ElementRef&lt;HTMLDivElement&gt;;
  chessfield!: Chessfield;

  ngOnInit() {
    this.chessfield = new Chessfield(this.boardRef.nativeElement, { theme: 'brown' });
  }
}
</code></pre>
</div>

<h2 id="links">Links</h2>
<ul>
    <li><strong>npm Package</strong>: <a href="https://www.npmjs.com/package/chessfield" target="_blank">chessfield on npm</a></li>
    <li><strong>GitHub Repository</strong>: <a href="https://github.com/unicolored/chessfield" target="_blank">unicolored/chessfield</a></li>
    <li><strong>Issues & Contributions</strong>: <a href="https://github.com/unicolored/chessfield" target="_blank">GitHub Issues</a></li>
</ul>

</div>

<script>
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
</script>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
    "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.tsl.js",
    "three/": "https://cdn.jsdelivr.net/npm/three@0.186.1/"
  }
}
</script>
<script type="module">
  // Live demo
  import { Chessfield } from 'https://cdn.jsdelivr.net/npm/chessfield@2.5.5/dist/chessfield.js';
  const boardEl = document.getElementById('board1');
  const board = new Chessfield(boardEl, {
    orientation: 'white',
    camera: 'white',
    angle: 'right',
    theme: 'green',
    playerNames: { white: 'GM White', black: 'IM Black' },
  });

  const bind = (id, action, label) => {
    const btn = document.getElementById(id);
    const sync = () => { btn.textContent = label(); };
    sync();
    btn.addEventListener('click', () => { action(); sync(); });
  };

  bind('switch-theme-btn', () => board.switchTheme(), () => 'Switch Theme');
  bind('switch-camera-btn', () => board.switchCamera(), () => `Camera: ${board.getCurrentCamera()}`);
  bind('switch-mode-btn', () => board.switchMode(), () => `Mode: ${board.getCurrentMode()}`);
  bind('switch-projection-btn', () => board.switchProjection(), () => `Projection: ${board.getCurrentProjection()}`);

  board.addRing(6, 2, 'ring');
  board.addRing(7, 2, 'ring');
  board.addRing(6, 3, 'ringAlt');
  board.addRing(7, 3, 'ringAlt');
  board.addRing(6, 4, 'ringCtrl');
  board.addRing(7, 4, 'ringCtrl');
  board.addRing(6, 5, 'ringCtrlAlt');
  board.addRing(7, 5, 'ringCtrlAlt');

  board.setFen('rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR b KQkq - 0 1', ['e2', 'e3']);
</script>
