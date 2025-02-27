# Chessfield

![Chessfield views](/screenshot/views.jpg)

_Chessfield_ is a free/libre open source chess UI..
It targets modern browsers, as well as mobile development using Cordova.

## License

Chessfield is distributed under the **GPL-3.0 license** (or any later version,
at your option).
When you use Chessfield for your website, your combined work may be
distributed only under the GPL. **You must release your source code** to the
users of your website.

Please read more about GPL for JavaScript on [greendrake.info](https://greendrake.info/publications/js-gpl).

## Demos

- [Chess 3D TV](https://chessfield.gilles.dev/tv)

## Features

Chessfield is designed to be a chess viewer, compatible with Chessground configuration.

- Well typed with TypeScript
- WebGL powered by Three.js

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
