
/** Image class for use in gameify. Usually you'll access this through the gameify object.
 * @example // Use images via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myImage = new gameify.Image("player.png");
 * @example // Import just images
 * import { images } from "./gameify/image.js"
 * let myImage = new images.Image("player.png");
 * @global
 */
export let images = {
    /** An image for use in sprites and other places. 
     * @alias gameify.Image
     * @example let playerImage = new gameify.Image("images/player.png");
     * @arg {String} [path] - The image filepath. (Can also be a dataURI). If not specified, the image is created with no texture
    */
    Image: class {
        constructor(path) {
            this.path = path || "";

            if (path !== undefined) {
                this.texture = document.createElement("img");
                this.texture.src = path;
                let pathName = path;
                if (path.length > 50) {
                    pathName = path.slice(0, 40) + '...';
                }
                this.texture.onerror = () => {
                    throw new Error(`Your image "${pathName}" couldn't be loaded. Check the path, and make sure you don't have any typos.`);
                }
                this.texture.onload = () => {
                    console.info(`Loaded image "${pathName}"`)
                    this.loaded = true;
        
                    // don't reset the crop if it was already specified.
                    if (!this.cropData.width) this.cropData.width = this.texture.width;
                    if (!this.cropData.height) this.cropData.height = this.texture.height;
        
                    if (this.#loadFunction) { this.#loadFunction(); }
                }
            }
        }

        /** The image filepath. Modifying this will not do anything.
         * @readonly
         */
        path;
        /** The opaciy of the image
         * @type {Number}
         * @default 1
         */
        opacity = 1;
        /** If the image is loaded
         * @type {Boolean}
         */
        loaded = false;
        #loadFunction = undefined;
        /** If the image was derived from a tileset, details about where it came from.
         * Mostly used for serialization. See example below for schema.
         * @example
         * {   // tileData schema:
         *     tileset: Tileset,
         *     position: { x: Number, y: Number }
         *     size: { x: Number, y: Number }
         * }
         * @type {Object}
         */
        tileData = {};
        cropData = { x: 0, y: 0, width: 0, height: 0, cropped: false };
        texture = undefined;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Image}
        */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Image.');
                const obj = new images.Image(data[0]);
                if (data[1]) obj.cropData = data[1];
                return obj;
            }

            if (data.tileData) {
                const tileset = find(data.tileData.tileset);
                // Don't apply crop data, getTile sets the crop, and in most cases
                // you would want the image to reflect changes to the tileset,
                // not the specific crop it was originally created with.
                const pos = data.tileData.position;
                const size = data.tileData.size;
                return tileset.getTile(pos.x, pos.y, size.x, size.y);
            } else {
                return new images.Image(data.path, data.cropData);
            }
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            let tileData = undefined;
            if (this.tileData.tileset) {
                tileData = {
                    tileset: ref(this.tileData.tileset),
                    position: this.tileData.position,
                    size: this.tileData.size
                }
                console.log('SVT', tileData, this.tileData);
            }
            return {
                path: this.path,
                cropData: this.getCrop(),
                tileData: tileData
            };
        }

        /** Change and load a new image path. Reset's the image's crop
         * @method
         * @param {string} path - The new image path
         */
        changePath = (path) => {
            this.path = path;
            const ni = new images.Image(path);
            ni.onLoad(() => {
                this.texture = ni.texture;
                this.cropData.width = this.texture.width;
                this.cropData.height = this.texture.height;
                if (this.#loadFunction) { this.#loadFunction(); }
            });
        }

        /** Set a function to be run when the image is loaded
         * @method
         * @param {function} callback - The function to be called when the image is loaded.
         */
        onLoad = (callback) => { this.loadFunction = callback; }

        /** Crop the image 
         * @method
         * @param {Number} x - how much to crop of the left of the image
         * @param {Number} y - how much to crop of the right of the image
         * @param {Number} width - how wide the resulting image should be
         * @param {Number} height - how tall the resulting image should be
        */
        crop = (x, y, width, height) => {
            if (x === undefined || y === undefined || width === undefined || height === undefined) {
                throw new Error("x, y, width and height must be specified");
            }
            this.cropData = { x: x, y: y, width: width, height: height, cropped: true };
        }

        /** Remove crop from the image 
         * @method
         */
        uncrop = () => {
            this.cropData.cropped = false;
        }

        /** Get the image crop. Returns an object with x, y, width, and height properties.
         * @method
         */
        getCrop = () => {
            return JSON.parse(JSON.stringify(this.cropData));
        }

        /** Draw the image to a context
         * @method
         * @param {CanvasRenderingContext2D} context - The canvas context to draw to
         * @param {Number} x - The x coordinate to draw at
         * @param {Number} y - The y coordinate to draw at
         * @param {Number} w - Width
         * @param {Number} h - Height
         * @param {Number} r - Rotation, in degrees
         */
        draw = (context, x, y, w, h, r) => {

            context.globalAlpha = this.opacity;
            
            if (r) {
                // translate the canvas to draw rotated images
                const transX = x + w / 2;
                const transY = y + h / 2;
                const transAngle = (r * Math.PI) / 180; // convert degrees to radians

                context.translate(transX, transY);
                context.rotate(transAngle);

                if (this.cropData.cropped) {
                    context.drawImage( this.texture,
                                    // source coordinates
                                    this.cropData.x,
                                    this.cropData.y,
                                    this.cropData.width,
                                    this.cropData.height,
                                    // destination coordinates
                                    -w / 2,
                                    -h / 2,
                                    w,
                                    h );

                } else {
                    context.drawImage( this.texture,
                                    // omit source coordinates when not cropping
                                    -w / 2,
                                    -h / 2,
                                    w,
                                    h );

                }

                context.rotate(-transAngle);
                context.translate(-transX, -transY);

            } else {
                if (this.cropData.cropped) {
                    context.drawImage( this.texture,
                        // source coordinates
                        this.cropData.x,
                        this.cropData.y,
                        this.cropData.width,
                        this.cropData.height,
                        // destination
                        x, y, w, h );

                } else {
                    context.drawImage( this.texture,
                        // omit source coordinates when not cropping
                        x, y, w, h );

                }

            }
            // reset the alpha
            context.globalAlpha = 1;
        }
    },
}