### Overview

Each gameify game is contained within a {@linkcode gameify.Screen}. You'll add other objects to your Screen to add them to the game. Each object can only be in one Screen at a time. The game loop is controlled by {@linkcode gameify.Scene} objects. Each scene represents a different part of your game, like a menu or a level.

### Using Scenes

Scenes provide an easy way to separate different parts of your game. Using {@linkcode gameify.Screen#setScene|setScene(...)} you can easily switch between scenes.

Each scene has two main functions that are run while the scene is active:
{@linkcode gameify.Scene#onUpdate|onUpdate(...)} and
{@linkcode gameify.Scene#onUpdate|onDraw(...)}. Both functions are run every frame of the game. The `onUpdate` function is called first, and you should use it to listen to keyboard events and update any game objects. `onDraw` is called last, and should be used to draw all visible game objects.

### Game lifecycle

Games can be started and stopped on-demand using the {@linkcode gameify.Screen#startGame|startGame()} and {@linkcode gameify.Screen#stopGame|stopGame()} functions.

`stopGame` simply stops the game loop, and does not remove and game objects or clean anything up.


---
A minimal sample:
```js
import {gameify} from "/gameify/gameify.js"
let screen = new gameify.Screen(document.querySelector("#my-canvas"), 1200, 800);

// Create a scene for each game state
let menu = new gameify.Scene(screen);
let pausemenu = new gameify.Scene(screen);
let level1 = new gameify.Scene(screen);

menu.onUpdate(() => {
    // Check for clicks and/or key presses
    // and update buttons
    // (i.e. make hovered buttons red)
});
menu.onDraw(() => {
    // Draw the menu screen
});

// ...

screen.startGame();
```