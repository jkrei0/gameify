
// ENGINE.JS - This is where default code lives

// =========================== //
//   You shouldn't edit this   //
// =========================== //

import {gameify} from '/gameify/gameify.js';

let __globals = {
    'Canvas': document.querySelector('#game-canvas')
};

/** Access an object from the engine
 * @param {string} name - The name of the object to access
 */
export const $get = (name) => {
    return __globals[name];
};

__globals.Screen = new gameify.Screen($get('Canvas'), 1200, 800);

__globals.MainScene = new gameify.Scene($get('Screen'));

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

console.info('Engine loaded');

setTimeout(() => {
    // Start the game
    console.info('Game started');
    $get('Screen').startGame();
}, 200);

export default $get;