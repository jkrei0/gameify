import {gameify} from "./gameify/gameify.js"
"use strict"

// Get the Canvas element
// Create a Screen that is 600 by 400 and centered
let screen = new gameify.Screen(document.querySelector("#my-canvas"), 1200, 800);
screen.setSmoothImages(false);

// Create a Scene
let level1 = new gameify.Scene(screen);

// create the player and add it to the game
let player = new gameify.Sprite(100, 100, new gameify.Image("sample/player.png"));
let playerSpeed = 30;   // give the player a speed
player.scale = 0.2;     // scale the player down to a reasonable size
screen.add(player);

// Make a list of monsters on the screen
let monsters = [];

// All monsters use the same image
// There's no point in creating a copy of it for each monster,
// so just make one now and use it for all of them
let monsterImage = new gameify.Image("sample/enemy.png")
// Same with the update funtion for them
function monsterUpdate(delta, monster) {
    // ...
}

level1.onUpdate((delta) => {
    // This code runs at a mostly constant speed to update the game

    // make a new vector representing movement added this frame
    let addedVelocity = new gameify.Vector2d(0, 0);

    // change the added velocity based on what keys are pressed.
    if (screen.keyboard.keyIsPressed("W")) {
        addedVelocity.y -= 1; 
    }
    if (screen.keyboard.keyWasJustPressed("S")) {
        addedVelocity.y += 1;
    }
    if (screen.keyboard.keyWasJustPressed("D")) {
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

    // Spawn monsters when the player presses Space
    if (screen.keyboard.keyWasJustPressed("Space")) {
        // create a new monster with the monsterImage and spawn it near the player
        let newMonster = new gameify.Sprite(player.position.x + 100, player.position.y + 100, monsterImage);
        monster.onUpdate(monsterUpdate);

        monsters.push(newMonster); // add it to the list of monsters
    }

    // update everything
    for (let monster of monsters) {
        monster.update(delta);
    }

    player.update(delta);

    // slow the player down
    console.log(player.velocity.toString(),
        player.velocity.getNormalized().multiply(playerSpeed * delta).toString(),
        gameify.vectors.shortestOf(player.velocity.getNormalized().multiply(playerSpeed * delta), player.velocity));
    //player.velocity = player.velocity.subtract(gameify.vectors.shortestOf(player.velocity.getNormalized().multiply(playerSpeed * delta), player.velocity));

});
level1.onDraw(() => {
    // Code that runs after the update function, to draw to the screen
    screen.clear(); // clear the screen each frame (Curious as to why? Delete this and see)
    
    // draw things in back-to-front order
    for (let monster of monsters) {
        monster.draw();
    }
    player.draw();
});

// Start the game
screen.setScene(level1);
screen.startGame(Number(prompt("Enter update speed:")));
