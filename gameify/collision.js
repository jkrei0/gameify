import { vectors } from "./vector.js"

"use strict"

/** Shapes and collision detection for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use shapes via gameify
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
        /** A string represeting the type of shape, eg "Circle"
         * @type {String}
        */
        this.type = type || "Shape";
        
        /** The position of the shape, often locked to the position of a sprite that it represents
         * @type {gameify.Vector2d}
         */
        this.position = vectors.vectors.ZERO();

        /** Check if this shape collides with another shape
         * @virtual
         * @param {shapes.Shape} obj - The object to check for collision
         * @return {Boolean}
         */
        this.collidesWith = (obj) => {
            throw new Error("shape.collidesWith must be implemented by each specific shape type");
        }

        /** Check if a point (Vector2d) is inside this shape
         * @virtual
         * @param {gameify.Vector2d} point - The point to check
         * @return {Boolean}
         */
        this.contains = (point) => {
            throw new Error("shape.contains must be implemented by each specific shape type");
        }

        /** The stroke color when this shape is drawn
         * @type {String}
        */
        this.strokeColor = "#25ac",
        /** The fill color when this shape is drawn
         * @type {String}
         */
        this.fillColor = "#58c3",

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

        if (typeof x !== "number" || typeof y !== "number" || typeof radius !== "number") {
            throw "Circle x, y, and radius must be numbers";
        }

        this.position = new vectors.Vector2d(x, y);

        /** The radius of the circle
         * @type {Number}
        */
        this.radius = radius;
        
        /** Check if this shape collides with another shape
         * @param {shapes.Shape} obj - The object to check for collision
         * @return {Boolean}
         */
        this.collidesWith = (obj, recursion) => {
            if (obj.type === "Circle") {
                return ( this.position.subtract(obj.position).getDistance() < this.radius + obj.radius );

            } else {
                // don't create an infinite recursion loop if neither object has a collision function
                if (recursion) {
                    throw new Error("Collision between these shapes is not supported.");
                }
                // else see if the passed object can handle the request
                return obj.collidesWith(this, /*recursion=*/true);
            }
        }

        /** Check if a point (Vector2d) is inside this shape
         * @param {gameify.Vector2d} point - The point to check
         * @return {Boolean}
         */
        this.contains = (point) => {
            return this.position.distanceTo(point) < this.radius;
        }

        /** Draw the shape to a given context
         * @param {CanvasRenderingContext2D} context - The canvas context to draw to
         */
        this.draw = (context) => {
            context.strokeStyle = this.strokeColor;
            context.fillStyle = this.fillColor;
            context.beginPath();
            context.arc( this.position.x,
                         this.position.y,
                         this.radius, 0, 2 * Math.PI );
            context.stroke();
            context.fill();
        }

    },
    /** A rectangle shape
     * @constructor
     * @alias gameify.shapes.Rectangle
     * @extends gameify.shapes.Shape
     * @param {number} x - The x position
     * @param {number} y - The y position
     * @param {number} width - The rectangle width
     * @param {number} height - The rectangle height
     */
    Rectangle: function (x, y, width, height) {
        shapes.Shape.call(this, "Rectangle");

        if (typeof x !== "number"
            || typeof y !== "number"
            || typeof width !== "number"
            || typeof height !== "number"
        ) {
            throw "Circle x, y, and radius must be numbers";
        }

        if (width < 0 || height < 0) {
            width = Math.abs(width);
            height = Math.abs(height);
            console.warn('Rectangle width and height should be >= 0. Using absolute values instead.');
        }
        
        this.position = new vectors.Vector2d(x, y);
        /** The size (width and height) of the rectangle
         * @type {gameify.Vector2d}
         */
        this.size = new vectors.Vector2d(width, height);

        /** Check if this shape collides with another shape
         * @param {shapes.Shape} obj - The object to check for collision
         * @return {Boolean}
         */
        this.collidesWith = (obj, recursion) => {
            if (obj.type === "Rectangle") {
                if (this.position.x < obj.position.x + obj.size.x && this.position.x + this.size.x > obj.position.x
                    && this.position.y < obj.position.y + obj.size.y && this.position.y + this.size.y > obj.position.y
                ) return true;

                // else no collision
                return false;

            } else if (obj.type === "Circle") {
                const topRight = new vectors.Vector2d(this.position);
                topRight.x += this.size.x;
                const bottomLeft = new vectors.Vector2d(this.position);
                bottomLeft.y += this.size.y;
                const bottomRight = new vectors.Vector2d(this.position).add(this.size);

                if (obj.position.distanceTo(this.position, topRight) < obj.radius
                    || obj.position.distanceTo(this.position, bottomLeft) < obj.radius
                    || obj.position.distanceTo(topRight, bottomRight) < obj.radius
                    || obj.position.distanceTo(bottomLeft, bottomRight) < obj.radius
                    || (obj.position.x > this.position.x && obj.position.y > this.position.y
                        && obj.position.x < bottomRight.x && obj.position.y < bottomRight.y)
                ) {
                    return true;
                }
                return false;

            } else {
                // don't create an infinite recursion loop if neither object has a collision function
                if (recursion) {
                    throw new Error("Collision between these shapes is not supported.");
                }
                // else see if the passed object can handle the request
                return obj.collidesWith(this, /*recursion=*/true);
            }
        }
        
        /** Check if a point (Vector2d) is inside this shape
         * @param {gameify.Vector2d} point - The point to check
         * @return {Boolean}
         */
        this.contains = (point) => {
            if (this.position.x < point.x && this.position.x + this.size.x > point.x
                && this.position.y < point.y && this.position.y + this.size.y > point.y
            ) {
                return true;
            } else {
                return false;
            }
        }

        /** Draw the shape to a given context
         * @param {CanvasRenderingContext2D} context - The canvas context to draw to
         */
        this.draw = (context) => {
            context.strokeStyle = this.strokeColor;
            context.fillStyle = this.fillColor;
            context.beginPath();
            context.rect(this.position.x, this.position.y,
                         this.size.x, this.size.y);
            context.stroke();
            context.fill();
        }
    }
};