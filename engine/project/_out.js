
// ENGINE.JS - This is where default code lives

// =========================== //
//   You shouldn't edit this   //
// =========================== //

import {gameify} from '/gameify/gameify.js';

/* Engine Objects */

if (!window.__s_objects) console.error('Failed to load game objects');

const __objects = {};

/** Access an object from the engine
 * @param {string} name - The name of the object to access
 */
export const $get = (name) => {

    const type = name.split('::')[0];
    const oName = name.split('::')[1];
    if (oName === "" && window.__s_objects[type]) {
        const names = [];
        const results = [];
        for (const obj in window.__s_objects[type]) {
            names.push(name + obj);
            results.push($get(name + obj));
        }

        return results;
    }

    if (!__objects[name]) {
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
    if (!$get('Screen::')[0]) {
        console.error('Your game has no Screen object!');
    }
    $get('Screen::')[0].startGame();
    console.info('Game started');
}, 200);

export default $get;