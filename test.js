import {gameify} from "./gameify/gameify.js"
"use strict"

// Get the Canvas element
// Create a Screen that is 600 by 400 and centered
let screen = new gameify.Screen(document.querySelector("#my-canvas"), 1200, 800);

// Do this if you're using pixel art:
// screen.setSmoothImages(false);

// Create a Scene
let level1 = new gameify.Scene(screen);

// load the scribble dungeon art
let dungeonTileset = new gameify.Tileset("sample/tilesheet.png", 64, 64);

// create the player and add it to the game
let player = new gameify.Sprite(0, 0, dungeonTileset.getTile(6, 8));
let playerSpeed = 150;   // give the player a speed
screen.add(player);

let playerWeapon = new gameify.Sprite(0, 0, dungeonTileset.getTile(0, 9));
let playerAttack = 0;
screen.add(playerWeapon);

player.onUpdate(() => {
    // Only update if the player is moving
    // Otherwise the weapon gets positioned funny when the player stops
    if (player.velocity.getMagnitude() > 0) {
        playerWeapon.position = player.position.add(player.velocity.getNormalized().multiply(40));
    }
});

let dungeonMap = new gameify.Tilemap(64, 64, 5, 5);
screen.add(dungeonMap);
dungeonMap.setTileset(dungeonTileset);
dungeonMap.loadMapData([
        {"s":[9,0],"p":["0","0"],"r":360},{"s":[10,0],"p":["0","1"],"r":270},{"s":[10,0],"p":["0","2"],"r":270},{"s":[10,0],"p":["0","3"],"r":270},{"s":[10,0],"p":["0","4"],"r":270},{"s":[10,0],"p":["0","5"],"r":270},{"s":[10,0],"p":["0","6"],"r":270},{"s":[10,0],"p":["0","7"],"r":270},{"s":[10,0],"p":["0","8"],"r":270},{"s":[10,0],"p":["0","9"],"r":270},{"s":[10,0],"p":["0","10"],"r":270},{"s":[9,0],"p":["0","11"],"r":270},{"s":[10,0],"p":["1","0"],"r":0},{"s":[10,0],"p":["1","11"],"r":180},{"s":[10,0],"p":["2","0"],"r":0},{"s":[10,0],"p":["2","11"],"r":180},{"s":[10,0],"p":["3","0"],"r":0},{"s":[10,0],"p":["3","11"],"r":180},{"s":[10,0],"p":["4","0"],"r":0},{"s":[10,0],"p":["4","11"],"r":180},{"s":[10,0],"p":["5","0"],"r":0},{"s":[10,7],"p":["5","3"],"r":360},{"s":[10,7],"p":["5","8"],"r":360},{"s":[10,0],"p":["5","11"],"r":180},{"s":[10,0],"p":["6","0"],"r":0},{"s":[10,0],"p":["6","11"],"r":180},{"s":[10,0],"p":["7","0"],"r":0},{"s":[10,0],"p":["7","11"],"r":180},{"s":[10,0],"p":["8","0"],"r":0},{"s":[10,7],"p":["8","6"],"r":360},{"s":[10,0],"p":["8","11"],"r":180},{"s":[10,0],"p":["9","0"],"r":0},{"s":[10,0],"p":["9","11"],"r":180},{"s":[10,0],"p":["10","0"],"r":0},{"s":[10,0],"p":["10","11"],"r":180},{"s":[10,0],"p":["11","0"],"r":0},{"s":[10,0],"p":["11","11"],"r":180},{"s":[10,0],"p":["12","0"],"r":0},{"s":[10,0],"p":["12","11"],"r":180},{"s":[10,0],"p":["13","0"],"r":0},{"s":[10,7],"p":["13","6"],"r":360},{"s":[10,0],"p":["13","11"],"r":180},{"s":[10,0],"p":["14","0"],"r":0},{"s":[10,7],"p":["14","2"],"r":360},{"s":[10,0],"p":["14","11"],"r":180},{"s":[10,0],"p":["15","0"],"r":0},{"s":[10,0],"p":["15","11"],"r":180},{"s":[10,0],"p":["16","0"],"r":0},{"s":[10,0],"p":["16","11"],"r":180},{"s":[9,0],"p":["17","0"],"r":90},{"s":[10,0],"p":["17","1"],"r":90},{"s":[10,0],"p":["17","2"],"r":90},{"s":[10,0],"p":["17","3"],"r":90},{"s":[10,0],"p":["17","4"],"r":90},{"s":[10,0],"p":["17","5"],"r":90},{"s":[10,0],"p":["17","6"],"r":90},{"s":[10,0],"p":["17","7"],"r":90},{"s":[10,0],"p":["17","8"],"r":90},{"s":[10,0],"p":["17","9"],"r":90},{"s":[10,0],"p":["17","10"],"r":90},{"s":[9,0],"p":["17","11"],"r":180},{"s":[10,0],"p":["-1","3"],"r":270}
    ]);

// Use this to build maps more easily
// dungeonMap.enableMapBuilder(screen);

// Make a list of monsters on the screen
let monsters = [];

// All monsters use the same image
// There's no point in creating a copy of it for each monster,
// so just make one now and use it for all of them
let monsterImage = dungeonTileset.getTile(4, 8)
// Same with the update funtion for them
function monsterUpdate(delta, monster) {
    // make the monster face the player, and move at 1/4 the player's speed.
    monster.goTowards(player.position, playerSpeed / 4);
    if (monster.health < 0) {
        monsters.splice(monsters.indexOf(monster), 1);
    }
}

// Scenes have two main functions: onUpdate and onDraw
// One to update the scene objects, and the other to draw them
level1.onUpdate((delta) => {
    // This code runs at a mostly constant speed to update the game

    // make a new vector representing movement added this frame
    let addedVelocity = new gameify.Vector2d(0, 0);

    // change the added velocity based on what keys are pressed.
    if (screen.keyboard.keyIsPressed("W")) {
        addedVelocity.y -= 1; 
    }
    if (screen.keyboard.keyIsPressed("S")) {
        addedVelocity.y += 1;
    }
    if (screen.keyboard.keyIsPressed("D")) {
        addedVelocity.x += 1;
    }
    if (screen.keyboard.keyIsPressed("A")) {
        addedVelocity.x -= 1;
    }

    // Normalize the addedVeclocity vector (make the distance = 1)
    // This way the player goes the same speed even when moving diagonally
    addedVelocity.normalize();

    // Multiply it by playerSpeed so that the player goes at a reasonable speed
    // Also multiply it by the delta so that the speed is the same regardless of the game's update speed
    addedVelocity = addedVelocity.multiply(playerSpeed * delta);

    // Add it to the player's speed
    player.velocity = player.velocity.add(addedVelocity);
    
    // slow the player down
    player.velocity = player.velocity.multiply(1/delta);

    // If the player is moving, have the player face towards it's motion
    if (addedVelocity.getMagnitude() > 0) {
        const direction = player.position.add(player.velocity);
        player.faceTowards(direction, -90);
                                            // Have the sword rotate on attacks
        //playerWeapon.faceTowards(direction);
    }
    playerWeapon.rotation = player.rotation + 90 - (playerAttack > 0 ? 90 : 0);
    
    // Spawn monsters when the player presses F
    if (screen.keyboard.keyWasJustPressed("F")) {
        // create a new monster with the monsterImage and spawn it near the player
        let newMonster = new gameify.Sprite(player.position.x + 100, player.position.y + 100, monsterImage);
        newMonster.onUpdate(monsterUpdate);

        newMonster.health = 180;

        screen.add(newMonster);
        monsters.push(newMonster); // add it to the list of monsters
    }

    // Attack when space is pressed
    if (playerAttack < -90 && screen.keyboard.keyIsPressed("Space")) {
        playerAttack = 90;
    } else {
        playerAttack -= delta / 3;
    }

    // update everything
    for (let monster of monsters) {
        console.log(monster.position.subtract(playerWeapon.position).getDistance());
        if (playerAttack > 0 && monster.position.subtract(playerWeapon.position).getDistance() < 40) {
            monster.health -= playerAttack / 5;
        }
        monster.update(delta);
    }

    playerWeapon.update(delta);
    player.update(delta);

});
level1.onDraw(() => {
    // Code that runs after the update function, to draw to the screen
    screen.clear(); // clear the screen each frame (Curious as to why? Delete this and see)
    
    // draw things in back-to-front order
    dungeonMap.draw();

    for (let monster of monsters) {
        monster.draw();
    }

    player.draw();
    playerWeapon.draw();
});

// Start the game
screen.setScene(level1);
screen.startGame();
screen.element.click();
screen.element.focus();
