

/** Animations for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myAnimation = new gameify.Animation([frames], options);
 * @example // Import just sprites
 * import { animations } from "./gameify/animation.js"
 * let myAnimation = new animations.Animation([frames], options);
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
     * let myAnimation = new gameify.Animation([frames], { duration: 200, loop: true });
     * 
     * mySprite.animator.set('idle', myAnimation);
     * mySprite.animator.play('idle');
     */
    Animator: function () {
        /** The animations currently assigned to the animator.
         * Use Animator.set() and Animator.play() to add and play animations
         * @readonly
        */
        this.animations = {};

        
        /** The animation that is currently playing (or undefined if not playing). Use Animator.play() to change the current animation being played. */
        this.currentAnimation = undefined;

        /** If an animation is currently playing */
        this.playing = false;

        /** Add an animation to the animations list
         * @param {String} name - The name of the animation
         * @param {gameify.Animation} animation - The animation
         */
        this.set = (name, animation) => {
            this.animations[name] = animation;
        }

        /** The time the animation started playing */
        this.animationProgress = 0;

        /** Play an animation
         * @param {String} name - The name of the animation
         */
        this.play = (name) => {
            this.currentAnimation = this.animations[name];
            this.animationProgress = 0;
            this.playing = true;
        }

        /** Stop & reset the animation */
        this.stop = () => {
            this.playing = false;
            this.currentAnimation = undefined;
            this.animationProgress = 0;
        }

        /** Update the animation
         * @param {Number} delta - The time, in miliseconds, since the last frame
         * @param {Object} object - The object to update
         */
        this.update = (delta, object) => {
            if (!this.playing) return;

            this.animationProgress += delta;
            const frame = this.currentAnimation.getFrameAt(this.animationProgress);
            this.currentAnimation.applyTo(object, frame);
        }
    },

    /** Creates an animation
     * @constructor
     * @alias gameify.Animation
     * @example 
     * // ...
     * 
     * // Create a sprite with the image "player.png" in the top left corner
     * const frames = [
     *     new gameify.Image("player_idle1.png"),
     *     new gameify.Image("player_idle2.png")
     * ];
     * let myAnimation = new gameify.Animation([frames], { duration: 200, loop: true });
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
     * @arg {Number} x - The x (horizontal) position of the sprite, left-to-right.
     * @arg {Number} y - The y (vertical) position of the sprite, top-to-bottom.
     * @arg {gameify.Image} image - The image the sprite should have.
     */
    Animation: function (images, options) {
        
    }

}