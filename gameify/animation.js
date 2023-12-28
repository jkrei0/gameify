import { vectors } from "./vector.js"

/** Animation types. Most types replace the value (absolute)
 * @member
 * @alias gameify.Animation.propertyTypes
 * @enum
 */
let animationPropertyTypes = {
    // Base types
    /** Apply the property by overwriting the old value each frame */
    simple: { apply: (property, value, object) => object[property] = value },
    /** Apply the property using Object.apply() each frame */
    object: { apply: (property, value, object) => Object.apply(object[property], value) },

    // Other simple types
    /** A number */
    number: { apply: (...args) => animationPropertyTypes.simple.apply(...args) },
    /** A string */
    string: { apply: (...args) => animationPropertyTypes.simple.apply(...args) },
    /** A boolean */
    boolean: { apply: (...args) => animationPropertyTypes.simple.apply(...args) },
    /** A gameify.Image (on a sprite, or other object with a setImage method) */
    'Image': { apply: (property, value, object) => object.setImage(value) },
    /** A gameify.Vector2d */
    'Vector2d': { apply: (property, value, object) => { object[property].x = value.x; object[property].y = value.y; } }
}

/** Animations for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myAnimation = new gameify.Animation(frames, options);
 * @example // Import just sprites
 * import { animations } from "./gameify/animation.js"
 * let myAnimation = new animations.Animation(frames, options);
 * @global
 */
export let animation = {
    /** Manages animations for sprites, text, etc. Usually used via the Sprite or Text object
     * @constructor
     * @alias gameify.Animator
     * @example
     * 
     * mySprite = new gameify.Sprite(0, 0, new gameify.Image("player.png"));
     *
     * let myAnimation = new gameify.Animation(frames, { duration: 200, loop: true });
     * 
     * mySprite.animator.set('idle', myAnimation);
     * mySprite.animator.play('idle');
     * 
     * @arg {Object} parent - The object to animate
     */
    Animator: class {
        constructor (parent) {
            this.parent = parent;
        }

        /** The animations currently assigned to the animator.
         * Use Animator.set() and Animator.play() to add and play animations
         * @readonly
        */
        animations = {};

        /** The object that this animator is attached to
         * @type {Object}
         */
        parent;
        
        /** The animation that is currently playing (or undefined if not playing). Use Animator.play() to change the current animation being played. */
        currentAnimation = undefined;

        /** If an animation is currently playing */
        playing = false;

        /** The time the animation started playing */
        animationProgress = 0;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Animation}
        */
        static fromJSON = (data, find) => {
            return new animation.Animation(data.frames, data.options);
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            const out = {
                currentAnimation: Object.keys(this.animations).find(key => this.animations[key] === value),
                animationProgress: this.animationProgress,
                playing: this.playing,
                parent: ref(this.parent),
                animations: {}
            };
            for (const key in this.animations) {
                const anim = this.animations[key];
                out.animations[key] = ref(anim);
            }
            return out;
        }

        /** Add an animation to the animations list
         * @method
         * @param {String} name - The name of the animation
         * @param {gameify.Animation} animation - The animation
         */
        set = (name, animation) => {
            this.animations[name] = animation;
        }

        /** Play an animation
         * @method
         * @param {String} name - The name of the animation
         */
        play = (name) => {
            if (!this.animations[name]) {
                throw new Error(`Animation '${name}' not found or was not added to this animator.`);
            }
            this.currentAnimation = this.animations[name];
            this.animationProgress = 0;
            this.playing = true;
        }

        /** Stop & reset the animation
         * @method
         */
        stop = () => {
            this.playing = false;
            this.currentAnimation = undefined;
            this.animationProgress = 0;
        }

        /** Update the animation
         * @method
         * @param {Number} delta - The time, in miliseconds, since the last frame
         */
        update = (delta) => {
            if (!this.playing) return;
            if (this.currentAnimation.isAfterCompletion()) {
                this.stop();
                return;
            }

            this.animationProgress += delta;
            this.currentAnimation.applyTo(this.parent, this.animationProgress);
        }
    },

    /** Animation options
     * @typedef {Object} AnimationOptions
     * @property {Number} [duration=1000] - The duration of the animation, in milliseconds (calculated based on frameDuration if frameDuration is set)
     * @property {Number} [frameDuration] - The duration of each frame (by default, calculated based on duration)
     * @property {Boolean} [loop=false] - If the animation should loop
     */

    /** An animation frame
     * @typedef {Object} AnimationFrame
     * @property {animationPropertyTypes|string} [type=gameify.animation.types.simple] - An animation type, or the name of an animation type
     * @property {any} value - The value of the property at the frame
     * @example
     * const frames = [{
     *     image: { type: 'Image', value: new gameify.Image("player_idle1.png") },
     *     position: { type: 'Vector2d', value: new gameify.Vector2d(0, 2) },
     * },{
     *     image: { type: 'Image', value: new gameify.Image("player_idle2.png") },
     *     position: { type: 'Vector2d', value: new gameify.Vector2d(0, 2) },
     * },{
     *     image: { type: 'Image', value: new gameify.Image("player_idle3.png") },
     *     position: { type: 'Vector2d', value: new gameify.Vector2d(0, -2) },
     * },{
     *     image: { type: 'Image', value: new gameify.Image("player_idle4.png") },
     *     position: { type: 'Vector2d', value: new gameify.Vector2d(0, -2) },
     * }];
     * let myAnimation = new gameify.Animation(frames, { duration: 200, loop: true });
     */

    /** Creates an animation
     * @constructor
     * @alias gameify.Animation
     * @example 
     * // ...
     * 
     * // Create a sprite with the image "player.png" in the top left corner
     * const frames = [{
     *     image: { type: 'Image', value: new gameify.Image("player_idle1.png") },
     *     position: { type: 'Vector2d', value: new gameify.Vector2d(0, 2) },
     * }, // ... more frames
     * ];
     * let myAnimation = new gameify.Animation(frames, { duration: 200, loop: true });
     * 
     * mySprite.animator.set('idle', myAnimation);
     * 
     * // ...
     * 
     * myScene.onUpdate(() => {
     *     if (mySprite.velocity.getMagnitude() < .1) {
     *         mySprite.animator.play('idle');
     *     } else {
     *         mySprite.animator.play('walking');
     *     }
     * });
     * 
     * @arg {Array<AnimationFrame>} frames - The frames of the animation
     * @arg {AnimationOptions} options - animation options
     */
    Animation: class {
        constructor (frames, options) {
            this.#frames = frames;
            this.frames = new Proxy(this.#frames, {
                set: (target, key, value) => {
                    target[key] = value;
                    this.#updateOptions(); // Options depend on frames length
                    return true;
                }
            });

            this.#options = Object.assign({
                duration: 1000,
                frameDuration: undefined,
                loop: false
            }, options);
            this.options = new Proxy(this.#options, {
                set: (target, key, value) => {
                    target[key] = value;
                    this.#updateOptions();
                    return true;
                }
            });

            this.#updateOptions();
        }

        /** The frames of the animation
         * @type {Array<Object>}
         */
        frames;

        /** The animation's options
         * @type {AnimationOptions}
         */
        options;

        #frames;

        #options;

        #updateOptions = () => {
            if (this.#options.frameDuration === undefined) {
                this.#options.frameDuration = this.#options.duration / this.frames.length;
                if (this.frames.length === 0) this.#options.frameDuration = 0;
            } else {
                this.#options.duration = this.#options.frameDuration * this.frames.length;
            }
        }

        // Documented above at animationPropertyTypes
        static propertyTypes = animationPropertyTypes;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Animation}
        */
        static fromJSON = (data, find) => {
            return new animation.Animation(data.frames, data.options);
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                // This works as long as `frames` is easily converted to JSON
                // Eventually, we'll have images in here and need to save
                // them separately to prevent storing images twice (or more).
                frames: this.frames,
                options: this.options
            };
        }

        /** Update the animation's frames
         * @method
         * @arg {Array<AnimationFrame>} frames - The new frames
         */
        setFrames = (frames) => {
            this.frames = frames;
            this.options.duration = this.options.frameDuration * this.frames.length;
        }

        /** Get the frame number at the given time
         * @method
         * @param {Number} time - The time (in milliseconds) to get the frame at
         * @returns {Number}
         */
        getFrameNumberAt = (time) => {
            const framesElapsed = Math.floor(time / this.options.frameDuration);
            if (this.options.loop) {
                return framesElapsed % this.frames.length;
            }
            return Math.min(framesElapsed, this.frames.length - 1);
        }

        /** Get the frame at the given time
         * @method
         * @param {Number} time - The time (in milliseconds) to get the frame at
         * @returns {Object}
        */
        getFrameAt = (time) => {
            return this.frames[this.getFrameNumberAt(time)];
        }

        /** Apply an animation frame to an object
         * @method
         * @param {Object} object - The object to apply the frame to
         * @param {Number} time - The time (in milliseconds) to of the frame
         */
        applyTo = (object, time) => {
            const frame = this.getFrameAt(time);
            this.applyFrameTo(object, frame);
        }

        /** Apply an animation frame to an object
         * @method
         * @param {Object} object - The object to apply the frame to
         * @param {Object} frame - The frame to apply
         */
        applyFrameTo = (object, frame) => {
            for (const property in frame) {
                // Type can be a type, or a string, or blank (in which case, use simple)
                let type = frame[property].type;
                if (!type.apply) type = animationPropertyTypes[type];
                if (!type.apply) type = animationPropertyTypes.simple;

                type.apply(property, frame[property].value, object);
            }
        }

        /** Check if a the animation is completed after a specific time
         * If options.loop is true, always returns false
         * @method
         * @param {Number} time - The time (in milliseconds) to check if the animation is completed at
         */
        isAfterCompletion = (time) => {
            if (this.#options.loop) return false;
            const framesElapsed = Math.floor(time / this.#options.frameDuration);
            // Compare to length (not length - 1), b/c the animation isn't
            // done until it's the whole way through the last frame
            if (framesElapsed >= this.frames.length) return true;
            return false;
        }
    }
}