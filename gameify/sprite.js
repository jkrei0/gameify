import { vectors } from "./vector.js"

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
    Sprite: function (x, y, image) {
        if (x === '_deserialize') {
            // data - saved data
            // find - a function to find an object based on a saved name
            return (data, find) => {
                const obj = new sprites.Sprite(data.position?.x || 0, data.position?.y || 0, undefined);
                if (data.rotation) obj.rotation = data.rotation;    // Set rotation
                if (data.image.parent) {
                    console.log(data.image.parent);
                    const set = find(data.image.parent);
                    obj.setImage(set.getTile(data.image.position.x, data.image.position.y));
                } else if (data.image) {
                    obj.setImage(find(data.image.name)); // Set image
                }
                if (data.shape) obj.setShape(find(data.shape)); // Set shape
                if (data.parent) find(data.parent).add(obj);    // Add to screen
                return obj;
            }
        }
        // name - a function to generate a name for an object to be restored later
        this.serialize = (name) => {
            return {
                position: {
                    x: this.position.x,
                    y: this.position.y
                },
                rotation: this.rotation,
                image: {
                    name: name(this.image),
                    parent: name(this.image.tileData?.tileset),
                    position: this.image.tileData?.position
                },
                shape: name(this.shape),
                parent: name(this.parent)
            };
        }

        /** The position of the Sprite on the screen
         * @type {gameify.Vector2d}
         */
        this.position = new vectors.Vector2d(x, y);

        /** The velocity of the Sprite
         * @type {gameify.Vector2d}
         */
        this.velocity = new vectors.Vector2d(0, 0);

        /** The Sprite's image / texture
         */
        this.image = image;

        /** The sprite's rotation, in degrees */
        this.rotation = 0;

        /** The sprite's shape, for collision, etc. Use setShape to set the shape
         * @type {shapes.Shape}
         */
        this.shape = undefined;

        /** Set a shape for collisions
         * @param {gameify.shapes.Shape} shape
         */
        this.setShape = (shape) => {
            this.shape = shape;
        }

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

            if (this.shape) {
                this.shape.position.x = this.position.x;
                this.shape.position.y = this.position.y;
            }

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
                throw new Error("You need to add this sprite to a screen before you can draw it.");
            }

            const crop = this.image.getCrop();

            this.image.draw( this.context,
                             this.position.x, this.position.y,
                             crop.width * this.scale,
                             crop.height * this.scale,
                             this.rotation );

            // if (this.shape) {
            //     this.shape.draw(this.context);
            // }
        }

        /** The Canvas context to draw to
         * @private
         */
        this.context = null;

        /** The parent screen (not used directly)
         * @private
         */
        this.parent = null;

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Screen
         * @private
         */
        this.setContext = (context, parent) => {
            this.context = context;
            this.parent = parent;
        }
    }
};