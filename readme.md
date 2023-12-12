# Gameify
Gameify is a 2d javascript games library. Source code is available on github at [jkrei0/gameify](https://github.com/jkrei0/gameify).

Documentation is available at [gameify.vercel.app](https://gameify.vercel.app/out/index.html).

## Use it yourself

The easiest way to get started with gameify is to use the [gameify engine online](https://gameify.vercel.app/engine/engine.html). Read {@tutorial getting_started} to get familiar with the engine.

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
Visual engine source is available in `/engine/`.

To develop the visual engine with accounts and cloud saves enabled, install the vercel CLI, and run using `vercel dev`. Vercel functions are located in `/api/`, and utility/helper/etc files are located in `/api-util/`

Make sure to add the follwing to your `.env.local` file:
```py
# Accounts and cloud saves (If left blank, offline will still work but cloud will appear to be broken)
MONGO_NAME="your_mongodb_username"
MONGO_PASSWORD="your_mongodb_username"

# Send email notifications (i.e. account requests. If left blank, account requests will appear to be broken)
# Send and receive addresses can be the same
EMAIL_REC_ADDR="your_email@domain.com"
EMAIL_SEND_ADDR="sender_email@domain.com"
EMAIL_PASSWORD="sender_email_password"

# Github integration.(If left blank, offline will still work but github integration will appear to be broken)
GITHUB_CLIENT_ID="your_ap_id"
GITHUB_CLIENT_SECRET="your_app_secret"
```

The app attempts to connect to a `gameify` database, with the following collections:
- `accounts`
- `sessions`
- `games`

### Wishlist

Read [wishlist.md](wishlist.md) for a list of things I'd like to add at some point.