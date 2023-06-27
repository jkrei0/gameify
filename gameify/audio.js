
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
                sound.setVolume(sound._volume);
            });
        }

        /** Add a sound to the AudioManager
         * @param {gameify.audio.Sound} sound - The sound to add
         */
        this.add = (sound) => {
            this.sounds.push(sound);
            sound.audioManager = this;
        }
    },

    /** Creates a sound that can be played
     * @alias gameify.audio.Sound
     * @constructor
     * @example let mySound = new gameify.audio.Sound("my-sound.mp3");
     * @arg {String} path - The path to the sound file
     */
    Sound: function (path) {

        /** The sound path. Modifying this will not do anything.
         * @readonly
         */
        this.path = path;

        this.audioManager = undefined;

        this.loaded = false;

        /** Play the sound. Please be aware some browsers block autoplay by default. */
        this.play = () => {
            if (!this.audioManager) {
                throw new Error('You need to add this song to an AudioManager (i.e. myScreen.audio.add(mySound))');
            }
            this.audio.play();
        }

        /** Pause the sound */
        this.pause = () => {
            this.audio.pause();
        }

        /** Stop the sound (resets the seek time) */
        this.stop = () => {
            this.pause();
            this.seek(0);
        }

        /** Choose whether the sound should loop or not (default is not looping)
         * @param {Boolean} loop - If the sound should loop
         */
        this.setLoop = (loop) => {
            this.audio.loop = loop;
        }

        /** Get the duration of the audio (in seconds)
         * @return {Number} The duration of the sound in seconds
         */
        this.getDuration = () => {
            return this.audio.duration;
        }

        /** Get the current seek time of the sound
         * @return {Number} The current seek time, in seconds
         */
        this.getCurrentTime = () => {
            return this.audio.currentTime;
        }

        /** Seek to a specific point in the audio
         * @param {Number} time - The time to seek to, in seconds
         */
        this.seek = (time) => {
            this.audio.currentTime = time;
        }

        /** Seek a percentage of the way through the audio
         * @param {Number} time - Where to seek to, from 0 to 1
         */
        this.seekRelative = (time) => {
            this.seek(this.getDuration() * time);
        }

        this._volume = 1;

        /** Sets the volume of the sound
         * @param {Number} volume - The desired volume level, a number between 0 and 1.
         */
        this.setVolume = (volume) => {
            if (volume < 0 || volume > 1) {
                console.warn('Volume should be between 0 and 1');
            }
            this._volume = Math.max(0, Math.min(1, volume));
            this.audio.volume = this._volume * this.audioManager._volume;
        }

        /** Set a function to be run when the sound is loaded (Can be played through w/o buffering)
         * @param {Function} callback - The function to be called when the sound is loaded.
         */
        this.onLoad = (callback) => {
            this.loadFunction = callback;
        }

        this.audio = undefined;
        if (path !== undefined) {
            this.audio = document.createElement('audio');
            this.audio.src = path;
            this.audio.oncanplaythrough = () => {
                this.loaded = true;
                if (this.loadFunction) { this.loadFunction(); }
            }
        }
    }
}