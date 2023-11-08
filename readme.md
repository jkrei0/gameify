# Gameify
Gameify is a 2d javascript games library. Source code is available on github at [jkrei0/gameify](https://github.com/jkrei0/gameify).

Documentation is available at [gameify.vercel.app](https://gameify.vercel.app/out/index.html).

### Use it yourself

The easiest way to get started with gameify is to use the [gameify engine online](https://gameify.vercel.app/engine/engine.html). Read {@tutorial getting_started} to get familiar with the engine.

Or, use the library in your own projects without the engine:
```js
import {gameify} from "https://gameify.vercel.app/gameify/gameify.js";
```

### Run it yourself

To use the visual engine, start a static http server (eg `http-server` from npm) from the project root, and open `/engine/engine.html`.
Accounts functionality and cloud saved will be disabled.

To generate tutorials and documentation from source, run `npm install` to install the JSDoc theme, then run `jsdoc -c jsdoc.json` and open `/out/index.html`.

### Develop

To develop the visual engine with accounts and cloud saves enabled, install the vercel CLI, and run using `vercel dev`.

Make sure to add the follwing to your `.env.local` file:
```py
# Accounts and cloud saves (If left blank, offline will still work but cloud will be broken)
MONGO_NAME="your_mongodb_username"
MONGO_PASSWORD="your_mongodb_username"

# Send email notifications (i.e. account requests. Leave blank for no emails)
# Send and receive addresses can be the same
EMAIL_REC_ADDR="your_email@domain.com"
EMAIL_SEND_ADDR="sender_email@domain.com"
EMAIL_PASSWORD="sender_email_password"
```

The app attempts to connect to a `gameify` database, with the following collections:
- `accounts`
- `sessions`
- `games`

### Wishlist

Read [wishlist.md](wishlist.md) for a list of things I'd like to add at some point.