import {gameify} from '/gameify/gameify.js';
import {game_template} from '/engine/project/_template.js';


/* Code Editor */

const editorFileList = document.querySelector('#editor-list');

let files = {};

const editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/dracula");
editor.setOptions({fontSize: '16px'})


/* Misc Internal Utils */

const visualLog = (message, type = 'info', source = 'editor') => {
    if (type === 'error') showWindow('visual');

    const visualEl = document.querySelector('#visual-output');
    visualEl.innerHTML += `<span class="log-item ${type}">
            <span class="short">${type.toUpperCase()}</span>
            <span class="message">${message}</span>
            <span class="source">${source}</span>
        </span>`;
    visualEl.scrollTo(0, visualEl.scrollHeight);
}
const showWindow = (t) => {
    document.querySelector(`.window.visible`).classList.remove('visible');
    document.querySelector(`.window.${t}`).classList.add('visible');
};



/* Visual Editor and Tools */

let objects = {
    'None': {
        // Leave empty
    },
    'Screen': {
        'Screen': new gameify.Screen(document.querySelector('#game-canvas'), 1200, 800)
    },
    'Scene': {
        'Main Scene': new gameify.Scene()
    },
    'Tileset': {
        'Dungeon Tiles': new gameify.Tileset('/sample/tilesheet.png', 64, 64)
    },
    'Tilemap': {
        'Dungeon Map': new gameify.Tilemap(64, 64, 5, 5)
    },
    'Sprite': {
        'Player': new gameify.Sprite(0, 0, {__engine_name: 'Image::Player Image'})
    },
    'Image': {
        'Player Image': new gameify.Image('/sample/tilesheet.png')
    }
}

/** A label and button
 * @param {string} text - Label text
 * @param {string} [btn] - Button text
 * @param {Function} [call] - Button onclick callback
 */
const labelItem = (text, btn, call = ()=>{}) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;
    const button = document.createElement('button');
    button.innerHTML = btn;
    button.onclick = call;
    if (btn !== undefined) label.append(button);
    return label;
}
/** A label and input
* @param {string} text - Label text
* @param {string} [value=''] - Input value
* @param {string} [type='text'] - Input type
* @param {Function} [call] - Input onchange callback
*/
const inputItem = (text, value = '', type = 'text', call = ()=>{}) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.value = value;
    input.onchange = ()=>{ call(input.value); };
    label.append(input);
    return [label, input];
}
const twoInputItem = (text, values = ['', ''], type = 'text', call = ()=>{}) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;

    const xvl = document.createElement('span');
    xvl.classList.add('x-value-label');
    label.appendChild(xvl);
    const input = document.createElement('input');
    input.setAttribute('type', type);
    input.value = values[0];
    input.onchange = ()=>{ call(input.value, input2.value); };
    label.append(input);

    const yvl = document.createElement('span');
    yvl.classList.add('y-value-label');
    label.appendChild(yvl);
    const input2 = document.createElement('input');
    input2.setAttribute('type', type);
    input2.value = values[1];
    input2.onchange = ()=>{call(input.value, input2.value)};
    label.append(input2);

    return [label, input, input2];
}
const selectItem = (text, options, call = ()=>{}, selected) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;
    const input = document.createElement('select');
    input.onchange = () => {
        if (input.value !== 'None::None') {
            input.querySelector('option[value="None::None"]').setAttribute('disabled', true);
        }
        call(input.value);
    };

    input.innerHTML += `<option value="None::None" ${selected ? 'disabled' : ''}>- None -</option>`;
    for (const opt of options) {
        input.innerHTML += `<option ${selected === opt ? 'selected' : ''}>${opt}</option>`;
    }
    label.append(input);
    return [label, input];
}

const populateObjectsList = () => {
    const objList = document.querySelector('#node-list');
    objList.innerHTML = '';

    const types = [];

    for (const setName in objects) {
        const set = objects[setName];
        types.push(setName);

        for (const objName in set) {
            const obj = set[objName];

            obj.__engine_name = setName + '::' + objName;

            const details = document.createElement('details');
            if (obj.__engine_options_open) details.setAttribute('open', true);
            details.addEventListener('toggle', () => {
                obj.__engine_options_open = details.hasAttribute('open');
            });
            details.classList.add('list-item');
            const summary = document.createElement('summary');
            /* Icons */
            if (setName === 'Tileset') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-grid-3x3" viewBox="0 0 16 16">
                        <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v4h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/>
                    </svg>`;

            } else if (setName === 'Tilemap') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-map" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z"/>
                    </svg>`;

            } else if (setName === 'Scene') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                    </svg>`;

            } else if (setName === 'Screen') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-display" viewBox="0 0 16 16">
                        <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4c0 .667.083 1.167.25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75c.167-.333.25-.833.25-1.5H2s-2 0-2-2V4zm1.398-.855a.758.758 0 0 0-.254.302A1.46 1.46 0 0 0 1 4.01V10c0 .325.078.502.145.602.07.105.17.188.302.254a1.464 1.464 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.758.758 0 0 0 .254-.302 1.464 1.464 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.757.757 0 0 0-.302-.254A1.46 1.46 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145z"/>
                    </svg>`;

            } else if (setName === 'Image') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16">
                        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                    </svg>`;

            } else {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16">
                        <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
                    </svg>`;
            }
            summary.innerHTML += `${objName} <span class="type">${setName}</span>`;
            
            details.appendChild(summary);

            /* Property Items */

            const [nameElem, selName] = inputItem('Name', objName, 'text', (newName) => {
                newName = newName.replaceAll('::', '_');
                if (set[newName]) {
                    visualLog(`Object with the name '${setName}::${newName}' already exists!`, 'error');
                    return;
                }
                set[newName] = obj;
                set[objName] = undefined;
                delete set[objName];
                populateObjectsList();
            });
            // Don't allow changing the name of locked items
            if (!obj.__engine_locked) details.appendChild(nameElem);

            
            const screens = [];
            for (const scr in objects.Screen) { screens.push('Screen::' + scr); }
            const scenes = [];
            for (const scn in objects.Scene) { scenes.push('Scene::' + scn); }
            const images = [];
            for (const img in objects.Image) { images.push('Image::' + img); }
            const tilesets = [];
            for (const tst in objects.Tileset) { tilesets.push('Tileset::' + tst); }

            if (obj.__engine_locked) {
                details.appendChild(labelItem(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                        <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                        <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                    </svg>
                    This object is locked
                `));
            } else if (setName === 'Tilemap') {
                details.appendChild(labelItem('Edit map', 'Edit', () => {
                    if (!obj.tileset) {
                        visualLog('You need to add a tileset before you can edit the map', 'error', obj.__engine_name);
                        return;
                    }
                    if (obj.__engine_editing) stopEditTileMap(obj);
                    else editTileMap(obj);
                }));
                details.appendChild(twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = Number(x);
                    obj.theight = Number(y);
                })[0]);
                details.appendChild(twoInputItem('Offset',  [obj.offset.x, obj.offset.y], 'number', (x, y) => {
                    obj.offset.x = Number(x);
                    obj.offset.y = Number(y);
                })[0]);
                details.appendChild(selectItem('Tileset', tilesets, (v) => {
                    obj.setTileset(objects[v.split('::')[0]][v.split('::')[1]]);
                }, obj.tileset?.__engine_name)[0]);
                details.appendChild(selectItem('Screen', screens, (v) => {
                    // Screen.add(obj)
                    objects[v.split('::')[0]][v.split('::')[1]].add(obj);
                }, obj.parent?.__engine_name)[0]);

            } else if (setName === 'Tileset') {
                details.appendChild(inputItem('File', obj.path, 'text', (v) => {
                    obj.path = v;
                })[0]);
                details.appendChild(twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = Number(x);
                    obj.theight = Number(y);
                })[0]);
            } else if (setName === 'Image') {
                details.appendChild(inputItem('File', obj.path, 'text', (v) => {
                    obj.path = v;
                })[0]);
            } else if (setName === 'Sprite') {
                details.appendChild(selectItem('Image', images.concat(tilesets), (v) => {
                    if (v.split('::')[0] === 'Image') {
                        obj.setImage(objects[v.split('::')[0]][v.split('::')[1]]);
                    } else if (v.split('::')[0] === 'Tileset') {
                        const tileset = objects[v.split('::')[0]][v.split('::')[1]];
                        console.log(tileset, tileX.value, tileY.value, tileset.getTile(tileX.value, tileY.value))
                        obj.setImage(tileset.getTile(tileX.value, tileY.value));
                        // Nothing special about this format,
                        // But that it identifies a derived image
                        // The name after the :: has no special meaning
                        obj.image.__engine_name = `Tileset/Image::${setName} ${objName}`;
                    }
                    updateTSPos();
                }, obj.image?.__engine_name || obj.image?.tileData.tileset?.__engine_name)[0]);

                const [tileLabel, tileX, tileY] = twoInputItem('Tile',  [0, 0], 'number', (x, y) => {
                    obj.setImage(obj.image.tileData.tileset.getTile(tileX.value, tileY.value));
                });
                const updateTSPos = () => {
                    if (obj.image?.tileData?.tileset) {
                        tileLabel.style.display = '';
                        tileX.value = obj.image.tileData.position.x;
                        tileY.value = obj.image.tileData.position.y;
                    } else {
                        tileLabel.style.display = 'none';
                    }
                }
                updateTSPos();
                details.appendChild(tileLabel);

                details.appendChild(twoInputItem('Position',  [obj.position.x, obj.position.y], 'number', (x, y) => {
                    obj.position.x = Number(x);
                    obj.position.y = Number(y);
                })[0]);
                details.appendChild(inputItem('Scale', obj.scale, 'number', (v) => {
                    obj.scale = Number(v);
                })[0]);
                details.appendChild(selectItem('Screen', screens, (v) => {
                    // Screen.add(obj)
                    objects[v.split('::')[0]][v.split('::')[1]].add(obj);
                }, obj.parent?.__engine_name)[0]);

            } else if (setName === 'Screen') {
                details.appendChild(inputItem('Canvas', obj.element.id, 'text', (v) => {
                    obj.element = document.getElementById(obj.element.id);
                })[0]);
                details.appendChild(twoInputItem('Size',  [obj.width, obj.height], 'number', (x, y) => {
                    obj.setSize(x, y);
                })[0]);
                details.appendChild(selectItem('Start Scene', scenes, (v) => {
                    obj.setScene(objects[v.split('::')[0]][v.split('::')[1]]);
                }, obj.currentScene?.__engine_name)[0]);

            } else if (setName === 'Scene') {
                details.appendChild(selectItem('Screen', screens, (v) => {
                    obj.parent = objects[v.split('::')[0]][v.split('::')[1]];
                }, obj.parent?.__engine_name)[0]);
            }

            /* Delete Button */

            const delButton = document.createElement('button');
            delButton.classList.add('list-item');
            delButton.classList.add('property');
            delButton.classList.add('small');
            delButton.innerHTML = 'Delete';
            delButton.onclick = () => {
                delete set[objName];
                visualLog(`Deleted object '${setName}::${objName}'`, 'warn');
                populateObjectsList();
            }
            // Don't allow deleting locked items
            if (!obj.__engine_locked) details.appendChild(delButton);

            objList.appendChild(details);
        }
    }

    /* New object */

    const details = document.createElement('details');
    details.classList.add('list-item');
    const summary = document.createElement('summary');
    summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Add object
    `;
    details.appendChild(summary); 

    const rand = Math.floor(Math.random() * 1000);
    const [nameElem, selName] = inputItem('Name', 'New Object ' + rand, 'text');
    details.appendChild(nameElem);
    const [typeElem, selType] = selectItem('Type', types, 'text', 'Sprite');
    details.appendChild(typeElem);

    const addButton = document.createElement('button');
    addButton.classList.add('list-item');
    addButton.classList.add('property');
    addButton.innerHTML = 'Add Object';
    addButton.onclick = () => {
        const type = selType.value;
        const name = selName.value.replaceAll('::', '_');
        if (objects[type][name]) {
            visualLog(`Object with the name '${type}::${name}' already exists!`, 'error');
        }

        const addToScreen = () => {
            // Add the image to the default screen
            Object.values(objects['Screen'])[0].add(objects[type][name]);
        }
        
        if (type === 'Tileset') {
            objects[type][name] = new gameify.Tileset('path/to/image.png', 64, 64);
        } else if (type === 'Tilemap') {
            objects[type][name] = new gameify.Tilemap(64, 64, 0, 0);
            addToScreen();
        } else if (type === 'Sprite') {
            objects[type][name] = new gameify.Sprite(0, 0, undefined);
            addToScreen();
        } else if (type === 'Image') {
            objects[type][name] = new gameify.Image('path/to/image.png');
        } else if (type === 'Scene') {
            objects[type][name] = new gameify.Scene(null);
        } else {
            visualLog(`You may not create a new ${type} object from the visual editor.`, 'error');
            return;
        }

        visualLog(`Created new object '${type}::${name}'`, 'log');
        populateObjectsList();
    }
    details.appendChild(addButton);

    objList.appendChild(details);

}

const serializeObjectsList = () => {
    const out = {};
    for (const type in objects) {
        const set = objects[type];
        out[type] = {}
        for (const name in set) {
            const item = set[name];
            if (item.serialize) {
                out[type][name] = item.serialize((o) => {
                    return o?.__engine_name;
                });
            } else {
                console.warn(`Cannot save ${type}::${name}`);
                out[type][name] = false;
            }
        }
    }

    return out;
}
const loadObjectsList = (data) => {
    const loadObject = (query) => {
        const type = query.split('::')[0];
        const name = query.split('::')[1];
        if (!objects[type]) objects[type] = {};
        if (!objects[type][name]) {
            objects[type][name] = gameify[type]('_deserialize')(data[type][name], loadObject);
            objects[type][name].__engine_name = type + '::' + name;
        }
        return objects[type][name];
    }

    objects = {};
    for (const type in data) {
        if (!objects[type]) objects[type] = {};
        for (const name in data[type]) {
            if (data[type][name] === false || !gameify[type]) {
                console.warn(`Cannot deserialize ${type}::${name}`);
                continue;
            }
            // If an object was already loaded (because of another's dependency)
            if (objects[type][name]) continue;

            // Deserialize object
            loadObject(type + '::' + name);
        }
    }
    populateObjectsList();
}

const editorCanvas = document.querySelector('#game-canvas');
const editorScreen = new gameify.Screen(editorCanvas, 1200, 800);

const dummyScene = new gameify.Scene(editorScreen);
editorScreen.setScene(dummyScene);

dummyScene.onUpdate(() => {
    // Resize based on game screen size
    const defaultScreen = Object.values(objects['Screen'])[0];
    editorScreen.setSize(defaultScreen.getSize());
});
dummyScene.onDraw(() => {
    for (const type of ['Tilemap', 'Sprite']) {
        for (const name in objects[type]) {
            const obj = objects[type][name];
            const ps = obj.getParent();
            editorScreen.add(obj);
            obj.draw();
            ps.add(obj); // Set the screen back!
        }
    }
});
editorScreen.startGame();

const editTileMap = (map) => {
    map.__engine_editing = true;

    visualLog(`Editing ${map.__engine_name}.`, 'log', 'tilemap editor');
    visualLog(`Click: Place tile
        <br>Right-Click: Delete tile
        <br>Middle-Click: Pick tile
        <br>Middle-Drag: Translate/move map
        <br>Scroll: Switch tile x
        <br>Ctrl-Scroll: Switch tile y
        <br>Shift-Scroll: Rotate tile`, 'info', 'tilemap editor');
    showWindow('visual');

    // Grab the scene and copy the update function
    const scene = map.enableMapBuilder(editorScreen);
    const update = scene.updateFunction;

    let countdown = 0;
    let prevOffset = {}
    // Hijack the update function
    scene.onUpdate((delta) => {
        if (prevOffset !== map.offset) {
            // Update the objects list when the offset is changed
            prevOffset = map.offset;
            populateObjectsList();
        }
        // call the regular update function
        update(delta);
        if (editorScreen.keyboard.keyIsPressed('Escape')) {
            stopEditTileMap(map);
        }
    });
}

const stopEditTileMap = (map) => {
    // Clear the visual editor
    editorScreen.getScene().unlock();
    editorScreen.setScene(dummyScene);
    map.__engine_editing = false;
    visualLog('Stopped editing tilemap', 'log', 'tilemap editor');
}

// Populate list after editor setup
populateObjectsList();
document.querySelector('#refresh-objects').addEventListener('click', populateObjectsList);

/* Game preview */

const gameFrame = document.querySelector('#game-frame');
const win = gameFrame.contentWindow;

const genGameHtml = (scripts = '') => {
    const html = `<head>
            <title>A Game</title>
            
            <style>
                html, body {
                    background: #ddd;
                    height: 100%;
                    margin: 0;
                }
                div {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 100%;
                    margin: 0;
                }
                canvas {
                    position: relative;
                    background: white;
                    max-width: 100%;
                    max-height: 100%;
                }
            </style>
        </head>
        <body>
            <div>
                <canvas id="game-canvas"></canvas>
            </div>
            ${scripts}
        </body>
    `;
    return html;
}

const consoleOut = document.querySelector('#console-output');
let numMessages = 0;
window.addEventListener('message', (event) => {
    numMessages += 1;
    if (numMessages > 200) {
        consoleOut.innerHTML = '';
        numMessages = 0;
        consoleOut.innerHTML += `<span class="log-item warn">
            <span class="short">CLEAR</span>
            <span class="message">Console items cleared - Too many logs</span>
            <span class="source">engine</span>
        </span>`;
    }

    if (event.data && event.data.type === 'console') {
        const { message, lineNumber, columnNumber, fileName } = event.data.payload;
        consoleOut.innerHTML += `<span class="log-item ${event.data.logType}">
            <span class="short">${event.data.logType.toUpperCase()}</span>
            <span class="message">${message}</span>
            <span class="source">${fileName.replace(/.* injectedScript.*/, '(project script)')} ${lineNumber}:${columnNumber}</span>
        </span>`;
        consoleOut.scrollTo(0, consoleOut.scrollHeight);
    }
});
gameFrame.addEventListener('load', () => {

    // Clear the console
    consoleOut.innerHTML = `<span class="log-item info"></span>`;
    numMessages = 0;

    // Set up log handlers
    const log = (t, args, q = {}, pe) => {
        const error = pe || new Error().stack.split('\n')[2];
        const split = error.split(':');

        let message = q ? args : args.map(a => JSON.stringify(a)).join(', ');

        try {
            win.parent.postMessage({
                type: 'console',
                logType: t,
                payload: {
                    message: message,
                    lineNumber: q.line || split[split.length - 2],
                    columnNumber: q.col || split[split.length - 1],
                    fileName: q.file || split[split.length - 3].replace(/.*?\/(engine\/)?/, '')
                }
            }, '*');
        
        } catch (e) {
            // Try to convert the logged object to a string
            win.parent.postMessage({
                type: 'console',
                logType: t,
                payload: {
                    message: String(message),
                    lineNumber: q.line || split[split.length - 2],
                    columnNumber: q.col || split[split.length - 1],
                    fileName: q.file || split[split.length - 3].replace(/.*?\/(engine\/)?/, '')
                }
            }, '*');
        }
    };

    win.console.log = (...args) => { log('log', args); }
    win.console.info = (...args) => { log('info', args); }
    win.console.debug = (...args) => { log('debug', args); }
    win.console.warn = (...args) => { log('warn', args); }
    win.console.error = (...args) => { 
        if (args[0] && args[0]._gameify_error === 'onerror') {
            const details = args[0].details
            // details = [message, file, line, col, error]
            log('error', [details[0]], {file: details[1].replace(/.*?:\d{4}\//, ''), line: details[2], col: details[3]});

        } else if (args[0] && args[0]._gameify_error === 'promise') {
            const details = args[0].message;
            log('error', [details], {}, "::");
        } else {
            log('error', args);
        }
    }

    win.__s_objects = serializeObjectsList();

    // Add scripts
    const html = win.document.querySelector('html');
    html.innerHTML = genGameHtml();

    console.info('GAME START (loading scripts)');

    for (const file in files) {
        const script = document.createElement('script');
        script.type = 'module';
        //script.src = './' + file;
        script.innerHTML = files[file].getValue();
        win.document.body.appendChild(script);
    }
});


/* Tabs */

document.querySelector('#play-button').addEventListener('click', () => {
    showWindow('preview');
    win.location.href = "/engine/project/;";
});
document.querySelector('#code-button').addEventListener('click', () => {
    showWindow('editor');
});
document.querySelector('#visual-button').addEventListener('click', () => {
    showWindow('visual');
});


let currentProjectFilename = '';

/* Save and load */

const saveProject = () => {
    const savedList = localStorage.getItem('saveNames')?.split(',') || [];

    const name = prompt('Name this save', currentProjectFilename).replaceAll(',', '_') || 'Unnamed Save';
    let overwrite = false;
    if (savedList.includes(name)) {
        if (!confirm(`Overwrite save '${name}'?`)) return;
        overwrite = true;
    }
    // If overwriting, the name is already in the list
    if (!overwrite) savedList.push(name);
    localStorage.setItem('saveNames', savedList.join(','))

    const saved = {
        objects: serializeObjectsList(),
        files: {}
    };
    for (const file in files) {
        saved.files[file] = files[file].getValue();
    }
    localStorage.setItem('savedObjects:' + name, JSON.stringify(saved));

    visualLog(`Saved as '${name}'${overwrite ? ' (overwrote)' : ''}`, 'debug');
    listSaves();
}
document.querySelector('#save-button').addEventListener('click', saveProject);
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        // Prevent the Save dialog to open
        e.preventDefault();
        // Place your code here
        saveProject();
    }
});

document.querySelector('#download-button').addEventListener('click', () => {
    const saved = {
        objects: serializeObjectsList(),
        files: {}
    };
    for (const file in files) {
        saved.files[file] = files[file].getValue();
    }

    var link = document.createElement("a");
    link.setAttribute('download', 'gameify_project.gpj');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(saved)]));
    document.body.appendChild(link);
    link.click();
    link.remove();

});

const listFiles = (data) => {
    let reloadEditors = true;
    if (!data) {
        data = files;
        reloadEditors = false;
    }
    // Clear the file list
    if (reloadEditors) files = {};
    editorFileList.innerHTML = '';
    
    // Load new files
    for (const file in data) {
        if (reloadEditors) {
            files[file] = ace.createEditSession(data[file]);
            files[file].setMode("ace/mode/javascript");
        }

        const button = document.createElement('button');
        button.classList.add('list-item');
        button.classList.add('filename');
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-braces" viewBox="0 0 16 16">
                <path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6zM13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6z"/>
            </svg>
            ${file.split('.')[0]}
            <span class="type">
                ${file.replace(file.split('.')[0] + '.', '').toUpperCase()}
            </span>`;

        button.addEventListener('click', () => {
            editor.setSession(files[file]);

            const prev = document.querySelector('.file-button-active');
            console.log(prev);
            if (prev) prev.classList.remove('file-button-active');
            button.classList.add('file-button-active');

            showWindow('editor');
        });
        editorFileList.appendChild(button);
    }
    for (const file in data) {
        editor.setSession(files[file]);
        // Set the first file as current
        break;
    }

    const newFileButton = document.createElement('button');
    newFileButton.classList.add('list-item');
    newFileButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-plus" viewBox="0 0 16 16">
            <path d="M8 6.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 .5-.5z"/>
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg> New file`;
    newFileButton.onclick = () => {
        let name = prompt('Enter a name', 'unnamed.js');
        while (files[name]) {
            name = prompt('That file already exists! Enter a name', 'unnamed.js');
        }
        files[name] = ace.createEditSession(`// ${name}\n`);
        files[name].setMode("ace/mode/javascript");
        listFiles();
        // Make sure the new file is opened
        showWindow('editor');
        editor.setSession(files[name]);
    }
    editorFileList.appendChild(newFileButton);
}
console.log(listFiles);
const openProject = (data) => {
    // Clear the visual editor
    editorScreen.getScene().unlock();
    editorScreen.setScene(dummyScene);

    listFiles(data.files);

    // Load editor objects
    loadObjectsList(data.objects);
}

const listSaves = () => {
    const listElem = document.querySelector('#load-save-list');
    listElem.innerHTML = '';

    const savedList = localStorage.getItem('saveNames')?.split(',') || [];
    if (!savedList) {
        const message = document.createElement('span');
        message.classList.add('list-item');
        message.innerText = 'No saves';
        listElem.appendChild(message);
    }

    for (const name of savedList) {
        const button = document.createElement('button');
        button.classList.add('list-item');

        if (!localStorage.getItem('savedObjects:' + name)) {
            button.setAttribute('title', 'This save is missing');
            console.warn('Missing save');
        }

        button.onclick = () => {
            const loaded = localStorage.getItem('savedObjects:' + name);
            if (!loaded) return;
            currentProjectFilename = name;
            openProject(JSON.parse(loaded));

            visualLog(`Loaded save '${name}'`, 'debug');
        }
        button.innerText = name;
        const delButton = document.createElement('button');
        delButton.onclick = () => {
            localStorage.removeItem('savedObjects:' + name);

            const savedList = localStorage.getItem('saveNames')?.split(',');
            savedList.splice(savedList.indexOf(name), 1)
            localStorage.setItem('saveNames', savedList.join(','))
            if (savedList.length < 1) localStorage.removeItem('saveNames');

            visualLog(`Deleted save '${name}'`, 'warn');
            listSaves();
        }
        delButton.innerText = 'Delete';
        button.appendChild(delButton);

        listElem.appendChild(button);
    }

    const label = document.createElement('span');
    label.classList.add('list-item');
    label.innerText = 'Upload';

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (event) => {
            const fileContents = event.target.result;
            visualLog(`Loaded project file '${file.name}'`, 'debug');
            currentProjectFilename = file.name;
            openProject(JSON.parse(fileContents));
        };
    }
    label.appendChild(input);

    listElem.appendChild(label);
}
listSaves();

visualLog('Loaded template project', 'debug');
openProject(game_template);