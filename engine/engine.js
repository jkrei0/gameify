import {gameify} from '/gameify/gameify.js';


/* Code Editor */

const editorFileList = document.querySelector('#editor-list');

const files = {
    '_out.js': '',
    'main.js': '',
    'level.js': ''
};
let current_file = undefined;

var editor = ace.edit("ace-editor");
editor.setTheme("ace/theme/dracula");
editor.setOptions({fontSize: '16px'})

for (const file in files) {
    fetch('./project/' + file).then(res => {
        return res.text()
    }).then(data => {
        files[file] = ace.createEditSession(data);
        files[file].setMode("ace/mode/javascript");
    });

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



/* Misc Internal Utils */

const visualLog = (message, type = 'info', source = 'editor') => {
    document.querySelector('#visual-output').innerHTML += `<span class="log-item ${type}">
            <span class="short">${type.toUpperCase()}</span>
            <span class="message">${message}</span>
            <span class="source">${source}</span>
        </span>`;
}
const showWindow = (t) => {
    document.querySelector(`.window.visible`).classList.remove('visible');
    document.querySelector(`.window.${t}`).classList.add('visible');
};



/* Visual Editor and Tools */

const editorCanvas = document.querySelector('#visual-editor');
const editorScreen = new gameify.Screen(editorCanvas, 500, 100);
const editorResize = () => {
    editorCanvas.width = '';
    editorCanvas.height = '';
    const box = editorCanvas.getBoundingClientRect();
    console.log(box);
    editorScreen.setSize(box.width - 10, box.height - 10);
}
window.addEventListener('resize', () => {
    editorResize();
});
editorResize();

let objects = {
    'Tileset': {
        'Dungeon Tiles': new gameify.Tileset('/sample/tilesheet.png', 64, 64)
    },
    'Tilemap': {
        'Dungeon Map': new gameify.Tilemap(64, 64, 5, 5)
    },
    'Sprite': {
        'Player': new gameify.Sprite(0, 0, undefined)
    },
    'Image': {
        'Player Image': new gameify.Image('/sample/tilesheet.png')
    }
}

const labelItem = (text, btn, call = ()=>{}) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;
    const button = document.createElement('button');
    button.innerHTML = btn;
    button.onclick = call;
    label.append(button);
    return label;
}
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
const selectItem = (text, options, call = ()=>{}) => {
    const label = document.createElement('span');
    label.classList.add('list-item');
    label.classList.add('property');
    label.innerHTML = text;
    const input = document.createElement('select');
    input.onchange = ()=>{ call(input.value); };
    for (const opt of options) {
        input.innerHTML += `<option>${opt}</option>`;
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

            const details = document.createElement('details');
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

            } else if (setName === 'Sprite') {
                summary.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
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
                set[newName] = obj;
                set[objName] = undefined;
                delete set[objName];
                populateObjectsList();
            });
            details.appendChild(nameElem);

            console.log(objName, obj);

            if (setName === 'Tilemap') {
                details.appendChild(labelItem('Edit map', 'Edit'));
                details.appendChild(twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = x;
                    obj.theight = y;
                })[0]);
                details.appendChild(twoInputItem('Offset',  [obj.offset.x, obj.offset.y], 'number', (x, y) => {
                    obj.offset.x = x;
                    obj.offset.y = y;
                })[0]);
            } else if (setName === 'Tileset') {
                details.appendChild(inputItem('File', obj.path, 'text', (v) => {
                    obj.path = v;
                })[0]);
                details.appendChild(twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = x;
                    obj.theight = y;
                })[0]);
            } else if (setName === 'Image') {
                details.appendChild(inputItem('File', obj.path, 'text', (v) => {
                    obj.path = v;
                })[0]);
            } else if (setName === 'Sprite') {
                const images = [];
                for (const img in objects.Image) { images.push(img); }

                details.appendChild(selectItem('Image', images, (v) => {
                    obj.setImage(objects.Image[v]);
                })[0]);
                details.appendChild(twoInputItem('Position',  [obj.position.x, obj.position.y], 'number', (x, y) => {
                    obj.position.x = x;
                    obj.position.y = y;
                })[0]);
            }

            /* Delete Button */

            const delButton = document.createElement('button');
            delButton.classList.add('list-item');
            delButton.classList.add('property');
            delButton.classList.add('small');
            delButton.innerHTML = 'Delete';
            delButton.onclick = () => {
                delete set[objName];
                populateObjectsList();
            }
            details.appendChild(delButton);

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
    const [typeElem, selType] = selectItem('Type', types, 'text');
    details.appendChild(typeElem);

    const addButton = document.createElement('button');
    addButton.classList.add('list-item');
    addButton.classList.add('property');
    addButton.innerHTML = 'Add Object';
    addButton.onclick = () => {
        const type = selType.value;
        const name = selName.value
        if (objects[type][name]) {
            alert('Object with that name already exists!');
        }

        if (type === 'Tileset') {
            objects[type][name] = new gameify.Tileset('path/to/image.png', 64, 64);
        } else if (type === 'Tilemap') {
            objects[type][name] = new gameify.Tilemap(64, 64, 0, 0);
        } else if (type === 'Sprite') {
            objects[type][name] = new gameify.Sprite(0, 0, undefined);
        } else if (type === 'Image') {
            objects[type][name] = new gameify.Image('path/to/image.png');
        } else {
            alert(`Cannot create ${type} object.`);
        }
        console.log(type, name, objects[type][name]);
        populateObjectsList();
    }
    details.appendChild(addButton);

    objList.appendChild(details);

}
populateObjectsList();

const serializeObjectsList = () => {
    const out = {};
    for (const type in objects) {
        const set = objects[type];
        out[type] = {}
        for (const name in set) {
            out[type][name] = set[name].serialize();
        }
    }
}

const tileMapEditor = new gameify.Scene(editorScreen);
editorScreen.setScene(tileMapEditor);

tileMapEditor.onUpdate(() => {

});
tileMapEditor.onDraw(() => {

});
editorScreen.startGame();



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
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'console') {
        const { message, lineNumber, columnNumber, fileName } = event.data.payload;
        consoleOut.innerHTML += `<span class="log-item ${event.data.logType}">
            <span class="short">${event.data.logType.toUpperCase()}</span>
            <span class="message">${message}</span>
            <span class="source">${fileName} ${lineNumber}:${columnNumber}</span>
        </span>`;
    }
});
gameFrame.addEventListener('load', () => {
    console.log('Started! .. Compiling game');

    // Clear the console
    consoleOut.innerHTML = `<span class="log-item info"></span>`;

    // Set up log handlers
    const log = (t, args, q = {}, pe) => {
        console.log('CAUGHT LOG', t, args);

        const error = pe || new Error().stack.split('\n')[2];
        const split = error.split(':');

        win.parent.postMessage({
            type: 'console',
            logType: t,
            payload: {
                message: args.join(', '),
                lineNumber: q.line || split[split.length - 2],
                columnNumber: q.col || split[split.length - 1],
                fileName: q.file || split[split.length - 3].replace(/.*?\/(engine\/)?/, '')
            }
        }, '*');
    };

    win.console.log = (...args) => { log('log', args); }
    win.console.info = (...args) => { log('info', args); }
    win.console.debug = (...args) => { log('debug', args); }
    win.console.warn = (...args) => { log('warn', args); }
    win.console.error = (...args) => { 
        if (args[0]._gameify_error === 'onerror') {
            console.log(args, '\n\n::', args[0])
            const details = args[0].details
            // details = [message, file, line, col, error]
            log('error', [details[0]], {file: details[1].replace(/.*?:\d{4}\//, ''), line: details[2], col: details[3]});

        } else if (args[0]._gameify_error === 'promise') {
            const details = args[0].message;
            log('error', [details], {}, "::");
        } else {
            log('error', args);
        }
    }

    console.log('handlers set');

    // Add scripts
    const html = win.document.querySelector('html');
    html.innerHTML = genGameHtml();

    for (const file in files) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = './' + file;
        win.document.body.appendChild(script);
    }
});


/* Tabs */

document.querySelector('#play-button').addEventListener('click', () => {
    console.log('loading');
    showWindow('preview');
    win.location.href = "/engine/project/;";
});
document.querySelector('#code-button').addEventListener('click', () => {
    showWindow('editor');
});
document.querySelector('#visual-button').addEventListener('click', () => {
    showWindow('visual');
});