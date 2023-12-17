import {gameify} from '/gameify/gameify.js';
import {game_template} from '/engine/project/_template.js';

import { downloadZip } from "https://cdn.jsdelivr.net/npm/client-zip/index.js";

import { serializeObjectsList } from '/engine/serialize.js';

import { engineTypes } from '/engine/engine_types.js';
import { engineUI } from '/engine/engine_ui.js';
import { engineEvents } from '/engine/engine_events.js';
import { engineIntegrations } from '/engine/engine_integration.js';
import { engineFetch } from '/engine/engine_fetch.js';

import '/engine/docs.js';

/* Code Editor */

const editorFileList = document.querySelector('#editor-list');

let files = {};

const editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/dracula");
editor.setOptions({fontSize: '16px'})


/* Misc Internal Utils */

const visualLog = (message, type = 'info', source = 'editor') => {
    if (type === 'error') showWindow('visual');

    if (source.includes('progress')) {
        document.querySelector('#cloud-progress').innerHTML = message;
    } else if (source.includes('project')) {
        document.querySelector('#cloud-progress').innerHTML = message;
        return;
    }

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

    if (t === 'preview') {
        totalMessages = 0;
    }
};

const openContextMenu = (menu, posX, posY) => {
    const contextMenu = document.querySelector('.contextmenu');
    contextMenu.innerHTML = '';
    contextMenu.style.display = 'block';

    if (posX !== undefined) contextMenu.style.left = posX + 'px';
    if (posY !== undefined) contextMenu.style.top = posY + 'px';
    contextMenu.style.bottom = 'unset';

    for (const option in menu) {
        const button = document.createElement('button');
        button.classList.add('list-item');
        button.innerHTML = option;
        button.onclick = (event) => {
            event.stopPropagation();
            menu[option]();
            contextMenu.style.display = 'none';
        };
        contextMenu.appendChild(button);
    }

    setTimeout(() => {
        // wait for dom update, then check if we need to move the menu
        if (contextMenu.getBoundingClientRect().bottom > window.innerHeight) {
            contextMenu.style.top = 'unset';
            contextMenu.style.bottom = (window.innerHeight - posY) + 'px';
        }
    });
}
window.addEventListener('contextmenu', (event) => {
    if (event.target.__engine_menu) {
        event.stopPropagation();
        event.preventDefault();
        openContextMenu(event.target.__engine_menu, event.clientX, event.clientY);
    }
});
window.addEventListener('click', (event) => {
    setTimeout(() => {
        document.querySelector('.contextmenu').style.display = 'none';
    }, 20);
});


/* Visual Editor and Tools */

let objects = { };

const populateObjectsList = () => {
    const objList = document.querySelector('#node-list');
    objList.innerHTML = '';

    const types = [];

    for (const setName in engineTypes.types) {
        if (!objects[setName]) objects[setName] = {};
        const set = objects[setName];
        types.push(setName);

        for (const objName in set) {
            const obj = set[objName];

            obj.__engine_name = setName + '::' + objName;
            if (obj.__engine_visible === undefined) obj.__engine_visible = true;

            const details = document.createElement('details');
            if (obj.__engine_options_open) details.setAttribute('open', true);
            details.addEventListener('toggle', () => {
                obj.__engine_options_open = details.hasAttribute('open');
            });
            details.classList.add('list-item');
            const summary = document.createElement('summary');

            // Get the type's icon
            let icon = engineTypes.get(setName, 'icon');

            // Icon is a button that shows/hides the object
            const visibilityButton = document.createElement('button');
            if (obj.__engine_visible) {
                visibilityButton.classList.add('object-visible');
            } else {
                visibilityButton.classList.add('object-hidden');
            }
            visibilityButton.innerHTML = icon;
            visibilityButton.onclick = () => {
                obj.__engine_visible = !obj.__engine_visible;

                if (obj.__engine_visible) {
                    visibilityButton.classList.remove('object-hidden');
                    visibilityButton.classList.add('object-visible');
                } else {
                    visibilityButton.classList.remove('object-visible');
                    visibilityButton.classList.add('object-hidden');
                }
            }
            summary.appendChild(visibilityButton);
            // Name and Type
            summary.append(`${objName}`);
            const typeSpan = document.createElement('span');
            typeSpan.classList.add('type');
            typeSpan.innerHTML = setName;
            summary.appendChild(typeSpan);
            
            details.appendChild(summary);

            /* Property Items */

            const [nameElem, selName] = engineUI.inputItem('Name', objName, 'text', (newName) => {
                newName = newName.replaceAll('::', '_');
                if (set[newName]) {
                    visualLog(`Object with the name '${setName}::${newName}' already exists!`, 'error', 'objects editor');
                    return;
                }
                set[newName] = obj;
                set[objName] = undefined;
                delete set[objName];
                populateObjectsList();
            });
            // Don't allow changing the name of locked items
            if (!obj.__engine_locked) details.appendChild(nameElem);

            if (obj.__engine_locked) {
                details.appendChild(engineUI.labelItem(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                        <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                        <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                    </svg>
                    This object is locked
                `));
            } else {
                // Call the type's buildUI function
                engineTypes.get(setName, 'buildUI')(details, obj, objects);
            }

            /* Delete Button */

            const delButton = document.createElement('button');
            delButton.classList.add('list-item');
            delButton.classList.add('property');
            delButton.classList.add('small');
            delButton.innerHTML = 'Delete';
            delButton.onclick = () => {
                if (!confirm('Delete ' + obj.__engine_name + '? You can\'t undo this!')) return;
                delete set[objName];
                visualLog(`Deleted object '${setName}::${objName}'`, 'warn', 'objects editor');
                populateObjectsList();
            }
            // Don't allow deleting locked items
            if (!obj.__engine_locked) details.appendChild(delButton);

            objList.appendChild(details);

            summary.__engine_menu = {
                'Copy Name': () => {
                    navigator.clipboard.writeText(obj.__engine_name)
                },
                'Copy JavaScript': () => {
                    navigator.clipboard.writeText(`$get('${obj.__engine_name}')`)
                },
                'Delete': () => {
                    delButton.click();
                }
            }
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
    const [nameElem, selName] = engineUI.inputItem('Name', 'New Object ' + rand, 'text');
    details.appendChild(nameElem);
    const [typeElem, selType] = engineUI.selectItem('Type', types, undefined, 'Sprite');
    details.appendChild(typeElem);

    const addButton = document.createElement('button');
    addButton.classList.add('list-item');
    addButton.classList.add('property');
    addButton.innerHTML = 'Add Object';
    addButton.onclick = () => {
        const type = selType.value;
        const name = selName.value.replaceAll('::', '_');
        if (objects[type][name]) {
            visualLog(`Object with the name '${type}::${name}' already exists!`, 'error', 'objects editor');
        }
        
        const defaultScreen = Object.values(objects['Screen'])[0];
        const newObject = engineTypes.get(type, 'newObject')(defaultScreen);

        if (!newObject) {
            visualLog(`You may not create a new ${type} object from the visual editor.`, 'error', 'objects editor');
            return;

        } else {
            objects[type][name] = newObject;
        }

        visualLog(`Created new object '${type}::${name}'`, 'log', 'objects editor');
        populateObjectsList();
    }
    details.appendChild(addButton);

    objList.appendChild(details);

}
engineEvents.listen('refresh objects list', () => populateObjectsList());

const loadObjectsList = (data) => {
    const loadObject = (query) => {
        const type = query.split('::')[0];
        const name = query.split('::')[1];
        if (!objects[type]) objects[type] = {};
        if (!objects[type][name]) {
            if (!data[type][name]) {
                console.warn('Cannot load ' + query + ' (object data is missing)');
                return undefined;
            }
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

const previewScene = new gameify.Scene(editorScreen);
editorScreen.setScene(previewScene);

previewScene.onUpdate(() => {
    // Resize based on game screen size
    const defaultScreen = Object.values(objects['Screen'])[0];
    editorScreen.setSize(defaultScreen.getSize());
    editorScreen.setAntialiasing(defaultScreen.getAntialiasing());
});
previewScene.onDraw(() => {
    for (const type of ['Tilemap', 'Sprite']) {
        for (const name in objects[type]) {
            const obj = objects[type][name];
            const ps = obj.getParent();
            editorScreen.add(obj);
            try {
                obj.draw();
                obj.__engine_error = false;
            } catch (e) {
                // Object failed to draw
                if (!obj.__engine_error) {
                    visualLog(`Error drawing ${type}::${name}: ${e}`, 'error', 'visual editor');
                    // Track errors to not spam logs
                    obj.__engine_error = true;
                }
            }
            ps.add(obj); // Set the screen back!
        }
    }
});
editorScreen.startGame();

const editTileMap = (map) => {
    clearVisualEditor();
    showWindow('visual');
    visualLog(`Editing ${map.__engine_name}.`, 'log', 'tilemap editor');

    const tileset = map.getTileset();

    // Update antialiasing to be consistent
    editorScreen.setAntialiasing(map.getParent().getAntialiasing());

    const editScene = new gameify.Scene(editorScreen);
    editorScreen.setScene(editScene);

    const controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('visual');
    const tileList = document.createElement('div');
    tileList.classList.add('tile-list');

    controls.innerHTML = `
    <div class="legend">
        <span><img src="images/mouse_left.svg">Place tiles</span>
        <span><img src="images/mouse_right.svg">Delete tiles</span>
        <span><img src="images/mouse_middle.svg">Pick tile</span>
        <span><img src="images/arrows_scroll.svg">Rotate tile</span>
        <button id="vi-zoom-out"><img src="images/zoom_out.svg">Smaller</button>
        <button id="vi-zoom-in"><img src="images/zoom_in.svg">Larger</button>
    </div>
    `;

    let tileCellSize = 50;

    controls.querySelector('#vi-zoom-out').onclick = () => {
        tileCellSize -= 10;
        if (tileCellSize < 10) tileCellSize = 10;
        tileList.querySelectorAll('.tile').forEach(tile => {
            tile.style.width = tileCellSize + 'px';
            tile.style.height = tileCellSize + 'px';
        })
    }
    controls.querySelector('#vi-zoom-in').onclick = () => {
        tileCellSize += 10;
        if (tileCellSize > 80) tileCellSize = 80;
        tileList.querySelectorAll('.tile').forEach(tile => {
            tile.style.width = tileCellSize + 'px';
            tile.style.height = tileCellSize + 'px';
        })
    }

    controls.appendChild(tileList);
    editorCanvas.parentElement.after(controls);

    let selTile = {x: 0, y: 0, r: 0};
    let dragStart = false;
    let originalOffset = null;

    for (let ty = 0; ty < tileset.texture.height/tileset.theight; ty++) {
        for (let tx = 0; tx < tileset.texture.width/tileset.twidth; tx++) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.setAttribute('title', `Tile ${tx}, ${ty}`)
            tileCanvas.classList.add('tile');
            tileCanvas.classList.add(`tile-${tx}-${ty}`);
            if (tx === 0 && ty === 0) {
                tileCanvas.classList.add('selected');
            }
            tileCanvas.width = 50;
            tileCanvas.height = 50;
            tileCanvas.onclick = () => {
                tileList.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
                tileCanvas.classList.add('selected');
                selTile = {x: tx, y: ty, r: 0};
            }
            const tile = tileset.getTile(tx, ty);
            tileList.appendChild(tileCanvas);

            tile.draw(tileCanvas.getContext('2d'), 0, 0, 50, 50, 0);
        }
        const rowBreak = document.createElement('span');
        rowBreak.classList.add('row-break');
        tileList.appendChild(rowBreak);
    }

    editScene.onUpdate(() => {
        const position = map.screenToMap(editorScreen.mouse.getPosition());
        if (editorScreen.mouse.buttonIsPressed("left")) {
            map.place(selTile.x, selTile.y, position.x, position.y, selTile.r);

        } else if (editorScreen.mouse.buttonIsPressed("right")) {
            map.remove(position.x, position.y);

        }

        if (editorScreen.mouse.buttonIsPressed("middle")) {
            // Pick tile
            const tile = map.get(position.x, position.y);
            if (tile && !dragStart) {
                selTile = tile.source;
                selTile.r = tile.rotation;
                // Update the tile list
                tileList.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
                tileList.querySelector(`.tile-${tile.source.x}-${tile.source.y}`).classList.add("selected");
                tileList.querySelector(`.tile-${tile.source.x}-${tile.source.y}`).scrollIntoView();
            }

            // Drag map
            const mousePos = editorScreen.mouse.getPosition();
            if (!dragStart) {
                dragStart = mousePos;
                originalOffset = map.offset.copy();
            }
            map.offset = originalOffset.subtract(dragStart.subtract(mousePos)).rounded();
        } else {
            dragStart = false;
        }


        if (editorScreen.mouse.eventJustHappened("wheelup")) {
            selTile.r -= 45;
        } else if (editorScreen.mouse.eventJustHappened("wheeldown")) {
            selTile.r += 45;
        }
    });
    editScene.onDraw(() => {
        // Convert to map and back again to snap to map tiles
        const position = map.mapToScreen(map.screenToMap(editorScreen.mouse.getPosition()));

        const previewTile = map.getTileset().getTile(selTile.x, selTile.y);
        
        editorScreen.clear();
        map.draw();

        const ctx = editorCanvas.getContext('2d');

        ctx.globalAlpha = 0.25;
        for (const mn in objects['Tilemap']) {
            if (objects['Tilemap'][mn] === map ||
                objects['Tilemap'][mn].__engine_visible === false) {
                continue;
            }

            objects['Tilemap'][mn].offset = map.offset.copy();
            objects['Tilemap'][mn].draw();
        }
        ctx.globalAlpha = 1;

        ctx.globalAlpha = 0.5;
        previewTile.draw(ctx,
                        position.x, position.y,
                        map.twidth, map.theight,
                        selTile.r);

        ctx.globalAlpha = 1;
        ctx.font = '26px sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText('Editing ' + map.__engine_name, 10, editorCanvas.height - 10);

    });
}
engineEvents.listen('edit tilemap', (_event, map) => editTileMap(map));

const clearVisualEditor = () => {
    visualLog(`Cleared tilemap editor`, 'debug', 'tilemap editor');
    const controls = document.querySelector('.editor-controls.visual');
    if (controls) {
        controls.remove();
    }
    for (const mn in objects['Tilemap']) {
        // Reset tilemap positions
        objects['Tilemap'][mn].offset = gameify.vectors.ZERO();
    }
    editorScreen.setScene(previewScene);
}
engineEvents.listen('clear visual editor', () => clearVisualEditor());

// Populate list after editor setup
populateObjectsList();
document.querySelector('#refresh-objects').addEventListener('click', populateObjectsList);

/* Game preview */

const gameFrame = document.querySelector('#game-frame');
const gameFrameWindow = gameFrame.contentWindow;

const genGameHtml = (scripts = '', styles = '') => {
    const html = `<head>
            <title>A Game</title>
            ${styles}
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
let totalMessages = 0;
const maxMessages = 1000
window.addEventListener('message', (event) => {
    numMessages += 1;
    totalMessages += 1;

    if (numMessages > 200) {
        consoleOut.innerHTML = '';
        numMessages = 0;
        consoleOut.innerHTML += `<span class="log-item warn">
            <span class="short">CLEAR</span>
            <span class="message">Console items cleared - Too many logs</span>
            <span class="source">console</span>
        </span>`;
    }

    const sanitize = (txt) => {
        // Make sure there's no funny business from an embedded game trying to send
        // malicious things in console logs. Not sure how viable this actually is,
        // but better to prevent it than not.
        return txt.toString().replaceAll(/&/g, '&amp;').replaceAll(/</g, '&lt;').replaceAll(/>/g, '&gt;');
    }

    if (event.data && event.data.type === 'console') {
        const { message, lineNumber, columnNumber, fileName } = event.data.payload;
        consoleOut.innerHTML += `<span class="log-item ${sanitize(event.data.logType)}">
            <span class="short">${sanitize(event.data.logType.toUpperCase())}</span>
            <span class="message">${sanitize(message.join(', '))}</span>
            <span class="source">
                ${sanitize(fileName.replace(/.* injectedScript.*/, '(project script)'))}
                ${sanitize(lineNumber)}:${sanitize(columnNumber)}
            </span>
        </span>`;
        consoleOut.scrollTo(0, consoleOut.scrollHeight);
    }
});
gameFrame.addEventListener('load', () => {
    // Clear the console
    consoleOut.innerHTML = `<span class="log-item info"></span>`;
    numMessages = 0;

    const saved = {
        objects: serializeObjectsList(objects),
        files: {}
    };
    for (const file in files) {
        saved.files[file] = files[file].getValue();
    }
    gameFrameWindow.postMessage(saved, /* REPLACE=embedURL */'https://gameify-embed.vercel.app'/* END */);
});

const runGame = () => {
    clearVisualEditor();
    showWindow('preview');
    gameFrameWindow.location.href = /* REPLACE=embedURL */'http://localhost:3001'/* END */+'/embed.html';
}

/* Tabs */

document.querySelector('#play-button').addEventListener('click', () => {
    runGame();
});
document.querySelector('#code-button').addEventListener('click', () => {
    showWindow('editor');
});
document.querySelector('#docs-button').addEventListener('click', () => {
    showWindow('docs');
});
document.querySelector('#visual-button').addEventListener('click', () => {
    showWindow('visual');
});

let currentProjectFilename = undefined;

/* Save and load */

engineFetch.setSessionFunction(() => {
    document.querySelector('#login-link').innerHTML = 'Log In';
    visualLog(`Session expired. Please <a href="./auth.html" target="_blank">log out/in</a> to refresh.`, 'error', 'account');
});
engineFetch.setLogFunction(visualLog);

const saveProject = (asName) => {
    const savedList = localStorage.getItem('saveNames')?.split(',') || [];

    const name = asName || prompt('Name this save', currentProjectFilename)?.replaceAll(',', '_');
    if (!name) {
        return;
    }

    let overwrite = false;
    if (savedList.includes(name) && name !== currentProjectFilename) {
        if (!confirm(`Overwrite save '${name}'?`)) return;
        overwrite = true;
    } else if (savedList.includes(name)) {
        overwrite = true;
    }

    // If overwriting, the name is already in the list
    if (!overwrite) savedList.push(name);
    localStorage.setItem('saveNames', savedList.join(','))

    const saved = {
        objects: serializeObjectsList(objects),
        integrations: engineIntegrations.getIntegrations(),
        files: {}
    };
    for (const file in files) {
        saved.files[file] = files[file].getValue();
    }

    let success = false;
    try {
        localStorage.setItem('savedObjects:' + name, JSON.stringify(saved));
        success = true;
    } catch (e) {
        console.error(e);
        alert('Your project could not be saved locally (likely because your files are too large)');
        visualLog(`Failed to save project, an error occurred!`, 'error', 'local save');
    }

    const cloudAccountName = localStorage.getItem('accountName');
    if (cloudAccountName) {
        visualLog(`Uploading '${cloudAccountName}/${name}' to cloud ...`, 'info', 'cloud progress');
        // Logged in, save to cloud!
        fetch('/api/games-store/save-game', {
            method: 'POST',
            body: JSON.stringify({
                username: cloudAccountName,
                sessionKey: localStorage.getItem('accountSessionKey'),
                title: name,
                data: saved
            })
        })
        .then(engineFetch.toJson)
        .then(result => {
            if (result.error) {
                visualLog(`Failed to upload to cloud.`, 'error', 'cloud save');
                engineFetch.checkSessionErrors(result);
            } else {
                visualLog(`Uploaded '${cloudAccountName}/${name}'`, 'info', 'cloud progress');
            }
        });
    } else {
        visualLog(`Saved as '${name}'`, 'info', 'local project');
    }

    if (success) {
        visualLog(`Saved locally as '${name}'${overwrite ? ' (overwrote)' : ''}.${
            cloudAccountName ? '' : ' <a href="./auth.html" target="_blank">Log in</a> to save to cloud.'
        }`, 'info', 'local save');
    }
    listSaves();

    currentProjectFilename = name;

    return name;
}
const pushProjectToGithub = () => {
    const saved = {
        objects: serializeObjectsList(objects),
        integrations: engineIntegrations.getIntegrations(),
        files: {}
    };
    for (const file in files) {
        saved.files[file] = files[file].getValue();
    }

    if (engineIntegrations.getProvider() !== 'github') {
        visualLog(`Current project does not have GitHub integration.`, 'error', 'github push');
    }

    const repoName = engineIntegrations.getRepo();
    const commitMessage = prompt('Describe your changes', 'Update project')?.replaceAll(',', '_');
    if (!commitMessage) {
        visualLog(`Github push canceled`, 'warn', 'github push');
        return;
    }

    visualLog(`Pushing changes to GitHub...`, 'info', 'github progress');

    fetch('/api/integrations/github-push-game', {
        method: 'POST',
        body: JSON.stringify({
            username: localStorage.getItem('accountName'),
            sessionKey: localStorage.getItem('accountSessionKey'),
            repo: repoName,
            url: 'https://github.com/' + repoName,
            message: commitMessage,
            data: saved
        })
    })
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            visualLog(`Failed to push to GitHub.`, 'error', 'github project');
            visualLog(`Failed to push '${repoName}' to GitHub.`, 'error', 'github push');
            if (engineFetch.checkSessionErrors(result)
                || engineFetch.checkGithubErrors(result, repoName)
            ) {
                return;
            } else if (result.error.includes('merge conflict')) {
                visualLog(`Merge conflict`, 'info', 'github project');
                visualLog(`There was a merge conflict while pushing your changes<br>
                    Your changes were pushed to a new branch, <code>${result.branch}</code><br>
                    You'll need to resolve these issues on your own.`,
                    'warn', 'github push');

            } else visualLog(result.error, 'warn', 'github push');
            return;
        }
        if (result.message.includes('no changes')) {
            visualLog(`Up-to-date with Github`, 'info', 'github project');
            visualLog(`Did not push to GitHub, no changes (your copy is up to date with '${repoName}').`, 'info', 'github push');
        } else {
            visualLog(`Pushed changes to '${repoName}'.`, 'info', 'github progress');
        }
    });
}
const diffGithubProject = () => {
    const button = document.querySelector('#github-diff-button');
    button.innerHTML = 'Loading...'

    const repo = engineIntegrations.getRepo();
    visualLog(`Loading diff from github: '${repo}' ...`, 'info', 'github diff');

    loadGithubRepo(repo, (result) => {
        engineIntegrations.setDiffContents(result.data);
        listFiles();
        visualLog(`Loaded diff from '${repo}'`, 'info', 'github diff');
        document.querySelector('#diff-objects-button').style.display = '';
        document.querySelector('#diff-objects-button').addEventListener('click', () => {
            showWindow('editor-diff');
            engineIntegrations.showDiff(serializeObjectsList(objects));
        });
        button.innerHTML = 'Diff';
    }, (result) => {
        button.innerHTML = 'Diff';
    });
}

const exportProject = async () => {
    const zipFiles = [];
    let styles = '';
    let scripts = '';
    for (const file in files) {
        zipFiles.push({
            name: file,
            input: files[file].getValue()
        });

        if (file.endsWith('.js')) {
            scripts += `<script src="./${file}" type="module"></script>`;
        } else if (file.endsWith('.css')) {
            styles += `<link rel="stylesheet" href="./${file}">`;
        }
    }

    zipFiles.push({
        name: 'index.html',
        input: `<!DOCTYPE html>
            <html>
                <head>
                    <title>A Game</title>
                    ${styles}
                </head>
                <body>
                    <div><canvas id="game-canvas"></canvas></div>
                </body>
                ${scripts}
            </html>`
    });

    const outJS = await fetch("./project/_out.js");
    const outJSText = await outJS.text();
    const objListText = 'window.__s_objects = ' + JSON.stringify(serializeObjectsList(objects));

    zipFiles.push({
        name: '_out.js',
        input: outJSText.replace('/*__s_objects*/', objListText)
    });

    const blob = await downloadZip(zipFiles).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (currentProjectFilename || 'gameify_project').toLowerCase().replace(/[^a-zA-z0-9._]/g, '_') + ".zip";
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}
const exportProjectSource = async () => {
    const zipFiles = [];
    for (const file in files) {
        zipFiles.push({
            name: file,
            input: files[file].getValue()
        });
    }

    const config = { objects: 'objects.gpj' };
    if ('.gfengine' in files) {
        // simplified parsing (as compared to github-load-game.js),
        // this only grabs values needed for exporting the project
        for (const line of configText.split('\n')) {
            if (line.startsWith('#')) continue;
            const param = line.split(':')[0].trim();
            const value = line.split(':')[1].trim();

            if (param == 'OBJECTS')  config.objects = value;
        }

    } else {
        zipFiles.push({
            name: '.gfengine',
            input: `# This file tells gameify how to configure your project
# What folder gameify should read files from
FOLDER:.
# The objects file
OBJECTS:objects.gpj
# Any files to ignore (one file per line)
# IGNORE: uncomment this line to add files`
        });
    }
    zipFiles.push({
        name: config.objects,
        // Be nice to version control and format the json
        input: JSON.stringify({ "objects": serializeObjectsList(objects) }, null, 2)
    })

    const blob = await downloadZip(zipFiles).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (currentProjectFilename || 'gameify_project').toLowerCase().replace(/[^a-zA-z0-9._]/g, '_') + ".zip";
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

document.querySelector('#save-button').addEventListener('click', () => { saveProject() });
document.querySelector('#github-push-button').addEventListener('click', () => { pushProjectToGithub() });
document.querySelector('#github-diff-button').addEventListener('click', () => { diffGithubProject() });
document.querySelector('#export-game-button').addEventListener('click', () => { exportProject() });
document.querySelector('#export-source-button').addEventListener('click', () => { exportProjectSource() });
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        // Ctrl + S
        // Save project
        e.preventDefault();
        saveProject(currentProjectFilename);
    } else if (e.ctrlKey && e.key === 'S') {
        // Ctrl + Shift + S
        // Screenshot canvas and download
        var link = document.createElement("a");
        link.setAttribute('download', 'screenshot.png');
        link.href = gameFrameWindow.document.querySelector('canvas').toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();

        e.preventDefault();
    } else if (e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
        // Ctrl + Enter
        // Run game
        runGame();
        e.preventDefault();
    } else if (e.ctrlKey && e.key === 'C') {
        // Ctrl + Shift + C
        // Open code editor
        showWindow('editor');
        e.preventDefault();
    } else if (e.ctrlKey && e.key === 'V') {
        // Ctrl + Shift + V
        // Open visual editor
        showWindow('visual');
        e.preventDefault();
    }
});

document.querySelector('#download-button').addEventListener('click', () => {
    const saved = {
        objects: serializeObjectsList(objects),
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
            if (file.endsWith('.js')) files[file].setMode("ace/mode/javascript");
            else if (file.endsWith('.css')) files[file].setMode("ace/mode/css");
        }

        const button = document.createElement('button');
        button.classList.add('list-item');
        button.classList.add('filename');
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-braces" viewBox="0 0 16 16">
                <path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6zM13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6z"/>
            </svg>
            ${file.split('.')[0]}
            <span class="type">
                .${file.replace(file.split('.')[0] + '.', '').toUpperCase()}
            </span>`;

        if (engineIntegrations.haveDiff()) {
            const diffButton = document.createElement('button');
            diffButton.innerHTML = 'Diff';
            diffButton.onclick = (evt) => {
                showWindow('editor-diff');
                evt.stopPropagation();
                engineIntegrations.showDiff(file, files);
            }
            button.appendChild(diffButton);
        }

        button.__engine_menu = {
            'Open': () => {
                button.click();
            },
            'Rename': () => {
                let name = prompt('Enter a new name', file);
                if (!name || name === file) return;
                while (files[name]) {
                    name = prompt('That file already exists! Enter a new name', file);
                    if (!name || name === file) return;
                }
                const temp = files[file];
                delete files[file];
                files[name] = temp;
                visualLog(`Renamed file '${file}' to '${name}'`, 'log', 'filesystem');
                listFiles();
            },
            'Delete': () => { 
                if (confirm('Delete ' + file + '?')) {
                    delete files[file];
                    visualLog(`Deleted file '${file}'`, 'warn', 'filesystem');
                    listFiles();
                }   
            }
        }

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
        if (!name) return;
        while (files[name]) {
            name = prompt('That file already exists! Enter a name', 'unnamed.js');
            if (!name) return;
        }
        files[name] = ace.createEditSession(`// ${name}\n`);
        files[name].setMode("ace/mode/javascript");
        visualLog(`Created file '${name}'`, 'log', 'filesystem');
        listFiles();
        // Make sure the new file is opened
        showWindow('editor');
        editor.setSession(files[name]);
    }
    editorFileList.appendChild(newFileButton);
}

const openProject = (data) => {
    engineIntegrations.setIntegrations(data.integrations);
    console.log(data);
    if (data.integrations?.github) {
        document.querySelector('#github-save-integration').style.display = '';
    } else {
        document.querySelector('#github-save-integration').style.display = 'none';
    }

    // Clear the visual editor
    clearVisualEditor();

    listFiles(data.files);

    // Load editor objects
    loadObjectsList(data.objects);

    visualLog(`Loaded '${currentProjectFilename || 'Template Project'}'`, 'log', 'project');
}

const deleteCloudSave = (save) => {
    const cloudAccountName = localStorage.getItem('accountName');
    if (!confirm(`Delete cloud save '${cloudAccountName}/${save}'?`)) return;

    visualLog(`Deleting '${cloudAccountName}/${save}' from the cloud.`, 'warn', 'cloud save');

    fetch('/api/games-store/save-game', {
        method: 'POST',
        body: JSON.stringify({
            username: cloudAccountName,
            sessionKey: localStorage.getItem('accountSessionKey'),
            title: save,
            delete: true
        })
    })
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            visualLog(`Failed to delete '${save}' from the cloud.`, 'error', 'cloud save');
            engineFetch.checkSessionErrors(result);
        } else {
            visualLog(`Deleted '${cloudAccountName}/${save}' from the cloud.`, 'warn', 'cloud save');
        }
        listSaves();
    });
}

const listSaves = () => {
    const listElem = document.querySelector('#load-save-list');
    listElem.innerHTML = '';

    // cloud files

    const cloudAccountName = localStorage.getItem('accountName');
    if (cloudAccountName) {
        // listprojects handles updating the account name in the corner
        document.querySelector('#login-link').innerHTML = cloudAccountName;

        const cloudLoadingIndicator = document.createElement('span');
        cloudLoadingIndicator.classList.add('list-item');
        cloudLoadingIndicator.innerHTML = 'Loading cloud saves...';
        listElem.prepend(cloudLoadingIndicator);

        fetch('/api/games-store/list-games', {
            method: 'POST',
            body: JSON.stringify({
                username: cloudAccountName,
                sessionKey: localStorage.getItem('accountSessionKey')
            })
        })
        .then(engineFetch.toJson)
        .then(result => {
            cloudLoadingIndicator.remove();

            if (result.error) {
                visualLog(`Failed to list cloud saves.`, 'warn', 'cloud save');
                engineFetch.checkSessionErrors(result);
                return;
            }

            for (const game of result.games) {
                const name = game.title
                const button = document.createElement('button');
                button.classList.add('list-item');

                button.onclick = () => {
                    visualLog(`Loading '${name}' ...`, 'info', 'cloud progress');

                    fetch(`/api/games-store/load-game`, {
                        method: 'POST',
                        body: JSON.stringify({
                            // no session key needed for loading
                            username: cloudAccountName,
                            title: game.title
                        })
                    })
                    .then(engineFetch.toJson)
                    .then(result => {
                        if (result.error) {
                            visualLog(`Failed to load game '${name}' - ${result.error}`, 'error', 'cloud save');
                            engineFetch.checkSessionErrors(result);
                            return;
                        }

                        currentProjectFilename = name;
                        openProject(result.data);
                        visualLog(`Loaded cloud save '${name}'`, 'info', 'cloud save');
                    });
                }
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-cloud-arrow-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M7.646 10.854a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 9.293V5.5a.5.5 0 0 0-1 0v3.793L6.354 8.146a.5.5 0 1 0-.708.708l2 2z"/>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                </svg> ` + name;

                
                const openButton = document.createElement('button');
                openButton.onclick = () => {
                    window.open(`${window.location.protocol}//${window.location.host}/engine/play.html#${cloudAccountName}/${name}`, '_blank');
                }
                openButton.classList.add('right');
                openButton.innerText = 'Play';
                button.appendChild(openButton);

                listElem.prepend(button);
                button.__engine_menu = {
                    'Save': () => {
                        saveProject(name);
                    },
                    'Load': () => {
                        button.click();
                    },
                    'Delete': () => {
                        button.style.color = '#ff8';
                        deleteCloudSave(name);
                    }
                }
            }
        });

    } else {
        document.querySelector('#login-link').innerHTML = 'Log in';
    }

    // local files

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
            button.setAttribute('disabled', 'True');
            console.warn('Missing save');
        }

        button.onclick = () => {
            const loaded = localStorage.getItem('savedObjects:' + name);
            if (!loaded) return;
            currentProjectFilename = name;
            openProject(JSON.parse(loaded));

            visualLog(`Loaded save '${name}'`, 'info', 'local save');
        }
        button.innerText = name;
        const delButton = document.createElement('button');
        delButton.onclick = (event, bypass) => {
            event?.stopPropagation();
            if (!bypass && !confirm(`Delete save ${name}?`)) { return; }

            localStorage.removeItem('savedObjects:' + name);

            const savedList = localStorage.getItem('saveNames')?.split(',');
            savedList.splice(savedList.indexOf(name), 1)
            localStorage.setItem('saveNames', savedList.join(','))
            if (savedList.length < 1) localStorage.removeItem('saveNames');

            visualLog(`Deleted save '${name}'`, 'warn', 'local save');
            listSaves();
        }
        delButton.innerText = 'Delete';
        button.appendChild(delButton);

        listElem.appendChild(button);

        button.__engine_menu = {
            'Save': () => {
                saveProject(name);
            },
            'Load': () => {
                button.click();
            },
            'Delete': () => {
                delButton.click();
            },
            'Rename': () => {
                let newName = prompt('Rename this save', name);
                if (!newName) return;
                if (localStorage.getItem('savedObjects:' + newName)) {
                    if (!confirm(`Overwrite save ${newName}?`)) return;
                }
                // Copy the save over
                localStorage.setItem(
                    'savedObjects:' + newName,
                    localStorage.getItem('savedObjects:' + name)
                );
                const savedList = localStorage.getItem('saveNames')?.split(',') || [];
                savedList.splice(savedList.indexOf(name), 1, newName);
                localStorage.setItem('saveNames', savedList.join(','));
                // Delete the old save
                localStorage.removeItem('savedObjects:' + name);
                visualLog(`Renamed save '${name}' to '${newName}'`, 'log', 'local save');
                listSaves();
            }
        }
    }

    // upload files

    const label = document.createElement('span');
    label.classList.add('list-item');
    label.innerText = 'Upload';

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.gpj');
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (event) => {
            const fileContents = event.target.result;
            visualLog(`Loaded project file '${file.name}'`, 'info', 'local save');
            currentProjectFilename = file.name;
            openProject(JSON.parse(fileContents));
        };
    }
    label.appendChild(input);

    listElem.appendChild(label);
}
document.querySelector('#refresh-saves').addEventListener('click', listSaves);
listSaves();

visualLog('Loaded template project', 'debug', 'engine');
openProject(game_template);

const loadGithubRepo = (repo, callback, errCallback) => {
    fetch('/api/integrations/github-load-game', {
        method: 'POST',
        body: JSON.stringify({
            // github integration requires a session key
            username: localStorage.getItem('accountName'),
            sessionKey: localStorage.getItem('accountSessionKey'),
            repo: repo,
            url: 'https://github.com/' + repo
        })
    })
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            visualLog(`Failed to load github repo '${repo}' - ${result.error}`, 'error', 'github');
            engineFetch.checkSessionErrors(result);
            engineFetch.checkGithubErrors(result, repo);
            errCallback(result);
            return;
        }

        callback(result);
    });
}

// Load project from hash
const loadFromHash = () => {
    if (!window.location.hash) return;

    if (window.location.hash.startsWith('#github:')) {
        // load from github
        const repo = window.location.hash.replace('#github:', '');
        const repoName = repo.split('/')[1];
        visualLog(`Loading 'github:${repo}' ...`, 'info', 'github progress');

        loadGithubRepo(repo, (result) => {
            currentProjectFilename = 'github:' + repoName;
            openProject(result.data);
            visualLog(`Loaded github repository: '${repo}'`, 'info', 'github');
        });

    } else {
        // load from gameify cloud
        const accountName = window.location.hash.split('/')[0].replace('#', '');
        const game = window.location.hash.split('/')[1];
    
        visualLog(`Loading '${accountName}/${game}' ...`, 'info', 'cloud progress');
    
        fetch(`/api/games-store/load-game`, {
            method: 'POST',
            body: JSON.stringify({
                // no session key needed for loading
                username: accountName,
                title: game
            })
        })
        .then(engineFetch.toJson)
        .then(result => {
            if (result.error) {
                visualLog(`Failed to load game '${game}' - ${result.error}`, 'error', 'cloud save');
                engineFetch.checkSessionErrors(result);
                return;
            }
    
            currentProjectFilename = game;
            openProject(result.data);
            visualLog(`Loaded cloud save '${game}'`, 'info', 'cloud save');
        });
    }
}
// will only do anything if the hash exists
loadFromHash();
window.onhashchange = loadFromHash;
