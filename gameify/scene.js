import {docs} from './docs.js'

/** Scene class for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use scenes via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let mainScene = new gameify.Scene(myScreen);
 * @example // Import just scenes
 * import { scenes } from "./gameify/scene.js"
 * let myScene = new scenes.Scene(0, 0);
 * @global
 */
export let scenes = {
    /** Creates a scene in the game. (Eg. a menu or level)
     * @constructor
     * @alias gameify.Scene
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
    Scene: class {
        constructor (screen) {
            this.parent = screen;
        }

        /** The user-set update function
         * @private
         */
        #updateFunction = null;
        /** The user-set draw function
         * @private
         */
        #drawFunction = null;
        /** If the scene is locked */
        locked = false;
        /** The parent Screen */
        parent;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Scene}
        */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Image.');
                const obj = new scenes.Scene();
                if (data[1]) obj.lock(data[1]);
                return obj;
            }

            const obj = new scenes.Scene(data.parent);
            if (data.locked) obj.lock(data.locked)
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
                locked: this.locked,
                parent: ref(this.parent)
            };
        }

        /** Set the update function for this scene
         * @method
         * @param {function} callback - The function that is called every update. Optionally, you can include a delta argument for physics and movement calculations.
         */
        onUpdate = (callback) => {
            this.#updateFunction = callback;
        }

        /** Update the scene
         * @method
         */
        update = (delta) => {
            if (this.#updateFunction == null) {
                throw new Error(`You need to specify an update function for this Scene. See ${docs.getDocs("gameify.Scene")} for details`);
            }
            this.parent.keyboard.clearJustPressed();
            this.parent.mouse.clearRecentEvents();
            this.#updateFunction(delta);
        }

        /** Lock the scene, meaning you cannot switch to another scene until it is unlocked with scene.unlock()
         * @method
         * @param {String} [text] - A helpful message to display when you try to switch scenes
         */
        lock = (text) => {
            this.locked = text || "Unlock it to change the scene";
        }
        /** Unlock the scene, meaning you can now switch to another scene. Scenes are unlocked by default
         * @method
         */
        unlock = () => {
            this.locked = false;
        }

        /** Set the draw function for this scene
         * @method
         * @param {function} callback
         */
        onDraw = (callback) => {
            this.#drawFunction = callback;
        }
 
        /** Draw the scene. This is done automatically, you usually shouldn't have to use it yourself.
         * @method
         */
        draw = () => {
            if (this.#drawFunction == null) {
                throw new Error(`You need to specify a draw function for your Scene. See ${docs.getDocs("gameify.Scene")} for details`);
            }
            this.#drawFunction();
        }

        /** Run when the scene is set as a Screen's active scene
         * @method
         * @package
         * @param {gameify.Screen} parent
        */
        onLoad = (parent) => {
            if (this.#loadFunction) this.#loadFunction();
            this.parent = parent;
        }

        #unloadFunction = undefined;
        #loadFunction = undefined;

        /** Defined a callback to be run when the scene is hidden (switched away from)
         * @param {function} callback
         * @method
         */
        onSceneHidden = (func) => {
            this.#unloadFunction = func;
        }
        /** Defined a callback to be run when the scene is shown (switched to)
         * @param {function} callback
         * @method
         */
        onSceneShown = (func) => {
            this.#loadFunction = func;
        }

        /** Run when the scene is set as inactive / replaced by another scene
         * @method
         * @package
        */
        onUnload = () => {
            if (this.#unloadFunction) this.#unloadFunction();
            this.parent = null;
        }
    },
}