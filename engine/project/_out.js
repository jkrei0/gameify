
// ENGINE.JS - This is where default code lives

// =========================== //
//   You shouldn't edit this   //
// =========================== //

import {gameify} from '/gameify/gameify.js';

/* Engine Objects */

if (!window.__s_objects) console.error('Failed to load game objects');

const __objects = {};

const deserializeObject = () => {

}

/** Access an object from the engine
 * @param {string} name - The name of the object to access
 */
export const $get = (name) => {
    if (!__objects[name]) {
        const type = name.split('::')[0];
        const oName = name.split('::')[1];
        if (window.__s_objects[type] && window.__s_objects[type][oName]) {
            if (window.__s_objects[type][oName] === false) {
                console.warn(`Cannot deserialize ${type}::${oName}`);
                return undefined;
            }
            // Deserialize object (call constructor, then call deserializer with data and $get)
            __objects[type + '::' + oName] = gameify[type]('_deserialize')(window.__s_objects[type][oName], $get);
            console.debug(`Loaded ${name}`);

        } else {
            console.warn(`Object '${name}' not found.`);
            return undefined;
        }
    }

    return __objects[name];
};


/* Error handling */

window.onerror = (...args) => {
    console.error({
        _gameify_error: 'onerror',
        details: args
    });
}

window.addEventListener('unhandledrejection', function(event) {
    console.error({
        _gameify_error: 'promise',
        message: event.reason
    });
});

/* Start the game */

console.info('Engine loaded');

setTimeout(() => {
    // Start the game
    console.info('Game started');
    $get('Screen::Screen').startGame();
}, 200);

export default $get;