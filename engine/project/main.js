import {$get} from './_out.js';
import {gameify} from '/gameify/gameify.js';

// MAIN.JS - This is where your game setup logic goes

const screen = $get('Screen::')[0];
const mainScene = $get('Scene::Main Scene');
const player = $get('Sprite::Player');
const map = $get('Tilemap::Dungeon Map');

const playerSpeed = 100; // px per second

mainScene.onUpdate((delta) => {
    screen.clear()

    let addedVelocity = new gameify.Vector2d(0, 0);

    // change the added velocity based on what keys are pressed.
    if (screen.keyboard.keyIsPressed("W")) { addedVelocity.y -= 1; }
    if (screen.keyboard.keyIsPressed("S")) { addedVelocity.y += 1; }
    if (screen.keyboard.keyIsPressed("D")) { addedVelocity.x += 1; }
    if (screen.keyboard.keyIsPressed("A")) { addedVelocity.x -= 1; }

    // Normalize the addedVeclocity vector and multiply by the player speed
    // This way the player goes the same speed even when moving diagonally
    addedVelocity = addedVelocity.getNormalized().multiply(playerSpeed);

    // Add this frame's movement to the player's speed
    player.velocity = player.velocity.add(addedVelocity);

    // The update function takes the velocity and moves the player
    player.update(delta);

    // slow the player down, so they don't go super fast
    player.velocity = player.velocity.multiply(1/delta);
});

mainScene.onDraw(() => {
    map.draw();
    player.draw();
});