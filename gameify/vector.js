import { docs } from './docs.js';

/** Vectors for use in gameify. Usually you'll access these through the gameify object.
 * @example // Use vectors via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myVector = new gameify.Vector2d(0, 0);
 * @example // Import just vectors
 * import { vectors } from "./gameify/vectors.js"
 * let myVector = new vectors.Vector2d(0, 0);
 * @global
 */
export let vectors = {
    /** A 2d vector. Usually used to represent things such as distance, direction, position, velocity, etc.
     * You can use two numbers, a formatted string, or another Vector2d to create a new Vector2d
     * @alias gameify.Vector2d
     * @constructor
     * @example // A vector from two numbers
     * let vectorA = new gameify.Vector2d(5, 8);
     * // A vector from a formatted string
     * let vectorB = new gameify.Vector2d("<4, 6>");
     * // A vector from another vector (copying it)
     * let vectorC = new gameify.Vector2d(vectorA)
     * @arg {Number|gameify.Vector2d|String} x - x coordinate OR an existing vector
     * @arg {Number} [y] - y coordinate
    */
    Vector2d: class {
        constructor(x, y) {
            this.x = Number(x);
            this.y = Number(y);
            if (typeof(x) === "object") {
                this.x = x.x;
                this.y = x.y;
            } else if (typeof(x) === "string" && isNaN(x)) {
                this.x = parseFloat(x.match(/(\d|\.)+(?=,)/));
                this.y = parseFloat(x.match(/(\d|\.)+((?!\d*,)|$)/));
            }
            if (isNaN(this.x) || isNaN(this.y)) {
                throw new Error(`You can use either two numbers, a formatted string, or an existing Vector2d to create a Vector2d. (Given ${x}, ${y})`);
            }
        }

        #x = 0;
        #y = 0;
        
        /** The x (a) point of the vector
         * @type {Number}
         * @name gameify.Vector2d#x
         */
        get x() { return this.#x; }
        set x(value) {
            if (typeof value !== 'number') {
                throw new Error("Vector2d.x must be a number!");
            }
            this.#x = value;
        }
        
        /** The y (b) point of the vector
         * @type {Number}
         * @name gameify.Vector2d#y
         */
        get y() { return this.#y; }
        set y(value) {
            if (typeof value !== 'number') {
                throw new Error("Vector2d.y must be a number!");
            }
            this.#y = value;
        }

        /** Returns a copy of the vector
         * @method
         * @returns {gameify.Vector2d} */
        copy = () => {
            return new vectors.Vector2d(this.x, this.y);
        }

        /** Calculate the distance between a this and another vector
         * (From this vector's coordinates to the other vector's coordinates)
         * @method
         * @param {gameify.Vector2d} point - The start of the line segment
         * @return {Number} The distance to the vector
         *//** Calculate the distance between a this and a line segment
         * (From this vector's coordinates to the closest point on the line segment)
         * @method
         * @param {gameify.Vector2d} segmentStart - The start of the line segment
         * @param {gameify.Vector2d} segmentEnd - The end of the line segment (start/end order does not matter)
         * @return {Number} The distance between this point and the line segment
         */
        distanceTo = (start, end) => {

            if (end === undefined) {
                // 1st overload, distance to point
                return Math.sqrt((this.x - start.x)**2 + (this.y - start.y)**2)
            }

            // 2nd overload, distance to segment

            const A = this.x - start.x
            const B = this.y - start.y
            const C = end.x - start.x
            const D = end.y - start.y

            const dot = A * C + B * D;
            // line segment length squared
            const lengthSquared = C**2 + D**2;
            // 0 < param <= 1 --> Closest to line, not end points
            // param < 0 --> Closest to start point
            // param > 1 --> Closest to end point
            let param = -1;
            // Don't divide by zero!
            // In case of zero-length, use param < 0 (measure from start point)
            if (lengthSquared !== 0) {
                param = dot / lengthSquared;
            }
            // Project the point onto the segment
            let proj = new vectors.Vector2d(0, 0);

            if (param < 0) {
                // Project to start point
                proj.x = start.x;
                proj.y = start.y
            } else if (param > 1) {
                // Project to end point
                proj.x = end.x;
                proj.y = end.y;
            } else {
                // Project to segment
                proj.x = start.x + param * C;
                proj.y = start.y + param * D;
            }
            
            // Distance from original point to projected point
            return Math.sqrt((this.x - proj.x)**2 + (this.y - proj.y)**2);
        }
        /** Returns the length (magnitude) of the vector. Equivalent to vector.getMagnitude
         * @method
         */
        getDistance = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns the (magnitude) length of the vector. Equivalent to vector.getDistance
         * @method
         */
        getMagnitude = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns a normalized copy of the vector (Sets the length equal to one while maintaining the direction)
         * @returns {gameify.Vector2d}
         * @method
         */
        getNormalized = () => {
            const dist = this.getDistance();
            if (dist === 0) {
                return new vectors.Vector2d(this.x, this.y);
            }
            return new vectors.Vector2d(this.x / dist, this.y / dist);
        }
        /** Returns a copy of the vector with both coordinates to the nearest integer
         * @method
         * @return {gameify.Vector2d}
         */
        rounded = () => {
            return new vectors.Vector2d(Math.round(this.x), Math.round(this.y));
        }
        /** Normalizes the vector (Sets the length equal to one while maintaining the direction)
         * @method
         */
        normalize = () => {
            const normalized = this.getNormalized();
            this.x = normalized.x;
            this.y = normalized.y;
        }
        /** Adds this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @method
         * @arg {gameify.Vector2d} vectorB - The vector to add
         * @returns {gameify.Vector2d}
         */
        add = (vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;
            return new vectors.Vector2d(this.x + vectorB.x, this.y + vectorB.y);
        }
        /** Subtracts this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @method
         * @arg {gameify.Vector2d} vectorB - The vector to subtract
         * @returns {gameify.Vector2d}
         */
        subtract = (vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;
            return new vectors.Vector2d(this.x - vectorB.x, this.y - vectorB.y);
        }
        /** Multiplies this vector by an amount
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = vectorA.multiply(4); // vectorB = <12, -8>
         * @method
         * @arg {Number} value - The amount to multiply by
         * @returns {gameify.Vector2d}
         */
        multiply = (value) => {
            return new vectors.Vector2d(this.x * value, this.y * value);
        }
        /** Returns a copy of this vector rotated by an angle, in radians (counterclockwise)
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * vectorA.rotated(Math.PI/2); // vectorA = <-2, 3>
         * @method
         * @arg {Number} angle - The angle to rotate by, in degrees
         * @returns {gameify.Vector2d}
         */
        rotated = (angle) => {
            return new vectors.Vector2d(
                (this.x * Math.cos(angle)) - (this.y * Math.sin(angle)),
                (this.x * Math.sin(angle)) + (this.y * Math.cos(angle))
            )
        }
        /** Returns a copy of this vector rotated by an angle, in degrees (counterclockwise)
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * vectorA.rotatedDegrees(90); // vectorA = <-2, 3>
         * @method
         * @arg {Number} angle - The angle to rotate by, in degrees
         * @returns {gameify.Vector2d}
         */
        rotatedDegrees = (angle) => {
            return this.rotated(angle * (Math.PI / 180));
        }
        /** Linear interpolation from this vector to another
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, 12);
         * // Get a vector half way between A and B
         * let vectorC = vectorA.linearInterpolate(vectorB, 0.5); // vectorC = <5, 7>
         * @method
         * @arg {gameify.Vector2d} vectorB - The vector to interpolate to
         * @arg {Number} t - A number from 0 to 1, with larger values closer to vectorB
         * @returns {gameify.Vector2d}
        */
        linearInterpolate = (vectorB, t) => {
            // Linear interpolation is A * (1 - t) + B * t
            return new vectors.Vector2d(this.x + (vectorB.x - this.x) * t, this.y + (vectorB.y - this.y) * t);
        }
        /** Truncates the x and y values to a certain precision
         * @method
         * @param {Number} [precision=0] - Values after the decimal to keep
         * @returns {gameify.Vector2d} The vector with truncated values
         */
        truncated = (precision = 0) => {
            const amt = 10 ** precision;
            return new vectors.Vector2d(
                Math.floor(this.x * amt)/amt,
                Math.floor(this.y * amt)/amt
            );
        }

        /** Returns a string representing the vector in the form <code>"&lt;x, y&gt;"</code>. Truncated to three decimal places.
         * @method
         * @returns {String}
         */
        toString = () => {
            return `<${Math.floor(this.x*1000)/1000}, ${Math.floor(this.y*1000)/1000}>`;
        }
        /** Same as toString, but does not truncate the string.
         * @method
         */
        toRawString = () => {
            return `<${this.x}, ${this.y}>`;
        }
        /** Returns a JSON representation of the vector
         * @method
         */
        toJSON = () => {
            return {
                x: this.x,
                y: this.y
            }
        }
        /** Returns a string representation of the vector, equivalent to toString
         * @method
         */
        valueOf = this.toString;
    },
    /** Vector helpers
     * @member
     * @alias gameify.vectors
     * @example // Create a new vector <0, 0>
     * let myVector = gameify.vectors.ZERO()
     */
    vectors: {
        /** A zero vector for reference and calculation
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * // Interpolate vectorA towards zero (using gameify.vectors.ZERO to avoid having to make a new vector)
         * let vectorB = vectorA.linearInterpolate(gameify.vectors.ZERO, 0.5); // vectorB = <1.5, 1>*/
        ZERO: () => { return new vectors.Vector2d(0, 0); },
        /** The i vector <1, 0> for reference and calculation */
        i: () => { return new vectors.Vector2d(1, 0); },
        /** The j vector <0, 1> for reference and calculation */
        j: () => { return new vectors.Vector2d(0, 1); },
        /** Checks if a vector is compatible with operations in this one
         * @package
         */
        isCompatibleVector: (vector) => {
            if (typeof(vector.x) != "number" || typeof(vector.y) != "number") {
                return false;
            }
            return true;
        },
        assertIsCompatibleVector: (vector) => {
            if (typeof(vector.x) != "number" || typeof(vector.y) != "number") {
                console.error(`The vector you're passing to this function is either broken or not a vector. See ${docs.getDocs("gameify.Vector2d")} for help`);
                return false;
            }
            return true;
        },
        /** Given two vectors, returns the one with the greatest magnitude (length)
         * @arg {gameify.Vector2d} vectorA
         * @arg {gameify.Vector2d} vectorB
         */
        longestOf: (vectorA, vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorA)) return;
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;

            if (vectorA.getMagnitude() > vectorB.getMagnitude()) {
                return vectorA;
            }
            return vectorB;
        },
        /** Given two vectors, returns the one with the least magnitude (length)
         * @arg {gameify.Vector2d} vectorA
         * @arg {gameify.Vector2d} vectorB
         */
        shortestOf: (vectorA, vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorA)) return;
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;
            
            if (vectorA.getMagnitude() < vectorB.getMagnitude()) {
                return vectorA;
            }
            return vectorB;
        }
    }
}