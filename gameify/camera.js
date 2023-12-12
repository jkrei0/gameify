import { vectors }  from "./vector.js"

/** Camera for use in gameify
 * @example // Use via gameify
 * import { gameify } from "./gameify/gameify.js"
 * let myScreen = new gameify.Screen(canvas, 600, 400);
 * myScreen.camera.translate(50, 70);
 * @global
 */
export let camera = {
    /** A camera.
     * @alias gameify.Camera
     * @constructor
     * @example
     * import { gameify } from "./gameify/gameify.js"
     * let myScreen = new gameify.Screen(canvas, 600, 400);
     * myScreen.camera.translationSpeed = 0.7;
     * myScreen.camera.translate(50, 70);
     * @arg {CanvasRenderingContext2D} context - The canvas context
     */
    Camera: function (context) {
        this.context = context;

        /** The translation speed of the camera. 1 is instant, 0 is stationary.
         * @default 1
         * @type {Number}
         */
        this.translationSpeed = 1;

        /** Set the translation speed of the camera. 1 is instant, 0 is stationary.
         * @param {Number} speed - The speed of camera translations
         */
        this.setSpeed = (speed) => {
            this.translationSpeed = speed;
        }

        /** The maximum distance the camera can be from its target position, in pixels.
         * If the camera goes too far away, it will speed up to stay close to the target.
         * (Note, this distance is measured as a square, not a circle)
         * @example // Set speed to zero to disable interpolation
         * camera.translationSpeed = 0; // or camera.setSpeed(0)
         * // Create a 100 px "dead zone" in the center of the screen before
         * // the camera starts following
         * camera.maxDistance = 100;
         * @default canvas height * 0.5
         * @type {Number}
         */
        this.maxDistance = this.context.canvas.height * 0.5;

        /** The minimum distance the camera must be from its target position, in pixels,
         * before the camera starts to move. (Note, this distance is measured as a square, not a circle)
         * @default 1
         * @type {Number}
         */
        this.minDistance = 1;

        // "Private" translation target variable
        let _translationTarget = new vectors.Vector2d(0, 0);
        let _currentTranslation = new vectors.Vector2d(0, 0);

        /** Translate the camera (relative to the current transform)
         * @param {Number} x - The x amount, in pixels, to translate
         * @param {Number} y - The y amount, in pixels, to translate
         *//** Translate the camera (relative to the current transform)
         * @param {gameify.Vector2d} amount - The amount, in pixels, to translate
         */
        this.translate = (x, y) => {
            if (x.x != undefined && x.y != undefined) {
                // Convert vector to x and y
                y = x.y;
                x = x.x;
            }
            if (typeof x != 'number' || typeof y != 'number') {
                throw new Error("X and Y position passed to camera.translate are not numbers!");
            }
            _translationTarget.x += x;
            _translationTarget.y += y;
        }

        /** Translate the camera (using absolute positioning)
         * @param {Number} x - The x position to translate to
         * @param {Number} y - The y position to translate to
         *//** Translate the camera (using absolute positioning)
         * @param {gameify.Vector2d} position - The position to translate to
         */
        this.translateAbsolute = (x, y) => {
            if (x.x != undefined && x.y != undefined) {
                // Convert vector to x and y
                y = x.y;
                x = x.x;
            }
            if (typeof x != 'number' || typeof y != 'number') {
                throw new Error("X and Y position passed to camera.translateAbsolute are not numbers!");
            }
            _translationTarget.x = x;
            _translationTarget.y = y;
        }

        /** Position the center of the screen (using absolute position). Useful for following a player/sprite
         * @param {Number} x - The x position to translate to
         * @param {Number} y - The y position to translate to
         * @param {Number} offsetx - Y offset (from given position)
         * @param {Number} offsety - X offset (from given position)
         *//** Position the center of the screen (using absolute position). Useful for following a player/sprite
         * @param {gameify.Vector2d} position - The position to translate to
         * @param {gameify.Vector2d} [offset=new gameify.Vector2d(0, 0)] - Offset by an amount
         */
        this.focus = (x, y, ox = 0, oy = 0) => {
            let position = new vectors.Vector2d(x);
            let offset = new vectors.Vector2d(y);

            if (x.x == undefined && x.y == undefined) {
                // not vectors, convert
                position = new vectors.Vector2d(x, y);
                offset = new vectors.Vector2d(ox, oy);
            }

            const screenSize = new vectors.Vector2d(this.context.canvas.width, this.context.canvas.height);
            let screenOffset = position.subtract(screenSize.multiply(.5)).truncated();
            screenOffset = screenOffset.add(offset);

            try {
                this.translateAbsolute(screenOffset.multiply(-1));
            } catch (e) {
                throw new Error(`Bad values passed to camera.focus (could not translate). position=${position} offset=${offset}`);
            }
        }

        /** Reset the camera's (canvas's) transformation
         */
        this.resetTransform = () => {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
        }

        /** Sets the camera draw mode.
         * Set to 'ui' mode before drawing UI elements, set to 'world' for drawing everything else.
         * (draw mode is reset to 'world' each frame).
         * Equivalent to calling camera.resetTransform() or camera.update(0)
         * @tutorial camera
         * @param {String} mode - 'world' or 'ui'
         */
        this.setDrawMode = (mode) => {
            mode = mode.toLowerCase();
            if (mode === 'ui') this.resetTransform();
            else if (mode === 'world') this.update(0); // move to position, without actually moving the camera
            else console.warn('Unknown draw mode: ' + mode);
        }

        /** Update the camera. If you're using the a gameify.Screen's camera, this will be called automatically.
         * This function rounds translation vectors to whole numbers for better rendering
         * @param {Number} delta - The time, in milliseconds, since the last frame
         */
        this.update = (delta) => {
            this.resetTransform();

            const distX = _translationTarget.x - _currentTranslation.x;
            const distXAbs = Math.abs(distX);
            const distY = _translationTarget.y - _currentTranslation.y;
            const distYAbs = Math.abs(distY);

            const frameTargetPos = _translationTarget.copy();

            // If x or y is w/in min distance, 
            if (distXAbs < this.minDistance) frameTargetPos.x = _currentTranslation.x;
            if (distYAbs < this.minDistance) frameTargetPos.y = _currentTranslation.y;

            if (this.translationSpeed >= 1) {
                // Move instantly, speed is set to instant
                _currentTranslation = frameTargetPos.copy();

            } else if (distXAbs > this.maxDistance || distYAbs > this.maxDistance) {
                // Stay inside square boundary w/ side length of 2 * maxDistance
                if (distXAbs > this.maxDistance) {
                    _currentTranslation.x = frameTargetPos.x - (Math.sign(distX) * this.maxDistance);
                }
                if (distYAbs > this.maxDistance) {
                    _currentTranslation.y = frameTargetPos.y - (Math.sign(distY) * this.maxDistance);
                }

            } else {
                // Move by linear interpolation
                const lerpAmount = 1 - Math.pow(1 - this.translationSpeed, delta);
                _currentTranslation = _currentTranslation.linearInterpolate(frameTargetPos, lerpAmount);
            }

            const position = _currentTranslation.truncated();
            this.context.translate(position.x, position.y);
        }
    }
}