

/** Vectors for use in gameify. Usually you'll access these through the gameify object.
 * @example // Use vectors via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myVector = new gameify.Vector2d(0, 0);
 * @example // Import just vectors
 * import { vectors } from "gameify/vectors.js"
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
     * @arg {Number|gameify.Vector2d|String} x
     * @arg {Number} [y]
    */
    Vector2d: function (x, y) {

        /** The x (a) point of the vector
         * @type {Number}
         */
        this.x = x;
        /** The y (b) point of the vector
         * @type {Number}
         */
        this.y = y;

        if (typeof(x) === "object") {
            this.x = x.x;
            this.y = x.y;
        } else if (typeof(x) === "string") {
            this.x = parseInt(x.match(/(\d|\.)+(?=,)/));
            this.y = parseInt(x.match(/(\d|\.)+(?=>)/));
        } else if (typeof(x) !== "number" && typeof(y) !== "number") {
            console.error(`You can use either two numbers, a formatted string, or an existing Vector2d to create a Vector2d. See ${gameify.getDocs("gameify.Vector2d")} for more details`);
        }

        /** Returns a copy of the vector
         * @returns {gameify.Vector2d} */
        this.copy = () => {
            return new vectors.Vector2d(this.x, this.y);
        }
        /** Returns the length (magnitude) of the vector. Equivalent to vector.getMagnitude */
        this.getDistance = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns the (magnitude) length of the vector. Equivalent to vector.getDistance */
        this.getMagnitude = () => {
            return Math.sqrt((this.x**2) + (this.y**2));
        }
        /** Returns a normalized copy of the vector (Sets the length equal to one while maintaining the direction)
         * @returns {gameify.Vector2d} */
        this.getNormalized = () => {
            const dist = this.getDistance();
            if (dist === 0) {
                return new vectors.Vector2d(this.x, this.y);
            }
            return new vectors.Vector2d(this.x / dist, this.y / dist);
        }
        /** Normalizes the vector (Sets the length equal to one while maintaining the direction)
         */
        this.normalize = () => {
            const normalized = this.getNormalized();
            this.x = normalized.x;
            this.y = normalized.y;
        }
        /** Adds this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @arg {gameify.Vector2d} vectorB - The vector to add
         * @returns {gameify.Vector2d}
         */
        this.add = (vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;
            return new vectors.Vector2d(this.x + vectorB.x, this.y + vectorB.y);
        }
        /** Subtracts this vector and another one
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, -3);
         * let vectorC = vectorA.add(vectorB); // vectorC = <10, -1>
         * @arg {gameify.Vector2d} vectorB - The vector to subtract
         * @returns {gameify.Vector2d}
         */
        this.subtract = (vectorB) => {
            if (!vectors.vectors.assertIsCompatibleVector(vectorB)) return;
            return new vectors.Vector2d(this.x - vectorB.x, this.y - vectorB.y);
        }
        /** Multiplies this vector by an amount
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = vectorA.multiply(4); // vectorB = <12, -8>
         * @arg {Number} value - The amount to multiply by
         * @returns {gameify.Vector2d}
         */
        this.multiply = (value) => {
            return new vectors.Vector2d(this.x * value, this.y * value);
        }
        /** Linear interpolation from this vector to another
         * @example let vectorA = new gameify.Vector2d(3, 2);
         * let vectorB = new gameify.Vector2d(7, 12);
         * // Get a vector half way between A and B
         * let vectorC = vectorA.linearInterpolate(vectorB, 0.5); // vectorC = <5, 7>
         * @arg {gameify.Vector2d} vectorB - The vector to interpolate to
         * @arg {Number} t - A number from 0 to 1, with larger values closer to vectorB
         * @returns {gameify.Vector2d}
        */
        this.linearInterpolate = (vectorB, t) => {
            // Linear interpolation is A * (1 - t) + B * t
            return new vectors.Vector2d(this.x + (vectorB.x - this.x) * t, this.y + (vectorB.y - this.y) * t);
        }

        /** Returns a string representing the vector in the form <code>"&lt;x, y&gt;"</code>. Truncated to three decimal places.
         * @returns {String}
         */
        this.toString = () => {
            return `<${Math.floor(this.x*1000)/1000}, ${Math.floor(this.y*1000)/1000}>`;
        }
        /** Same as toString, but does not truncate the string. Only for debug use
         * @package
         */
        this.toRawString = () => {
            return `<${this.x}, ${this.y}>`;
        }
        this.valueOf = this.toString;
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
                console.error(`The vector you're passing to this function is either broken or not a vector. See ${gameify.getDocs("gameify.Vector2d")} for help`);
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