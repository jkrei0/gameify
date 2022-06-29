import { vectors } from "./vector.js"

"use strict"

/** Shapes and collision detection for use in gameify
 * @global
 */
export let shapes = {
    /** A generic shape. The base for all other shapes.
     * @constructor
     * @package
     * @param {String} type - The shape type
     */
    Shape: function (type) {
        /** A string represeting the type of shape */
        this.type = type || "Shape";
        
        /** The position of the shape, often locked to the position of a sprite that it represents
         * @type {gameify.Vector2d}
         */
        this.position = vectors.vectors.ZERO();

        /** Check if this shape collides with another shape
         * @virtual
         * @param {shapes.Shape} obj - 
         */
        this.collidesWith = (obj) => {
            throw new Error("shape.collidesWith must be implemented by each specific shape type");
        }

        /** The sprite this shape is following
         * @private
         */
        this.followedSprite = undefined;
        
        /** Make the shape follow the position of a sprite. This should be done automatically if you attach it via the sprite
         * @param {gameify.Sprite} sprite - The sprite to follow
         * @package
         */
        this.followSprite = (sprite) => {
            this.followedSprite = sprite;
        }

        /** Update the shape. This should be done automatically if you attach it via the sprite
         * @package
         */
        this.update = () => {
            this.position.x = this.followedSprite.position.x;
            this.position.y = this.followedSprite.position.y;
        }

        /** Draw a hitbox for debugging
         * @virtual
         * @param {CanvasRenderingContext2D} context - The rendering context to draw to
         */
        this.draw = (canvas) => {
            throw new Error("shape.draw must be implemented by each specific shape type");
        }
    },
    /** A circle shape
     * @constructor
     * @extends shapes.Shape
     */
    Circle: function (x, y, radius) {
        shapes.Shape.call(this, "Circle");

        /** The center of the circle, relative to the circle's position
         * @type {gameify.Vector2d}
         */
        this.centerOffset = new vectors.Vector2d(x, y);

        /** The radius of the circle */
        this.radius = radius;

        this.collidesWith = (obj, recursion) => {
            if (obj.type === "Circle") {
                let pos1 = this.position.add( this.centerOffset );
                let pos2 = obj.position.add( obj.position.centerOffset );

                return ( pos1.subtract(pos2).getDistance() < this.radius + obj.radius );

            } else {
                // don't create an infinite recursion loop if neither object has a collision function
                if (recursion) {
                    throw new Error("Collision between these shapes is not supported.");
                }
                // else see if the passed object can handle the request
                return obj.collidesWith(this, true);
            }
        }

        this.draw = (context) => {
            context.beginPath();
            context.arc( this.position.x + this.centerOffset.x,
                         this.position.y + this.centerOffset.y,
                         this.radius, 0, 2 * Math.PI );
            context.stroke();

        }

    }
};