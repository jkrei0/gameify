import { vectors }  from "./vector.js"

/** Text for use in gameify. Usually you'll access these through the gameify object.
 * @example // Use text via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myText = new gameify.Text("Hello, World!", 0, 0);
 * @example // Import just text
 * import { text } from "./gameify/text.js"
 * let myText = new text.Text("Hello, World!", 0, 0);
 * @global
 */
export let text = {

    /** Text style data
     * @alias gameify.TextStyle
     * @constructor
     * @arg {String} [font='sans-serif'] - The text font
     * @arg {Number} [size=24] - The text size, in pixels
     * @arg {String} [fillColor='#000f'] - The fill color
     * @arg {String} [strokeColor='#000f'] - The stroke color. (Stroke paint is disabled by default - use TextStyle.setPaint to enable stroke)
     * @arg {Number} [strokeWidth=1] - The stroke width
     */
    TextStyle: function (font = 'sans-serif', size = 24, fillColor = '#000f', strokeColor = '#000f', strokeWidth = 1) {

        /** The text font
         * @type {String}
         */
        this.font = font;

        /** The text size, in pixels
         * @type {Number}
         */
        this.size = size;

        this.fill = {
            paint: true,
            color: fillColor
        }
        this.stroke = {
            paint: false,
            color: strokeColor,
            width: strokeWidth
        }

        /** Set the paint options
         * @param {String} [fill] - "fill", "stroke", "none" or "both"
         * @param {String} [fillColor] - The text fill color
         * @param {String} [strokeColor] - The text stroke color
         * @param {String} [strokeWidth] - The text stroke width
         */
        this.setPaint = (fill, fillColor, strokeColor, strokeWidth) => {
            if (fill === 'fill') {
                this.fill.paint   = true;
                this.stroke.paint = false;
            } else if (fill === 'stroke') {
                this.fill.paint   = false;
                this.stroke.paint = true;
            } else if (fill === 'both') {
                this.fill.paint   = true;
                this.stroke.paint = true;
            } else if (fill === 'none') {
                this.fill.paint   = false;
                this.stroke.paint = false;
            }

            if (fillColor)   this.fill.color   = fillColor;
            if (strokeColor) this.stroke.color = strokeColor;
            if (strokeWidth) this.stroke.width = strokeWidth;
        }

        /** Get the fill paint settings
         * @returns {Object} {paint: Boolean, color: String}
         */
        this.getFill = () => {
            return {
                paint: this.fill.paint,
                color: this.fill.color
            };
        }
        /** Get the stroke paint settings
         * @returns {Object} {paint: Boolean, color: String}
         */
        this.getStroke = () => {
            return {
                paint: this.stroke.paint,
                color: this.stroke.color
            };
        }

        /** Apply these styles to a canvas context.
         * @param {CanvasRenderingContext2D} context
         * @private
         */
        this.applyTo = (context) => {
            context.font = `${this.size}px ${this.font}`;
            context.fillStyle = this.fill.color;

            context.lineWidth = this.stroke.width;
            context.strokeStyle = this.stroke.color;
        }
    },

    /** A drawable string of text
     * @alias gameify.Text
     * @constructor
     * @example // A text label
     * let myText = new gameify.Text("Hello, World", 0, 0);
     * @arg {String} text - The text string to draw
     * @arg {Number} [x=0] - x coordinate of the top left of the text
     * @arg {Number} [y=0] - y coordinate of the top left of the text
     * @arg {gameify.TextStyle} [style] - The text style
     * @arg {Number} [size=48] - The text size, in pixels
    */
    Text: function (string, x = 0, y = 0, style, size = 48) {

        /** The string of text to draw
         * @type {String}
        */
        this.string = string;

        /** The position of the text top left corner of the text
         * @type {gameify.Vector2d}
         */
        this.position = new vectors.Vector2d(x, y);

        /** The text style
         * @type {gameify.TextStyle}
         */
        this.style = style || new text.TextStyle();

        /** The text size, in pixels
         * @type {Number}
         */
        this.size = size;

        /** Draw the Text */
        this.draw = () => {
            if (!this.context) {
                throw new Error("You need to add this text to a screen before you can draw it.");
            }

            if (typeof this.size !== 'number') {
                throw new Error("Text size must be a number");
            }
            
            this.context.textBaseline = 'top';
            this.style.applyTo(this.context);

            if (this.style.fill.paint)   this.context.fillText  (this.string, this.position.x, this.position.y);
            if (this.style.stroke.paint) this.context.strokeText(this.string, this.position.x, this.position.y);
        }

        /** The Canvas context to draw to
         * @private
         */
        this.context = null;

        /** The parent screen (not used directly)
         * @private
         */
        this.parent = null;

        /** Get the screen this sprite draws to
         * @returns {gameify.Screen}
         */
        this.getParent = () => {
            return this.parent;
        }

        /** Set the Canvas context to draw to. This should be called whenever a sprite is added to a Screen
         * @private
         */
        this.setContext = (context, parent) => {
            this.context = context;
            this.parent = parent;
        }
    }
}
