Player movement and collisions are a pretty common task in games, however, there's no built-in physics
engine in gameify. Unless you're using an external physics engine in your game, you'll
have to implement collision yourself.

*You can integrate an external physics engine by `include {...}`ing it in your code,
but every physics engine is different, so you're on your own if you chose to.*

The first thing to do is make sure your player has a collision shape assigned to it,
and create some other shapes for the player to collide with.
```js
const player = $get('Sprite::Player');
player.setShape(new gameify.shapes.Circle(0, 0, 24), 24, 24);

// An array of shapes for the player to collide with (just one in this example)
const collisionBoxes = [new gameify.shapes.Rectangle(387, 358, 59, 30)];
```

Then, in your `onUpdate()` function, check for plauyer movement. You can put this
directy in `onUpdate`, or in another function that you can call in multiple scenes.
```js
const playerSpeed = 100; // px per second
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

// ... Check for collision here
// ... And update the player sprite

// slow the player down, so they don't go super fast
player.velocity = player.velocity.multiply(1/delta);
```

Then there are two approaches to dealing with collisions: 
- The simple approach, where the player doesn't move if they collide. This means that
  players can't slide along walls
- The more complicated approach, where if the player collides, check similar movement
  (suck as 45 degrees from where the player is trying to move) to try to let the player
  move. This allows players to slide along walls.

Depending on your game, you might want one or the other, or a completely different option.

The simple approach is pretty easy:
```js
const last_position = player.position.copy(); // Save the player position
player.update(); // Update & move the player
for (const box of collisionBoxes) {
    if (player.shape.collidesWith(box)) {
        player.position = last_position; // Restore the player position
    }
}
```

The more complex one is a little more work:
*Note: this example imports the collision function from {@tutorial how_to_tilemap_collisions}.
You can use this, or make your own collision function*
```js
// Place the import at the top of the file
import {collides_with_map} from '/tilemapColllisions.js';

// Copy both the player position and velocity, since we're messing
// with both this time
const last = player.position.copy();
const last_vel = player.velocity.copy();

// Pick some directions (angles in degrees). You can increase or decrease these
// numbers depending on how slidey you want the player to be.
const directions = [0, // Always include 0, we want to move straight forwards first
                    45, -45,
                    65, -65];

// Now, try moving in all the directions we defined earlier
for (const dir of directions) {
    player.velocity = last_vel.rotatedDegrees(dir);
    player.update(delta);
    
    // Check if the player collides with any of the map objects
    // revert to before collision and try again
    if (collides_with_map(player.shape)) {
        player.position = last;
        
    } else break; // If the player can move, we're done, and exit the loop!
}
```

Of course, these are not the only two approaches, and these aren't going to be perfect
for everyone's games.