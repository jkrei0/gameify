Often you'll want to implement collisions for an entire tilemap (When certain tiles are
collidable). This is a simple solution to it. Keep in mind, this does not account for
tile rotation, and isn't updated if the map is changed during the game!

*Eventually, I want to add this functionality as a built-in feature of tilemaps, so it's not
as much work to implement.*

The general steps are:
- Make an empty array to store your collision shapes
- Use `Tilemap.listTiles()` to loop through an array of all the tiles
- Check the tile source (`tile.source.x` and `tile.source.y`) to check for the tiles you want to collide with
- Convert the tile position to screen coordinates, and create a collision shape
- Add the collision shape to your collision shapes array

```js
import {$get,$share} from './_out.js';
import {gameify} from '/gameify/gameify.js';

const map = $get('Tilemap::Forest Map');

const boxes = [];
map.listTiles().forEach(tile => {
    if (
        (tile.source.x === 2 || tile.source.x === 1)
        && tile.source.y === 2
    ) {
        const rectPos = map.mapToScreen(tile.position);
        rectPos.x += 3;
        rectPos.y += 38;
        const rectangle = new gameify.shapes.Rectangle(
            rectPos.x, rectPos.y, 56, 26
        );
        boxes.push(rectangle);
    }
    // Add additional tiles here
});

// Check if a shape collides with any of the collision boxes
$share('collides-with-map', (shape) => {
    for (let box of boxes) {
        if (shape.collidesWith(box)) {
            return true;
        }
    }
    return false;
});

// If you want to see collision boxes, for debug purposes
const screen = $get('Screen::')[0];
$share('draw-map-boxes', () => {
    for (let box of boxes) {
        box.draw(screen.getContext());
    }
});

```

If you chose to use `$share()` to access your functions in other files,
you can then just use them as you normally would with `$share()`:

```js
// onUpdate
if ($share('collides-with-map')(player)) {
    // collision management
}

// onDraw
$share('draw-map-boxes')();
```