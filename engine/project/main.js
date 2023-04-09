import {$get} from './_out.js';
import {gameify} from '/gameify/gameify.js';

// MAIN.JS - This is where your game setup logic goes

const screen = $get('Screen::')[0];
const mainScene = $get('Scene::Main Scene');
const player = $get('Sprite::Player');

mainScene.onUpdate((delta) => {
    screen.clear()

    // make the player rotate at 45 degress per second
    const delta_s = delta/1000; // delta in seconds
    const deg_per_sec = 45;
    player.rotation += deg_per_sec * delta_s;
});

mainScene.onDraw(() => {
    player.draw();
});