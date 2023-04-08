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
    Scene: function (screen) {
        if (screen === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new scenes.Scene();
                if (data[1]) obj.lock(data[1]);
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return [this.locked];
        }

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
                throw new Error(`You need to specify an update function for this Scene. See ${docs.getDocs("gameify.Scene")} for details`);
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
                throw new Error(`You need to specify a draw function for your Scene. See ${docs.getDocs("gameify.Scene")} for details`);
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
}