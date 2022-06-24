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
        concept = concept.replace("gameify.", "");
        switch (concept) {
            default:
                return `${docsPath + concept}.html#${permalink ? permalink : ""}`;
        }
    },

    /** A 2d vector. Usually used to represent things such as distance, direction, position, velocity, etc.
     * You can use two numbers, a formatted string, or another Vector2d to create a new Vector2d
     * @constructor
     * @example // A vector from two numbers
     * let vectorA = new gameify.Vector2d(5, 8);
     * // A vector from a formatted string
     * let vectorB = new gameify.Vector2d("<4, 6>");
     * // A vector from another vector (copying it)
     * let vectorC = new gameify.Vector2d(vectorA)
     * @arg {Number|gameify.Vector2d|String} x
     * @arg {Number} [y]
    */
    Vector2d: function (x, y) {

        /** The x (a) point of the vector
         * @type {Number}
         */
        this.x = x;
        /** The y (b) point of the vector
         * @type {Number}
         */
        this.y = y;

        if (typeof(x) === "object") {
            this.x = x.x;
            this.y = x.y;
        } else if (typeof(x) === "string") {
            this.x = parseInt(x.match(/(\d|\.)+(?=,)/));
            this.y = parseInt(x.match(/(\d|\.)+(?=>)/));
        } else if (typeof(x) !== "number" && typeof(y) !== "number") {
            console.error(`You can use either two numbers, a formatted string, or an existing Vector2d to create a Vector2d. See ${gameify.getDocs("gameify.Vector2d")} for more details`);
        }

        /** Returns a copy of the vector
         * @returns {gameify.Vector2d} */
        this.copy = () => {
            return new gameify.Vector2d(this.x, this.y);
        }
        /** Returns the length (magnitude) of the vector. Equivalent to vector.getMagnitude */
        this.getDistance = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns the (magnitude) length of the vector. Equivalent to vector.getDistance */
        this.getMagnitude = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns a normalized copy of the vector (Sets the length equal to one while maintaining the direction)
         * @returns {gameify.Vector2d} */
        this.getNormalized = () => {
            const dist = this.getDistance();
            if (dist === 0) {
                return new gameify.Vector2d(this.x, this.y);
            }
            return new gameify.Vector2d(this.x / dist, this.y / dist);
        }
        /** Normalizes the vector (Sets the length equal to one while maintaining the direction)
         */
        this.normalize = () => {
            const normalized = this.getNormalized();
            this.x = normalized.x;
            this.y = normalized.y;
        }
        /** Adds this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @arg {gameify.Vector2d} vectorB - The vector to add
         * @returns {gameify.Vector2d}
         */
        this.add = (vectorB) => {
            if (!gameify.vectors.assertIsCompatibleVector(vectorB)) return;
            return new gameify.Vector2d(this.x + vectorB.x, this.y + vectorB.y);
        }
        /** Subtracts this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @arg {gameify.Vector2d} vectorB - The vector to subtract
         * @returns {gameify.Vector2d}
         */
        this.subtract = (vectorB) => {
            if (!gameify.vectors.assertIsCompatibleVector(vectorB)) return;
            return new gameify.Vector2d(this.x - vectorB.x, this.y - vectorB.y);
        }
        /** Multiplies this vector by an amount
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = vectorA.multiply(4); // vectorB = <12, -8>
         * @arg {Number} value - The amount to multiply by
         * @returns {gameify.Vector2d}
         */
        this.multiply = (value) => {
            return new gameify.Vector2d(this.x * value, this.y * value);
        }
        /** Linear interpolation from this vector to another
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, 12);
         * // Get a vector half way between A and B
         * let vectorC = vectorA.linearInterpolate(vectorB, 0.5); // vectorC = <5, 7>
         * @arg {gameify.Vector2d} vectorB - The vector to interpolate to
         * @arg {Number} t - A number from 0 to 1, with larger values closer to vectorB
         * @returns {gameify.Vector2d}
        */
        this.linearInterpolate = (vectorB, t) => {
            // Linear interpolation is A * (1 - t) + B * t
            return new gameify.Vector2d(this.x + (vectorB.x - this.x) * t, this.y + (vectorB.y - this.y) * t);
        }

        /** Returns a string representing the vector in the form <code>"&lt;x, y&gt;"</code>. Truncated to three decimal places.
         * @returns {String}
         */
        this.toString = () => {
            return `<${Math.floor(this.x*1000)/1000}, ${Math.floor(this.y*1000)/1000}>`;
        }
        /** Same as toString, but does not truncate the string. Only for debug use
         * @package
         */
        this.toRawString = () => {
            return `<${this.x}, ${this.y}>`;
        }
        this.valueOf = this.toString;
    },
    vectors: {
        /** A zero vector for reference and calculation
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * // Interpolate vectorA towards zero (using gameify.vectors.ZERO to avoid having to make a new vector)
         * let vectorB = vectorA.linearInterpolate(gameify.vectors.ZERO, 0.5); // vectorB = <1.5, 1>*/
        ZERO: () => { return new gameify.Vector2d(0, 0); },
        /** The i vector <1, 0> for reference and calculation */
        i: () => { return new gameify.Vector2d(1, 0); },
        /** The j vector <0, 1> for reference and calculation */
        j: () => { return new gameify.Vector2d(0, 1); },
        /** Checks if a vector is compatible with operations in this one
         * @package
         */
        isCompatibleVector: (vector) => {
            if (typeof(vector.x) != "number" || typeof(vector.y) != "number") {
                return false;
            }
            return true;
        },
        assertIsCompatibleVector: (vector) => {
            if (typeof(vector.x) != "number" || typeof(vector.y) != "number") {
                console.error(`The vector you're passing to this function is either broken or not a vector. See ${gameify.getDocs("gameify.Vector2d")} for help`);
                return false;
            }
            return true;
        },
        /** Given two vectors, returns the one with the greatest magnitude (length)
         * @arg {gameify.Vector2d} vectorA
         * @arg {gameify.Vector2d} vectorB
         */
        longestOf: (vectorA, vectorB) => {
            if (!gameify.vectors.assertIsCompatibleVector(vectorA)) return;
            if (!gameify.vectors.assertIsCompatibleVector(vectorB)) return;

            if (vectorA.getMagnitude() > vectorB.getMagnitude()) {
                return vectorA;
            }
            return vectorB;
        },
        /** Given two vectors, returns the one with the least magnitude (length)
         * @arg {gameify.Vector2d} vectorA
         * @arg {gameify.Vector2d} vectorB
         */
        shortestOf: (vectorA, vectorB) => {
            if (!gameify.vectors.assertIsCompatibleVector(vectorA)) return;
            if (!gameify.vectors.assertIsCompatibleVector(vectorB)) return;
            
            if (vectorA.getMagnitude() < vectorB.getMagnitude()) {
                return vectorA;
            }
            return vectorB;
        }
    },

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
            // This is normal, the OS
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
         *     player.motion.x = 5;
         * }
        */
        this.keyIsPressed = (key) => {
            return (this.pressedKeys.indexOf(key) >= 0);
        }

        /** Check if a key was just pressed and let up
         * @arg {String} key - What key do you want to check
         * @returns {Boolean} if the key is pressed down
         * @example // See if the player pressed the Escape key.
         * if (myScreen.keyboard.keyWasJustPressed("Escape")) {
         *     myScreen.setScene(mainMenu);
         * }
        */
        this.keyWasJustPressed = (key) => {
            for (const i in this.justPressedKeys) {
                let jpk = this.justPressedKeys[i];
                if (jpk[1] == key || jpk[2] == key) {
                    this.justPressedKeys[i][0] == 99999;
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
            if (this.currentScene) this.currentScene.onUnload();
            this.currentScene = scene;
            this.currentScene.onLoad(this);
        }

        /** Add a Sprite to the Screen. This makes it so that sprite.draw(); draws to this screen.
         * @param {gameify.Sprite} sprite - The sprite to add to the scene
         */
        this.add = (sprite) => {
            sprite.setContext(this.getContext());
        }

        /** The game's update interval
         * @private
         */
        this.updateInterval = null;

        // Timestamp of the last update
        let lastUpdate = 0;

        /** Starts the game.
         * @param {Number} targetFps - Target updates (frames) per second.
        */
        this.startGame = (targetFps) => {
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
     * myScreen.startGame(30);
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
            this.updateFunction(delta);
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
     * @arg {String} path - The image filepath. (Can also be a dataURI)
    */
    Image: function (path) {
        /** If the image is loaded */
        this.loaded = false;

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
         * @private
         */
        this.image = image;

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

        /** Have the sprite face towards a point (keeping its speed). Note that if its current velocity is 0 this won't do anything.
         * @param {gameify.Vector2d} pos - The point to face towards
         */
        this.goTowards = (pos) => {
            const magnitude = this.velocity.getMagnitude();
            this.velocity = pos.subtract(this.position).getNormalized();
            // keep the same magnitude
            this.velocity = this.velocity.multiply(magnitude);
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

        /** Set the draw function for this scene
         * @param {function} callback
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
            this.context.drawImage( this.image.texture,
                                    this.position.x,
                                    this.position.y,
                                    this.image.texture.width * this.scale,
                                    this.image.texture.height * this.scale );
        }

        /** The Canvas context to draw to
         * @private
         */
        this.context = null;

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Scene
         * @private
         */
        this.setContext = (context) => {
            this.context = context;
        }
    }
};
