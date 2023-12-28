
"use strict"

/** Audio for use with gameify. Usually you'll access this through the gameify object.
 * @example // Use audio via gameify
 * // This is the most common way
 * import { gameify } from "./gameify/gameify.js"
 * let myScreen = new gameify.Screen(document.querySelector("#my-canvas"), 600, 400);
 * let mySound = new gameify.audio.Sound("my-sound.mp3");
 * myScreen.audio.add(mySound);
 * @example // Import just audio
 * import { audio } from "./gameify/audio.js"
 * let audioManager = new audio.AudioManager();
 * let mySound = new audio.Sound("my-sound.mp3");
 * audioManager.add(mySound);
 */
export let audio = {
    /** An audio manager. Controlls multiple sounds at once.
     * Screen objects come with an AudioManager (Screen.audio), but you can
     * create your own for more fine-grained control. This allows you to easily
     * control the volume of different parts of your game independently, i.e.
     * seperate SFX, menu, and gameplay sound sliders.
     * @alias gameify.audio.AudioManager
     * @constructor
     * @example import { gameify } from "./gameify/gameify.js"
     * const myAudioManager = new gameify.audio.AudioManager();
     * const mySound = new gameify.audio.Sound("my-sound.mp3");
     * myAudioManager.add(mySound);
    */
    AudioManager: function () {
        /** Sounds this AudioManager controlls. Don't modify this - Use add() and remove() to add/remove sounds.
         * AudioManagers are set to 20% volume by default, to protect your ears.
         * @readonly
         */
        this.sounds = [];

        this._volume = 0.2;

        /** Adjust the volume of all controlled sounds
         * @param {Number} volume - The volume modifier, from 0 to 1
         */
        this.setVolume = (volume) => {
            this._volume = volume;
            this.sounds.forEach(sound => {
                // Sounds take their AudioManager's volume into account
                // When setting the volume, so we simply use their setVolume
                // method.
                sound.setVolume(sound.getVolume());
            });
        }

        /** Get the volume of the AudioManager. Note that this volume is mixed
         * with the volume of each sound. Use Sound.getCalculatedVolume to get
         * the actual volume of each sound.
         * @returns {Number}
         */
        this.getVolume = () => {
            return this._volume;
        }

        /** Add a sound to the AudioManager
         * @param {gameify.audio.Sound} sound - The sound to add
         */
        this.add = (sound) => {
            this.sounds.push(sound);
            sound.audioManager = this;
            sound.setVolume(sound.getVolume());
        }
    },

    /** Creates a sound that can be played
     * @alias gameify.audio.Sound
     * @constructor
     * @example let mySound = new gameify.audio.Sound("my-sound.mp3");
     * @arg {String} path - The path to the sound file
     */
    Sound: class {
        constructor(path) {
            this.path = path;
            this.changePath(path);
        }

        /** The sound path. Modifying this will not do anything.
         * @readonly
         */
        path;
        audioManager = undefined;
        /** If the sound has loaded yet
         * @readonly
         */
        loaded = false;
        audio = undefined;
        
        #volume = 1;

        /** Creates a object from JSON data
         * @method
         * @arg {Object|Array} data - Serialized object data (from object.toJSON)
         * @arg {Function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {gameify.Image}
         */
        static fromJSON = (data, find) => {
            if (Array.isArray(data)) {
                // Be backwards compatible
                console.warn('Save is using the old (de)serialization format for Sound.');
                const obj = new audio.Sound(data[0]);
                obj.setLoop(data[1]);
                obj.setVolume(data[2]);
                return obj;
            }

            const obj = new audio.Sound(data.path);
            obj.setLoop(data.loop);
            obj.setVolume(data.volume);
            return obj;
        }
        
        /** Convert the object to JSON
         * @method
         * @arg {string} [key] - Key object is stored under (unused, here for consistency with e.g. Date.toJSON, etc.)
         * @arg {function} ref - A function that returns a name for other objects, so they can be restored later
         * @returns {Object}
         */
        toJSON = (key, ref) => {
            return {
                path: this.path,
                loop: this.getLoop(),
                volume: this.getVolume()
            };
        }

        /** Play the sound. Please be aware some browsers block autoplay by default.
         * @method
         */
        play = () => {
            if (!this.audioManager) {
                throw new Error('You need to add this song to an AudioManager (i.e. myScreen.audio.add(mySound))');
            }
            this.audio.play();
        }

        /** Pause the sound
         * @method
         */
        pause = () => {
            this.audio.pause();
        }

        /** Stop the sound (resets the seek time)
         * @method
         */
        stop = () => {
            this.pause();
            this.seek(0);
        }

        /** Choose whether the sound should loop or not (default is not looping)
         * @method
         * @param {Boolean} loop - If the sound should loop
         */
        setLoop = (loop) => {
            this.audio.loop = loop;
        }
        /** Check if the sound is set to loop
         * @method
         * @return {Boolean} If the sound is set to loop
         */
        getLoop = () => {
            return this.audio.loop;
        }

        /** Get the duration of the audio (in seconds)
         * @method
         * @return {Number} The duration of the sound in seconds
         */
        getDuration = () => {
            return this.audio.duration;
        }

        /** Get the current seek time of the sound
         * @method
         * @return {Number} The current seek time, in seconds
         */
        getCurrentTime = () => {
            return this.audio.currentTime;
        }

        /** Seek to a specific point in the audio
         * @method
         * @param {Number} time - The time to seek to, in seconds
         */
        seek = (time) => {
            this.audio.currentTime = time;
        }

        /** Seek a percentage of the way through the audio
         * @method
         * @param {Number} time - Where to seek to, from 0 to 1
         */
        seekRelative = (time) => {
            this.seek(this.getDuration() * time);
        }

        /** Sets the volume of the sound
         * @method
         * @param {Number} volume - The desired volume level, a number between 0 and 1.
         */
        setVolume = (volume) => {
            if (volume < 0 || volume > 1) {
                console.warn('Volume should be between 0 and 1');
            }
            this.#volume = Math.max(0, Math.min(1, volume));
            this.audio.volume = this.getCalculatedVolume();
        }
        /** Get the volume of the sound. Note that this volume is mixed with the
         * audioManager's volume to get the actual volume. Use getCalculatedVolume()
         * to get the actual volume the sound will be played at.
         * @see {gameify.audio.Sound.getCalculatedVolume}
         * @method
         * @return {Number} The volume of the sound, between 0 and 1
         */
        getVolume = () => {
            return this.#volume;
        }
        /** Get the calculated volume of the sound (after audioManager volume is applied)
         * @method
         * @return {Number} The calculated volume of the sound, between 0 and 1
         */
        getCalculatedVolume = () => {
            return this.#volume * (this.audioManager?.getVolume() || .2); // Use .2 default when no audioManager is set
        }

        /** Change and load a new image path. Resets the image's crop
         * @method
         * @param {string} path - The new image path
         */
        changePath = (path) => {
            this.path = path;
            if (path !== undefined) {
                this.audio = document.createElement('audio');
                this.audio.src = path;
                this.audio.oncanplaythrough = () => {
                    this.loaded = true;
                    if (this.loadFunction) { this.loadFunction(); }
                }
            }
        }

        /** Set a function to be run when the sound is loaded (Can be played through w/o buffering)
         * @method
         * @param {Function} callback - The function to be called when the sound is loaded.
         */
        onLoad = (callback) => {
            this.loadFunction = callback;
        }
    }
}