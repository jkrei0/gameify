import { vectors } from "./vector.js"

"use strict"

/** Shapes and collision detection
 * @global
 */
export let shapes = {
    /** A generic shape. The base for all other shapes.
     * @constructor
     * @package
     * @param {String} type - The shape type
     */
    Shape: function (type) {
        /** The type  */
        this.type = type || "Shape";
        this.position = vectors.vectors.ZERO();

        /** Check if this shape collides with another shape
         * @virtual
         * @param {shapes.Shape} obj - 
         */
        this.collidesWith = (obj) => {
            throw new Error('CollidesWith must be implemented by each specific shape type and is not available in the Shape class');
        }
    },
    /** A circle shape
     * @constructor
     * @extends shapes.Shape
     */
    Circle: function (x, y, radius) {
        shapes.Shape.call(this, "Circle");

        this.centerOffset = new vectors.Vector2d(x, y);

        this.radius = radius;

        this.collidesWith = () => {

        }
    }
};