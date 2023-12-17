
export let game_template = {
    "objects": {
        "None": {},
        "Screen": {
            "Screen": ["game-canvas", 1200, 800, "Scene::Main Scene"]
        },
        "Scene": {
            "Main Scene": [false]
        },
        "Tileset": {
            "Dungeon Tiles": ["https://gameify.vercel.app/sample/tilesheet.png", 64, 64]
        },
        "Tilemap": {
            "Dungeon Map": [64, 64, {
                    "x": 0,
                    "y": 0
                }, "Tileset::Dungeon Tiles", [{
                        "s": [10, 7],
                        "p": ["2", "1"],
                        "r": 180
                    }, {
                        "s": [11, 7],
                        "p": ["2", "8"],
                        "r": 180
                    }, {
                        "s": [11, 7],
                        "p": ["3", "9"],
                        "r": 180
                    }, {
                        "s": [2, 0],
                        "p": ["5", "3"],
                        "r": 0
                    }, {
                        "s": [3, 0],
                        "p": ["5", "4"],
                        "r": 270
                    }, {
                        "s": [3, 0],
                        "p": ["5", "5"],
                        "r": 270
                    }, {
                        "s": [3, 0],
                        "p": ["5", "6"],
                        "r": 270
                    }, {
                        "s": [2, 0],
                        "p": ["5", "7"],
                        "r": 270
                    }, {
                        "s": [3, 0],
                        "p": ["6", "3"],
                        "r": 360
                    }, {
                        "s": [7, 1],
                        "p": ["6", "4"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["6", "5"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["6", "6"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["6", "7"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["7", "3"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["7", "4"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["7", "5"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["7", "6"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["7", "7"],
                        "r": 540
                    }, {
                        "s": [8, 0],
                        "p": ["7", "10"],
                        "r": 0
                    }, {
                        "s": [8, 1],
                        "p": ["7", "11"],
                        "r": 180
                    }, {
                        "s": [8, 1],
                        "p": ["7", "12"],
                        "r": 180
                    }, {
                        "s": [3, 0],
                        "p": ["8", "3"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["8", "4"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["8", "5"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["8", "6"],
                        "r": 540
                    }, {
                        "s": [4, 1],
                        "p": ["8", "7"],
                        "r": 540
                    }, {
                        "s": [8, 1],
                        "p": ["8", "8"],
                        "r": 180
                    }, {
                        "s": [8, 1],
                        "p": ["8", "9"],
                        "r": 180
                    }, {
                        "s": [8, 0],
                        "p": ["8", "10"],
                        "r": 180
                    }, {
                        "s": [11, 7],
                        "p": ["8", "11"],
                        "r": 180
                    }, {
                        "s": [3, 0],
                        "p": ["9", "3"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["9", "4"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["9", "5"],
                        "r": 540
                    }, {
                        "s": [0, 1],
                        "p": ["9", "6"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["9", "7"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["10", "3"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["10", "4"],
                        "r": 540
                    }, {
                        "s": [7, 1],
                        "p": ["10", "5"],
                        "r": 360
                    }, {
                        "s": [0, 1],
                        "p": ["10", "6"],
                        "r": 540
                    }, {
                        "s": [3, 0],
                        "p": ["10", "7"],
                        "r": 540
                    }, {
                        "s": [11, 7],
                        "p": ["11", "1"],
                        "r": 180
                    }, {
                        "s": [2, 0],
                        "p": ["11", "3"],
                        "r": 90
                    }, {
                        "s": [3, 0],
                        "p": ["11", "4"],
                        "r": 450
                    }, {
                        "s": [3, 0],
                        "p": ["11", "5"],
                        "r": 450
                    }, {
                        "s": [3, 0],
                        "p": ["11", "6"],
                        "r": 450
                    }, {
                        "s": [2, 0],
                        "p": ["11", "7"],
                        "r": 180
                    }, {
                        "s": [11, 7],
                        "p": ["12", "1"],
                        "r": 180
                    }, {
                        "s": [10, 7],
                        "p": ["12", "10"],
                        "r": 180
                    }, {
                        "s": [11, 7],
                        "p": ["15", "8"],
                        "r": 180
                    }, {
                        "s": [10, 7],
                        "p": ["17", "2"],
                        "r": 180
                    }
                ], "Screen::Screen"]
        },
        "Sprite": {
            "Player": {
                "position": {
                    "x": 512,
                    "y": 384
                },
                "scale": 1,
                "rotation": 0,
                "image": {
                    "parent": "Tileset::Dungeon Tiles",
                    "position": {
                        "x": "6",
                        "y": "8"
                    }
                },
                "parent": "Screen::Screen"
            }
        },
        "Image": {
            "Player Image": ["https://gameify.vercel.app/sample/tilesheet.png"]
        }
    },
    "files": {
        "main.js": "import {$get,$share} from './_out.js';\r\nimport {gameify} from '/gameify/gameify.js';\r\n\r\n// MAIN.JS - This is where your game setup logic goes\r\n\r\nconst screen = $get('Screen::')[0];\r\nconst mainScene = $get('Scene::Main Scene');\r\nconst player = $get('Sprite::Player');\r\nconst map = $get('Tilemap::Dungeon Map');\r\n\r\nconst playerSpeed = 100; // px per second\r\n\r\nmainScene.onUpdate((delta) => {\r\n    screen.clear()\r\n\r\n    let addedVelocity = new gameify.Vector2d(0, 0);\r\n\r\n    // change the added velocity based on what keys are pressed.\r\n    if (screen.keyboard.keyIsPressed(\"W\")) { addedVelocity.y -= 1; }\r\n    if (screen.keyboard.keyIsPressed(\"S\")) { addedVelocity.y += 1; }\r\n    if (screen.keyboard.keyIsPressed(\"D\")) { addedVelocity.x += 1; }\r\n    if (screen.keyboard.keyIsPressed(\"A\")) { addedVelocity.x -= 1; }\r\n\r\n    // Normalize the addedVeclocity vector and multiply by the player speed\r\n    // This way the player goes the same speed even when moving diagonally\r\n    addedVelocity = addedVelocity.getNormalized().multiply(playerSpeed);\r\n\r\n    // Add this frame's movement to the player's speed\r\n    player.velocity = player.velocity.add(addedVelocity);\r\n\r\n    // The update function takes the velocity and moves the player\r\n    player.update(delta);\r\n\r\n    // slow the player down, so they don't go super fast\r\n    player.velocity = player.velocity.multiply(1/delta);\r\n});\r\n\r\nmainScene.onDraw(() => {\r\n    map.draw();\r\n    player.draw();\r\n});",
        "level.js": "import {$get,$share} from './_out.js';\r\nimport {gameify} from '/gameify/gameify.js';\r\n\r\n",
        "style.css": "html, body {\r\n    background: #ddd;\r\n    height: 100%;\r\n    margin: 0;\r\n}\r\ndiv {\r\n    display: flex;\r\n    flex-direction: column;\r\n    justify-content: center;\r\n    align-items: center;\r\n    height: 100%;\r\n    width: 100%;\r\n    margin: 0;\r\n}\r\ncanvas {\r\n    position: relative;\r\n    background: white;\r\n    max-width: 100%;\r\n    max-height: 100%;\r\n}"
    }
}
