
// ENGINE.JS - This is where default code lives

// =========================== //
//   You shouldn't edit this   //
// =========================== //

import {gameify} from '/gameify/gameify.js';

/* Engine Objects */

/* Game objects are inserted below.
Please do not edit the following line: */
/*__s_objects*/

if (!window.__s_objects) {
    await new Promise((resolve) => {
        window.__set_s_objects = resolve;
    });
    if (!window.__s_objects) {  
        console.error('Failed to load game objects');
    }
}



const __objects = {};

const __share = {};

/** Access an object from the engine. Actual docs in gameify.js
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
            
            const itm = type.split('.');
            let constructor = gameify[itm[0]];
            for (let i = 1; i < itm.length; i++) {
                constructor = constructor[itm[i]];
            }
            if (constructor.fromJSON) {
                __objects[type + '::' + oName] = constructor.fromJSON(window.__s_objects[type][oName], $get);
            } else {
                console.warn(`Object ${name} is using the old (de)serialization system.`);
                __objects[type + '::' + oName] = constructor('_deserialize')(window.__s_objects[type][oName], $get);
            }

            console.debug(`Loaded ${name}`);

        } else {
            console.warn(`Object '${name}' not found.`);
            return undefined;
        }
    }

    return __objects[name];
};
/** Share other things. Actual docs in gameify.js */
let __$share_warned = false
export const $share = (name, object) => {
    if (!__$share_warned) {
        console.warn('$share is deprecated. Use import/export instead.');
        __$share_warned = true;
    }
    if (object) __share[name] = object;
    else return __share[name];
}


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