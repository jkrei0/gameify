import { shapes }   from "./collision.js"
import { docs }     from "./docs.js"
import { sprites }  from "./sprite.js"
import { scenes }   from "./scene.js"
import { vectors }  from "./vector.js"
import { text }     from "./text.js"
import { audio }    from "./audio.js"
import { camera }   from "./camera.js"
import { animation } from "./animation.js"
import { images } from "./image.js"
"use strict"

console.log("Welcome to Gameify");

/** Access engine objects in your code
 * @example import {$get} from './_out.js';
 * $get('Tilemap::Dungeon Map');
 * @arg {String} sel - The object selector ( Type::Name )
 * @return The object, if it exists (undefined if it doesn't)
 */
let $get = (sel) => { throw 'How\'d you access this?? (Bad $get)'; }

/** Share objects between files / modules (in the engine).
 * By default, variables/etc defined (in the engine) in one file aren't accessible in another.
 * NOTE that shared variables are not automatically updated (copy, not reference).
 * @example import {$share} from './_out.js';
 * $share('my name', 'bob');
 * console.log($share('my name')); // 'bob'
 * @arg {String} name - A name for what you're sharing
 * @arg {String} [obj] - The object/function/variable to share
 */
let $share = (sel, obj) => { throw 'How\'d you access this?? (Bad $share)'; }

/** This is the main gameify object. All other things are contained within it. 
 * @global
 */
export let gameify = {
    getDocs: docs.getDocs,

    Animation: animation.Animation,
    Animator: animation.Animator,
    Camera: camera.Camera,
    Vector2d: vectors.Vector2d,
    vectors: vectors.vectors,

    Image: images.Image,
    Sprite: sprites.Sprite,
    Scene: scenes.Scene,
    Text: text.Text,
    TextStyle: text.TextStyle,

    shapes: shapes,
    audio: audio,

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

        this.firstFocusFunction = undefined;
        this.firstFocusHappened = false;

        /** Run a callback when the game is first focused (Useful for starting audio, etc)
         * @arg {Function} callback - The callback to run
         */
        this.onFirstFocus = (callback) => {
            this.firstFocusFunction = callback;
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
            this.firstFocusHappened = false;

            this.captureScope.setAttribute("tabindex", 1);
            this.captureScope.addEventListener("focusin", () => {
                if (!this.firstFocusHappened) {
                    this.firstFocusHappened = true;
                    if (this.firstFocusFunction) this.firstFocusFunction();
                }
            });
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
         * @arg {Boolean} [capture=false] - Capture the event, and stop other checks from seeing it
         * @returns {Boolean} if the event just happened
         * @example // See if the player clicked.
         * if (myScreen.mouse.eventJustHappened("click")) {
         *     // do something
         * }
        */
        this.eventJustHappened = (event, capture) => {
            for (const i in this.eventsJustHappened) {
                let evt = this.eventsJustHappened[i];
                if (evt[1] == event || evt[2] == event) {
                    this.eventsJustHappened[i][0] = 99999;
                    if (capture) {
                        this.eventsJustHappened.splice(i, 1);
                    }
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

    /** A Screen to draw things to and get events from, the base of every game.
     * @example // Get the canvas element
     * let canvas = document.querySelector("#my-canvas");
     * // Create a Screen that is 600 by 400
     * let myScreen = new gameify.Screen(canvas, 600, 400);
     * @arg {HTMLElement} element - The canvas to draw the screen to
     * @arg {number} width - The width of the Screen
     * @arg {number} height - The height of the Screen
     */
    Screen: class {
        constructor(element, width, height) {
            // Error if not given the correct parameters
            if (!element) {
                throw new Error(`You need to specify a canvas element to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
            }
            if (!width || !height) {
                throw new Error(`You need to specify a width and height to create a Screen. See ${gameify.getDocs("gameify.Screen")} for details`);
            }

            this.element = element;
            this.width = width;
            this.height = height;
            this.element.width = this.width;
            this.element.height = this.height;
            this.context = this.element.getContext("2d");

            this.keyboard = new gameify.KeyboardEventManager(this.element.parentElement);
            this.keyboard.setup();
            this.mouse = new gameify.MouseEventManager(this.element.parentElement, this.element);
            this.mouse.setup();
            this.audio = new gameify.audio.AudioManager();
            this.audio.setVolume(0.5);
            this.camera = new gameify.Camera(this.context);
        }

        /** The HTML5 Canvas element the Screen is attached to 
         * @type HTMLElement
         */
        element;
        /** The width of the Screen
         * @type Number
         */
        width;
        /** The height of the Screen
         * @type Number
         */
        height;
        /** The Canvas Context */
        context;
        /** Keyboard events for the Screen. Used to see what keys are pressed.
         * @type {gameify.KeyboardEventManager}
         */
        keyboard;
        /** Mouse events for the Screen. Used to what mouse buttons are pressed, and other mouse events (eg scroll)
         * @type {gameify.MouseEventManager}
         */
        mouse;
        /** This screen's default AudioManager.
         * @type {gameify.audio.AudioManager}
         */
        audio;
        /** This screen's default Camera.
         * @type {gameify.Camera}
         */ 
        camera;
        /** The current game scene */
        currentScene = null;
        /** The game's update interval */
        updateInterval = null;

        // Track this seperately (detatched from canvas el), so that if the
        // canvas for some reason loses its status, it can be restored
        // (it does this w/ the engine!)
        #antialiasingEnabled = true;
        // Timestamp of the last update
        #lastUpdate = 0;
        #gameActive = false;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Screen}
        */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Screen.');
                const obj = new gameify.Screen(document.getElementById(data[0]), data[1], data[2]);
                if (data[3]) obj.setScene(find(data[3]));
                obj.setAntialiasing(data[4]);
                return obj;
            }

            const obj = new gameify.Screen(document.getElementById(data.elementId), data.width, data.height);
            if (data.currentScene) obj.setScene(find(data.currentScene));
            obj.setAntialiasing(data.antialiasing);
            return obj;
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                elementId: this.element.id, 
                width: this.width,
                height: this.height,
                currentScene: ref(this.currentScene),
                antialiasing: this.getAntialiasing()
            }
        }

        /** Get the screen's HTML5 canvas context
         * @method
         * @returns {CanvasRenderingContext2D} - The canvas context
         */
        getContext = () => {
            return this.context;
        }

        /** Alias for setAntialiasing
         * @see {gameify.Screen.setAntialiasing}
         * @method
         * @param {Boolean} enable - Whether smoothing should be enabled or not (true/false)
         * @deprecated
        */
        setSmoothImages = (value) => {
            this.context.imageSmoothingEnabled = value;
        }

        /** Turn antialiasing on or off (set to off for pixel art)
         * @method
         * @param {Boolean} enable - Whether antialiasing should be enabled.
         */
        setAntialiasing = (value) => {
            this.#antialiasingEnabled = value;
            this.context.imageSmoothingEnabled = value;
        }

        /** Check if antialising is enabled (Note, also checks and corrects if
         * the canvas element has the correct antialiasing setting)
         * @method
         * @returns {Boolean} - Whether antialising is enabled or not
        */
        getAntialiasing = () => {
            this.context.imageSmoothingEnabled = this.#antialiasingEnabled;
            return this.#antialiasingEnabled;
        }

        /** Clear the screen
         * @method
         * @arg {String} [color] - The color to clear to, e.g. #472d3c or rgb(123, 123, 123). Default is transparent
        */
        clear = (color) => {
            this.context.save();
            this.context.setTransform(1, 0, 0, 1, 0, 0);

            this.context.clearRect(0, 0, this.width, this.height);

            if (color) {
                this.context.beginPath();
                this.context.rect(0, 0, this.width, this.height);
                this.context.fillStyle = color;
                this.context.fill();
            }
            // Restore transformations
            this.context.restore();
        }

        /** Changes the width of the Screen
         * @method
         * @param {Number} width - The new width of the Screen
         */
        setWidth = (width) => {
            width = Number(width);
            this.width = width;
            this.element.width = width;
        }

        /** Changes the height of the Screen
         * @method
         * @param {Number} height - The new height of the screen
         */
        setHeight = (height) => {
            height = Number(height);
            this.height = height;
            this.element.height = height;
        }

        /** Changes the size of the Screen
         * @method
         * @param {Number} width - The new width of the screen
         * @param {Number} height - The new height of the screen
         *//** Changes the size of the Screen
         * @method
         * @param {gameify.Vector2d} size - The new size of the screen
         */
        setSize = (width, height) => {
            if (width.x != undefined && width.y != undefined) {
                // Convert vector to 
                height = width.y;
                width = width.x;
            }
            this.setWidth(width);
            this.setHeight(height);
        }

        /** Get the width and height of the screen
         * @method
         * @returns {gameify.Vector2d} A vector representing the size of the screen
         */
        getSize = () => {
            return new vectors.Vector2d(this.width, this.height);
        }

        /** Sets the game's scene
         * @method
         * @param {gameify.Scene} scene - The scene to set the game to.
         */
        setScene = (scene) => {
            if (this.currentScene && this.currentScene.locked) {
                console.warn("The current scene is locked and cannot be changed: " + this.currentScene.locked);
                return;
            }
            if (this.currentScene) this.currentScene.onUnload();
            this.currentScene = scene;
            this.currentScene.onLoad(this);
        }

        /** Returns the game's active scene
         * @method
         * @returns {gameify.Scene} The active scene
         */
        getScene = () => { return this.currentScene; }

        /** Add a Sprite to the Screen. This makes it so that sprite.draw(); draws to this screen.
         * @method
         * @param {gameify.Sprite | gameify.Tilemap} obj - The object to add to the screen
         */
        add = (obj) => {
            obj.setContext(this.getContext(), this);
        }

        /** Starts the game.
         * @method
         */
        startGame = () => {
            if (this.currentScene == null) {
                throw new Error(`You need to set a Scene before you can start the game. See ${gameify.getDocs("gameify.Scene")} for details`);
            }
            
            if (this.#gameActive) {
                console.warn('The game is already started!');
                return;
            }

            this.#gameActive = true;
            this.#lastUpdate = 0;

            const eachFrame = async (time) => {
                if (!this.#lastUpdate) {
                    this.#lastUpdate = time;
                }
                const delta = time - this.#lastUpdate;
                this.#lastUpdate = time;
                // if delta is zero, pass one instead (bc of div-by-zero errors)
                this.currentScene.update(delta || 1);
                this.camera.update(delta || 1);
                this.currentScene.draw();
                
                if (this.#gameActive) {
                    window.requestAnimationFrame(eachFrame);
                }
            }
            window.requestAnimationFrame(eachFrame);

        }

        /** Stops (pauses) the game 
         * @method
         */
        stopGame = () => {
            this.#gameActive = false;
        }
    },

    /** A Tileset for use with Tilemaps, Sprites, etc
     * @example let myTileset = new gameify.Tileset("images/tileset.png");
     * // Give the coordinates of a tile to retrieve it
     * let grassTile = myTileset.getTile(3, 2);
     * @arg {String} path - The image/tileset filepath
     * @arg {Number} twidth - The width of each tile
     * @arg {Number} theight - The height of each tile
     */
    Tileset: class {
        constructor(path, twidth, theight) {
            this.path = path;
            this.twidth = Number(twidth);
            this.theight = Number(theight);
            this.texture = document.createElement("img");
            this.texture.src = path;

            this.#pathName = path;
            if (path.length > 50) {
                this.#pathName = this.#pathName = path.slice(0, 40) + '...';
            }
            this.texture.onerror = () => {
                throw new Error(`Your image "${this.#pathName}" couldn't be loaded. Check the path, and make sure you don't have any typos.`);
            }
            this.texture.onload = () => {
                console.info(`Loaded image "${this.#pathName}"`)
                this.loaded = true;
    
                if (this.#loadFunction) { this.#loadFunction(); }
            }
        }

        path;
        twidth;
        theight;
        loaded = false;
        /** The tileset's image/texture
         * @package
         */
        texture;
        #pathName;
        #loadFunction = undefined;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Tileset}
        */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Tileset.');
                const obj = new gameify.Tileset(...data);
                return obj;
            }

            const obj = new gameify.Tileset(data.path, data.twidth, data.theight);
            return obj;
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                path: this.path,
                twidth: this.twidth,
                theight: this.theight
            };
        }

        /** Get a tile (or section of tiles) from the tileset. Returns a new Image object each time, so if you're getting
         * the same tile a lot you might want to save it to a variable
         * @method
         * @param {Number} x - The x coordinate of the tile
         * @param {Number} y - The y coordinate of the tile
         * @param {Number} [width=1] - How many tiles wide
         * @param {Number} [height=1] - How many tiles tall
         * @returns {gameify.Image}
         */
        getTile = (x, y, width = 1, height = 1) => {
            const tile = new gameify.Image();
            tile.tileData = {
                tileset: this,
                position: { x: x, y: y },
                size: { x: width, y: height }
            }
            tile.texture = this.texture;
            tile.crop(x * this.twidth, y * this.theight, this.twidth*width, this.theight*height);
            return tile;
        }

        /** Change and load a new image path. Please note this does not clear
         * tilemaps' cached data, and it might retain its the original image.
         * @method
         * @param {string} path - The new tileset image path
         */
        changePath = (path) => {
            this.path = path;
            const ni = new gameify.Tileset(path, this.twidth, this.theight);
            ni.onLoad(() => {
                this.texture = ni.texture;
                if (this.#loadFunction) { this.#loadFunction(); }
            });
        }

        /** Set a function to be run when the image is loaded
         * @method
         * @param {function} callback - The function to be called when the image is loaded.
         */
        onLoad = (callback) => { this.#loadFunction = callback; }
    },

    /** A Tile as part of a Tilemap (not a tile from a Tileset)
     * @arg {Number} x - The x coordinate of the tile
     * @arg {Number} y - The y coordinate of the tile
     * @arg {Number} sourcex - The source x coordinate of the tile
     * @arg {Number} sourcey - The source y coordinate of the tile
     * @arg {gameify.Image} image - The tile's Image (reference)
     * @arg {Number} [rotation=0] - The rotation of the tile
     * @arg {Number} [width=1] - The width (in tiles) of the tile
     * @arg {Number} [height=1] - The height (in tiles) of the tile
     */
    Tile: class {
        constructor (x, y, sx, sy, image, r = 0, width = 1, height = 1) {
            this.image = image;
            this.position = new gameify.Vector2d(x, y);
            this.source = new gameify.Vector2d(sx, sy);
            this.size = new gameify.Vector2d(width, height);
            this.rotation = r;
        }

        /** Creates a Tile from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Tile}
        */
        static fromJSON = (data, find) => {
            const obj = new gameify.Tile(
                data.position.x, data.position.y,
                data.source.x, data.source.y,
                find(data.image),
                data.rotation,
                data.size.x || 1, data.size.y || 1
            );
            return obj;
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                image: ref(this.image),
                position: this.position.toJSON(),
                source: this.source.toJSON(),
                rotation: this.rotation
            };
        }
        
        /** The tile's Image
         * @type {gameify.Image}
         */
        image;
        /** The tile's position in the tilemap
         * @type {gameify.Vector2d}
         */
        position;
        /** The tile's source coordinates
         * @type {gameify.Vector2d}
         */
        source;
        /** The tile's rotation
         * @type {Number}
         */
        rotation;
    },

    /** Class representing a Tilemap of rectangular tiles
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
     * @arg {Number} twidth - The width of the tiles
     * @arg {Number} theight - The height of the tiles
     * @arg {Number} [offsetx=0] - X offset of the tiles
     * @arg {Number} [offsety=0] - Y offset of the tiles
     */
    // Dev's Note: There are a LOT of places in loops where row and col are reversed
    // this.tiles.placed[x][y] means that looping through this.tiles.placed
    // actually loops through each column, and I was dumb and got this backwards.
    // Some are correct, because I realised it -- but be careful
    Tilemap: class {
        constructor (twidth, theight, offsetx, offsety) {
            this.twidth = Number(twidth);
            this.theight = Number(theight);
            this.offset = new vectors.Vector2d(offsetx || 0, offsety || 0);
        }

        twidth;
        theight;
        /** The tile offset (coordinates of tile <0, 0>). Used to translate the map
         * @type {gameify.Vector2d}
         */
        offset;
        /** The Canvas context to draw to */
        context = null;
        /** The parent screen (not used directly) */
        parent = null;
        // placed is an object so there can be negative indexes
        tiles = { placed: {} };
        tileset = undefined;

        #drawFunction = null;
        #warnedNotIntegerCoordinates = false;

        /** Creates a Tilemap from JSON data
         * @method
         * @arg {Object|Array} data - Serialized Tilemap data (from Tilemap.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Tilemap}
        */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Tilemap.');
                const obj = new gameify.Tilemap(data[0], data[1], data[2].x, data[2].y);
                if (data[3]) {
                    obj.setTileset(find(data[3]));
                    obj.loadMapData(data[4]);
                }
                if (data[5]) find(data[5]).add(obj); // Add to Screen
                return obj;
            }

            const obj = new gameify.Tilemap(
                data.twidth, data.theight,
                data.offset.x, data.offset.y
            );
            if (data.tileset) {
                obj.setTileset(find(data.tileset));
                obj.loadMapData(data.mapData);
            }
            if (data.parent) find(data.parent).add(obj); // Add to Screen
            return obj;
        }
        
        /** Convert the Tilemap to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                twidth: this.twidth,
                theight: this.theight,
                offset: this.offset.toJSON(),
                tileset: ref(this.tileset),
                mapData: this.exportMapData(),
                parent: ref(this.parent),
            };
        }
        
        /** Clear the tilemap. Removes all placed tiles and cached images
         * @method
        */
        clear = () => {
            this.tiles = { placed: {} };
        }

        /** What tileset to use. This tileset must include anything you want to use in this tilemap.
         * @method
         * @param {gameify.Tileset} set - The tileset
        */
        setTileset = (set) => {
            this.tileset = set;
        }

        /** Get the tilemap's tileset
         * @method
         * @returns {gameify.Tileset} The tileset
         */
        getTileset = () => {
            return this.tileset;
        }

        /** Set the draw function for this tilemap
         * @method
         * @param {function} callback - The function to be called right before the tilemap is drawn
         */
        onDraw = (callback) => {
            this.#drawFunction = callback;
        }

        /** Convert screen coordinates to map coordinates 
         * @method
         * @param {Number} screenx - The screen x coordinate
         * @param {Number} [screeny] - The screen y coordinate
         * @returns {gameify.Vector2d} A vector representing the calculated position
         *//** Convert screen coordinates to map coordinates 
         * @method
         * @param {Object | gameify.Vector2d} position - A vector OR an object containing both x any y coordinates
         * @returns {gameify.Vector2d} A vector representing the calculated position
         */
        screenToMap = (screenx, screeny) => {
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
         * @method
         * @param {Number} mapx - The map x coordinate
         * @param {Number} [mapy] - The map y coordinate
         * @returns {Object} {gameify.Vector2d} A vector representing the calculated position
         *//** Convert map coordinates to screen coordinates
         * @method
         * @param {Object | gameify.Vector2d} position - A vector OR an object containing both x any y coordinates
         * @returns {gameify.Vector2d} A vector representing the calculated position
         */
        mapToScreen = (mapx, mapy) => {
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
         * @method
         * @param {Number} originx - The x position of the tile on the tilesheet
         * @param {Number} originy - The y position of the tile on the tilesheet
         * @param {Number} destx - The x position to place the tile
         * @param {Number} desty - The y position to place the tile
         * @param {Number} [rotation=0] - Tile rotation, in degrees
         * @param {Number} [width=1] - Tile width, relative to single tile width
         * @param {Number} [height=1] - Tile height, relative to single tile height
         */
        place = (originx, originy, destx, desty, rotation = 0, width = 1, height = 1) => {
            if (!this.tileset) {
                throw new Error("You can't place a tile before setting a tileset.");
            }

            const tileCacheString = `${originx},${originy}/${width},${height}`

            // "cache" tiles as to not create a new Image for every single placed tile.
            if (!this.tiles[tileCacheString]) {
                this.tiles[tileCacheString] = this.tileset.getTile(originx, originy, width, height);
            }
            if (!this.tiles.placed[destx]) {
                // an object so there can be negative indexes
                this.tiles.placed[destx] = {};
            }

            // add the tile to the list of placed tiles
            this.tiles.placed[destx][desty] = new gameify.Tile(
                destx, desty,       // destination position
                originx, originy,   // source position
                this.tiles[tileCacheString], // gameify.Image
                rotation || 0,      // rotation
                width, height       // size
            )
        }

        /** Get the tile (if it exists) placed at a certain position
         * @method
         * @param {Number} x - X coordinate of the tile
         * @param {Number} y - Y coordinate of the tile
         * @return {gameify.Tile}
         */
        get = (x, y) => {
            if (this.tiles.placed[x] && this.tiles.placed[x][y]) {
                return this.tiles.placed[x][y];

            } else return undefined;
        }

        /** Get an array of all the tiles in the map
         * @method
         * @return {gameify.Tile[]}
         */
        listTiles = () => {
            const out = [];
            for (const x in this.tiles.placed) {
                for (const y in this.tiles.placed[x]) {
                    out.push(this.tiles.placed[x][y]);
                }
            }
            return out;
        }

        /** Remove a tile from the tilemap
         * @method
         * @param {Number} x - The x coord of the tile to remove
         * @param {Number} y - The y coord of the tile to remove
         */
        remove = (x, y) => {
            if (this.tiles.placed[x] && this.tiles.placed[x][y]) {
                delete this.tiles.placed[x][y];
            }
        }

        /** Draw the tilemap to the screen
         * @param {Function} [check] - A function to check if the tile should be drawn (calls check(tile, x, y))
         * @method
         */
        draw = (check = (t, x, y) => true) => {
            if (this.#drawFunction) {
                this.#drawFunction();
            }
            if (!this.context) {
                throw new Error(`You need to add this tilemap to a screen before you can draw it. See ${gameify.getDocs("gameify.Tilemap")} for more details`);
            }

            if (!this.#warnedNotIntegerCoordinates &&
                ( Math.round(this.offset.x) !== this.offset.x
                || Math.round(this.offset.y) !== this.offset.y)
            ) {
                this.#warnedNotIntegerCoordinates = true;
                console.warn(`Timemap offset is not an integer. This can cause images
                    to contain artifacts (eg lines along the edge)`);
            }

            for (const row in this.tiles.placed) {
                for (const col in this.tiles.placed[row]) {
                    // row = x, col = y, yes it's backwards
                    const tile = this.tiles.placed[row][col];
                    if (!check(tile, row, col)) continue
                    tile.image.draw(this.context,
                                    row * this.twidth + this.offset.x, col * this.theight + this.offset.y,
                                    this.twidth*tile.size.x, this.theight*tile.size.y,
                                    tile.rotation, /* ignoreOpacity= */ true );
                }
            }

        }

        /** <b>Deprecated.</b> Use the engine editor to build your tilemaps. This editor is no longer maintained.<br>
         * Enable the map builder tool. This allows you to easily edit tilesets.<br>
         * Controls are: Click to place, Right-click to delete, Middle-click to pick, Scroll and Ctrl+Scroll to switch tile, Shift+Scroll to rotate the tile.<br>
         * Once you're finished, call <code>tilemap.exportMapData()</code> to export the map.
         * @deprecated Use the engine editor to build and export your tilemaps. This editor is no longer maintained.
         * @method
         * @param {gameify.Screen} screen - The screen to show the map builder on. For best results, use the one you've already added it to.
         */
        enableMapBuilder = (screen) => {
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
         * @method
         * @returns {object} The map data as JSON
         */
        exportMapData = () => {
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

        /** Download a .tilemapdata.js file of the tilemap. This file can be imported as an es6 module
         * @example
         * myMap.downloadMapData();
         * @example
         * import myMapData from './mymap.tilemapdata.js';
         * myMap.loadMapData(myMapData);
         * @method
         */
        downloadMapData = () => {
            const text = 'export default' + JSON.stringify(this.exportMapData(), null, 2);
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', `${this.__engine_name || 'mymap'}.tilemapdata.js`);

            element.style.display = 'none';
            document.body.appendChild(element);
          
            element.click();
          
            document.body.removeChild(element);
        }

        /** Load saved map data (export using exportMapData)
         * @method
         * @param {Object} data - The map data to load
         */
        loadMapData = (data) => {
            for (const tile of data) {
                this.place(tile.s[0], tile.s[1], tile.p[0], tile.p[1], tile.r);
            }
        }

        /** Get the screen this sprite draws 
         * @method
         * @returns {gameify.Screen}
         */
        getParent = () => {
            return this.parent;
        }

        /** Set the Canvas context to draw to. Should be called by a screen when the Tilemap is added to it.
         * @method
         */
        setContext = (context, parent) => {
            this.context = context;
            this.parent = parent;
        }
        
    }
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