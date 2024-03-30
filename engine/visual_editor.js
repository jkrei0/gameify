import { gameify } from '/gameify/gameify.js';
import { engineEvents } from './engine_events.js';
import { engineState } from './engine_state.js';
import { engineTypes } from './engine_types.js';

const visualLog = (...args) => engineEvents.emit('visual log', ...args);

let sortedPreviewTileMaps = []
const sortPreviewTileMaps = () => {
    sortedPreviewTileMaps = [];
    for (const mn in engineState.objects['Tilemap']) {
        sortedPreviewTileMaps.push(mn);
    }
    sortedPreviewTileMaps.sort((a, b) => engineState.objects['Tilemap'][a].__engine_index - engineState.objects['Tilemap'][b].__engine_index);

    return sortedPreviewTileMaps;
}
const drawTileMapsInOrder = (beforeDraw) => {
    for (let index = sortedPreviewTileMaps.length - 1; index >= 0; index--) {
        const mn = sortedPreviewTileMaps[index];
        if (!engineState.objects['Tilemap'][mn] || engineState.objects['Tilemap'][mn].__engine_visible === false) {
            continue;
        }
        const obj = engineState.objects['Tilemap'][mn];
        if (beforeDraw) {
            beforeDraw(obj);
        }
        obj.draw((t, x, y) => {
            if ((x+1)*obj.twidth < -editorScreen.camera.getPosition().x
                || x*obj.twidth > -editorScreen.camera.getPosition().x + editorScreen.width
                || (y+1)*obj.theight < -editorScreen.camera.getPosition().y
                || y*obj.theight > -editorScreen.camera.getPosition().y + editorScreen.height
            ) {
                return false;
            }
            return true;
        });
    }
}

const editorCanvas = document.querySelector('#game-canvas');
const editorScreen = new gameify.Screen(editorCanvas, 1400, 800);

const previewScene = new gameify.Scene(editorScreen);
editorScreen.setScene(previewScene);

let previewSceneDragStart = null;
let previewOriginalOffset = null;
// a screen to use before any project is loaded
let _defaultScreen = new gameify.Screen(editorCanvas, 1400, 800);

previewScene.onUpdate(() => {
    // Resize based on game screen size
    const defaultScreen = Object.values(engineState.objects['Screen'])[0] || _defaultScreen;
    editorScreen.setSize(defaultScreen.getSize());
    editorScreen.setAntialiasing(defaultScreen.getAntialiasing());

    if (editorScreen.mouse.buttonIsPressed("left") || editorScreen.mouse.buttonIsPressed("middle")) {
        // Drag map
        const mousePos = editorScreen.mouse.getPosition();
        if (!previewSceneDragStart) {
            previewSceneDragStart = mousePos;
            previewOriginalOffset = editorScreen.camera.getPosition();
        }
        editorScreen.camera.translateAbsolute(previewOriginalOffset.subtract(previewSceneDragStart.subtract(mousePos)));
    } else {
        previewSceneDragStart = false;
    }
});
previewScene.onDraw(() => {
    drawTileMapsInOrder();
    for (const name in engineState.objects['Sprite']) {
        const obj = engineState.objects['Sprite'][name];
        const ps = obj.getParent();
        editorScreen.add(obj);
        try {
            // Only pass the check function to Tilemaps
            obj.draw();
            obj.__engine_error = false;
        } catch (e) {
            // Object failed to draw
            if (!obj.__engine_error) {
                visualLog(`Error drawing Sprite::${name}: ${e}`, 'error', obj.__engine_name);
                // Track errors to not spam logs
                obj.__engine_error = true;
            }
        }
        ps.add(obj); // Set the screen back!
    }
});
editorScreen.startGame();

let doBreakTileRows = false;

const editTileMap = (map) => {
    clearVisualEditor();
    engineEvents.emit('show window', 'visual');
    visualLog(`Editing ${map.__engine_name}.`, 'log', 'tilemap editor');

    const tileset = map.getTileset();
    map.refreshCachedImages();
    map.__engine_editing = true;
    engineEvents.emit('refresh objects list');

    // Update antialiasing to be consistent
    editorScreen.setAntialiasing(map.getParent().getAntialiasing());

    const editScene = new gameify.Scene(editorScreen);
    editorScreen.camera.setSpeed(1);
    editorScreen.setScene(editScene);

    const controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('visual');
    const tileList = document.createElement('div');
    tileList.classList.add('tile-list');

    controls.innerHTML = `
    <div class="legend">
        <span><img src="images/mouse_left.svg">Place</span>
        <span><img src="images/mouse_right.svg">Delete</span>
        <span><img src="images/mouse_middle.svg">Pick</span>
        <span><img src="images/arrows_scroll.svg">Rotate</span>
        <button id="vi-stop-editing" class="right"><img src="images/check_done.svg">Preview</button>
        <button id="vi-switch-layout"><img src="images/tiles_layout.svg">Wrap</button>
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
    controls.querySelector('#vi-switch-layout').onclick = () => {
        for (const rowBreak of tileList.querySelectorAll('.row-break')) {
            rowBreak.classList.toggle('no-break');
        }
        doBreakTileRows = !doBreakTileRows;
    }
    controls.querySelector('#vi-stop-editing').onclick = () => {
        map.__engine_editing = false;
        engineEvents.emit('refresh objects list');
        showPreviewOrderControls();
    }

    controls.appendChild(tileList);
    editorCanvas.parentElement.after(controls);

    let selTile = {x: 0, y: 0, r: 0};
    let dragStart = false;
    let originalOffset = null;

    for (let ty = 0; ty < tileset.texture.height/tileset.theight; ty++) {
        for (let tx = 0; tx < tileset.texture.width/tileset.twidth; tx++) {
            const tileCanvas = document.createElement('canvas');
            const context = tileCanvas.getContext('2d');

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

            context.imageSmoothingEnabled = editorScreen.getAntialiasing();
            tile.draw(context, 0, 0, 50, 50, 0);
        }
        const rowBreak = document.createElement('span');
        rowBreak.classList.add('row-break');
        if (!doBreakTileRows) {
            rowBreak.classList.add('no-break');
        }
        tileList.appendChild(rowBreak);
    }
    const rowBreakEnd = document.createElement('span');
    rowBreakEnd.classList.add('row-break-end');
    tileList.appendChild(rowBreakEnd);

    editScene.onUpdate(() => {
        const position = map.screenToMap(editorScreen.mouse.worldPosition());
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
                originalOffset = editorScreen.camera.getPosition();
            }
            editorScreen.camera.translateAbsolute(originalOffset.subtract(dragStart.subtract(mousePos)));

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
        const position = map.mapToScreen(map.screenToMap(editorScreen.mouse.worldPosition()));

        const previewTile = map.getTileset().getTile(selTile.x, selTile.y);
        
        editorScreen.clear();
        map.draw();

        const ctx = editorCanvas.getContext('2d');

        drawTileMapsInOrder((dm) => {
            ctx.globalAlpha = 0.4;
            if (dm === map) {
                ctx.globalAlpha = 1;
            }
        });

        ctx.globalAlpha = 0.75;
        previewTile.draw(ctx,
                        position.x, position.y,
                        map.twidth, map.theight,
                        selTile.r, /*ignoreOpacity=*/true);

        ctx.globalAlpha = 1;
    });
}
engineEvents.listen('edit tilemap', (_event, map) => editTileMap(map));

const editAnimation = (anim) => {
    clearVisualEditor();
    engineEvents.emit('show window', 'visual');
    visualLog(`Editing ${anim.__engine_name}.`, 'log', 'animation editor');

    // Update antialiasing to be consistent
    const defaultScreen = Object.values(engineState.objects['Screen'])[0];
    editorScreen.setAntialiasing(defaultScreen.getAntialiasing());

    const editScene = new gameify.Scene(editorScreen);
    editorScreen.setScene(editScene);

    const controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('visual');

    const propertyTypes = {
        simple: {
            createInput: (property, modifier = (v) => v) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                input.value = property.value.toString();
                if (modifier(property.value) === undefined) {
                    input.classList.add('invalid');
                }
                input.addEventListener('change', () => {
                    const parsedValue = modifier(input.value);
                    if (parsedValue === undefined) {
                        // If the value is invalid, don't change it
                        // and reset the input to the old value
                        input.value = property.value;
                        return;
                    }
                    input.classList.remove('invalid');
                    property.value = parsedValue;
                    input.value = parsedValue;
                }); 
                return input;
            }
        },
        object: {
            createInput: (property) => {
                const input = document.createElement('span');
                input.innerText = '[Object]'
                return input;
            }
        },
        string: {
            createInput: (property) => {
                return propertyTypes.simple.createInput(property);
            }
        },
        number: {
            createInput: (property) => {
                return propertyTypes.simple.createInput(property, (value) => {
                    if (isNaN(value)) return undefined;
                    return Number(value);
                });
            }
        },
        boolean: {
            createInput: (property) => {
                return propertyTypes.simple.createInput(property, (value) => {
                    if (value === "0" || value[0]?.toLowerCase() === "f") return false;
                    return Boolean(value);
                });
            }
        },
        Vector2d: {
            createInput: (property) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'text');
                // Make sure the property is a vector
                try {
                    property.value = new gameify.Vector2d(property.value);
                } catch (e) {
                    input.classList.add('invalid');
                }
                input.value = property.value.toString();
                input.addEventListener('change', () => {
                    let parsedValue;
                    try {
                        parsedValue = new gameify.Vector2d(input.value);
                    } catch (e) {
                        // If the input is invalid, don't change it
                        // and reset the input to the old value
                        input.value = property.value.toString();
                        return;
                    }
                    input.classList.remove('invalid');
                    property.value = parsedValue;
                    input.value = parsedValue;
                });
                return input;
            }
        },
        Image: {
            createInput: (property) => {
                const container = document.createElement('div');
                const input = document.createElement('select');
                input.innerHTML = '<option value="None::None" selected disabled>None</option>';
                engineTypes.list(engineState.objects, ['Image', 'Tileset']).forEach((name) => {
                    const selectedName = property.value?.__engine_name || property.value?.tileData?.tileset?.__engine_name
                    const selected = name === selectedName || name === property.value ? 'selected' : '';
                    const shortName = name.replace('Image::', 'I::').replace('Tileset::', 'T::');
                    input.innerHTML += `<option value="${name}" ${selected}>${shortName}</option>`;
                });
                input.addEventListener('change', () => {
                    const v = input.value;
                    const type = v.split('::')[0];
                    const name = v.split('::')[1];
                    if (type === 'Image') {
                        property.value = engineState.objects[type][name];
                    } else if (type === 'Tileset') {
                        const tileset = engineState.objects[type][name];
                        property.value = tileset.getTile(tilePos.value.x, tilePos.value.y)
                    }
                    updateTsPos();
                });

                const tileLabel = document.createElement('span');
                const tilePos = {
                    // property.value is of type Image
                    value: property.value?.tileData?.position || new gameify.Vector2d(0, 0)
                }
                const tilePosProxy = new Proxy(tilePos, { set: (target, prop, value) => {
                    // When tile position is changed
                    if (prop === 'value') {
                        target.value = value;
                        // property.value is of type Image
                        property.value = property.value.tileData.tileset.getTile(value.x, value.y);
                        return true;
                    }
                }, get: (target, prop) => {
                    if (prop === 'value') {
                        const val = target[prop];
                        let pref = '';
                        if (!val.x) val.x = 0;
                        if (!val.y) val.y = 0;
                        return pref + (new gameify.Vector2d(val).toString());
                    }
                }});
                // Create this input with a proxy
                // So we can catch changes and apply them properly
                const tileInput = propertyTypes.Vector2d.createInput(tilePosProxy);
                const updateTsPos = () => {
                    if (property.value?.tileData?.tileset) {
                        tileLabel.style.display = '';
                    } else {
                        tileLabel.style.display = 'none';
                    }
                }
                tileLabel.appendChild(tileInput);
                updateTsPos();

                container.appendChild(input);
                container.appendChild(tileLabel);
                return container;
            }
        }
    }
    
    let frameListEls = {};
    let drawnFrameDuration = anim.options.frameDuration;

    let previewEl = null;
    let previewActive = false;
    let previewAnimator = new gameify.Animator(previewEl);
    let lastActiveFrameEl = undefined;

    const genFrameTable = () => {
        drawnFrameDuration = anim.options.frameDuration;
        if (frameListEls.table) {
            frameListEls.table.remove();
        }

        frameListEls.table = document.createElement('table'),
        frameListEls.body = document.createElement('tbody'),
        frameListEls.header = document.createElement('thead'),
        frameListEls.headerRow = document.createElement('tr'),
        frameListEls.propLabelTh = document.createElement('th'),
        frameListEls.propTypeTh = document.createElement('th'),
        frameListEls.propRows = {};

        controls.appendChild(frameListEls.table);

        frameListEls.table.classList.add('frame-list');
        frameListEls.table.appendChild(frameListEls.header);
        frameListEls.table.appendChild(frameListEls.body);
        frameListEls.header.appendChild(frameListEls.headerRow);
        frameListEls.headerRow.appendChild(frameListEls.propLabelTh);
        frameListEls.headerRow.appendChild(frameListEls.propTypeTh);
        frameListEls.propLabelTh.innerHTML = 'Property';
        frameListEls.propTypeTh.innerHTML = 'Type';

        if (document.querySelector('#vi-frames-count')) {
            document.querySelector('#vi-frames-count').innerHTML = anim.frames.length + ' frames';
        }

        // Add each property to the table
        for (const index in anim.frames) {
            const frame = anim.frames[index];
            for (const propName in frame) {
                if (!frameListEls.propRows[propName]) {
                    const propRow = document.createElement('tr');
                    frameListEls.propRows[propName] = {
                        defaultType: frame[propName].type,
                        element: propRow
                    }

                    // Property name (1st column)
                    const propLabel = document.createElement('td');
                    propLabel.__engine_menu = {
                        'Delete Property': () => {
                            for (const frame of anim.frames) {
                                if (frame[propName]) {
                                    delete frame[propName];
                                }
                            }
                            genFrameTable();
                        }
                    };
                    const propInput = document.createElement('input');
                    propInput.value = propName;
                    propInput.addEventListener('change', () => {
                        for (const frame of anim.frames) {
                            if (frame[propName]) {
                                // Rename the property, by Object.assign-ing it, then deleting the old property
                                // delete Object.assign(obj, {[newKey]: obj[oldKey] })[oldKey];
                                delete Object.assign(frame, { [propInput.value]: frame[propName] })[propName];
                            }
                        }
                        genFrameTable();
                    });
                    propLabel.appendChild(propInput);
                    propRow.appendChild(propLabel);
                    
                    // Property type (2nd column)
                    const propType = document.createElement('td');
                    const propSelect = document.createElement('select');
                    for (const type in gameify.Animation.propertyTypes) {
                        const selected = type === frameListEls.propRows[propName].defaultType ? 'selected' : '';
                        propSelect.innerHTML += `<option value="${type}" ${selected}>${type}</option>`;
                    }
                    propSelect.addEventListener('change', () => {
                        const newType = propSelect.value;
                        frameListEls.propRows[propName].defaultType = newType;
                        for (const frame of anim.frames) {
                            if (frame[propName]) {
                                frame[propName].type = newType;
                            }
                        }
                        genFrameTable();
                    });
                    propType.appendChild(propSelect);
                    propRow.appendChild(propType);

                    frameListEls.body.appendChild(propRow);
                }
            }
        }
        // Add each frame to the table
        for (const index in anim.frames) {
            const frameLabel = document.createElement('th');
            frameLabel.innerText = (index * anim.options.frameDuration)/1000 + 's';
            frameListEls.headerRow.appendChild(frameLabel);

            frameLabel.__engine_menu = {
                'Jump To Frame': () => {
                    previewAnimator.play('preview');
                    previewActive = true;
                    previewAnimator.animationProgress = index * anim.options.frameDuration;
                    previewAnimator.update(0);
                    previewAnimator.pause();
                },
                'Insert Frame Before': () => {
                    anim.frames.splice(index, 0, {});
                    genFrameTable();
                },
                'Delete Frame': () => {
                    anim.frames.splice(index, 1);
                    genFrameTable();
                }
            }

            const frame = anim.frames[index];
            for (const propName in frameListEls.propRows) {
                const propTd = document.createElement('td');
                propTd.__engine_menu = Object.assign({}, frameLabel.__engine_menu);

                if (frame[propName]) {
                    // Property value
                    const propInput = propertyTypes[frame[propName].type].createInput(frame[propName]);
                    propTd.appendChild(propInput);
                    propTd.__engine_menu['Clear Property'] = () => {
                        delete frame[propName];
                        genFrameTable();
                    }
                } else {
                    // Add property to frame
                    const addButton = document.createElement('button');
                    addButton.innerText = '+ Add';
                    addButton.addEventListener('click', () => {
                        frame[propName] = {
                            type: frameListEls.propRows[propName].defaultType, value: 0
                        };
                        genFrameTable();
                    });
                    propTd.appendChild(addButton);
                    propTd.__engine_menu['Add Property'] = () => {
                        addButton.click();
                    }
                }
                frameListEls.propRows[propName].element.appendChild(propTd);
            }
        }

        // New frame button
        const addLabel = document.createElement('th');
        const addFrameButton = document.createElement('button');
        addFrameButton.innerText = '+ Frame';
        addFrameButton.addEventListener('click', () => {
            anim.frames.push({});
            genFrameTable();
        });
        addLabel.appendChild(addFrameButton);
        frameListEls.headerRow.appendChild(addLabel);

        // New property button
        const addPropTr = document.createElement('tr');
        const addPropTd = document.createElement('td');
        const addPropButton = document.createElement('button');
        addPropButton.innerText = '+ Property';
        addPropButton.addEventListener('click', () => {
            const randomPropName = 'property' + Math.floor(Math.random()*1000);
            frameListEls.propRows[randomPropName] = {
                defaultType: 'number',
                element: document.createElement('td')
            }
            if (!anim.frames[0]) anim.frames.push({});
            anim.frames[0][randomPropName] = { type: 'number', value: 0 };
            genFrameTable();
            console.log(anim.frames);
        });
        addPropTr.appendChild(addPropTd);
        addPropTd.appendChild(addPropButton);
        frameListEls.body.appendChild(addPropTr);
    }

    controls.innerHTML = `
    <div class="legend">
        <button id="vi-stop-anim"><img src="images/stop.svg" aria-label="Stop"></button>
        <button id="vi-step-anim-back"><img src="images/step-left.svg" aria-label="Step back 1 frame"></button>
        <button id="vi-play-anim"><img src="images/play.svg" aria-label="Play"></button>
        <button id="vi-pause-anim"><img src="images/pause.svg" aria-label="Pause"></button>
        <button id="vi-step-anim-forward"><img src="images/step-right.svg" aria-label="Step foreward 1 frame"></button>
        <span id="vi-frames-count">${anim.frames.length} frames</span>
        <span class="right">Preview:</span>
        <select id="vi-preview-obj-select">
            <option value="None::None">No Preview</option>
        </select>
    </div>
    `;

    editorCanvas.parentElement.after(controls);

    genFrameTable();

    const previewSelector = controls.querySelector('#vi-preview-obj-select');
    // You can technically apply animations to anything, but
    // we're only supporting sprites and tilemaps for previews.
    engineTypes.list(engineState.objects, ['Sprite', 'Tilemap']).forEach((name) => {
        previewSelector.innerHTML += `<option value="${name}">${name}</option>`;
    });

    previewSelector.addEventListener('change', (event) => {
        const name = event.target.value;
        if (name === 'None::None') {
            previewEl = null;
            return;
        }
        const type = name.split('::')[0];
        const oName = name.split('::')[1];
        // Copy the object that we apply the preview to.
        const obj = engineState.objects[type][oName].toJSON(oName, (v)=>v); // Simple ref function, since we're not modifying any referenced objects
        previewEl = engineTypes.resolve(type).fromJSON(obj, (v)=>v);
        // Make a new animator for the new preview el
        previewAnimator = new gameify.Animator(previewEl);
        previewAnimator.set('preview', anim);
        visualLog(`Previewing animation on ${type}::${oName}`, 'info', 'animation editor');
    });

    document.querySelector('#vi-play-anim').addEventListener('click', () => {
        if (previewEl) previewAnimator.play('preview');
        if (anim.options.duration < 5) {
            visualLog(`Animation frame duration is very short (${anim.options.duration}ms).`, 'warn', 'animation editor');
        }
        previewActive = true;
        frameListEls.table.querySelectorAll(`td, th`).forEach(el => el.classList.remove('error'))
    });
    document.querySelector('#vi-pause-anim').addEventListener('click', () => {
        previewAnimator.pause();
    });
    document.querySelector('#vi-step-anim-back').addEventListener('click', () => {
        previewAnimator.animationProgress -= anim.options.frameDuration;
        // Trick it into updating
        previewAnimator.resume();
        previewAnimator.update(0);
        previewAnimator.pause();
    });
    document.querySelector('#vi-step-anim-forward').addEventListener('click', () => {
        previewAnimator.animationProgress += anim.options.frameDuration;
        previewAnimator.resume();
        previewAnimator.update(0);
        previewAnimator.pause();
    });
    document.querySelector('#vi-stop-anim').addEventListener('click', () => {
        previewAnimator.animationProgress = 0;
        // Don't actually stop, so the buttons still work
        previewAnimator.resume();
        previewAnimator.update(0);
        previewAnimator.pause();
    });

    const dealWithPreviewError = (error) => {
        const time = previewAnimator.animationProgress;
        const frame = anim.getFrameNumberAt(time);
        // +2 for property + type boxes, + 1 because frame number is zero-indexed)
        frameListEls.table.querySelectorAll(`:is(td, th):nth-child(${frame + 3})`).forEach(el => el.classList.add('error'));
        // Truncate to 2 decimal places. Even that's overkill, really
        const timeStr = String(time).match(/\d*\.\d{0,2}/)[0];
        visualLog(`Error playing animation at frame ${frame} (${timeStr}ms)`, 'error', 'animation editor');
        visualLog(error, 'error', 'animation editor');
        // Stop *afterwords* (so we can get the frame number above)
        previewAnimator.stop();
        previewActive = false;
    }

    editScene.onUpdate((delta) => {
        if (anim.options.frameDuration !== drawnFrameDuration) {
            genFrameTable();
        }
        if (previewEl && previewActive) {
            try {
                previewAnimator.update(delta);
                const time = previewAnimator.animationProgress;
                const frame = anim.getFrameNumberAt(time);
                lastActiveFrameEl?.classList.remove('active')
                lastActiveFrameEl = frameListEls.headerRow.querySelector(`th:nth-child(${frame + 3})`);
                lastActiveFrameEl?.classList.add('active');
            } catch (e) {
                console.error(e);
                dealWithPreviewError(e);
            }
        }
    });
    editScene.onDraw(() => {
        editorScreen.clear();
        if (previewEl && previewActive) {
            try {
                previewEl.draw();
            } catch (e) {
                console.error(e);
                dealWithPreviewError(e);
            }
        }
    });
}
engineEvents.listen('edit animation', (_event, anim) => editAnimation(anim));

const showPreviewOrderControls = () => {
    clearVisualEditor();
    // Create order 
    let controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('floating');
    controls.classList.add('visual');
    controls.classList.add('collapsed');
    const tileList = document.createElement('div');
    tileList.classList.add('tile-list');

    controls.innerHTML = `
    <div class="legend">
        <span>Reorder objects</span>
        <button id="vi-shrink-expand">Expand</button>
    </div>`;
    editorCanvas.parentElement.after(controls);

    controls.querySelector('#vi-shrink-expand').onclick = () => {
        if (controls.classList.contains('collapsed')) {
            controls.classList.remove('collapsed');
            controls.querySelector('#vi-shrink-expand').innerHTML = 'Collapse';
            controls.setAttribute(
                'style', controls.getAttribute('data-style') || ''
            );
        } else {
            controls.classList.add('collapsed');
            controls.querySelector('#vi-shrink-expand').innerHTML = 'Expand';
            controls.setAttribute(
                'data-style', controls.getAttribute('style') || ''
            );
            controls.removeAttribute('style');

        }
    }

    const list = document.createElement('ul');
    list.classList.add('list');
    controls.appendChild(list);

    const createList = () => {
        let selected = null

        function dragOver(e) {
            if (isBefore(selected, e.target)) {
                e.target.parentNode.insertBefore(selected, e.target)
            } else {
                e.target.parentNode.insertBefore(selected, e.target.nextSibling)
            }
        }
        function dragEnd() {
            selected.classList.remove('dragging');
            selected = null;
            // re-number the elements and regenerate the list
            let curIndex = 0;
            for (const el of list.children) {
                const name = el.getAttribute('data-tilemap-name');
                engineState.objects['Tilemap'][name].__engine_index = curIndex;
                curIndex++;
            }
            createList();
        }
        function dragStart(e) {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', null)
            selected = e.target
            selected.classList.add('dragging');
        }
        function isBefore(el1, el2) {
            let cur
            if (el2.parentNode === el1.parentNode) {
                for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
                if (cur === el2) return true
                }
            }
            return false;
        }

        list.innerHTML = '';
        const sortedMaps = sortPreviewTileMaps();;
        for (const index in sortedMaps) {
            const name = sortedMaps[index];
            const obj = engineState.objects['Tilemap'][name];
            obj.__engine_index = Number(index);

            const li = document.createElement('li');
            li.innerHTML += '(' + obj.__engine_index + ') ' + obj.__engine_name;
            li.classList.add('list-item');
            li.classList.add('grab');
            li.setAttribute('data-tilemap-name', name);
            li.setAttribute('draggable', true);
            
            li.addEventListener('dragstart', dragStart);
            li.addEventListener('dragover', dragOver);
            li.addEventListener('dragend', dragEnd);
            
            list.appendChild(li);
        }
    }
    createList();

}
engineEvents.listen('show visual editor preview', () => showPreviewOrderControls());

const clearVisualEditor = () => {
    sortPreviewTileMaps();

    visualLog(`Cleared tilemap editor`, 'debug', 'tilemap editor');
    // Remove old things
    const allControls = document.querySelectorAll('.editor-controls.visual');
    for (const controls of allControls) {
        controls.remove();
    }
    for (const mn in engineState.objects['Tilemap']) {
        engineState.objects['Tilemap'][mn].__engine_editing = false;
    }
    engineEvents.emit('refresh objects list');
    editorScreen.setScene(previewScene);
}
engineEvents.listen('clear visual editor', () => clearVisualEditor());
