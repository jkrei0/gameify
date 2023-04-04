import { vectors } from "./vector.js"

"use strict"

/** Shapes and collision detection for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use sprites via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myCircle = new gameify.shapes.Circle(0, 0, 5);
 * @example // Import just shapes
 * import { shapes } from "./gameify/collision.js"
 * let myCircle = new shapes.Circle(0, 0, 5);
 * @global
 */
export let shapes = {
    /** A generic shape. The base for all other shapes.
     * @constructor
     * @package
     * @alias gameify.shapes.Shape
     * @param {string} type - The shape type
     */
    Shape: function (type) {
        /** A string represeting the type of shape */
        this.type = type || "Shape";
        
        /** The position of the shape, often locked to the position of a sprite that it represents
         * @type {gameify.Vector2d}
         */
        this.position = vectors.vectors.ZERO();

        /** The point that the shape rotates around, relative to its position
         * @type {gameify.Vector2d}
         */
        this.rotationPoint = vectors.vectors.ZERO();

        /** The rotation of the shape, in degrees, rotated around the shape's rotation point */
        this.rotation = 0;

        /** Rotate the shape around its rotationPoint
         * @param {number} rotation - The (absolute) rotation in degrees
         *//**
         * Rotate the shape around a given point (also sets the rotationPoint)
         * @param {number} rotation - The (absolute) rotation in degrees
         * @param {number} x - The x position, relative to the shape's position, to rotate around
         * @param {number} y - The y position, relative to the shape's position, to rotate around
         *//**
         * Rotate the shape around a given point (also sets the rotationPoint)
         * @param {number} rotation - The (absolute) rotation in degrees
         * @param {gameify.Vector2d} point - The point (relative to the shape's position) to rotate around
         */
        this.setRotation = (rotation, x, y) => {
            let rotationVector = this.rotationPoint;
            if (x !== undefined && y === undefined) {
                // 3rd overload, x is a vector
            }
            // TODO shape rotation
        }

        /** Check if this shape collides with another shape
         * @virtual
         * @param {shapes.Shape} obj - The object to check for collision
         */
        this.collidesWith = (obj) => {
            throw new Error("shape.collidesWith must be implemented by each specific shape type");
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
     * @alias gameify.shapes.Circle
     * @extends gameify.shapes.Shape
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} radius - The circle radius
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