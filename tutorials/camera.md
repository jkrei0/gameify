Managing the camera can be confusing, and then once you've figured it out, all your buttons are moving too!
This guide has some simple ways to manage the camera in your game.

## Follow the player
Use {@linkcode gameify.Camera#focus|camera.focus()} to follow the player. Make sure to specify an offset,
about half of the players' size, so the camera follows the center of the player and not the corner.

Use the speed and distance settings to adjust how closely the player is followed.

```js
// Tweak these to whatever works best
screen.camera.setSpeed(0.001);
screen.camera.maxDistance = 125;
screen.camera.minDistance = 50;

mainScene.onUpdate((delta) => {
    // ... other code here
    screen.camera.focus(player.position, new gameify.Vector2d(24, 24));
});
```

## Draw UI elements
Use {@linkcode gameify.Camera#setDrawMode|camera.setDrawMode('ui')} to draw UI elements.
This temporarily resets the camera position so UI elements draw in the correct place and don't move around.
This is reset every frame, so you don't have to reset it by yourself.

*Technically, setDrawMode is just a fancy way of calling {@linkcode gameify.Camera#resetTransform|camera.resetTransform()} and {@linkcode gameify.Camera#update|camera.update(0)}. But it makes much more semantic sense to use setDrawMode*

```js
mainScene.onDraw(() => {
    screen.clear();
    map.draw();
    player.draw();
    // ... draw other things
    
    screen.camera.setDrawMode('ui');
    button.draw();
    // ... draw the rest of your UI

    // no need to set the camera back to 'world', it's reset automatically every frame
});
```
