# Chessfield

  <a href="https://www.npmjs.com/chessfield">
    <img src="https://img.shields.io/npm/v/chessfield
" />
  </a>

> **This project is made possible** thanks to the work going into https://github.com/lichess-org/chessground.

![Chessfield views](https://raw.githubusercontent.com/unicolored/chessfield/main/screenshot/views.jpg)

_Chessfield_ is a free/libre open source chess 3D board.

## License

Chessfield is distributed under the **GPL-3.0 license** (or any later version,
at your option).
When you use Chessfield for your website, your combined work may be
distributed only under the GPL. **You must release your source code** to the
users of your website.

Please read more about GPL for JavaScript on [greendrake.info](https://greendrake.info/publications/js-gpl).

## Demos

- 🍿 [ChessPop.Live](https://github.com/unicolored/chesspop.live)

## Features

Chessfield is designed to be a 3d chess viewer.

- Common configuration options with [Chessground](https://github.com/lichess-org/chessground)
- Royalty free wooden chess set by 3D Artist: [Ali Qolami](https://www.blenderkit.com/asset-gallery?query=order:-score+author_id:1118431)
- Well typed with TypeScript
- WebGL powered by Three.js
- Zoom and rotate around the board to see games in a any angle
- Display FEN and highlight squares of the last move

## Installation

```sh
npm install --save chessfield
```

### Usage

```js
import { Chessfield } from 'chessfield';

const config = {};
const field = Chessfield(document.body, config);
```

## Documentation

- [Config types](https://github.com/unicolored/chessfield/tree/main/src/resource/chessfield.config.ts)
- [Default config values](https://github.com/unicolored/chessfield/tree/main/src/resource/chessfield.state.ts)
- [API type signatures](https://github.com/unicolored/chessfield/tree/main/src/resource/chessfield.api.ts)
- [Simple standalone example](https://github.com/unicolored/chessfield/tree/main/demo.html)
- [Read more](https://unicolo.red/chessfield/)

## Development

Install build dependencies:

```sh
pnpm install
```

To build the node module:

```sh
pnpm run dev
```

To build the standalone:

```sh
pnpm run dist
```

