import { shapes }   from "./collision.js"
import { docs }     from "./docs.js"
import { sprites }  from "./sprite.js"
import { scenes }   from "./scene.js"
import { vectors }  from "./vector.js"
import { text }     from "./text.js"
"use strict"

console.log("Welcome to Gameify");

/** This is the main gameify object. All other things are contained within it. 
 * @global
 */
export let gameify = {
    getDocs: docs.getDocs,

    Vector2d: vectors.Vector2d,
    vectors: vectors.vectors,

    shapes: shapes,

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
    MouseEventManager: function (captureScope, canvasElement) {
        /** The element that input events are captured from
         * @private
         */
        this.captureScope = captureScope;
        this.canvasElement = canvasElement;

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
                default: throw new Error(`Invalid mouse button ${button}`);
            }
        }

        /** Get the x and y position of the mouse cursor
         * @example 
         * if (myScreen.mouse.getPosition().x < 50) {
         *     // do something
         * }
         * @returns {gameify.Vector2d} The mouse position on the Screen
        */
        this.getPosition = () => {
            // copy values, because we don't want to return a reference.
            return new vectors.Vector2d(this.cursorPosition.x, this.cursorPosition.y);
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
            const widthRatio =  this.canvasElement.width / this.canvasElement.getBoundingClientRect().width;
            this.cursorPosition.x = event.offsetX * widthRatio;
            this.cursorPosition.y = event.offsetY * widthRatio;
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

        this.onContextMenu = (event) => {
            event.preventDefault();
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
            this.captureScope.addEventListener("contextmenu", this.onContextMenu);
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
            this.captureScope.removeEventListener("contextmenu", this.onContextMenu);
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
        if (element === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new gameify.Screen(document.getElementById(data[0]), data[1], data[2]);
                if (data[3]) obj.setScene(find(data[3]));
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return [this.element.id, this.width, this.height, name(this.currentScene)];
        }

        // Error if not given the correct parameters
        if (!element) {
            throw new Error(`You need to specify a canvas element to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
        }
        if (!width || !height) {
            throw new Error(`You need to specify a width and height to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
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
        this.mouse = new gameify.MouseEventManager(this.element.parentElement, this.element);
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
            width = Number(width);
            this.width = width;
            this.element.style.width = width;
            this.element.width = width;
        }

        /** Changes the height of the Screen
         * @param {Number} height - The new height of the screen
         */
        this.setHeight = (height) => {
            height = Number(height);
            this.height = height;
            this.element.style.height = height;
            this.element.height = height;
        }

        /** Changes the size of the Screen
         * @param {Number} width - The new width of the screen
         * @param {Number} height - The new height of the screen
         *//** Changes the size of the Screen
         * @param {gameify.Vector2d} size - The new size of the screen
         */
        this.setSize = (width, height) => {
            if (width.x != undefined && width.y != undefined) {
                // Convert vector to 
                height = width.y;
                width = width.x;
            }
            this.setWidth(width);
            this.setHeight(height);
        }

        /** Get the width and height of the screen
         * @returns {gameify.Vector2d} A vector representing the size of the screen
         */
        this.getSize = () => {
            return new vectors.Vector2d(this.width, this.height);
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

        /** Returns the game's active scene
         * @returns {gameify.Scene} The active scene
         */
        this.getScene = () => { return this.currentScene; }

        /** Add a Sprite to the Screen. This makes it so that sprite.draw(); draws to this screen.
         * @param {gameify.Sprite | gameify.Tilemap} obj - The object to add to the screen
         */
        this.add = (obj) => {
            obj.setContext(this.getContext(), this);
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
                throw new Error(`You need to set a Scene before you can start the game. See ${gameify.getDocs("gameify.Scene")} for details`);
            }
            
            lastUpdate = 0;

            const eachFrame = async (time) => {
                if (!lastUpdate) {
                    lastUpdate = time;
                }
                const delta = time - lastUpdate;
                lastUpdate = time;
                // if delta is zero, pass one instead (bc of div-by-zero errors)
                this.currentScene.update(delta || 1);
                this.currentScene.draw();
                
                window.requestAnimationFrame(eachFrame);
            }
            window.requestAnimationFrame(eachFrame);

        }
    },

    /** Creates an image for use in sprites and other places. 
     * @constructor
     * @example let playerImage = new gameify.Image("images/player.png");
     * @arg {String} [path] - The image filepath. (Can also be a dataURI). If not specified, the image is created with no texture
    */
    Image: function (path) {
        if (path === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new gameify.Image(data[0]);
                if (data[1]) obj.cropData = data[1];
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return [this.path, this.getCrop()];
        }

        /** Change and load a new image path. Reset's the image's crop
         * @param {string} path - The new image path
         */
        this.changePath = (path) => {
            this.path = path;
            const ni = new gameify.Image(path);
            ni.onLoad(() => {
                this.texture = ni.texture;
                this.cropData.width = this.texture.width;
                this.cropData.height = this.texture.height;
                if (this.loadFunction) { this.loadFunction(); }
            });
        }

        /** The image filepath. Modifying this will not do anything. */
        this.path = path;

        /** If the image is loaded */
        this.loaded = false;

        this.loadFunction = undefined;

        /** Set a function to be run when the image is loaded
         * @param {function} callback - The function to be called when the image is loaded.
         */
        this.onLoad = (callback) => { this.loadFunction = callback; }

        // If from a tileset, what and where (for serialization)
        this.tileData = {};

        this.cropData = { x: 0, y: 0, width: 0, height: 0, cropped: false };

        /** Crop the image 
         * @param {Number} x - how much to crop of the left of the image
         * @param {Number} y - how much to crop of the right of the image
         * @param {Number} width - how wide the resulting image should be
         * @param {Number} height - how tall the resulting image should be
        */
        this.crop = (x, y, width, height) => {
            if (x === undefined || y === undefined || width === undefined || height === undefined) {
                throw new Error("x, y, width and height must be specified");
            }
            this.cropData = { x: x, y: y, width: width, height: height, cropped: true };
        }

        /** Remove crop from the image */
        this.uncrop = () => {
            this.cropData.cropped = false;
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

            if (r) {
                // translate the canvas to draw rotated images
                const transX = x + w / 2;
                const transY = y + h / 2;
                const transAngle = (r * Math.PI) / 180; // convert degrees to radians

                context.translate(transX, transY);
                context.rotate(transAngle);

                if (this.cropData.cropped) {
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

                } else {
                    context.drawImage( this.texture,
                                    // omit source coordinates when not cropping
                                    -w / 2,
                                    -h / 2,
                                    w,
                                    h );

                }

                context.rotate(-transAngle);
                context.translate(-transX, -transY);

            } else {
                if (this.cropData.cropped) {
                    context.drawImage( this.texture,
                        // source coordinates
                        this.cropData.x,
                        this.cropData.y,
                        this.cropData.width,
                        this.cropData.height,
                        // destination
                        x, y, w, h );

                } else {
                    context.drawImage( this.texture,
                        // omit source coordinates when not cropping
                        x, y, w, h );

                }

            }
        }

        this.texture = undefined;
        if (path !== undefined) {
            this.texture = document.createElement("img");
            this.texture.src = path;
            let pathName = path;
            if (path.length > 50) {
                pathName = path.slice(0, 40) + '...';
            }
            this.texture.onerror = () => {
                throw new Error(`Your image "${pathName}" couldn't be loaded. Check the path, and make sure you don't have any typos.`);
            }
            this.texture.onload = () => {
                console.info(`Loaded image "${pathName}"`)
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
        if (path === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new gameify.Tileset(...data);
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return [this.path, this.twidth, this.theight];
        }

        this.path = path;
        this.twidth = Number(twidth);
        this.theight = Number(theight);

        this.loaded = false;

        /** Get a tile from it's coordinates. Returns a new Image object each time, so if you're getting the same tile a lot you might want to save it to a variable
         * @param {Number} x - The x coordinate of the tile
         * @param {Number} y - The y coordinate of the tile
         * @returns {gameify.Image}
         */
        this.getTile = (x, y) => {
            const tile = new gameify.Image();
            tile.tileData = {
                tileset: this,
                position: { x: x, y: y }
            }
            tile.texture = this.texture;
            tile.crop(x * this.twidth, y * this.theight, this.twidth, this.theight);
            return tile;
        }

        /** Change and load a new image path. Please note this does not clear
         * tilemaps' cached data, and it might retain its the original image.
         * @param {string} path - The new tileset image path
         */
        this.changePath = (path) => {
            this.path = path;
            const ni = new gameify.Tileset(path, this.twidth, this.theight);
            ni.onLoad(() => {
                this.texture = ni.texture;
                if (this.loadFunction) { this.loadFunction(); }
            });
        }

        this.loadFunction = undefined;
        /** Set a function to be run when the image is loaded
         * @param {function} callback - The function to be called when the image is loaded.
         */
        this.onLoad = (callback) => { this.loadFunction = callback; }

        /** The tileset's image/texture
         * @package
         */
        this.texture = document.createElement("img");
        this.texture.src = path;
        let pathName = path;
        if (path.length > 50) {
            pathName = path.slice(0, 40) + '...';
        }
        this.texture.onerror = () => {
            throw new Error(`Your image "${pathName}" couldn't be loaded. Check the path, and make sure you don't have any typos.`);
        }
        this.texture.onload = () => {
            console.info(`Loaded image "${pathName}"`)
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
     * @arg {Number} [offsetx=0] - X offset of the tiles
     * @arg {Number} [offsety=0] - Y offset of the tiles
     */
    // Dev's Note: There are a LOT of places in loops where row and col are reversed
    // this.tiles.placed[x][y] means that looping through this.tiles.placed
    // actually loops through each column, and I was dumb and got this backwards.
    // Some are correct, because I realised it -- but be careful
    Tilemap: function (twidth, theight, offsetx, offsety) {
        if (twidth === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new gameify.Tilemap(data[0], data[1], data[2].x, data[2].y);
                if (data[3]) {
                    obj.setTileset(find(data[3]));
                    obj.loadMapData(data[4]);
                }
                if (data[5]) find(data[5]).add(obj); // Add to Screen
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return [this.twidth, this.theight, {x: this.offset.x, y: this.offset.y}, name(this.tileset), this.exportMapData(), name(this.parent)];
        }

        this.twidth = Number(twidth);
        this.theight = Number(theight);

        /** The tile offset (coordinates of tile <0, 0>). Used to translate the map
         * @type {gameify.Vector2d}
         */
        this.offset = new vectors.Vector2d(offsetx || 0, offsety || 0);

        // placed is an object so there can be negative indexes
        this.tiles = { placed: {} };
        /** Clear the tilemap. Removes all placed tiles and cached images */
        this.clear = () => {
            this.tiles = { placed: {} };
        }

        this.tileset = undefined;
        /** What tileset to use. This tileset must include anything you want to use in this tilemap.
         * @param {gameify.Tileset} set - The tileset
        */
        this.setTileset = (set) => {
            this.tileset = set;
        }
        /** Get the tilemap's tileset
         * @returns {gameify.Tileset} The tileset
         */
        this.getTileset = () => {
            return this.tileset;
        }

        this.drawFunction = null;
        /** Set the draw function for this tilemap
        * @param {function} callback - The function to be called right before the tilemap is drawn
        */
        this.onDraw = (callback) => {
            this.drawFunction = callback;
        }

        /** Convert screen coordinates to map coordinates 
         * @param {Number} screenx - The screen x coordinate
         * @param {Number} [screeny] - The screen y coordinate
         * @returns {gameify.Vector2d} A vector representing the calculated position
         *//** Convert screen coordinates to map coordinates 
         * @param {Object | gameify.Vector2d} position - A vector OR an object containing both x any y coordinates
         * @returns {gameify.Vector2d} A vector representing the calculated position
         */
        this.screenToMap = (screenx, screeny) => {
            // loose comparison because we don't want any null values
            if (screenx.x != undefined && screenx.y != undefined) {
                screeny = screenx.y;
                screenx = screenx.x;
            }
            return new vectors.Vector2d(
                Math.floor((screenx - this.offset.x) / this.twidth),
                Math.floor((screeny - this.offset.y) / this.theight)
            );
        }
        /** Convert map coordinates to screen coordinates
         * @param {Number} mapx - The map x coordinate
         * @param {Number} [mapy] - The map y coordinate
         * @returns {Object} {gameify.Vector2d} A vector representing the calculated position
         *//** Convert map coordinates to screen coordinates
         * @param {Object | gameify.Vector2d} position - A vector OR an object containing both x any y coordinates
         * @returns {gameify.Vector2d} A vector representing the calculated position
         */
        this.mapToScreen = (mapx, mapy) => {
            // loose comparison because we don't want any null values
            if (mapx.x != undefined && mapx.y != undefined) {
                mapy = mapx.y;
                mapx = mapx.x;
            }
            return new vectors.Vector2d(
                (mapx * this.twidth) + this.offset.x,
                (mapy * this.theight) + this.offset.y
            );
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
                throw new Error("You can't place a tile before setting a tileset.");
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
         * @return {Object} { image, source: {originX, originY}, rotation }
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

        let warnedNotIntegerCoordinates = false;

        /** Draw the tilemap to the screen */
        this.draw = () => {
            if (this.drawFunction) {
                this.drawFunction();
            }
            if (!this.context) {
                throw new Error(`You need to add this tilemap to a screen before you can draw it. See ${gameify.getDocs("gameify.Tilemap")} for more details`);
            }

            if (!warnedNotIntegerCoordinates &&
                ( Math.round(this.offset.x) !== this.offset.x
                || Math.round(this.offset.y) !== this.offset.y)
            ) {
                warnedNotIntegerCoordinates = true;
                console.warn(`Timemap offset is not an integer. This can cause images
                    to contain artifacts (eg lines along the edge)`);
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

        /** <b>Deprecated.</b> Use the engine editor to build your tilemaps. This editor is no longer maintained.<br>
         * Enable the map builder tool. This allows you to easily edit tilesets.<br>
         * Controls are: Click to place, Right-click to delete, Middle-click to pick, Scroll and Ctrl+Scroll to switch tile, Shift+Scroll to rotate the tile.<br>
         * Once you're finished, call <code>tilemap.exportMapData()</code> to export the map.
         * @deprecated Use the engine editor to build and export your tilemaps. This editor is no longer maintained.
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

            // Start position for movement
            let dragging = false;
            let originalOffset = this.offset.copy();
            let dragStartPos = new vectors.Vector2d(0, 0);

            mainScene.onUpdate(() => {
                if (screen.mouse.buttonIsPressed("left")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    this.place(selectedTile.x, selectedTile.y, pos.x, pos.y, selectedTile.rotation);

                } else if (screen.mouse.buttonIsPressed("right")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    this.remove(pos.x, pos.y);

                }
                
                if (screen.mouse.buttonIsPressed("middle")) {
                    const pos = this.screenToMap(screen.mouse.getPosition());
                    if (!dragging) {
                        originalOffset = this.offset.copy();
                        dragStartPos = screen.mouse.getPosition();
                    }
                    dragging = true;
                    this.offset = originalOffset.add(screen.mouse.getPosition().subtract(dragStartPos)).truncated(2);

                    const tile = this.get(pos.x, pos.y);
                    if (tile) {
                        selectedTile.x = tile.source.x;
                        selectedTile.y = tile.source.y;
                        selectedTile.rotation = tile.rotation;
                    }
                } else {
                    dragging = false;
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
                                  pos.x * this.twidth + this.offset.x,
                                  pos.y * this.theight + this.offset.y,
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

            screen.setScene(mainScene);

            return mainScene;
        }

        /** Export this tilemap's map data and layout (load with loadMapData)
         * @returns {object} The map data as JSON
         */
        this.exportMapData = () => {
            let output = [];
            for (const col in this.tiles.placed) {
                for (const row in this.tiles.placed[col]) {
                    const tile = this.tiles.placed[col][row];
                    // use as little text as possible, this will be saved to a JSON string
                    // Because this will be repeated possibly hundreds of times
                    output.push({
                        s: [tile.source.x, tile.source.y],
                        p: [Number(col), Number(row)],
                        r: tile.rotation
                    });
                }
            }
            return output;
        }

        /** Load saved map data (export using exportMapData)
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

        /** The parent screen (not used directly)
         * @private
         */
        this.parent = null;

        /** Get the screen this sprite draws to
         * @returns {gameify.Screen}
         */
        this.getParent = () => {
            return this.parent;
        }

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Screen
         * @private
         */
        this.setContext = (context, parent) => {
            this.context = context;
            this.parent = parent;
        }
        
    },

    Sprite: sprites.Sprite,
    Scene: scenes.Scene,
    Text: text.Text,
    TextStyle: text.TextStyle
};

/** This is a mostly complete list of mouse and keyboard input events supported by gameify. Most event names are case-sensitive
 * @global
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
 * "F15" // most keyboards only have F1-F12
 * 
 * // Numpad keys
 * "NumpadDivide"   "NumpadMultiply"  "NumpadSubtract"
 * "NumpadAdd"      "NumpadDecimal"
 */
// This is an empty object, that only exists for the documentation.
export let inputEventsTables = {};