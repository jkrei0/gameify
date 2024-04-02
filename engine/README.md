# Gameify Engine
This is a browser-based game engine built on top of the Gameify game library.

## Development

Most of the visual engine works when run in a simple http server (e.g the `http-server` npm package).
To run gameify without any integrations or cloud functionality:
```sh
npm install
npm run vars local
http-server . --port=3000
# in a separate terminal
http-server ./engine/embed --port=3001
```

To develop the visual engine with accounts and cloud saves enabled:
- Install the Vercel CLI
- Run `npm install`
- Run `npm run serve` to set variables, generate docs, and start http-server and the vercel CLI
- Open `http://localhost:3000/engine/engine.html` in your browser to check everything works

**CARFEUL: Vercel messes with your files while it's running! Stop the local server before doing git
operations (merge, checkout, etc...) other than commits or you might lose work!**

Vercel functions are located in `/api/`, and utility/helper/etc files are located in `/api-util/`

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

The app attempts to connect to a `gameify` database in mongodb, with the following collections:
- `accounts`
- `sessions`
- `games`
- `github-integrations`

## File structure
- `/engine/` - Main engine files
- `/engine/project` - Game and project files, i.e. templates and injected scripts (`_out.js`)
- `/engine/account` - Account and management pages (except for the main `auth.html` account page), 
- `/engine/lib` - External libraries
- `/engine/images` - Images, svgs, and related assets
- `/engine/embed` - For the `play.html` page, read the 'embedding games' section below.

## The gameify API

The api is available at `https://gameify.vercel.app/api/`. Please reference existing fetch code and use the same style. Do not include the domain when calling the API, so that changes are not required when developing locally.

See [API.md](API.md) for api routes and docs

## Other notes

- Github integration is very flimsy/unreliable. I think I broke it more while refactoring. But it really needs an overhaul, so I haven't bothered to fix it for now.
- Styles are written in SCSS, in `engine.scss`. These should be compiled to `engine.css`, and both files should be committed.
- The engine core is in `engine.js`, and some components have been extracted to their own files (e.g. `engine_events.js`). Please try to keep new code as modular as possible, preferrably in a new file or a relevant existing file.
- REFACTORING: I'm trying to move stuff out of engine.js, into other files.
  - `engineEvents.emit/listen` can be used to call some functions. It was mostly made to ease refactoring for me, and functions that can be `export`ed should be.
  - `engineState` contains information about the currently open project.
  - Other functionality and utilities are mostly split into their own files.

## Embedding games

To prevent games from accessing user data and tokens, they are embedded on a separate domain. Everything in `/engine/embed/` is hosted on vercel at `gameify-embed.vercel.app` (but can be run locally with a simple http server, or `npm run serve` - see the instructions for running with the vercel CLI at the top of this file for more info).

## Custom properties

Game objects and HTML elements have custom, engine-only properties in the form of `object.__engine_property`.
When setting custom properties for anything, please follow this convention, and update this document.

The current properties are:

**For Gameify Objects (`object.__engine_property`)**
- `__engine_name`: The type and name of the object, which should be unique. A string formatted like `Type::Name`, eg `Tilemap::Level One`.
- `__engine_visible`: If the object should be shown in the visual editor (eg, which tilemaps are shown while editing another map). This is not universally obyed, but really should be. Feel free to fix places that don't respect it if/when you find them.
- `__engine_options_open`: Set to true when the object's details pane in the sidebar is open. This is set so the sidebar does not jump around when it is refreshed. This is not a way to open or close the details pane, and generally should be used as read-only.
- `__engine_locked`: When set to true, resricts modification of the object, including that it cannot be deleted or renamed. Not actually used anywhere, but the existing functionality has been kept in.
- `__engine_editing`: Set to true when the object is being edited using the visual editor
- `__engine_folder`: The folder the object is in
- `__engine_data`: When serialized, contains information such as folder, visible, etc. that don't actually modify the object
- `__engine_index`: The order objects should be drawn in in the visual editor (lower index = draw first)


**For HTML Elements (`element.__engine_property`)**
- `__engine_menu`: An object containing custom context menu items. `{'Context Item': () => {/* Callback */}, ... }`. If an HTML element with this property set is right-clicked, a custom context menu with the specified options is opened.