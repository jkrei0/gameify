# Gameify
Gameify is a 2d javascript games library. Source code is available on github at [jkrei0/gameify](https://github.com/jkrei0/gameify).

Documentation is available at [gameify.vercel.app](https://gameify.vercel.app/out/index.html).

## Use it yourself

The easiest way to get started with gameify is to use the [gameify engine online](https://gameify.vercel.app/engine/engine.html). Read [the getting started guide](https://gameify.vercel.app/out/tutorial-getting_started.html) to get familiar with the engine.

Or, use the library in your own projects without the engine:
```js
import {gameify} from "https://gameify.vercel.app/gameify/gameify.js";
```

## Run it yourself

To use the visual engine, start a static http server (eg `http-server` from npm) from the project root, and open `/engine/engine.html`.
Accounts functionality and cloud saved will be disabled.

To generate tutorials and documentation from source, run `npm install` to install the JSDoc theme, then run `jsdoc -c jsdoc.json` and open `/out/index.html`.

## Develop

### Develop the library
Gameify (the library)'s source code is in `/gameify/`. See above for generating docs.

### Write tutorials
 Add a file to the `tutorials` folder, and register it in `tutorials.json`.

### Develop the visual engine
Visual engine source is available in `/engine/`. Read [the readme](https://github.com/jkrei0/gameify/blob/main/engine/README.md) in that folder for information on developing it.

### Wishlist

Read [wishlist.md](https://github.com/jkrei0/gameify/blob/main/wishlist.md) for a list of things I'd like to add at some point.