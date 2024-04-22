import { vectors } from "./vector.js"
import { animation } from "./animation.js"

/** Sprite class for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use sprites via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let playerSprite = new gameify.Sprite(0, 0, "player.png");
 * @example // Import just sprites
 * import { sprites } from "./gameify/sprite.js"
 * let playerSprite = new sprites.Sprite(0, 0);
 * @global
 */
export let sprites = {
    /** Creates a scene in the game. (Eg. a menu or level)
     * @constructor
     * @alias gameify.Sprite
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
    Sprite: class {
        constructor(x, y, image) {
            this.position = new vectors.Vector2d(x, y);
            this.image = image;
        }

        /** The animator for this sprite.
         * @type {gameify.Animator}
         */
        animator = new animation.Animator(this);
        /** The position of the Sprite on the screen
         * @type {gameify.Vector2d}
         */
        position;
        /** The velocity of the Sprite
         * @type {gameify.Vector2d}
         */
        velocity = new vectors.Vector2d(0, 0);
        /** The Sprite's image / texture
         */
        image;
        /** The sprite's rotation, in degrees */
        rotation = 0;
        /** The sprite's shape, for collision, etc.
         * @type {shapes.Shape}
         */
        shape = undefined;
        /** The sprite's shape offset (to align it properly)
         * @type {gameify.Vector2d}
        */
        shapeOffset = new vectors.Vector2d(0, 0);
        /** The scale of the sprite's texture */
        scale = 1;
        /** The parent screen (not used directly) */
        parent = null;

        #deltaWarned = false;
        /** The Canvas context to draw to
         * @private
         */
        #context = null;
        /** The user-set draw function
         * @private
         */
        #drawFunction = null;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Sprite}
        */
        static fromJSON = (data, find) => {
            // Serialization format is the same (Sprites always stored as JSON, yay!)
            const obj = new sprites.Sprite(data.position?.x || 0, data.position?.y || 0, undefined);
            if (data.rotation) obj.rotation = data.rotation;    // Set rotation
            if (data.scale) obj.scale = data.scale;             // Set scale
            if (data.image.parent) {
                // Set image from tileset
                const set = find(data.image.parent);
                if (!set) {
                    // Timemap not found
                    console.warn('Could load sprite image (tileset not found)');
                } else {
                    // Found tilemap
                    obj.setImage(set.getTile(
                        data.image.position.x, data.image.position.y,
                        data.image.size?.x || 1, data.image.size?.y || 1
                    ));
                }
            } else if (data.image) {
                obj.setImage(find(data.image.name));        // Set image
            }
            if (data.shape) obj.setShape(find(data.shape)); // Set shape
            if (data.parent) find(data.parent).add(obj);    // Add to screen
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
                position: this.position.toJSON(),
                scale: this.scale,
                rotation: this.rotation,
                image: {
                    name: ref(this.image),
                    parent: ref(this.image.tileData?.tileset),
                    position: this.image.tileData?.position,
                    size: this.image.tileData?.size
                },
                shape: ref(this.shape),
                parent: ref(this.parent)
            };
        }

        /** Set a shape for collisions. If no offset is provided, the shape's position is used.
         * @method
         * @param {gameify.shapes.Shape} shape - The shape (This shape is NOT copied, and it's position will be modified)
         * @param {gameify.Vector2d} [offset] - The shape's offset (to align it properly)
         *//** Set a shape for collisions. If no offset is provided, the shape's position is used.
         * @method
         * @param {gameify.shapes.Shape} shape - The shape (This shape is NOT copied, and it's position will be modified)
         * @param {Number} [offsetx] - The shape's offset x (to align it properly)
         * @param {Number} [offsety] - The shape's offset y
         */
        setShape = (shape, x, y) => {
            this.shape = shape;
            if (x !== undefined && y === undefined) {
                this.shapeOffset = new vectors.Vector2d(x);
            } else if (x !== undefined && y !== undefined) {
                this.shapeOffset = new vectors.Vector2d(x, y);
            } else {
                this.shapeOffset = shape.position.copy();
            }
        }

        /** Change the Sprite's image / texture
         * @method
         * @param {gameify.Image} newImage - The image to change the sprite to
         */
        setImage = (newImage) => {
            this.image = newImage;
        }

        /** Run a function when this sprite updates
         * @method
         * @param {function} callback - The function to be run when the sprite updates. An optional argument can be included for a delta since the last update, and another for a reference to the sprite
         */
        onUpdate = (callback) => {
            this.updateFunction = callback;
        }

        /** Have the sprite move towards a point.
         * @method
         * @param {gameify.Vector2d} pos - The point to move towards
         * @param {Number} [speed] - How quickly the sprite should move towards the point. If speed isn't specified, it keeps its current speed.
         */
        goTowards = (pos, speed) => {
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
         * @method
         * @param {gameify.Vector2d} point -  The point to face towards
         * @param {Number} [offset] -  Rotational offset, in degrees
        */
        faceTowards = (point, offset) => {
            const rise = this.position.y - point.y;
            const run = this.position.x - point.x;
                                            // convert to degrees  // add the offset
            this.rotation = (Math.atan(rise / run) * 180/Math.PI) + (offset || 0);
            if (run < 0) {
                this.rotation -= 180;
            }
        }

        /** Update the Sprite
         * @method
         * @param {Number} [delta] - The time, in miliseconds, since the last frame
         * @param {Boolean} [updateAnimator] - Whether or not to update the animator
        */
        update = (delta, updateAnimator = true) => {
            if (delta === undefined) {
                delta = 1000;
                if (!this.#deltaWarned) {
                    console.warn(`You should include a delta argument with your update call, eg sprite.update(delta)
This way speeds and physics are the same regardless of FPS or how good your computer is.`);
                    this.#deltaWarned = true;
                }
            }
            
            if (updateAnimator) {
                this.animator.update(delta);
            }

            // make the velocity dependant on the update speed
            this.position = this.position.add(this.velocity.multiply(delta/1000));

            if (this.shape) {
                this.shape.position = this.position.add(this.shapeOffset);
            }

            if (this.updateFunction) {
                this.updateFunction(delta, this);
            }
        }

        /** Set the draw function for this sprite
         * @method
         * @param {function} callback - The function to be called right before the sprite is drawn
         */
        onDraw = (callback) => {
            this.#drawFunction = callback;
        }

        /** Draw the Sprite
         * @method
         */
        draw = () => {
            if (this.#drawFunction) {
                this.#drawFunction();
            }
            if (!this.#context) {
                throw new Error("You need to add this sprite to a screen before you can draw it.");
            }

            const crop = this.image.getCrop();

            this.image.draw( this.#context,
                             this.position.x, this.position.y,
                             crop.width * this.scale,
                             crop.height * this.scale,
                             this.rotation, /* ignoreOpacity= */ true  );
        }

        /** Get the size of the sprite
         * @returns {gameify.Vector2d}
         */
        getSize = () => {
            const crop = this.image.getCrop();
            return new vectors.Vector2d(
                crop.width * this.scale,
                crop.height * this.scale,
            );
        }

        /** Get the screen this sprite draws to
         * @method
         * @returns {gameify.Screen}
         */
        getParent = () => {
            return this.parent;
        }

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Screen
         * @method
         * @package
         */
        setContext = (context, parent) => {
            this.#context = context;
            this.parent = parent;
        }
    }
};