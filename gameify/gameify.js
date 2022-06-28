import { shapes } from "./collision.js"
import { vectors } from "./vector.js"
"use strict"

console.log("Welcome to Gameify");

window.onerror = (message, source, lineno, colno, error) => {
    // explain the error. Todo later.
}

/** This is the main gameify object. All other things are contained within it. 
 * @global
 */
export let gameify = {
    /** Returns the documentation link to a given concept
     * @package
     * @arg {String} concept - The name of a gameify class or concept, eg "Screen"
     */
    getDocs: function (concept, permalink) {
        let docsPath = "localhost:8080/out/";
        switch (concept) {
            default:
                return `${docsPath + concept}.html#${permalink ? permalink : ""}`;
        }
    },

    Vector2d: vectors.Vector2d,
    vectors: vectors.vectors,

    /** Manages keyboard events. One is created automatically for every screen, you can access it as shown in the example.
     * @constructor
     * @example // make a new screen and scene
     * let myScreen = new gameify.Screen(document.querySelector("#my-canvas"), 600, 400);
     * let myScene = new gameify.Scene(myScreen);
     * myScene.onUpdate(() => {
     *     if (myScreen.keyboard.keyIsPressed("Escape")) {
     *         myScreen.setScene(pause_menu);
     *     }
     * });
     * @arg {HTMLElement} scope - What parts of the screen the KeyboardEventManager looks for.
    */
    KeyboardEventManager: function (captureScope) {
        /** The element that input events are captured from
         * @private
         */
        this.captureScope = captureScope;

        // A list of the keys that are currently pressed
        this.pressedKeys = [];
        // A list of keys that were just pressed. Cleared after a few updates or at the end of an update in which it's queried for.
        this.justPressedKeys = [];

        /** Makes pressed keys nicer, for simpler queries (KeyH --> H) 
         * @package
         * @arg {String} key - The key to make nicer
         * @returns {String} The input key, with extra text stripped away.
        */
        this.makeKeyNicer = (key) => {
            // If it has a direction (Control, Shift, Alt, OS all have left and right variants)
            // and is not the arrow keys, remove the direction.
            if (!key.startsWith("Arrow")) {
                key = key.replace("Left", "")
                         .replace("Right", "");
            }

            // Get rid of prefixes
            return key.replace("Digit", "")
                      .replace("Numpad", "")
                      .replace("Key", "")
                      .replace("Arrow", "")
        }

        /** Called when a key is pressed down
         * @private
         */
        this.onKeyDown = (event) => {
            let key = event.code;
            // If the key is already in the array, don't add it again.
            // This is normal, the OS might fire the keydown event repeatedly for held keys
            if (this.pressedKeys.indexOf(key) >= 0) {
                return;
            }

            // Push both the niceified and unique key, in case someone wants more precise control.
            // This does mean that there could be duplicates of the niceified key (Numpad8 and Digit8 are both 8),
            // but that's fine since the niceified one is always next to the unique one
            this.pressedKeys.push(key);
            this.pressedKeys.push(this.makeKeyNicer(key));
        }

        /** Called when a key is released
         * @private
         */
        this.onKeyUp = (event) => {
            event.preventDefault();
            let key = event.code;
            // Remove the keys from the pressedkeys array
            this.pressedKeys.splice(this.pressedKeys.indexOf(key), 2);

            // Add keys to just pressed list
            this.justPressedKeys.push([0, key, this.makeKeyNicer(key)]);
        }

        /** Check if a key is currently pressed down
         * @arg {String} key - What key do you want to check
         * @returns {Boolean} if the key is pressed down
         * @example // see if the right arrow is pressed
         * if (myGame.keyboard.keyIsPressed("Right")) {
         *     // set the player motion
         *     player.velocity.x = 5;
         * }
        */
        this.keyIsPressed = (key) => {
            return (this.pressedKeys.indexOf(key) >= 0);
        }

        /** Check if a key was just pressed and let up
         * @arg {String} key - What key do you want to check
         * @returns {Boolean} if the key was just pressed
         * @example // See if the player pressed the Escape key.
         * if (myScreen.keyboard.keyWasJustPressed("Escape")) {
         *     myScreen.setScene(mainMenu);
         * }
        */
        this.keyWasJustPressed = (key) => {
            for (const i in this.justPressedKeys) {
                let jpk = this.justPressedKeys[i];
                if (jpk[1] == key || jpk[2] == key) {
                    this.justPressedKeys[i][0] = 99999;
                    return true;
                }
            }
            return false;
        }

        // How long before "just pressed" keys are removed from the justPressedKeys list
        this.clearJpkTimeout = 1;

        /** Sets how long before "just pressed" keys are removed from the just pressed list.
         * By default, keys are removed from the list after one frame.
         * @arg {Number} timeout - How many frames/updates keys should be considered "just pressed"
         */
        this.setJustPressedTimeout = (timeout) => {
            if (timeout < 1) {
                console.warn(`Setting the timeout to 0 or less means keys will NEVER be considered "just pressed", meaning keyWasJustPressed will always return false`);
                return;
            }
            this.clearJpkTimeout = timeout;
        }

        /** Removes stale keys from the just pressed list.
         * @private
         */
        this.clearJustPressed = () => {
            for (const i in this.justPressedKeys) {
                if (this.justPressedKeys[i][0] >= this.clearJpkTimeout) {
                    this.justPressedKeys.splice(i, 1);
                } else {
                    this.justPressedKeys[i][0] += 1;
                }
            }
        }

        /** Sets up the event manager.
         * @package
        */
        this.setup = () => {
            this.captureScope.setAttribute("tabindex", 1);
            this.captureScope.addEventListener("keydown", this.onKeyDown);
            this.captureScope.addEventListener("keyup", this.onKeyUp);
        }
        /** Destructs the event manager (clears events) 
         * @package
        */
        this.destruct = () => {
            this.captureScope.removeEventListener("keydown", this.onkeyDown);
            this.captureScope.removeEventListener("keyup", this.onKeyUp);
        }
        /** Changes the scope that the KeyboardInputManager looks at
         * @arg {HTMLElement} scope - What parts of the screen the KeyboardEventManager looks for.
        */
        this.setCaptureScope = (scope) => {
            this.destruct();
            this.captureScope = scope;
            this.setup();
        }
    },

    /** Manages mouse events. One is created automatically for every screen, you can access it as shown in the example.
     * @constructor
     * @example // make a new screen and scene
     * let myScreen = new gameify.Screen(document.querySelector("#my-canvas"), 600, 400);
     * let myScene = new gameify.Scene(myScreen);
     * myScene.onUpdate(() => {
     *     if (myScreen.mouse.buttonIsPressed()) {
     *         myScreen.setScene(pause_menu);
     *     }
     * });
     * @arg {HTMLElement} scope - What parts of the screen the MouseEventManager looks at.
     */
    MouseEventManager: function (captureScope) {
        /** The element that input events are captured from
         * @private
         */
        this.captureScope = captureScope;

        // A list of the keys that are currently pressed
        this.pressedButtons = [];
        // A list of keys that were just pressed. Cleared after a few updates or at the end of an update in which it's queried for.
        this.eventsJustHappened = [];
        // Current mouse position
        this.cursorPosition = {x: 0, y: 0};

        /** Returns the name of the button given the number. <br> 0 = left, 1 = middle (wheel), 2 = right
         * @param {Number} button - The numerical button to get the name of
         * @private
         */
        this.getButtonName = (button) => {
            switch (button) {
                case 0: return "left";
                case 1: return "middle";
                case 2: return "right";
                default: console.error("Invalid mouse button");
            }
        }

        /** Get the x and y position of the mouse cursor
         * @example 
         * if (myScreen.mouse.getPosition().x < 50) {
         *     // do something
         * }
         * @returns {Object} {x, y}
        */
        this.getPosition = () => {
            // copy values, because we don't want to return a reference.
            return {x: this.cursorPosition.x, y: this.cursorPosition.y};
        }

        /** Called when a mouse button is pressed down
         * @private
         */
        this.onMouseDown = (event) => {
            this.pressedButtons.push(event.button);
            this.pressedButtons.push(this.getButtonName(event.button));
        }

        /** Called when a key is released
         * @private
         */
        this.onMouseUp = (event) => {
            event.preventDefault();
            let button = event.button;
            // Remove the keys from the pressedkeys array
            this.pressedButtons.splice(this.pressedButtons.indexOf(button), 2);

            // Add keys to just pressed list
            this.eventsJustHappened.push([0, button, this.getButtonName(button)]);
        }

        this.onMouseMove = (event) => {
            this.cursorPosition.x = event.offsetX;
            this.cursorPosition.y = event.offsetY;
            this.eventsJustHappened.push([0, "mousemove", "move"]);
        }

        /** Called when the mouse leaves the canvas
         * @private
         */
        this.onMouseOut = (event) => {
            this.pressedButtons = [];
            this.eventsJustHappened.push([0, "mouseout", "leave"]);
        }

        /** Called when the mouse wheel is moved 
         * @private
         */
        this.onMouseWheel = (event) => {
            event.preventDefault();
            if (event.deltaY > 0) {
                this.eventsJustHappened.push([0, "wheeldown", "wheel"]);
            } else {
                this.eventsJustHappened.push([0, "wheelup", "wheel"]);
            }
        }

        /** Check if a button is currently pressed down
         * @arg {String} button - The button you want to check
         * @returns {Boolean} if the button is pressed
         * @example // see if the left button is pressed
         * if (myGame.mouse.buttonIsPressed("left")) {
         *     // do something
         * }
        */
        this.buttonIsPressed = (button) => {
            return (this.pressedButtons.indexOf(button) >= 0);
        }

        /** Check if a mouse event just happened (eg a button press or scroll)
         * @arg {String} event - The event you want to check
         * @returns {Boolean} if the event just happened
         * @example // See if the player clicked.
         * if (myScreen.mouse.eventJustHappened("click")) {
         *     // do something
         * }
        */
        this.eventJustHappened = (event) => {
            for (const i in this.eventsJustHappened) {
                let evt = this.eventsJustHappened[i];
                if (evt[1] == event || evt[2] == event) {
                    this.eventsJustHappened[i][0] = 99999;
                    return true;
                }
            }
            return false;
        }

        // How long before "just pressed" keys are removed from the eventsJustHappened list (in frames)
        this.clearEventTimeout = 1;

        /** Sets how long before "just pressed" keys are removed from the just pressed list.
         * By default, keys are removed from the list after one frame.
         * @arg {Number} timeout - How many frames/updates keys should be considered "just pressed"
         */
        this.setRecentEventTimeout = (timeout) => {
            if (timeout < 1) {
                console.warn(`Setting the timeout to 0 or less means events will NEVER be considered "just happened", meaning eventJustHappened will always return false`);
                return;
            }
            this.clearEventTimeout = timeout;
        }

        /** Removes stale keys from the just pressed list.
         * @private
         */
        this.clearRecentEvents = () => {
            for (const i in this.eventsJustHappened) {
                if (this.eventsJustHappened[i][0] >= this.clearEventTimeout) {
                    this.eventsJustHappened.splice(i, 1);
                } else {
                    this.eventsJustHappened[i][0] += 1;
                }
            }
        }

        /** Sets up the event manager.
         * @package
        */
        this.setup = () => {
            this.captureScope.setAttribute("tabindex", 1);
            this.captureScope.addEventListener("mousedown", this.onMouseDown);
            this.captureScope.addEventListener("mouseup", this.onMouseUp);
            this.captureScope.addEventListener("mouseout", this.onMouseOut);
            this.captureScope.addEventListener("mousemove", this.onMouseMove);
            this.captureScope.addEventListener("wheel", this.onMouseWheel);
        }
        /** Destructs the event manager (clears events) 
         * @package
        */
        this.destruct = () => {
            this.captureScope.removeEventListener("mousedown", this.onMouseDown);
            this.captureScope.removeEventListener("mouseup", this.onMouseUp);
            this.captureScope.removeEventListener("mouseout", this.onMouseOut);
            this.captureScope.removeEventListener("mousemove", this.onMouseMove);
            this.captureScope.removeEventListener("wheel", this.onMouseWheel);
        }
        /** Changes the scope that the KeyboardInputManager looks at
         * @arg {HTMLElement} scope - What parts of the screen the KeyboardEventManager looks for.
        */
        this.setCaptureScope = (scope) => {
            this.destruct();
            this.captureScope = scope;
            this.setup();
        }
    },

    /** Creates a screen to draw things to.
     * @constructor
     * @example // Get the canvas element
     * let canvas = document.querySelector("#my-canvas");
     * // Create a Screen that is 600 by 400
     * let myScreen = new gameify.Screen(canvas, 600, 400);
     * @arg {HTMLElement} element - The canvas to draw the screen to
     * @arg {number} width - The width of the Screen
     * @arg {number} height - The height of the Screen
     */
    Screen: function (element, width, height) {
        // Error if not given the correct parameters
        if (!element) {
            console.error(`You need to specify a canvas element to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
        }
        if (!width || !height) {
            console.error(`You need to specify a width and height to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
        }

        /** The HTML5 Canvas element the Screen is attached to 
         * @type HTMLElement
         */
        this.element = element;
        /** The width of the Screen
         * @type Number 
         * @private
         */
        this.width = width;
        /** The height of the Screen
         * @type Number
         * @private
         */
        this.height = height;
    
        this.element.style.width = width;
        this.element.style.height = height;
        this.element.width = this.width;
        this.element.height = this.height;

        /** The Canvas Context
         * @private
         */
        this.context = this.element.getContext("2d");

        /** Keyboard events for the Screen. Used to see what keys are pressed.
         * @type {gameify.KeyboardEventManager}
         */
        this.keyboard = new gameify.KeyboardEventManager(this.element.parentElement);
        this.keyboard.setup();

        /** Mouse events for the Screen. Used to what mouse buttons are pressed, and other mouse events (eg scroll)
         * @type {gameify.MouseEventManager}
         */
        this.mouse = new gameify.MouseEventManager(this.element.parentElement);
        this.mouse.setup();

        /** Get the Screen's canvas context 
         * @private
         */
        this.getContext = () => {
            return this.context;
        }

        /** Turn antialiasing on or off (set to off for pixel art)
         * @param {Boolean} enable - Whether smoothing should be enabled or not (true/false)
         */
        this.setSmoothImages = (value) => {
            this.context.imageSmoothingEnabled = value;
        }

        /** Clear the screen
         * @arg {gameify.Color} [color] - The color to clear to. Default is transparent;
        */
        this.clear = () => {
            this.context.clearRect(0, 0, this.width, this.height);
        }

        /** Changes the width of the Screen
         * @param {Number} width - The new width of the Screen
         */
        this.setWidth = (width) => {
            this.element.style.width = width;
            this.element.width = this.width;
        }

        /** Changes the height of the Screen
         * @param {Number} height - The new height of the screen
         */
        this.setHeight = (height) => {
            this.element.style.height = height;
            this.element.height = this.height;
        }

        /** The current game scene
         * @private
         */
        this.currentScene = null;

        /** Sets the game's scene
         * @param {gameify.Scene} scene - The scene to set the game to.
         */
        this.setScene = (scene) => {
            if (this.currentScene && this.currentScene.locked) {
                console.warn("The current scene is locked and cannot be changed: " + this.currentScene.locked);
                return;
            }
            if (this.currentScene) this.currentScene.onUnload();
            this.currentScene = scene;
            this.currentScene.onLoad(this);
        }

        /** Add a Sprite to the Screen. This makes it so that sprite.draw(); draws to this screen.
         * @param {gameify.Sprite | gameify.Tilemap} obj - The object to add to the screen
         */
        this.add = (obj) => {
            obj.setContext(this.getContext());
        }

        /** The game's update interval
         * @private
         */
        this.updateInterval = null;

        // Timestamp of the last update
        let lastUpdate = 0;

        /** Starts the game.
        */
        this.startGame = () => {
            if (this.currentScene == null) {
                console.error(`You need to set a Scene before you can start the game. See ${gameify.getDocs("gameify.Scene")} for details`);
            }
            
            lastUpdate = 0;

            const eachFrame = (time) => {
                if (!lastUpdate) {
                    lastUpdate = time;
                }
                window.requestAnimationFrame(eachFrame);
                const delta = time - lastUpdate;
                lastUpdate = time;
                // if delta is zero, pass one instead (bc of div-by-zero errors)
                this.currentScene.update(delta || 1);
                this.currentScene.draw();
            }
            window.requestAnimationFrame(eachFrame);

        }
    },

    /** Creates a scene in the game. (Eg. a menu or level)
     * @constructor
     * @example 
     * // Create a Screen that is 600 by 400 and centered
     * let myScreen = new gameify.Screen(document.querySelector("#my-canvas"), 600, 400);
     * myScreen.center();
     * 
     * // Create a Scene and give it update and draw functions
     * let mainMenu = new gameify.Scene(myScreen);
     * mainMenu.onUpdate((delta) => {
     *     // code ...
     * });
     * mainMenu.onDraw(() => {
     *     // code ...
     * });
     * 
     * // Start the game
     * myScreen.setScene(mainMenu);
     * myScreen.startGame();
     * @arg {gameify.Screen} screen - The Screen the Scene should draw to.
     */
    Scene: function (screen) {
        /** The user-set update function
         * @private
         */
        this.updateFunction = null;

        /** Set the update function for this scene
         * @param {function} callback - The function that is called every update. Optionally, you can include a delta argument for physics and movement calculations.
         */
        this.onUpdate = (callback) => {
            this.updateFunction = callback;
        }

        /** Update the scene
         * @private
         */
        this.update = (delta) => {
            if (this.updateFunction == null) {
                console.error(`You need to specify an update function for this Scene. See ${gameify.getDocs("gameify.Scene")} for details`);
                return;
            }
            this.parent.keyboard.clearJustPressed();
            this.parent.mouse.clearRecentEvents();
            this.updateFunction(delta);
        }

        this.locked = false;
        /** Lock the scene, meaning you cannot switch to another scene until it is unlocked with scene.unlock()
         * @param {String} [text] - A helpful message to display when you try to switch scenes
         */
        this.lock = (text) => {
            this.locked = text || "Unlock it to change the scene";
        }
        /** Unlock the scene, meaning you can now switch to another scene. Scenes are unlocked by default */
        this.unlock = () => {
            this.locked = false;
        }

        /** The user-set draw function
         * @private
         */
        this.drawFunction = null;

        /** Set the draw function for this scene
         * @param {function} callback
         */
        this.onDraw = (callback) => {
            this.drawFunction = callback;
        }
 
        /** Draw the scene. This is done automatically, you usually shouldn't have to use it yourself.
         */
        this.draw = () => {
            if (this.drawFunction == null) {
                console.error(`You need to specify a draw function for your Scene. See ${gameify.getDocs("gameify.Scene")} for details`);
                return;
            }
            this.drawFunction();
        }

        /** The parent Screen
         * @private
         */
        this.parent = screen;

        /** Run when the scene is set as a Screen's active scene 
         * @param {gameify.Screen} parent
         * @private
        */
        this.onLoad = (parent) => {
            this.parent = parent;
        }

        /** Run when the scene is set as inactive / replaced by another scene
         * @private
        */
        this.onUnload = () => {
            this.parent = null;
        }
    },

    /** Creates an image for use in sprites and other places. 
     * @constructor
     * @example let playerImage = new gameify.Image("images/player.png");
     * @arg {String} [path] - The image filepath. (Can also be a dataURI). If not specified, the image is created with no texture
    */
    Image: function (path) {
        /** If the image is loaded */
        this.loaded = false;

        this.loadFunction = undefined;

        /** Set a function to be run when the image is loaded
         * @param {function} callback - The function to be called when the image is loaded.
         */
        this.onLoad = (callback) => { this.loadFunction = callback; }

        
        this.cropData = { x: 0, y: 0, width: 0, height: 0 }

        /** Crop the image 
         * @param {Number} x - how much to crop of the left of the image
         * @param {Number} y - how much to crop of the right of the image
         * @param {Number} width - how wide the resulting image should be
         * @param {Number} height - how tall the resulting image should be
        */
        this.crop = (x, y, width, height) => {
            if (x === undefined || y === undefined || width === undefined || height === undefined) {
                console.error("x, y, width and height must be specified");
            }
            this.cropData = { x: x, y: y, width: width, height: height };
        }

        /** Get the image crop. Returns an object with x, y, width, and height properties. */
        this.getCrop = () => {
            return JSON.parse(JSON.stringify(this.cropData));
        }

        /** Draw the image to a context
         * @param {CanvasRenderingContext2D} context - The canvas context to draw to
         * @param {Number} x - The x coordinate to draw at
         * @param {Number} y - The y coordinate to draw at
         * @param {Number} w - Width
         * @param {Number} h - Height
         * @param {Number} r - Rotation, in degrees
         */
        this.draw = (context, x, y, w, h, r) => {
            // translate the canvas to draw rotated images
            const transX = x + w / 2;
            const transY = y + h / 2;
            const transAngle = (r * Math.PI) / 180; // convert degrees to radians

            context.translate(transX, transY);
            context.rotate(transAngle);

            context.drawImage( this.texture,
                               // source coordinates
                               this.cropData.x,
                               this.cropData.y,
                               this.cropData.width,
                               this.cropData.height,
                               // destination coordinates
                               -w / 2,
                               -h / 2,
                               w,
                               h );

            context.rotate(-transAngle);
            context.translate(-transX, -transY);
        }

        this.texture = undefined;
        if (path !== undefined) {
            this.texture = document.createElement("img");
            this.texture.src = path;
            this.texture.onerror = () => {
                console.error(`Your image "${path}" couldn't be loaded. Check the path, and make sure you don't have any typos.`)
            }
            this.texture.onload = () => {
                console.info(`Loaded image "${path}"`)
                this.loaded = true;
    
                // don't reset the crop if it was already specified.
                if (!this.cropData.width) this.cropData.width = this.texture.width;
                if (!this.cropData.height) this.cropData.height = this.texture.height;
    
                if (this.loadFunction) { this.loadFunction(); }
            }
        }
    }, 

    /** Creates a tileset from an image
     * @constructor
     * @example let myTileset = new gameify.Tileset("images/tileset.png");
     * // Give the coordinates of a tile to retrieve it
     * let grassTile = myTileset.getTile(3, 2);
     * @arg {String} path - The image/tileset filepath
     * @arg {Number} twidth - The width of each tile
     * @arg {Number} theight - The height of each tile
     */
    Tileset: function (path, twidth, theight) {
        this.path = path;
        this.twidth = twidth;
        this.theight = theight;

        this.loaded = false;

        /** Get a tile from it's coordinates. Returns a new Image object each time, so if you're getting the same tile a lot you might want to save it to a variable
         * @param {Number} x - The x coordinate of the tile
         * @param {Number} y - The y coordinate of the tile
         * @returns {gameify.Image}
         */
        this.getTile = (x, y) => {
            const tile = new gameify.Image();
            tile.texture = this.texture;
            tile.crop(x * this.twidth, y * this.theight, this.twidth, this.theight);
            return tile;
        }

        this.loadFunction = undefined;
        /** Set a function to be run when the image is loaded
         * @param {function} callback - The function to be called when the image is loaded.
         */
        this.onLoad = (callback) => { this.loadFunction = callback; }

        this.texture = document.createElement("img");
        this.texture.src = path;
        this.texture.onerror = () => {
            console.error(`Your image "${path}" couldn't be loaded. Check the path, and make sure you don't have any typos.`)
        }
        this.texture.onload = () => {
            console.info(`Loaded image "${path}"`)
            this.loaded = true;

            if (this.loadFunction) { this.loadFunction(); }
        }
    },

    /** Creates a map of rectangular tiles
     * @example // ...
     * // make a new tileset with 8x8 pixels
     * let forestTileset = new gameify.Tileset("images/forest.png", 8, 8);
     * // make a new tilemap with 16x16 tiles and no offset
     * // anything that's not 16x16 will be scaled to match
     * let forestMap = new gameify.Tilemap(16, 16, 0, 0);
     * forsetMap.setTileset(forestTileset);
     * 
     * // make sure to add it to the screen
     * myScreen.add(tileset);
     * 
     * forestScene.onDraw(() => {
     *     // ...
     *     // Draw the tilemap
     *     forsetMap.draw();
     * });
     * @constructor
     * @arg {Number} twidth - The width of the tiles
     * @arg {Number} theight - The height of the tiles
     * @arg {Number} offsetx - X offset of the tiles
     * @arg {Number} offsety - Y offset of the tiles
     */
    // Dev's Note: There are a LOT of places in loops where row and col are reversed
    // this.tiles.placed[x][y] means that looping through this.tiles.placed
    // actually loops through each column, and I was dumb and got this backwards.
    // Some are correct, because I realised it -- but be careful
    Tilemap: function (twidth, theight, offsetx, offsety) {
        this.twidth = twidth;
        this.theight = theight;
        this.offset = {
            x: offsetx || 0,
            y: offsety || 0
        };

        // placed is an object so there can be negative indexes
        this.tiles = { placed: {} };

        this.tileset = undefined;
        /** What tileset to use. This tileset must include anything you want to use in this tilemap.
         * @param {gameify.Tileset} set - The tileset
        */
        this.setTileset = (set) => {
            this.tileset = set;
        }

        this.drawFunction = null;
        /** Set the draw function for this tilemap
        * @param {function} callback - The function to be called right before the tilemap is drawn
        */
        this.onDraw = (callback) => {
            this.drawFunction = callback;
        }

        /** Convert screen coordinates to map coordinates 
         * @param {Number | Object} screenx - The screen x coordinate OR an object containing both x any y coordinates
         * @param {Number} [screeny] - The screen y coordinate
         * @returns {Object} {x, y}
         */
        this.screenToMap = (screenx, screeny) => {
            // loose comparison because we don't want any null values
            if (screenx.x != undefined && screenx.y != undefined) {
                screeny = screenx.y;
                screenx = screenx.x;
            }
            return {
                x: Math.floor((screenx - this.offset.x) / this.twidth),
                y: Math.floor((screeny - this.offset.y) / this.theight)
            }
        }
        /** Convert map coordinates to screen coordinates
         * @param {Number | Object} mapx - The map x coordinate OR an object containing both x and y coordinates
         * @param {Number} [mapy] - The map y coordinate
         * @returns {Object} {x, y}
         */
        this.mapToScreen = (mapx, mapy) => {
            // loose comparison because we don't want any null values
            if (mapx.x != undefined && mapy.y != undefined) {
                mapy = mapx.y;
                mapx = mapx.x;
            }
            return {
                x: (mapx + this.offset.x) * this.twidth,
                y: (mapy + this.offset.y) * this.theight
            }
        }

        /** Place a tile on the tilemap
         * @param {Number} originx - The x position of the tile on the tilesheet
         * @param {Number} originy - The y position of the tile on the tilesheet
         * @param {Number} destx - The x position to place the tile
         * @param {Number} desty - The y position to place the tile
         * @param {Number} [rotation=0] - Tile rotation, in degrees
         */
        this.place = (originx, originy, destx, desty, rotation) => {
            if (!this.tileset) {
                console.error("You can't place a tile before setting a tileset.");
                return;
            }

            // "cache" tiles as to not create a new Image for every single placed tile.
            if (!this.tiles[`${originx},${originy}`]) {
                this.tiles[`${originx},${originy}`] = this.tileset.getTile(originx, originy);
            }
            if (!this.tiles.placed[destx]) {
                // an object so there can be negative indexes
                this.tiles.placed[destx] = {};
            }

            // add the tile to the list of placed tiles
            this.tiles.placed[destx][desty] = {
                image: this.tiles[`${originx},${originy}`],
                source: {
                    x: originx,
                    y: originy
                },
                rotation: rotation || 0
            };
        }

        /** Get the tile (if it exists) placed at a certain position
         * @param {Number} x - X coordinate of the tile
         * @param {Number} y - Y coordinate of the tile
         */
        this.get = (x, y) => {
            if (this.tiles.placed[x] && this.tiles.placed[x][y]) {
                return this.tiles.placed[x][y];

            } else return undefined;
        }

        /** Remove a tile from the tilemap
         * @param {Number} x - The x coord of the tile to remove
         * @param {Number} y - The y coord of the tile to remove
         */
        this.remove = (x, y) => {
            if (this.tiles.placed[x] && this.tiles.placed[x][y]) {
                delete this.tiles.placed[x][y];
            }
        }

        this.draw = () => {
            if (this.drawFunction) {
                this.drawFunction();
            }
            if (!this.context) {
                console.error(`You need to add this tilemap to a screen before you can draw it. See ${gameify.getDocs("gameify.Tilemap")} for more details`);
                return;
            }

            for (const row in this.tiles.placed) {
                for (const col in this.tiles.placed[row]) {
                    const tile = this.tiles.placed[row][col];

                    tile.image.draw(this.context,
                                    row * this.twidth + this.offset.x, col * this.theight + this.offset.y,
                                    this.twidth, this.theight,
                                    tile.rotation );
                }
            }

        }

        /** Enable the map builder tool. This allows you to easily edit tilesets.<br>
         * Controls are: Click to place, Right-click to delete, Middle-click to pick, Scroll and Ctrl+Scroll to switch tile, Shift+Scroll to rotate the tile.<br>
         * Once you're finished, press Enter and copy the message in the console
         * @param {gameify.Screen} screen - The screen to show the map builder on. For best results, use the one you've already added it to.
         */
        this.enableMapBuilder = (screen) => {
            let mainScene = new gameify.Scene(screen);
            mainScene.lock("The Tilemap builder is currently enabled.");

            let selectedTile = {
                x: 0, y: 0,
                rotation: 0
            };

            let textureImage = new gameify.Image(this.tileset.texture.src);

            mainScene.onUpdate(() => {
                if (screen.mouse.buttonIsPressed("left")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    this.place(selectedTile.x, selectedTile.y, pos.x, pos.y, selectedTile.rotation);

                } else if (screen.mouse.buttonIsPressed("right")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    this.remove(pos.x, pos.y);

                } else if (screen.mouse.buttonIsPressed("middle")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    const tile = this.get(pos.x, pos.y);
                    if (tile) {
                        selectedTile.x = tile.source.x;
                        selectedTile.y = tile.source.y;
                        selectedTile.rotation = tile.rotation;
                    }
                }

                if (screen.keyboard.keyWasJustPressed("Enter")) {
                    this.exportMapData();
                    mainScene.unlock();
                }

                if (screen.mouse.eventJustHappened("wheeldown")) {
                    if (screen.keyboard.keyIsPressed("Shift")) {
                        selectedTile.rotation += 45;
                        return;
                    } else if (screen.keyboard.keyIsPressed("Control")) {
                        selectedTile.y += 1;
                        // go to the next row if it's at the end
                        if (selectedTile.y * this.theight >= this.tileset.texture.height) {
                            selectedTile.y = 0;
                            selectedTile.x += 1;
                            // loop to the beginning
                            if (selectedTile.x * this.twidth >= this.tileset.texture.width) {
                                selectedTile.x = 0;
                            }
                        }
                        return;
                    }
                    selectedTile.x += 1;
                    // go to the next row if it's at the end
                    if (selectedTile.x * this.twidth >= this.tileset.texture.width) {
                        selectedTile.x = 0;
                        selectedTile.y += 1;
                        // loop to the beginning
                        if (selectedTile.y * this.theight >= this.tileset.texture.height) {
                            selectedTile.y = 0;
                        }
                    }

                } else if (screen.mouse.eventJustHappened("wheelup")) {
                    if (screen.keyboard.keyIsPressed("Shift")) {
                        selectedTile.rotation -= 45;
                        return;
                    } else if (screen.keyboard.keyIsPressed("Control")) {
                        selectedTile.y -= 1;
                        // go to the previous row if it's at the beginning
                        if (selectedTile.y < 0) {
                            selectedTile.y = Math.floor(this.tileset.texture.height / this.theight) - 1;
                            selectedTile.x -= 1;
                            // loop to the end
                            if (selectedTile.x < 0) {
                                selectedTile.x = Math.floor(this.tileset.texture.width / this.twidth) - 1;
                            }
                        }
                        return;
                    }
                    selectedTile.x -= 1;
                    // go to the previous row if it's at the beginning
                    if (selectedTile.x < 0) {
                        selectedTile.x = Math.floor(this.tileset.texture.width / this.twidth) - 1;
                        selectedTile.y -= 1;
                        // loop to the end
                        if (selectedTile.y < 0) {
                            selectedTile.y = Math.floor(this.tileset.texture.height / this.theight) - 1;
                        }
                    }
                }
            });
            mainScene.onDraw(() => {
                screen.clear();

                this.draw();

                const pos = this.screenToMap(screen.mouse.getPosition());

                const previewImage = this.tileset.getTile(selectedTile.x, selectedTile.y);
                const crop = previewImage.getCrop();
                // draw the preview transulcent
                this.context.globalAlpha = 0.5;

                previewImage.draw(this.context,
                                  this.offset.x + (pos.x * this.twidth),
                                  this.offset.y + (pos.y * this.twidth),
                                  this.twidth, this.theight,
                                  selectedTile.rotation );

                textureImage.draw( this.context, 0, 0,
                textureImage.texture.width / this.tileset.twidth * 25,
                textureImage.texture.height / this.tileset.theight * 25 );

                this.context.globalAlpha = 1;

                // highlight the hovered square
                const padding = 2;
                this.context.beginPath();
                this.context.rect(pos.x * this.twidth - padding + this.offset.x,
                                  pos.y * this.theight - padding + this.offset.y,
                                  this.twidth + (padding*2),
                                  this.theight + (padding*2));
                // for the "minimap"
                this.context.rect(selectedTile.x * 25, selectedTile.y * 25, 25, 25);
                this.context.stroke();
            });

            console.log(this.context === screen.element.getContext("2d"));

            screen.setScene(mainScene);

            return mainScene;
        }

        this.exportMapData = () => {
            let output = [];
            for (const col in this.tiles.placed) {
                for (const row in this.tiles.placed[col]) {
                    const tile = this.tiles.placed[col][row];
                    // use as little text as possible, this will be saved to a JSON string
                    // Because this will be repeated possibly hundreds of times
                    output.push({
                        s: [tile.source.x, tile.source.y],
                        p: [col, row],
                        r: tile.rotation
                    });
                }
            }
            console.log(JSON.stringify(output));
            return output;
        }

        /** Load data saved from the map builder<br>
         * @param {Object} data - The map data to load
         */
        this.loadMapData = (data) => {
            for (const tile of data) {
                this.place(tile.s[0], tile.s[1], tile.p[0], tile.p[1], tile.r);
            }
        }

        /** The Canvas context to draw to
         * @private
         */
        this.context = null;

        /** Set the Canvas context to draw to. This should be called whenever a tilemap is added to a Screen
         * @private
         */
        this.setContext = (context) => {
            this.context = context;
        }
        
    },

    /** Creates a scene in the game. (Eg. a menu or level)
     * @constructor
     * @example 
     * // ...
     * 
     * // Create a sprite with the image "player.png" in the top left corner
     * let mySprite = new gameify.Sprite(0, 0, "player.png");
     * // Add the sprite to the screen
     * myScreen.add(Sprite);
     * 
     * myScene.onUpdate(() => {
     *     // update the sprite
     *     mySprite.update();
     * });
     * myScene.onDraw(() => {
     *     myScene.clear(); // clear the screen
     *     mySprite.draw(); // draw the sprite
     * });
     * @arg {Number} x - The x (horizontal) position of the sprite, left-to-right.
     * @arg {Number} y - The y (vertical) position of the sprite, top-to-bottom.
     * @arg {gameify.Image} image - The image the sprite should have.
     */
    Sprite: function (x, y, image) {
        /** The position of the Sprite on the screen
         * @type {gameify.Vector2d}
         */
        this.position = new gameify.Vector2d(x, y);

        /** The velocity of the Sprite
         * @type {gameify.Vector2d}
         */
        this.velocity = new gameify.Vector2d(0, 0);

        /** The Sprite's image / texture
         */
        this.image = image;

        /** The sprite's rotation, in degrees */
        this.rotation = 0;

        /** Change the Sprite's image / texture
         * @param {gameify.Image} newImage - The image to change the sprite to
         */
        this.setImage = (newImage) => {
            this.image = newImage;
        }

        /** Set the update function for this scene
         * @param {function} callback - The function to be run when the sprite updates. An optional argument can be included for a delta since the last update, and another for a reference to the sprite
         */
        this.onUpdate = (callback) => {
            this.updateFunction = callback;
        }

        /** Have the sprite move towards a point.
         * @param {gameify.Vector2d} pos - The point to move towards
         * @param {Number} [speed] - How quickly the sprite should move towards the point. If speed isn't specified, it keeps its current speed.
         */
        this.goTowards = (pos, speed) => {
            const magnitude = this.velocity.getMagnitude();
            this.velocity = pos.subtract(this.position).getNormalized();
            // keep the same magnitude
            if (speed === undefined) {
                this.velocity = this.velocity.multiply(magnitude);
            } else {
                this.velocity = this.velocity.multiply(speed);
            }
        }

        /** Have the sprite rotate to face towards a point
         * @param {gameify.Vector2d} point -  The point to face towards
         * @param {Number} [offset] -  Rotational offset, in degrees
        */
        this.faceTowards = (point, offset) => {
            const rise = this.position.y - point.y;
            const run = this.position.x - point.x;
                                            // convert to degrees  // add the offset
            this.rotation = (Math.atan(rise / run) * 180/Math.PI) + (offset || 0);
            if (run < 0) {
                this.rotation -= 180;
            }
        }

        let deltaWarned = false;

        /** Update the Sprite */
        this.update = (delta) => {
            if (delta === undefined) {
                delta = 1000;
                if (!deltaWarned) {
                    console.warn(`You should include a delta argument with your update call, eg sprite.update(delta)
This way speeds and physics are the same regardless of FPS or how good your computer is.`);
                    deltaWarned = true;
                }
            }

            // make the velocity dependant on the update speed
            this.position = this.position.add(this.velocity.multiply(delta/1000));

            if (this.updateFunction) {
                this.updateFunction(delta, this);
            }
        }

        /** The user-set draw function
         * @private
         */
        this.drawFunction = null;

        /** Set the draw function for this sprite
         * @param {function} callback - The function to be called right before the sprite is drawn
         */
        this.onDraw = (callback) => {
            this.drawFunction = callback;
        }

        /** The scale of the sprite's texture */
        this.scale = 1;

        /** Draw the Sprite */
        this.draw = () => {
            if (this.drawFunction) {
                this.drawFunction();
            }
            if (!this.context) {
                console.error("You need to add this sprite to a screen before you can draw it. ");
                return;
            }
            const crop = this.image.getCrop();
            const destWidth = crop.width * this.scale;
            const destHeight = crop.height * this.scale;

            // translate the canvas to draw rotated images
            const transX = this.position.x + destWidth / 2;
            const transY = this.position.y + destHeight / 2;
            const transAngle = (this.rotation * Math.PI) / 180; // convert degrees to radians

            this.context.translate(transX, transY);
            this.context.rotate(transAngle);

            this.context.drawImage( this.image.texture,
                                    // source coordinates
                                    crop.x,
                                    crop.y,
                                    crop.width,
                                    crop.height,
                                    // Move over so it rotates around the center
                                    -destWidth / 2,
                                    -destHeight / 2,
                                    destWidth,
                                    destHeight );

            // revert the transforms
            this.context.rotate(-transAngle);
            this.context.translate(-transX, -transY);
        }

        /** The Canvas context to draw to
         * @private
         */
        this.context = null;

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Screen
         * @private
         */
        this.setContext = (context) => {
            this.context = context;
        }
    }
};

/** This is a mostly complete list of mouse and keyboard input events supported by gameify. Most event names are case-sensitive
 * @example // ----------------
 * //  Mouse Buttons
 * // ----------------
 * if (myScreen.mouse.buttonIsPressed( BUTTON_NAME )) {
 *     // do something
 * }
 * // Valid buttons are:
 * 0    "left"
 * 2    "right"
 * 1    "middle"
 * @example // ----------------
 * //  Mouse Events
 * // ----------------
 * if (myScreen.mouse.eventJustHappened( EVENT_NAME )) {
 *     // do something
 * }
 * // Valid events are:
 * 0    "left"
 * 2    "right"
 * 1    "middle"
 * "leave"  "mouseout"
 * "move"   "movemove"
 * "wheelup"
 * "wheeldown"
 * "wheel"
 * @example // ----------------
 * //  Keyboard Buttons
 * // ----------------
 * if (myScreen.keyboard.keyIsPressed( KEY_NAME )) {
 *     // do something
 * }
 * // Valid keys are: (On a standard US English keyboard)
 * // Letter keys
 * "A"  "KeyA"
 * // through
 * "Z"  "KeyZ"
 * 
 * // Other keys
 * "Backquote"  "Minus"  "Equal"  "BracketLeft"
 * "BracketRight"  "Backslash"  "Semicolon"  "Quote"
 * "Period"  "Comma"  "Slash"
 * 
 * // Numbers
 * "0"  "Digit0"  "Numpad0"
 * // through
 * "9"  "Digit9"  "Numpad9"
 * // You can check if a key is upper or lowercase by checking for the Shift key
 * 
 * // Arrow keys
 * "Up"     "ArrowUp"
 * "Down"   "ArrowDown"
 * "Left"   "ArrowLeft"
 * "Right"  "ArrowRight"
 * 
 * // Special keys
 * "Shift"      "ShiftLeft"     "ShiftRight"
 * "Control"    "ControlLeft"   "ControlRight"
 * "Alt"        "AltLeft"       "AltRight"
 * "OS"         "OSLeft"        "OSRight"
 * "Enter"  "NumpadEnter"   "Backspace" "CapsLock"
 * "Tab"    "PageUp"        "PageDown"  "Home"
 * "End"    "Delete"        "Insert"
 * 
 * // Function keys
 * "F1"
 * // through
 * "F15" // some keyboards only have F1-F12
 * 
 * // Numpad keys
 * "NumpadDivide"   "NumpadMultiply"  "NumpadSubtract"
 * "NumpadAdd"      "NumpadDecimal"
 */
// This is an empty object, that only exists for the documentation.
export let inputEventsTables = {};