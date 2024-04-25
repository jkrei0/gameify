import { vectors } from "./vector.js"

"use strict"

/** A generic shape. The base for all other shapes.
 * @constructor
 * @arg {string} type - The shape type
 * @arg {number} [x=0] - The x position
 * @arg {number} [y=0] - The y position
 * @alias gameify.shapes.Shape
 */
class Shape {
    constructor(type, x = 0, y = 0) {
        this.#type = type || "Shape";

        if (typeof x !== "number" || typeof y !== "number") {
            throw "Shape x and y radius must be numbers";
        }
        
        this.position = new vectors.Vector2d(x, y);
    }

    /** Creates a object from JSON data
     * @method
     * @arg {Object|Array} data - Serialized object data (from object.toJSON)
     * @returns {gameify.Tileset}
    */
    static fromJSON = (data) => {
        let newShape;
        switch (data.type) {
            case "Shape":
                newShape = new Shape(data.type, data.position.x, data.position.y); break;
            case "Circle":
                newShape = new Circle(data.position.x, data.position.y, data.radius); break;
            case "Rectangle":
                newShape = new Rectangle(data.position.x, data.position.y, data.size.x, data.size.y); break;
            case "Polygon":
                newShape = new Polygon(data.position.x, data.position.y, data.points); break;
            default:
                throw new Error("Unknown shape type: " + data.type);
        }
        newShape.strokeColor = data.strokeColor;
        newShape.fillColor = data.fillColor;
        return newShape;

    }

    /** Create a copy of the shape */
    copy = () => {
        // Use toJSON, not __toJSON, because we want to store the
        // actual shape data.
        return Shape.fromJSON(this.toJSON());
    }

    /** Convert the object to JSON. Not available on the base Shape, only on inherited classes
     * @method
     * @alias gameify.shapes.Shape#toJSON
     */
    __toJSON = (key) => {
        return {
            type: this.#type,
            position: this.position.toJSON(),
            strokeColor: this.strokeColor,
            fillColor: this.fillColor
        }
    }

    #type;

    /** A string represeting the type of shape, eg "Circle"
     * @type {String}
     * @readonly
     * @name gameify.shapes.Shape#type
     */
    get type() { return this.#type; }

    /** The position of the shape, often locked to the position of a sprite that it represents
     * @type {gameify.Vector2d}
     */
    position = new vectors.Vector2d(0, 0);

    /** The stroke color when this shape is drawn
     * @type {String}
     */
    strokeColor = "#25ac";
    
    /** The fill color when this shape is drawn
     * @type {String}
     */
    fillColor = "#58c3";

    /** Check if this shape collides with another shape
     * @virtual
     * @method
     * @arg {shapes.Shape} obj - The object to check for collision
     * @arg {Boolean} [recursion=false] - If this is a recursive call
     * @return {Boolean}
     */
    collidesWith = (obj, recursion) => {
        throw new Error("shape.collidesWith is not available in the base Shape class. It must be implemented by each specific shape type");
    }

    /** Check if a point (Vector2d) is inside this shape
     * @virtual
     * @method
     * @param {gameify.Vector2d} point - The point to check
     * @return {Boolean}
     */
    contains = (point) => {
        throw new Error("shape.contains is not available in the base Shape class. It must be implemented by each specific shape type");
    }
    
    /** Draw a hitbox for debugging
     * @virtual
     * @method
     * @param {CanvasRenderingContext2D} context - The rendering context to draw to
     */
    draw = (canvas) => {
        throw new Error("shape.draw is not available in the base Shape class. It must be implemented by each specific shape type");
    }

    /** Scale the shape by a factor
     * @method
     * @arg {Number} scale - The scale factor
     */
    scale(scale) {
        this.position = this.position.multiply(scale);
    }

}
/** A circle shape
 * @constructor
 * @alias gameify.shapes.Circle
 * @extends gameify.shapes.Shape
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @param {number} radius - The circle radius
 */
class Circle extends Shape {
    constructor (x, y, radius){
        super("Circle", x, y);

        if (typeof radius !== "number") {
            throw "Circle radius must be a number";
        }

        this.radius = radius;
    }

    /** Convert the object to JSON
     * @method
     */
    toJSON(key) {
        const data = this.__toJSON(key);
        data.radius = this.radius;
        return data;
    }

    #radius;

    /** The radius of the circle
     * @type {Number}
     * @name gameify.shapes.Circle#radius
    */
    get radius() { return this.#radius; }
    set radius(value) {
        if (typeof value !== "number") {
            throw "Circle radius must be a number";
        }
        this.#radius = value;
    }
    
    /** Check if this shape collides with another shape
     * @method
     * @arg {shapes.Shape} obj - The object to check for collision
     * @arg {Boolean} [recursion=false] - If this is a recursive call
     * @return {Boolean}
     */
    collidesWith = (obj, recursion) => {
        if (obj.type === "Circle") {
            return ( this.position.subtract(obj.position).getMagnitude() < this.radius + obj.radius );

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
     * @method
     * @returns {Boolean}
     */
    contains = (point) => {
        vectors.Vector2d.assertIsCompatibleVector(point);
        return this.position.distanceTo(point) < this.radius;
    }

    /** Draw a hitbox for debugging
     * @method
     * @param {CanvasRenderingContext2D} context - The rendering context to draw to
     */
    draw = (context) => {
        context.strokeStyle = this.strokeColor;
        context.fillStyle = this.fillColor;
        context.beginPath();
        context.arc( this.position.x,
                        this.position.y,
                        this.radius, 0, 2 * Math.PI );
        context.stroke();
        context.fill();
    }

    /** Scale the shape by a factor
     * @method
     * @arg {Number} scale - The scale factor
     */
    scale = (scale) => {
        super.scale(scale);
        this.radius *= scale;
    }
}
/** A rectangle shape
 * @constructor
 * @alias gameify.shapes.Rectangle
 * @extends gameify.shapes.Shape
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @param {number} width - The rectangle width
 * @param {number} height - The rectangle height
 */
class Rectangle extends Shape {
    constructor (x, y, width, height) {
        super("Rectangle", x, y);
        if (typeof width !== "number" || typeof height !== "number") {
            throw "Rectangle width and height must be numbers";
        }
        if (width < 0 || height < 0) {
            width = Math.abs(width);
            height = Math.abs(height);
            console.warn('Rectangle width and height should be >= 0. Using absolute values instead.');
        }

        this.size = new vectors.Vector2d(width, height);
    }

    /** Convert the object to JSON
     * @method
     */
    toJSON(key) {
        const data = this.__toJSON(key);
        data.size = this.#size.toJSON();
        return data;
    }

    #size;

    /** The size (width and height) of the rectangle
     * @type {gameify.Vector2d}
     * @name gameify.shapes.Rectangle#size
     */
    get size() { return this.#size; }
    set size(value) {
        this.#size = new vectors.Vector2d(value);
    }

    /** The width of the rectangle (alias of Rectangle.size.x)
     * @type {Number}
     * @name gameify.shapes.Rectangle#width
    */
    get width () { return this.size.x; }
    set width(value) {
        this.size.x = value;
    }

    /** The height of the rectangle (alias of Rectangle.size.y)
     * @type {Number}
     * @name gameify.shapes.Rectangle#height
    */
    get height () { return this.size.y; }
    set height(value) {
        this.size.y = value;
    }

    /** Check if this shape collides with another shape
     * @method
     * @arg {shapes.Shape} obj - The object to check for collision
     * @arg {Boolean} [recursion=false] - If this is a recursive call
     * @return {Boolean}
     */
    collidesWith = (obj, recursion) => {
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
     * @method
     * @returns {Boolean}
     */
    contains = (point) => {
        vectors.Vector2d.assertIsCompatibleVector(point);
        if (this.position.x < point.x && this.position.x + this.size.x > point.x
            && this.position.y < point.y && this.position.y + this.size.y > point.y
        ) {
            return true;
        } else {
            return false;
        }
    }

    /** Draw a hitbox for debugging
     * @method
     * @param {CanvasRenderingContext2D} context - The rendering context to draw to
     */
    draw = (context) => {
        context.strokeStyle = this.strokeColor;
        context.fillStyle = this.fillColor;
        context.beginPath();
        context.rect(this.position.x, this.position.y,
                        this.size.x, this.size.y);
        context.stroke();
        context.fill();
    }

    /** Scale the shape by a factor
     * @method
     * @arg {Number} scale - The scale factor
     */
    scale = (scale) => {
        super.scale(scale);
        this.size = this.size.multiply(scale);
    }
}

/** A polygon shape
 * @constructor
 * @alias gameify.shapes.Polygon
 * @extends gameify.shapes.Shape
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @param {gameify.Vector2d[]} points - The points of the polygon, relative to the position of the polygon
 */
class Polygon extends Shape {
    constructor(x, y, points) {
        super("Polygon", x, y);
        if (!Array.isArray(points)) {
            throw new Error("Points must be an array of gameify.Vector2d or compatible vector.");
        }
        for (const v in points) {
            this.#points[v] = new vectors.Vector2d(points[v]);
        }
    }
    
    /** Convert the object to JSON
     * @method
     */
    toJSON(key) {
        const data = this.__toJSON(key);
        data.points = this.#points;
        return data;
    }

    #points = [];
    #segments;
    #segmentsUpdated = false;

    /** The points of the polygon, relative to the position of the polygon
     * @type {gameify.Vector2d[]}
     * @name gameify.shapes.Polygon#points
     */
    set points(value) {
        if (!Array.isArray(value))   {
            throw new Error("Points must be an array of gameify.Vector2d or compatible vector.");
        }
        this.#segmentsUpdated = false;
        for (const v in value) {
            this.points[v] = new vectors.Vector2d(value[v]);
        }
    }
    get points() {
        return new Proxy(this.#points, {
            get: (target, name) => {
                return target[name];
            },
            set: (target, name, value) => {
                this.#segmentsUpdated = false;
                if (name === "length") {
                    target.length = value;
                    return true;
                }
                target[name] = new vectors.Vector2d(value);
                return target[name];
            }
        });
    }

    /**
     * @typedef {Object} LineSegment
     * @property {gameify.Vector2d} a - The starting point of the line segment
     * @property {gameify.Vector2d} b - The ending point of the line segment
     */

    /**
     * The polygon, as an array of line segments, relative to the position of the polygon
     * @type {LineSegment[]}
     * @name gameify.shapes.Polygon#segments
     * @readonly
     */
    get segments() {
        if (this.#segments && this.#segmentsUpdated) {
            return this.#segments;
        }

        this.#segments = [];
        for (const i in this.#points) {
            const p1 = this.#points[i];
            const p2 = this.#points[(parseInt(i) + 1) % this.#points.length];
            this.#segments.push({
                a: p1, b: p2
            });
        }

        this.#segmentsUpdated = true;
        return this.#segments;
    }

    #lastpoint = null;

    /** Check if a point (Vector2d) is inside this shape
     * @param {gameify.Vector2d} point - The point to check
     * @method
     * @returns {Boolean}
     */
    contains = (point) => {
        vectors.Vector2d.assertIsCompatibleVector(point);

        this.#lastpoint = point;

        let intersections = 0;
        
        for (const seg of this.segments) {
            // Subtract a weird amount so we're not likely to have similar slopes
            const int = vectors.Vector2d.segmentsIntersect(
                seg.a.add(this.position), seg.b.add(this.position), point, vectors.Vector2d.from(point).subtract({x: 1000, y: 1120}),
                /*tolerance=*/undefined, /*collinear=*/false
            );
            if (int) {
                intersections++;
            }
        }

        return intersections % 2 === 1;
    }

    /** Check if this shape collides with another shape
     * @method
     * @arg {shapes.Shape} obj - The object to check for collision
     * @arg {Boolean} [recursion=false] - If this is a recursive call
     * @return {Boolean}
     */
    collidesWith = (obj, recursion) => {
        if (obj.type === "Rectangle") {
            // Rectangle intersects if any lines intersect
            // or if any points are inside the rectangle
            for (const seg of this.segments) {
                const adjPosA = seg.a.add(this.position)
                const adjPosB = seg.b.add(this.position);

                const intTop = vectors.Vector2d.segmentsIntersect(
                    adjPosA, adjPosB, obj.position, obj.position.add(obj.size.xComponent())
                );
                const intBottom = vectors.Vector2d.segmentsIntersect(
                    adjPosA, adjPosB, obj.position.add(obj.size.yComponent()), obj.position.add(obj.size)
                )
                const intLeft = vectors.Vector2d.segmentsIntersect(
                    adjPosA, adjPosB, obj.position, obj.position.add(obj.size.yComponent())
                );
                const intRight = vectors.Vector2d.segmentsIntersect(
                    adjPosA, adjPosB, obj.position.add(obj.size.xComponent()), obj.position.add(obj.size)
                );

                if (intTop || intBottom || intLeft || intRight) {
                    return true;
                }

                if (obj.contains(adjPosA)) {
                    return true;
                }
            }
            if (this.contains(obj.position) || this.contains(obj.position.add(obj.size))
                || this.contains(obj.position.add(obj.size.xComponent())) || this.contains(obj.position.add(obj.size.yComponent()))
            ) {
                return true;
            }
            return false;
        } else if (obj.type === "Circle") {
            // Circle intersects if its center is inside the polygon or
            // if it intersects any lines of the polygon
            for (const seg of this.segments) {
                const adjPosA = seg.a.add(this.position)
                const adjPosB = seg.b.add(this.position);

                const dist = obj.position.distanceTo(adjPosA, adjPosB);
                if (dist < obj.radius) {
                    return true;
                }
            }
            if (this.contains (obj.position)) {
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

    /** Draw a hitbox for debugging
     * @method
     * @param {CanvasRenderingContext2D} context - The rendering context to draw to
     */
    draw = (context) => {
        context.strokeStyle = this.strokeColor;
        context.fillStyle = this.fillColor;
        context.beginPath();
        for (const point of this.#points) {
            context.lineTo(this.position.x + point.x, this.position.y + point.y);
        }
        context.closePath();
        context.stroke();
        context.fill();
    }

    /** Scale the shape by a factor
     * @method
     * @arg {Number} scale - The scale factor
     */
    scale = (scale) => {
        super.scale(scale);

        for (const point of this.#points) {
            point.x *= scale;
            point.y *= scale;
        }   
    }
}

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
    Shape, Circle, Rectangle, Polygon
};
