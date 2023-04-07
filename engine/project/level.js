import {$get} from './_out.js';
import {gameify} from '/gameify/gameify.js';

let dungeonTileset = new gameify.Tileset("/sample/tilesheet.png", 64, 64);
let player = new gameify.Sprite(0, 0, dungeonTileset.getTile(6, 8));

$get('MainScene').onUpdate((delta) => {
    player.rotation += delta/10;

    player.update(delta);
});

$get('MainScene').onDraw(() => {
    $get('Screen').clear();

    player.draw();
});

$get('Screen').add(player);
