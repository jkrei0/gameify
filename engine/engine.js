import { downloadZip } from "https://cdn.jsdelivr.net/npm/client-zip/index.js";

import { engineSerialize } from '/engine/serialize.js';
import { engineTypes } from '/engine/engine_types.js';
import { engineUI } from '/engine/engine_ui.js';
import { engineEvents } from '/engine/engine_events.js';
import { engineIntegrations, githubIntegration } from '/engine/engine_integration.js';
import { engineFetch } from '/engine/engine_fetch.js';
import { engineState } from '/engine/engine_state.js';
import { popup } from '/engine/popup.js';

import '/engine/visual_editor.js';
import '/engine/docs.js';

/* Code Editor */

const editorFileList = document.querySelector('#editor-list');

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
engineEvents.listen('visual log', (_event, ...args) => {
    visualLog(...args);
});
const showWindow = (t) => {
    stopGame();

    if (!engineState.projectFilename) {
        // No project is open, don't do anything
        return false;
    }

    document.querySelector(`.window.visible`).classList.remove('visible');
    document.querySelector(`.window.${t}`).classList.add('visible');

    if (t === 'preview') {
        totalMessages = 0;
    } else if (t === 'docs' && document.querySelector('#docs-iframe').contentWindow.location.href.endsWith(';')) {
        document.querySelector('#docs-iframe').contentWindow.location.reload();
    } else if (t === 'editor') {
        // Prevent weird issues when the window is resized
        // by forcing ace to resize every time the editor is shown
        engineState.editor.resize(true);
    }

    return true;
};
engineEvents.listen('show window', (_event, ...args) => {
    showWindow(...args);
});

const openContextMenu = (menu, posX, posY) => {
    const contextMenu = document.querySelector('.contextmenu');
    contextMenu.innerHTML = '';
    contextMenu.style.display = 'block';

    if (posX !== undefined) contextMenu.style.left = posX + 'px';
    if (posY !== undefined) contextMenu.style.top = posY + 'px';
    contextMenu.style.bottom = 'unset';
    contextMenu.style.right = 'unset';

    
    const hiddenButton = document.createElement('button');
    hiddenButton.setAttribute('aria-hidden', true);
    hiddenButton.classList.add('list-item');
    hiddenButton.style.height = '0';
    hiddenButton.style.padding = '0';
    contextMenu.appendChild(hiddenButton);

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
        const rect = contextMenu.getBoundingClientRect()
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = 'unset';
            contextMenu.style.bottom = (window.innerHeight - posY) + 'px';
        }
        if (rect.right >= window.innerWidth) {
            contextMenu.style.left = 'unset';
            contextMenu.style.right = '0px';
        }
        contextMenu.querySelector('button:first-of-type').focus();
    });
}
window.addEventListener('contextmenu', (event) => {
    let element = event.target;
    let index = 0;
    // Check the element and its parents to see
    // if they have a context menu defined
    while (element) {
        index += 1;
        if (index > 5) break;
        // only check 5 parents

        if (element.__engine_menu) {
            event.stopPropagation();
            event.preventDefault();
            openContextMenu(element.__engine_menu, event.clientX, event.clientY);
            break;
        }
        element = element.parentElement;
    }
});
window.addEventListener('click', (event) => {
    setTimeout(() => {
        document.querySelector('.contextmenu').style.display = 'none';
    }, 20);
});

const populateObjectsList = () => {
    const objList = document.querySelector('#node-list');
    objList.innerHTML = '';

    const folderEls = {};

    for (const setName of engineTypes.listTypes()) {
        if (!engineState.objects[setName]) engineState.objects[setName] = {};
        const set = engineState.objects[setName];

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
                engineTypes.get(setName, 'buildUI')(details, obj, engineState.objects);
            }

            /* Delete Button */

            const delButton = document.createElement('button');
            delButton.classList.add('list-item');
            delButton.classList.add('property');
            delButton.classList.add('small');
            delButton.innerHTML = 'Delete';
            delButton.onclick = async () => {
                if (!await popup.confirm('Delete File?', 'Delete ' + obj.__engine_name + '? You can\'t undo this!')) return;
                delete set[objName];
                visualLog(`Deleted object '${setName}::${objName}'`, 'warn', 'objects editor');
                populateObjectsList();
            }
            // Don't allow deleting locked items
            if (!obj.__engine_locked) details.appendChild(delButton);

            if (!obj.__engine_folder) {
                objList.appendChild(details);
            } else if (folderEls[obj.__engine_folder]) {
                const folder = folderEls[obj.__engine_folder];
                folder.appendChild(details);
                folder.__engine_objects.push(obj);
                if (obj.__engine_visible) {
                    folder.__vis_button.classList.remove('object-hidden');
                    folder.__vis_button.classList.add('object-visible');
                }
            } else {
                const folder = document.createElement('details');
                folder.classList.add('list-item');
                folder.classList.add('folder');
                folder.__engine_objects = [obj];
                folderEls[obj.__engine_folder] = folder;

                if (engineState.openFolders.find((x) => x === obj.__engine_folder)) {
                    folder.setAttribute('open', true);
                }

                folder.addEventListener('toggle', () => {
                    if(folder.hasAttribute('open')) {
                        engineState.openFolders.push(obj.__engine_folder);
                    } else {
                        engineState.openFolders = engineState.openFolders.filter((x) => x !== obj.__engine_folder);
                    }
                });
                
                const folderVisButton = document.createElement('button');
                folder.__vis_button = folderVisButton;
                if (!obj.__engine_visible) {
                    folderVisButton.classList.add('object-hidden');
                }
                const icon = engineTypes.get('engine_folder', 'icon');
                folderVisButton.innerHTML = icon;

                folderVisButton.onclick = () => {
                    let allHidden = true;
                    for (const child of folder.__engine_objects) {
                        if (child.__engine_visible) {
                            allHidden = false;
                        }
                    }

                    if (!allHidden) {
                        for (const child of folder.__engine_objects) {
                            child.__engine_visible = false;
                        }
                    } else {
                        for (const child of folder.__engine_objects) {
                            child.__engine_visible = true;
                        }
                    }
                    populateObjectsList();
                }

                const folderSummary = document.createElement('summary');
                folderSummary.appendChild(folderVisButton);
                folderSummary.append(`${obj.__engine_folder}`);
                const typeSpan = document.createElement('span');
                typeSpan.classList.add('type');
                typeSpan.innerHTML = '';
                folderSummary.appendChild(typeSpan);

                folder.appendChild(folderSummary);
                folder.appendChild(details);
                objList.prepend(folder);

                folderSummary.__engine_menu = {
                    'Rename': async () => {
                        const new_name = await popup.prompt('Rename folder', '', obj.__engine_folder);
                        if (!new_name) return;
                        for (const child of folder.__engine_objects) {
                            child.__engine_folder = new_name;
                        }
                        populateObjectsList();
                    },
                    'Delete': async () => {
                        if (!await popup.confirm('Delete folder?', 'Any objects in this folder will not be deleted.')) {
                            return;
                        }
                        for (const child of folder.__engine_objects) {
                            child.__engine_folder = undefined;
                        }
                    }
                }
            }

            summary.__engine_menu = {
                'Copy Name': () => {
                    navigator.clipboard.writeText(obj.__engine_name)
                },
                'Copy JavaScript': () => {
                    navigator.clipboard.writeText(`$get('${obj.__engine_name}')`)
                },
                'Add to folder': async () => {

                    const existingFolders = Object.keys(folderEls);
                    const rmText = '(no folder/remove from folder)';
                    existingFolders.push(rmText);
                    const folder = await popup.selectPrompt(
                        'Select a folder', '',  // title, text
                        existingFolders, // dropdown options
                        '', 'Or type a new folder name', // input default, placeholder
                        'Select', 'Cancel'
                    );
                    if (folder) {
                        obj.__engine_folder = folder;

                        if (folder === rmText) {
                            obj.__engine_folder = undefined;
                        }
                    }
                    populateObjectsList();
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
    const [typeElem, selType] = engineUI.selectItem('Type', engineTypes.listTypes(), undefined, 'Sprite');
    details.appendChild(typeElem);

    const addButton = document.createElement('button');
    addButton.classList.add('list-item');
    addButton.classList.add('property');
    addButton.innerHTML = 'Add Object';
    addButton.onclick = () => {
        const type = selType.value;
        const name = selName.value.replaceAll('::', '_');
        if (engineState.objects[type][name]) {
            visualLog(`Object with the name '${type}::${name}' already exists!`, 'error', 'objects editor');
            return;
        }
        
        const defaultScreen = Object.values(engineState.objects['Screen'])[0];
        const newObject = engineTypes.get(type, 'newObject')(defaultScreen);

        if (!newObject) {
            visualLog(`You may not create a new ${type} object from the visual editor.`, 'error', 'objects editor');
            return;

        } else {
            engineState.objects[type][name] = newObject;
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
        if (!query) {
            console.error('Cannot load object! (query is undefined)');
            return undefined;
        }
        const type = query.split('::')[0];
        const name = query.split('::')[1];
        if (!engineState.objects[type]) engineState.objects[type] = {};
        if (!engineState.objects[type][name]) {
            if (!data[type][name]) {
                console.warn('Cannot load ' + query + ' (object data is missing)');
                return undefined;
            }
            const constructor = engineTypes.resolve(type);
            if (constructor.fromJSON) {
                engineState.objects[type][name] = constructor.fromJSON(data[type][name], loadObject);
            } else {
                console.warn(`Object ${type}::${name} is using the old (de)serialization system.`);
                engineState.objects[type][name] = constructor('_deserialize')(data[type][name], loadObject);
            }
            engineState.objects[type][name].__engine_name = type + '::' + name;

            for (const dat in data[type][name].__engine_data) {
                engineState.objects[type][name]['__engine_' + dat] = data[type][name].__engine_data[dat];
            }
        }
        return engineState.objects[type][name];
    }

    engineState.objects = {};
    for (const type in data) {
        if (!engineState.objects[type]) engineState.objects[type] = {};
        for (const name in data[type]) {
            if (data[type][name] === false || !engineTypes.resolve(type)) {
                console.warn(`Cannot deserialize ${type}::${name}`);
                continue;
            }
            // If an object was already loaded (because of another's dependency)
            if (engineState.objects[type][name]) continue;

            // Deserialize object
            loadObject(type + '::' + name);
        }
    }
    populateObjectsList();
}

// Populate list after editor setup
populateObjectsList();
document.querySelector('#refresh-objects').addEventListener('click', populateObjectsList);

/* Game preview */

const gameFrame = document.querySelector('#game-frame');
const gameFrameWindow = gameFrame.contentWindow;

const consoleOut = document.querySelector('#console-output');
const consoleToggleButton = document.querySelector('#toggle-console-hook');
consoleToggleButton.addEventListener('click', () => {
    if (consoleOut.style.display === 'none') {
        consoleOut.style.display = '';
        consoleToggleButton.textContent = 'Hide console';
        gameFrame.contentWindow.postMessage({ type: 'consoleHook', consoleHook: true }, '*');
    } else {
        consoleOut.style.display = 'none';
        consoleToggleButton.textContent = 'Show console';
        gameFrame.contentWindow.postMessage({ type: 'consoleHook', consoleHook: false }, '*');
    }
    const message = 'Console hook toggled. You may need to stop/restart the game for the changes to take effect.';
    console.warn(message);
    // then send it to ourselves to show it in the gameify console
    window.postMessage({
        type: 'console',
        logType: 'warn',
        payload: {
            message: message,
            lineNumber: 0,
            columnNumber: 0,
            fileName: '(console)'
        }
    }, '*');
});
window.addEventListener('message', (event) => {
    if (event.data.type !== 'consoleHook') return;
    // sync console status with the iframe
    const consoleOpen = consoleOut.style.display !== 'none';
    if (event.data.consoleHook !== consoleOpen) {
        consoleToggleButton.click();
    }
});

let numMessages = 0;
let totalMessages = 0;
const maxMessages = 1000
window.addEventListener('message', (event) => {
    if (event.data.type !== 'console') return;
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
        if (txt.join) txt = txt.join(', ');
        // Make sure there's no funny business from an embedded game trying to send
        // malicious things in console logs. Not sure how viable this actually is,
        // but better to prevent it than not.
        const out = txt.toString()
            .replaceAll(/&/g, '&amp;')
            .replaceAll(/</g, '&lt;')
            .replaceAll(/>/g, '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll('\'', '&#39;');
        return out;
    }

    if (event.data && event.data.type === 'console') {
        const { message, lineNumber, columnNumber, fileName } = event.data.payload;

        const sourceFile = sanitize(fileName.replace(/.* injectedScript.*/, '(main script)')) // replace injectedScript with project script
                        .replace(/_gamefiles\/\d{1,5}\/_out\.js/, '(_out.js)')
                        .replace(/_gamefiles\/\d{1,5}\/+/, sanitize(engineState.projectFilename || 'Template Project') + '/')

        consoleOut.innerHTML += `<span class="log-item ${sanitize(event.data.logType)}">
            <span class="short">${sanitize(event.data.logType.toUpperCase())}</span>
            <span class="message">${sanitize(message)}</span>
            <span class="source">
                ${sourceFile}
                ${sanitize(lineNumber)}:${sanitize(columnNumber)}
            </span>
        </span>`;
        consoleOut.scrollTo(0, consoleOut.scrollHeight);
    }
});

const runGameButton = document.querySelector('#play-button')
gameFrame.addEventListener('load', () => {
    if (gameFrame.src === 'about:blank') return;

    // Clear the console
    consoleOut.innerHTML = `<span class="log-item info"></span>`;
    numMessages = 0;

    runGameButton.innerText = 'Stop Game';
    const saved = engineSerialize.projectData(engineState.objects, engineState.files, engineIntegrations.getIntegrations());
    // Use JSON.stringify to force json conversion. Otherwise it
    // gets mad that we're trying to pass functions through.
    gameFrameWindow.postMessage(
        JSON.parse(JSON.stringify({ type: 'gameData', gameData: saved })),
        /* REPLACE=embedURL */'http://localhost:3001'/* END */
    );
});

const stopGame = () => {
    gameFrame.src = 'about:blank';
    runGameButton.innerText = 'Run Game';
}
const runGame = () => {
    engineEvents.emit('clear visual editor');

    // Try to show the window, only start the game if it did show
    if (!showWindow('preview')) return;

    gameFrame.src = /* REPLACE=embedURL */'http://localhost:3001'/* END */+'/embed.html';
}

/* Tabs */

runGameButton.addEventListener('click', () => {
    if (gameFrame.src === 'about:blank') runGame();
    else stopGame();
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


/* Save and load */

engineFetch.setSessionFunction(() => {
    document.querySelector('#login-link').innerHTML = 'Log In';
    visualLog(`Session expired. Please <a href="./auth.html" target="_blank">log out/in</a> to refresh.`, 'error', 'account');
});
engineFetch.setLogFunction(visualLog);

const listSaveNames = () => {
    // local files
    const savedList = Object.entries(localStorage).filter(([key, value]) => {
        if (key.startsWith('savedObjects:')) {
            return true;
        }
        return false;
    }).map(([key, value]) => key.replace('savedObjects:', ''));

    return savedList;
}

const saveProject = async (asName) => {
    if (!engineState.projectFilename) {
        return;
    }

    let name = asName || engineState.projectFilename;
    if (engineState.projectFilename.startsWith('(template)')) {
        name = await popup.prompt('Name this save', '');
    } else if (asName === false) {
        name = await popup.prompt('Name this save', '', engineState.projectFilename);
    }

    if (!name) {
        return;
    }

    const savedList = listSaveNames();
    let overwrite = false;
    if (savedList.includes(name) && name !== engineState.projectFilename) {
        if (!await popup.confirm('Overwrite save?',
            `There is already a save named '${newName}'. Are you sure you want to overwrite it?`
        )) return;
        overwrite = true;
    } else if (savedList.includes(name)) {
        overwrite = true;
    }

    const saved = engineSerialize.projectData(engineState.objects, engineState.files, engineIntegrations.getIntegrations());

    let success = false;
    try {
        localStorage.setItem('savedObjects:' + name, JSON.stringify(saved));
        success = true;
    } catch (e) {
        console.error(e);
        popup.confirm('Error saving project',
            `Your project could not be saved locally
            (likely because your files are too large)`,
            'Download instead', 'Cancel'
        ).then((result) => {
            if (result) {
                downloadProjectGpj();
            }
        });
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

    engineState.projectFilename = name;

    return name;
}

const exportProject = async () => {
    const zipFiles = [];

    
    const replaceGameifyImports = (file) => {
        return file.replaceAll(/(import.*?from ('|"|`))\.?\/gameify\//g, (match, p1, p2) => {
            return p1 + 'https://gameify.vercel.app/gameify/';
        });
    }

    const outJS = await fetch("./project/_out.js");
    const outJSText = replaceGameifyImports(await outJS.text());
    const objListText = 'window.__s_objects = ' + JSON.stringify(engineSerialize.objectsList(engineState.objects));

    zipFiles.push({
        name: '_out.js',
        input: outJSText.replace('/*__s_objects*/', objListText)
    });

    for (const file in engineState.files) {
        let fileText = replaceGameifyImports(engineState.files[file].getValue());
        if (file === 'index.html') {
            // Add a script that alerts the user if they run it w/o a server
            const localCheckScript = await (await fetch("./project/_local_check.js")).text();
            fileText = fileText.replace('<body>', `<body><script>${localCheckScript}</script>`);
        }
        zipFiles.push({
            name: file,
            input: fileText
        });
    }

    const blob = await downloadZip(zipFiles).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = engineState.sanitizedFilename() + "_export.zip";
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}
const exportProjectSource = async () => {
    const zipFiles = [];
    for (const file in engineState.files) {
        zipFiles.push({
            name: file,
            input: engineState.files[file].getValue()
        });
    }

    const config = { objects: 'objects.gpj' };
    if ('.gfengine' in engineState.files) {
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
        input: JSON.stringify({ "objects": engineSerialize.objectsList(engineState.objects) }, null, 2)
    })

    const blob = await downloadZip(zipFiles).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = engineState.sanitizedFilename() + "_source.zip";
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
}

const downloadProjectGpj = () => {
    const saved = engineSerialize.projectData(engineState.objects, engineState.files, engineIntegrations.getIntegrations());

    var link = document.createElement("a");
    link.setAttribute('download',  engineState.sanitizedFilename() + '.gpj');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(saved)]));
    document.body.appendChild(link);
    link.click();
    link.remove();
}

document.querySelector('#save-button').addEventListener('click', () => { saveProject(false) });
document.querySelector('#github-push-button').addEventListener('click', () => { githubIntegration.pushProject() });
document.querySelector('#github-diff-button').addEventListener('click', () => { githubIntegration.diffProject() });
document.querySelector('#export-game-button').addEventListener('click', () => { exportProject() });
document.querySelector('#export-source-button').addEventListener('click', () => { exportProjectSource() });
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        // Ctrl + S
        // Save project
        e.preventDefault();
        saveProject();
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
    } else if (e.ctrlKey && e.key === 'D') {
        // Ctrl + Shift + D
        // Open docs tab
        showWindow('docs');
        e.preventDefault();
    } else if (e.ctrlKey && e.key === '!') {
        // Ctrl + Shift + 1
        // Jump to sidebar
        document.querySelector('#refresh-objects').focus()
        e.preventDefault();
    }
});

document.querySelector('#download-button').addEventListener('click', () => { downloadProjectGpj() });

const fetchTemplate = async (name) => {
    return await fetch(`/engine/templates/${name}.gpj`).then(engineFetch.toJson);
}

const listFiles = async (data) => {
    let reloadEditors = true;
    if (!data) {
        data = engineState.files;
        reloadEditors = false;
    }
    // Clear the file list
    if (reloadEditors) engineState.files = {};
    editorFileList.innerHTML = '';

    if (!data['index.html']) {
        data['index.html'] = (await fetchTemplate('scribble_dungeon')).files['index.html'];
        visualLog('Index.html not found, using index.html from template', 'warn', 'filesystem');
    }
    
    const setAceMode = (file) => {
        if (file.endsWith('.js')) engineState.files[file].setMode("ace/mode/javascript");
        else if (file.endsWith('.css')) engineState.files[file].setMode("ace/mode/css");
        else if (file.endsWith('.html')) engineState.files[file].setMode("ace/mode/html");
    }

    // Load new files
    for (const file in data) {
        if (reloadEditors || !engineState.files[file] || typeof engineState.files[file] === 'string') {
            engineState.files[file] = ace.createEditSession(data[file]);
            setAceMode(file);
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

                // Set active file
                const prev = document.querySelector('.file-button-active');
                if (prev) prev.classList.remove('file-button-active');
                button.classList.add('file-button-active');

                engineIntegrations.showDiff(file, engineState.files);
            }
            button.appendChild(diffButton);
        }

        button.__engine_menu = {
            'Open': () => {
                button.click();
            },
            'Rename': async () => {
                let name = await popup.prompt('Rename File', '', file);
                if (!name || name === file) return;
                while (engineState.files[name]) {
                    name = await popup.prompt('Rename File', 'That file already exists! Enter a new name', file);
                    if (!name || name === file) return;
                }
                const temp = engineState.files[file];
                delete engineState.files[file];
                engineState.files[name] = temp;
                visualLog(`Renamed file '${file}' to '${name}'`, 'log', 'filesystem');
                listFiles();
            },
            'Delete': async () => { 
                if (await popup.confirm('Delete ' + file + '?')) {
                    delete engineState.files[file];
                    visualLog(`Deleted file '${file}'`, 'warn', 'filesystem');
                    listFiles();
                }   
            }
        }

        button.addEventListener('click', () => {
            engineState.editor.setSession(engineState.files[file]);

            const prev = document.querySelector('.file-button-active');
            if (prev) prev.classList.remove('file-button-active');
            button.classList.add('file-button-active');

            showWindow('editor');
        });
        editorFileList.appendChild(button);
    }
    for (const file in data) {
        engineState.editor.setSession(engineState.files[file]);
        // Set the first file as current
        break;
    }

    const newFileButton = document.createElement('button');
    newFileButton.classList.add('list-item');
    newFileButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-plus" viewBox="0 0 16 16">
            <path d="M8 6.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 .5-.5z"/>
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg> New file`;
    newFileButton.onclick = async () => {
        let name = await popup.prompt('Create File', '', 'unnamed.js');
        if (!name) return;
        while (engineState.files[name]) {
            name = await popup.prompt('Create File', 'That file already exists! Enter a different name.', 'unnamed.js');
            if (!name) return;
        }
        engineState.files[name] = ace.createEditSession(`// ${name}\n`);
        setAceMode(name);
        visualLog(`Created file '${name}'`, 'log', 'filesystem');
        listFiles();
        // Make sure the new file is opened
        showWindow('editor');
        engineState.editor.setSession(engineState.files[name]);
    }
    editorFileList.appendChild(newFileButton);
}

const openProject = (data) => {
    // Sidebar is hidden before a project is loaded
    if (document.querySelector('.sidebar.hidden')) {
        document.querySelector('.sidebar').classList.remove('hidden');
    }

    engineIntegrations.setIntegrations(data.integrations);
    console.log(data);
    if (data.integrations?.github) {
        document.querySelector('#github-save-integration').style.display = '';
    } else {
        document.querySelector('#github-save-integration').style.display = 'none';
    }

    listFiles(data.files);

    // Load editor objects
    loadObjectsList(data.objects);

    // Clear the visual editor
    // and show map controls
    engineEvents.emit('show visual editor preview');
    showWindow('visual');

    visualLog(`Loaded '${engineState.projectFilename || 'Template Project'}'`, 'log', 'project');

    return true;
}

const deleteCloudSave = async (save) => {
    const cloudAccountName = localStorage.getItem('accountName');
    if (!await popup.confirm('Delete cloud save',
        `Delete '${cloudAccountName}/${save}' from the cloud? <br> This will not delete your local copy.`
    )) {
        return;
    }

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

const listSaves = async () => {
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
                const name = game.title;
                const button = document.createElement('button');
                let timestampDifference = 5;
                button.classList.add('list-item');

                // Find the matching local save (if it exists)
                const localSaveData = JSON.parse(localStorage.getItem('savedObjects:' + name) || null);
                const lsButton = document.querySelector(`.list-item[data-local-save-name="${name}"]`);

                button.onclick = async () => {
                    let loadAsName = name;
                    if (timestampDifference !== 0) {
                        const loadCloud = await popup.confirm(`Save mismatch`,
                            `<b>The local and cloud versions of this save may be different.</b><br>
                            Cloud saved at ${new Date(game.data.timestamp).toLocaleString()}<br>
                            Local saved at ${new Date(localSaveData.timestamp).toLocaleString()}`,
                            'Load a copy', 'Cancel', 'Overwrite local'
                        );
                        if (loadCloud === false) {
                            // cancel
                            return;
                        } else if (loadCloud === true) {
                            // make a copy
                            const newName = await popup.prompt(
                                'Name your copy', // title text
                                `This will create a copy of the cloud save '${name}' and load it.`, // p text
                                `Copy of ${name}`, // default input value
                                `Enter a name` // placeholder
                            );

                            if (!newName) return;
                            loadAsName = newName;
                        } else {
                            // overwrite local
                            if (!await popup.confirm(`Are you sure?`,
                                `This will overwrite the local save '${name}' with the cloud save.`
                            )) return;
                        }
                    }

                    visualLog(`Loading '${loadAsName}' ...`, 'info', 'cloud progress');

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
                            visualLog(`Failed to load game '${loadAsName}' - ${result.error}`, 'error', 'cloud save');
                            engineFetch.checkSessionErrors(result);
                            return;
                        }

                        engineState.projectFilename = loadAsName;
                        openProject(result.data);
                        visualLog(`Loaded cloud save '${loadAsName}'`, 'info', 'cloud save');
                    });
                }
                
                // cloud download icon (no local copy)
                let icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-cloud-arrow-down" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M7.646 10.854a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 9.293V5.5a.5.5 0 0 0-1 0v3.793L6.354 8.146a.5.5 0 1 0-.708.708l2 2z"/>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                </svg>`;

                if (lsButton) {
                    const localTimestamp = localSaveData.timestamp;
                    const cloudTimestamp = game.data.timestamp;
                    timestampDifference = cloudTimestamp - localTimestamp;
                    console.log(name, localTimestamp, cloudTimestamp);
                    if (localTimestamp === undefined || localTimestamp !== cloudTimestamp) {
                        // warn icon (mismatch)
                        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-exclamation-diamond warn" viewBox="0 0 16 16">
                            <path d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z"/>
                            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                        </svg>`;
                    } else {
                        // cloud check icon (saves match)
                        icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-cloud-check" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M10.354 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                            <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383m.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                        </svg>`;
                    }
                }
                
                button.innerHTML = icon + name;


                const openButton = document.createElement('button');
                openButton.onclick = () => {
                    window.open(`${window.location.protocol}//${window.location.host}/engine/play.html#${cloudAccountName}/${name}`, '_blank');
                }
                openButton.classList.add('right');
                openButton.innerText = 'Play';
                button.appendChild(openButton);

                listElem.prepend(button);
                button.__engine_menu = {
                    'Overwrite': () => {
                        saveProject(name);
                    },
                    'Load From Cloud': () => {
                        button.click();
                    },
                    'Delete From Cloud': () => {
                        button.style.color = '#ff8';
                        deleteCloudSave(name);
                    }
                }

                if (lsButton) {
                    // If there's a cloud save of the same name,
                    // instead add a context menu item, and hide the local save button
                    button.__engine_menu['Load Local Save'] = () => {
                        lsButton.click();
                    }
                    button.__engine_menu['Rename Local Save'] = () => {
                        lsButton.__engine_menu['Rename']();
                    }
                    lsButton.style.display = 'none';
                }
            }
        });

    } else {
        document.querySelector('#login-link').innerHTML = 'Log in';
    }

    // local files
    const savedList = listSaveNames();

    if (!savedList) {
        const message = document.createElement('span');
        message.classList.add('list-item');
        message.innerText = 'No saves';
        listElem.appendChild(message);
    }

    for (const name of savedList) {

        const button = document.createElement('button');
        button.classList.add('list-item');
        button.setAttribute('data-local-save-name', name);
        button.onclick = () => {
            const loaded = localStorage.getItem('savedObjects:' + name);
            if (!loaded) {
                popup.alert(`Save error`, `The save "${name}" was not found!`);
                return;
            }
            engineState.projectFilename = name;
            openProject(JSON.parse(loaded));

            visualLog(`Loaded save '${name}'`, 'info', 'local save');
        }
        button.innerText = name;
        const delButton = document.createElement('button');
        delButton.onclick = async (event, bypass) => {
            event?.stopPropagation();
            if (!bypass && !await popup.confirm('Delete save?', `Delete ${name}? you can't undo this`)) { return; }

            localStorage.removeItem('savedObjects:' + name);

            visualLog(`Deleted save '${name}'`, 'warn', 'local save');
            listSaves();
        }
        delButton.innerText = 'Delete';
        button.appendChild(delButton);

        listElem.appendChild(button);

        button.__engine_menu = {
            'Overwrite': async () => {
                if (!await popup.confirm('Overwrite save?',
                    `This will save the currently open project as '${name}', overwriting it.`
                )) return;
                saveProject(name);
            },
            'Load': () => {
                button.click();
            },
            'Delete': () => {
                delButton.click();
            },
            'Rename': async () => {
                let newName = await popup.prompt('Rename this save', '', name);
                if (!newName) return;

                // Check if the name already exists
                const savedList = listSaveNames();
                if (savedList.includes(newName)) {
                    // Don't prompt if the name is the same
                    if (name !== newName && !await popup.confirm('Overwrite save?',
                        `There is already a save named '${newName}'. Are you sure you want to overwrite it?`
                    )) return;
                    // Don't push the name into the list, it's already there
                } else {
                    savedList.push(newName);
                }

                // Copy the save over
                localStorage.setItem(
                    'savedObjects:' + newName,
                    localStorage.getItem('savedObjects:' + name)
                );

                // Delete the old save
                localStorage.removeItem('savedObjects:' + name);
                visualLog(`Renamed save '${name}' to '${newName}'`, 'log', 'local save');
                listSaves();
            }
        }
    }
}
document.querySelector('#refresh-saves').addEventListener('click', listSaves);
listSaves();

document.querySelector('#show-load-window').addEventListener('click', ()=>showWindow('save-load'));
document.querySelector('#upload-gpj-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
        const fileContents = event.target.result;
        visualLog(`Loaded project file '${file.name}'`, 'info', 'local save');
        engineState.projectFilename = file.name;
        openProject(JSON.parse(fileContents));
    };
});

document.querySelectorAll('button.template').forEach((button) => {
    button.addEventListener('click', async (event) => {
        const name = button.getAttribute('data-template');
        engineState.projectFilename = '(template) ' + name;
        openProject(await fetchTemplate(name));
        visualLog(`Loaded template '${name}'`, 'info', 'local save');
    });
});

// Load project from hash
const loadFromHash = () => {
    if (!window.location.hash) return;

    if (window.location.hash.startsWith('#github:')) {
        // load from github
        const repo = window.location.hash.replace('#github:', '');
        const repoName = repo.split('/')[1];
        visualLog(`Loading 'github:${repo}' ...`, 'info', 'github progress');

        githubIntegration.loadRepo(repo, (result) => {
            engineState.projectFilename = 'github:' + repoName;
            openProject(result.data);
            visualLog(`Loaded github repository: '${repo}'`, 'info', 'github');
        }, () => {});

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
    
            engineState.projectFilename = game;
            openProject(result.data);
            visualLog(`Loaded cloud save '${game}'`, 'info', 'cloud save');
        });
    }
}
// will only do anything if the hash exists
loadFromHash();
window.onhashchange = loadFromHash;
