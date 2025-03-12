<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield@1.2.0/dist/chessfield.css" />

<style>
    body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
    }
    .flex {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0;
    }
    .chessfield {
        width: 100%;
        max-width: 500px; /* Constrain width for better display */
        height: 333px;
        margin: 0 auto;
        border: 1px solid #ddd; /* Optional: subtle border */
    }
</style>

<h1>Chessfield: Interactive 3D Chessboards</h1>
<p>Chessfield is a lightweight TypeScript library that lets you render interactive 3D chessboards in the browser. Built with <a href="https://threejs.org/" target="_blank">Three.js</a>, it’s easy to integrate into any web project, whether you’re using it via CDN, Node.js, or a framework like Angular.</p>

<h2>Demo</h2>
<p>Below is a live demo of Chessfield in action:</p>
<div class="flex">
    <div class="chessfield" id="board1"></div>
</div>

<h2>Features</h2>
<ul>
    <li><strong>3D Rendering</strong>: Uses Three.js for smooth, modern 3D visuals.</li>
    <li><strong>Customizable</strong>: Adjust size, theme, and orientation.</li>
    <li><strong>Lightweight</strong>: Minimal dependencies, optimized for performance.</li>
    <li><strong>Flexible</strong>: Works via CDN, npm, or as a module.</li>
</ul>

<h2>Get Started</h2>
<p>You can add Chessfield to your project in a few ways:</p>

<h3>Via CDN</h3>
<pre><code>&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chessfield@1.0.1/dist/chessfield.css"&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/chessfield@1.0.1/dist/chessfield.umd.js"&gt;&lt;/script&gt;
&lt;script&gt;
    const container = document.getElementById('board');
    const chessfield = new Chessfield(container, { orientation: 'white' });
&lt;/script&gt;</code></pre>

<h3>Via npm</h3>
<pre><code>npm install chessfield</code></pre>
<pre><code>import { Chessfield } from 'chessfield';
const chessfield = new Chessfield(document.getElementById('board'), { orientation: 'white' });</code></pre>

<h2>Links</h2>
<ul>
    <li><strong>npm Package</strong>: <a href="https://www.npmjs.com/package/chessfield" target="_blank">chessfield on npm</a></li>
    <li><strong>GitHub Repository</strong>: <a href="https://github.com/unicolored/chessfield" target="_blank">unicolored/chessfield</a></li>
    <li><strong>Issues & Contributions</strong>: Feel free to report bugs or contribute on <a href="https://github.com/unicolored/chessfield" target="_blank">GitHub</a>!</li>
</ul>

<!--<gilles.nx-root></gilles.nx-root>-->
<script type="module">
    import { Chessfield } from 'https://cdn.jsdelivr.net/npm/chessfield@1.2.0/dist/chessfield.js';
    const boardContainer = document.getElementById('board1');
    var board1 = new Chessfield(boardContainer, {
        orientation: 'white',
    });
</script>
