import { gameify } from '/gameify/gameify.js';
import { engineEvents } from './engine_events.js';
import { engineState } from './engine_state.js';
import { engineTypes } from './engine_types.js';
import { tilemapTools } from './visual_editor_tilemap_tools.js';

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

/** Add a tooltip (similar to the title attribute), with the content of the element's aria-label.
 * @param {HTMLElement} el - The element to add the tooltip to
 * @param {number} [delay=500] - The delay to show the tooltip for
 */
const addAriaTooltip = (el, delay = 500) => {
    const tooltip = document.createElement('span');
    tooltip.innerHTML = el.getAttribute('aria-label');
    tooltip.classList.add('tooltip');
    // The aria-label already exists, so don't add this to the accessibility tree
    tooltip.classList.add('aria-hidden', true);

    el.addEventListener('mouseenter', () => {
        document.body.appendChild(tooltip);
        window.setTimeout(() => {
            if (el.matches(':hover')) {
                const box = el.getBoundingClientRect();
                tooltip.style.top = box.bottom + 'px';
                tooltip.style.left = box.left + 'px';
                tooltip.style.opacity = 1;
            }
            
        }, delay);
    });
    el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = 0;
        // there won't be a fade-out transition,
        // oh well. Removing this with a delay causes
        // problems when the mouse leaves and re-enters quickly
        tooltip.remove();
    });
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
    const defaultScreen = Object.values(engineState.objects?.['Screen'] || {})[0] || _defaultScreen;
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
let tileCellSize = 50;

const createTileList = (tileset, selectionChangeCallback = ()=>{}) => {
    const tileListElement = document.createElement('div');
    tileListElement.classList.add('tile-list');

    let selTile = {x: 0, y: 0, r: 0};

    for (let ty = 0; ty < tileset.texture.height/tileset.theight; ty++) {
        for (let tx = 0; tx < tileset.texture.width/tileset.twidth; tx++) {
            const canvasContainer = document.createElement('span');
            canvasContainer.classList.add('tile-container');
            const tileCanvas = document.createElement('canvas');
            const context = tileCanvas.getContext('2d');

            tileCanvas.setAttribute('aria-label', `Tile ${tx}, ${ty}`);
            addAriaTooltip(tileCanvas);
            tileCanvas.classList.add('tile');
            tileCanvas.classList.add(`tile-${tx}-${ty}`);
            if (tx === 0 && ty === 0) {
                tileCanvas.classList.add('selected');
            }
            tileCanvas.width = tileCellSize;
            tileCanvas.height = tileCellSize;
            tileCanvas.onclick = () => {
                tileListElement.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
                tileCanvas.classList.add('selected');
                selTile = {x: tx, y: ty, r: 0};
                selectionChangeCallback();
            }
            const tile = tileset.getTile(tx, ty);
            if (tile.tileData.collisionShape) {
                canvasContainer.classList.add('has-collision-shape');
            }
            canvasContainer.appendChild(tileCanvas);
            tileListElement.appendChild(canvasContainer);

            context.imageSmoothingEnabled = editorScreen.getAntialiasing();
            tile.draw(context, 0, 0, tileCellSize, tileCellSize, 0);
        }
        const rowBreak = document.createElement('span');
        rowBreak.classList.add('row-break');
        if (!doBreakTileRows) {
            rowBreak.classList.add('no-break');
        }
        tileListElement.appendChild(rowBreak);
    }
    const rowBreakEnd = document.createElement('span');
    rowBreakEnd.classList.add('row-break-end');
    tileListElement.appendChild(rowBreakEnd);

    return {
        element: tileListElement,
        selectedTile: () => selTile,
        tileCellSize: () => tileCellSize,
        zoomTilesRelative(size) {
            tileCellSize = tileCellSize + size;
            this.zoomTiles(tileCellSize);
        },
        zoomTiles(size) {
            tileCellSize = size;
            tileListElement.querySelectorAll('.tile').forEach(tile => {
                tile.style.width = size + 'px';
                tile.style.height = size + 'px';
            })
        },
        toggleWrap() {
            for (const rowBreak of tileListElement.querySelectorAll('.row-break')) {
                rowBreak.classList.toggle('no-break');
            }
            doBreakTileRows = !doBreakTileRows;
        },
        addCollisionShapeIcon(tilepos) {
            tileListElement.querySelector(`.tile-${tilepos.x}-${tilepos.y}`)
                .parentElement.classList.add("has-collision-shape");
        },
        removeCollisionShapeIcon(tilepos) {
            tileListElement.querySelector(`.tile-${tilepos.x}-${tilepos.y}`)
                .parentElement.classList.remove("has-collision-shape");
        },
        selectTile(tile) {
            selTile = tile.source;
            selTile.r = tile.rotation;
            // Update the tile list
            tileListElement.querySelectorAll('.tile.selected').forEach(t => t.classList.remove('selected'));
            tileListElement.querySelector(`.tile-${tile.source.x}-${tile.source.y}`).classList.add("selected");
            tileListElement.querySelector(`.tile-${tile.source.x}-${tile.source.y}`).scrollIntoView();
        },
        rotateSelection(degrees) {
            selTile.r += degrees;
        }
    }
}

// Setup the visual editor before editing something
const setupOpenEditor = (object) => {
    clearVisualEditor();
    engineEvents.emit('show window', 'visual');
    visualLog(`Editing ${object.__engine_name}.`, 'log', 'editor');

    object.__engine_editing = true;
    engineEvents.emit('refresh objects list');

    // Update antialiasing to be consistent
    const defaultScreen = Object.values(engineState.objects['Screen'])[0];
    editorScreen.setAntialiasing(defaultScreen.getAntialiasing());
}

const editTileMap = (map) => {
    setupOpenEditor(map);

    map.refreshCachedImages();

    const editScene = new gameify.Scene(editorScreen);
    editorScreen.camera.setSpeed(1);
    editorScreen.setScene(editScene);

    const controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('visual');
    controls.innerHTML = `
        <div class="legend">
            <span aria-label="Drag to place tiles, Control-drag to pan/move"><img src="images/mouse_left.svg">Place</span>
            <span aria-label="Shift-drag or Right-drag to erase tiles"><img src="images/mouse_right.svg">Delete</span>
            <span aria-label="Alt-click or Middle-click to pick tiles"><img src="images/mouse_middle.svg">Pick</span>
            <span aria-label="Scroll to rotate the current tile."><img src="images/arrows_scroll.svg">Rotate</span>
            <button id="vi-stop-editing" class="right"><img src="images/check_done.svg">Preview</button>
            <button id="vi-switch-layout"><img src="images/tiles_layout.svg">Wrap</button>
            <button id="vi-zoom-out"><img src="images/zoom_out.svg">Smaller</button>
            <button id="vi-zoom-in"><img src="images/zoom_in.svg">Larger</button>
        </div>
        <div class="legend tool-selector">
            <button class="squish-right active" data-tool="brush" aria-label="3x3 Brush: Draw/erase tiles"><img src="images/draw-point.svg">Brush</button>
            <input  data-tool="brush" type="number" id="vi-brush-size" min="1" max="15" value="1" aria-label="Brush radius">
            <button data-tool="line" aria-label="Line: Draw/erase lines"><img src="images/draw-line.svg">Line</button>
            <button data-tool="rectangle" aria-label="Rectangle: Draw/erase rectangles"><img src="images/draw-grid.svg">Rectangle</button>

            <button id="vi-edit-undo" aria-label="Undo up to 25 actions (Ctrl+Z)" class="right"><img src="images/undo.svg">Undo</button>
            <button id="vi-edit-redo" aria-label="Redo your last undone action (Ctrl+Y or Ctrl+Shift+Z)"><img src="images/redo.svg">Redo</button>
        </div>
    `

    const tileList = createTileList(map.getTileset());

    controls.querySelector('#vi-zoom-out').onclick = () => {
        tileList.zoomTilesRelative(-10);
    }
    controls.querySelector('#vi-zoom-in').onclick = () => {
        tileList.zoomTilesRelative(10);
    }
    controls.querySelector('#vi-switch-layout').onclick = () => {
        tileList.toggleWrap();
    }
    controls.querySelector('#vi-stop-editing').onclick = () => {
        map.__engine_editing = false;
        engineEvents.emit('refresh objects list');
        showPreviewOrderControls();
    }

    let currentTool = 'brush';
    controls.querySelectorAll('.tool-selector [data-tool]').forEach(el => {
        el.addEventListener('click', () => {
            controls.querySelector('.tool-selector .active').classList.remove('active');
            el.classList.add('active');
            currentTool = el.getAttribute('data-tool');
        });
    });

    let undoFrames = [map.exportMapData()];
    let redoFrames = [];
    const undo = () => {
        if (undoFrames.length > 0) {
            redoFrames.push(undoFrames.pop());
            map.clear();
            map.loadMapData(undoFrames[undoFrames.length - 1]);
        } else {
            visualLog('Nothing to undo', 'warn', 'tilemap editor');
        }
    }
    const redo = () => {
        if (redoFrames.length > 0) {
            undoFrames.push(redoFrames.pop());
            map.clear();
            map.loadMapData(undoFrames[undoFrames.length - 1]);
        } else {
            visualLog('Nothing to redo', 'warn', 'tilemap editor');
        }
    }
    controls.querySelector('#vi-edit-undo').addEventListener('click', () => {
        undo();
    });
    controls.querySelector('#vi-edit-redo').addEventListener('click', () => {
        redo();
    });

    controls.appendChild(tileList.element);
    editorCanvas.parentElement.after(controls);

    controls.querySelectorAll('[aria-label]').forEach(el => addAriaTooltip(el));

    let dragStart = false;
    let originalOffset = null;
    let previewTilePositions = [];
    let tilesetNotLoadedError = false;

    let lastMouseAction = 'draw';

    editScene.onUpdate(() => {
        const position = map.worldToMap(editorScreen.mouse.worldPosition());
        let mouseAction = 'none';
        if (editorScreen.mouse.buttonIsPressed("left")) {
            mouseAction = 'draw';
            
            if (editorScreen.keyboard.keyIsPressed("Shift")) {
                mouseAction = 'delete';
            } else if (editorScreen.keyboard.keyIsPressed("Control")) {
                mouseAction = 'move';
            } else if (editorScreen.keyboard.keyIsPressed("Alt")) {
                mouseAction = 'pick';
            }
        } else if (editorScreen.mouse.buttonIsPressed("right")) {
            mouseAction = 'delete';
        } else if (editorScreen.mouse.buttonIsPressed("middle")) {
            mouseAction = 'move,pick';
        }

        if ((mouseAction === 'draw' || mouseAction === 'delete') && mouseAction !== lastMouseAction) {
            undoFrames.push(map.exportMapData());
            if (undoFrames.length > 25) {
                undoFrames.shift();
            }
            redoFrames = [];
        }

        // keyboard undo/redo
        if (editorScreen.keyboard.keyIsPressed("Control") && editorScreen.keyboard.keyWasJustPressed("Z")) {
            undo();
        } else if (
            ( editorScreen.keyboard.keyIsPressed("Control")     // ctrl+y
                && editorScreen.keyboard.keyWasJustPressed("Y")
            ) || (editorScreen.keyboard.keyIsPressed("Control") // ctrl+shift+z
                && editorScreen.keyboard.keyWasJustPressed("Shift")
                && editorScreen.keyboard.keyWasJustPressed("Z")
        )) {
            redo();
        }

        // Clear last frame's preview
        previewTilePositions = [];

        // Change what the tool does based on the mouse action
        let applyAction = undefined;
        let applyLastAction = undefined;
        const applyPreview = (placeX, placeY) => previewTilePositions.push(
            new gameify.Vector2d(placeX*map.twidth, placeY*map.theight)
        );
        const applyDraw = (placeX, placeY) => {
            applyPreview(placeX, placeY);
            const selTile = tileList.selectedTile();
            map.place(selTile.x, selTile.y, placeX, placeY, selTile.r);
        }
        const applyDelete = (placeX, placeY) => {
            applyPreview(placeX, placeY);
            map.remove(placeX, placeY);
        }
        if (lastMouseAction === 'draw') {
            applyLastAction = applyDraw;
        } else if (lastMouseAction === 'delete') {
            applyLastAction = applyDelete;
        } else {
            applyLastAction = applyPreview;
        }
        if (mouseAction === 'draw') {
            applyAction = applyDraw;
        } else if (mouseAction === 'delete') {
            applyAction = applyDelete;
        } else {
            applyAction = applyPreview;
        }
        tilemapTools[currentTool](position, mouseAction, applyAction, applyLastAction, applyPreview);


        if (mouseAction.includes('pick')) {
            // Pick tile
            const tile = map.get(position.x, position.y);
            if (tile && !dragStart) {
                tileList.selectTile(tile);
            }
        }

        if (mouseAction.includes('move')) {
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
            tileList.rotateSelection(-45);
        } else if (editorScreen.mouse.eventJustHappened("wheeldown")) {
            tileList.rotateSelection(45);
        }

        lastMouseAction = mouseAction;
    });
    editScene.onDraw(() => {
        const previewTile = map.getTileset().getTile(tileList.selectedTile().x, tileList.selectedTile().y);
        
        editorScreen.clear();
        map.draw();

        const ctx = editorCanvas.getContext('2d');

        drawTileMapsInOrder((dm) => {
            ctx.globalAlpha = 0.4;
            if (dm === map) {
                ctx.globalAlpha = 1;
            }
        });

        if (!map.tileset.loaded) {
            if (!tilesetNotLoadedError) {
                tilesetNotLoadedError = true;
                visualLog(`Tileset ${map.tileset.__engine_name} is not loaded or it's image is broken.`, 'error', 'tilemap editor');
            }
            return;
        }

        ctx.globalAlpha = 0.75;
        for (const tilePos of previewTilePositions) {
            previewTile.draw(ctx,
                            tilePos.x, tilePos.y,
                            map.twidth, map.theight,
                            tileList.selectedTile().r, /*ignoreOpacity=*/true);
        }
        ctx.globalAlpha = 1;
    });
}
engineEvents.listen('edit tilemap', (_event, map) => editTileMap(map));

const editTilesetCollisions = (tileset) => {
    setupOpenEditor(tileset);

    const controls = document.createElement('div');
    controls.classList.add('editor-controls');
    controls.classList.add('visual');
    editorCanvas.parentElement.after(controls);
    controls.innerHTML = `
        <div class="legend">
            <button id="vi-clear-shape">Clear Shape</button>
            <button id="vi-set-rectangle">Rectangle</button>
            <button id="vi-set-polygon">Polygon</button>
            <button id="vi-set-circle">Circle</button>

            <button id="vi-stop-editing" class="right"><img src="images/check_done.svg">Done</button>
            <button id="vi-switch-layout"><img src="images/tiles_layout.svg">Wrap</button>
            <button id="vi-zoom-out" aria-label="Zoom out"><img src="images/zoom_out.svg"></button>
            <button id="vi-zoom-in" aria-label="Zoom in"><img src="images/zoom_in.svg"></button>
        </div>
        <div class="legend">
            <span id="vi-tag-list">
                No Tags
                <button class="remove-tag" aria-label="Remove tag">My Tag <img src="images/x-cancel.svg"></button>
            </span>

            <select id="vi-add-recent-tag" class="right">
                <option selected disabled value="__no_tag1">Add Recent Tag</option>
            </select>
            <input data-tool="brush" type="text" id="vi-tag-input" aria-label="Tag name" placeholder="Tag name">
            <button id="vi-add-tag">Add Tag</button>
        </div>
    `;

    const updateTagsList = () => {
        const selTile = tileList.selectedTile();
        const tags = tileset.getTile(selTile.x, selTile.y).tileData.tags || [];

        const tagList = document.querySelector('#vi-tag-list');
        tagList.innerHTML = '';
        for (const tag of tags) {
            const button = document.createElement('button');
            button.setAttribute('aria-label', `Remove tag ${tag}`);
            button.innerHTML = tag + ' <img src="images/x-cancel.svg">';
            button.onclick = () => {
                tileset.removeTag(tag, tileList.selectedTile());
                updateTagsList();
            }
            tagList.appendChild(button);
            addAriaTooltip(button);
        }
        if (tagList.innerHTML === '') {
            tagList.innerHTML = 'No Tags';
        }
    }

    const tileList = createTileList(tileset, updateTagsList);
    updateTagsList();
    controls.appendChild(tileList.element);

    controls.querySelector('#vi-zoom-out').onclick = () => {
        tileList.zoomTilesRelative(-10);
    }
    controls.querySelector('#vi-zoom-in').onclick = () => {
        tileList.zoomTilesRelative(10);
    }
    controls.querySelector('#vi-switch-layout').onclick = () => {
        tileList.toggleWrap();
    }
    controls.querySelector('#vi-stop-editing').onclick = () => {
        tileset.__engine_editing = false;
        engineEvents.emit('refresh objects list');
        showPreviewOrderControls();
    }

    controls.querySelector('#vi-clear-shape').onclick = () => {
        tileset.removeCollisionShape(tileList.selectedTile());
        tileList.removeCollisionShapeIcon(tileList.selectedTile());
    }
    controls.querySelector('#vi-set-rectangle').onclick = () => {
        tileList.addCollisionShapeIcon(tileList.selectedTile());
        tileset.setCollisionShape(
            // Full tile rectangle
            new gameify.shapes.Rectangle(0, 0, tileset.twidth, tileset.theight),
            tileList.selectedTile()
        );
    }
    controls.querySelector('#vi-set-polygon').onclick = () => {
        tileList.addCollisionShapeIcon(tileList.selectedTile());
        tileset.setCollisionShape(
            // Diamond shape
            new gameify.shapes.Polygon(0, 0, [
                {x: tileset.twidth/2, y: 0},
                {x: tileset.twidth, y: tileset.theight/2},
                {x: tileset.twidth/2, y: tileset.theight},
                {x: 0, y: tileset.theight/2},
            ]),
            tileList.selectedTile()
        );
    }
    controls.querySelector('#vi-set-circle').onclick = () => {
        tileList.addCollisionShapeIcon(tileList.selectedTile());
        tileset.setCollisionShape(
            // Full tile circle
            new gameify.shapes.Circle(tileset.twidth/2, tileset.twidth/2, tileset.twidth/2),
            tileList.selectedTile()
        );
    }

    const addTag = (tag) => {
        const input = controls.querySelector('#vi-tag-input');
        const select = document.querySelector('#vi-add-recent-tag');
        if (!tag) {
            tag = input.value;
            input.value = '';
        }
        if (!tag) return;

        tileset.addTag(tag, tileList.selectedTile());
        select.value = '__no_tag1';

        if (!select.querySelector(`[value="${tag}"]`)) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        }

        updateTagsList();
    };

    controls.querySelector('#vi-add-tag').addEventListener('click', ()=>addTag());
    controls.querySelector('#vi-tag-input').addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            addTag();
        }
    });
    document.querySelector('#vi-add-recent-tag').addEventListener('change', (evt) => {
        addTag(evt.target.value);
    });

    // Canvas is 400x400, tile is drawn 200x200, 
    // with 100px on each side, in case you want your shape
    // to be outside of the tile by a bit
    const canvasZoomFactor = 200/tileset.twidth;
    const tileAspectRatio = tileset.twidth/tileset.theight;

    const previewSprite = new gameify.Sprite(0, 0, tileset.getTile(0, 0));
    previewSprite.scale = canvasZoomFactor;
    editorScreen.add(previewSprite);

    editorScreen.setSize(200+(200*tileAspectRatio), 400);
    editorScreen.camera.setSpeed(1);
    editorScreen.camera.translateAbsolute(100, 100);
    editorScreen.setAntialiasing(false);

    let currentNodes = [];
    let draggingNode = false;
    const nodeDragDistance = 15;

    const editScene = new gameify.Scene(editorScreen);
    editorScreen.setScene(editScene);
    editScene.onUpdate(() => {
        const selTilePos = tileList.selectedTile();
        const previewTile = tileset.getTile(selTilePos.x, selTilePos.y);
        const shape = previewTile.tileData.collisionShape;

        const mousePos = editorScreen.mouse.worldPosition();

        currentNodes = [];
        const createNode = (pos, callback) => {
            const handleShape = new gameify.shapes.Circle(pos.x, pos.y, nodeDragDistance);
            handleShape.strokeColor = '#000f';
            const node = {
                handleShape,
                position: pos.multiply(canvasZoomFactor),
                update() {
                    const mousePos = editorScreen.mouse.worldPosition();
                    const mouseDown = editorScreen.mouse.buttonIsPressed("left");

                    this.closeToMouse = mousePos.distanceTo(this.position) < nodeDragDistance;

                    if (draggingNode === this) {
                        this.position = mousePos;
                        const shapePosition = mousePos.multiply(1/canvasZoomFactor);
                        callback(shapePosition.rounded()); // snap to nearest pixel
                        if (!mouseDown) draggingNode = false; // stop dragging on mouse up

                    } else if (mouseDown && !draggingNode && this.closeToMouse) {
                        draggingNode = this;
                    }

                    this.handleShape.position = this.position;
                },
                draw() {
                    if (this.closeToMouse) {
                        this.handleShape.fillColor = '#58cf';
                    } else {
                        this.handleShape.fillColor = '#58c8';
                    }
                    this.handleShape.draw(editorScreen.getContext());
                }
            };
            node.update();
            currentNodes.push(node);
        }

        if (draggingNode) {
            draggingNode.update();

        } else if (shape?.type === 'Rectangle') {
            // Top left corner
            const originalBR = shape.position.add(shape.size);
            createNode(shape.position, (pos) => {
                shape.position = pos;
                shape.size = originalBR.subtract(pos);
            });
            // Bottom right corner
            createNode(shape.position.add(shape.size), (pos) => {
                shape.size = pos.subtract(shape.position);
            });
            // Center
            createNode(shape.position.add(shape.size.multiply(1/2)), (pos) => {
                shape.position = pos.subtract(shape.size.multiply(1/2));
            });
        } else if (shape?.type === 'Circle') {
            // Center
            createNode(shape.position, (pos) => {
                shape.position = pos;
            });
            // Radius
            createNode(shape.position.add({x: shape.radius, y: 0}), (pos) => {
                shape.radius = Math.max(1, pos.subtract(shape.position).x);
            });
        } else if (shape?.type === 'Polygon') {
            // Vertices
            for (const point of shape.points) {
                const index = shape.points.indexOf(point);
                createNode(point, (pos) => {
                    shape.points[index] = pos;
                });
            }

            if (editorScreen.mouse.eventJustHappened("doubleclick")) {
                const shapeMousePos = mousePos.multiply(1/canvasZoomFactor);

                editorScreen.mouse.clearRecentEvents();
                let nearestPointIndex = 0;
                let nearestPointDistance = Infinity;
                for (const point of shape.points) {
                    const distance = shapeMousePos.distanceTo(point);
                    if (distance < nearestPointDistance) {
                        nearestPointIndex = shape.points.indexOf(point);
                        nearestPointDistance = distance;
                    }
                }
                // If the cursor is hovering over the point
                // then remove the point
                if (nearestPointDistance*canvasZoomFactor < nodeDragDistance) {
                    shape.points.splice(nearestPointIndex, 1);
                    console.log(shape.points);
                } else {
                    // If not hovering a point, add another point
                    // on the nearest segment
                    let nearestSegmentIndex = 0;
                    let nearestSegmentDistance = Infinity;
                    for (const segment of shape.segments) {
                        const distance = shapeMousePos.distanceTo(segment.a, segment.b);
                        if (distance < nearestSegmentDistance) {
                            nearestSegmentIndex = shape.segments.indexOf(segment);
                            nearestSegmentDistance = distance;
                        }
                    }
                    console.log(shape.points, shape.segments, nearestPointIndex, nearestSegmentIndex);
                    shape.points.splice(nearestSegmentIndex+1, 0, shapeMousePos);
                }
            }
        }
    });
    editScene.onDraw(() => {
        editorScreen.clear();
        const selTilePos = tileList.selectedTile();
        const previewTile = tileset.getTile(selTilePos.x, selTilePos.y);
        previewSprite.setImage(previewTile);
        previewSprite.draw();

        const shape = previewTile.tileData.collisionShape;
        const ctx = editorScreen.getContext();
        if (shape) {
            ctx.scale(canvasZoomFactor, canvasZoomFactor);
            shape.draw(ctx);
            ctx.scale(1/canvasZoomFactor, 1/canvasZoomFactor);
        }

        for (const node of currentNodes) {
            node.draw();
        };
    });
}
engineEvents.listen('edit tileset collisions', (_event, tileset) => editTilesetCollisions(tileset));

const editAnimation = (anim) => {
    setupOpenEditor(anim);

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
        <button id="vi-pause-anim" style="display:none;"><img src="images/pause.svg" aria-label="Pause"></button>
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

        stopButton.click();
    });

    const playButton = controls.querySelector('#vi-play-anim');
    playButton.addEventListener('click', () => {
        if (previewEl) previewAnimator.play('preview');
        else {
            visualLog('Please select an object to preview.', 'warn', 'animation editor');
        }
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
        if (!previewAnimator.currentAnimation) {
            // Prevent 'no animation playing' error
            playButton.click();
        }
        if (previewAnimator.animationProgress === anim.options.duration) {
            // Prevent double-step after looping back to the end
            // Normally, this wouldn't happen, but since we're stepping
            // by the exact frame duration, it does.
            // previewAnimator.animationProgress -= anim.options.frameDuration;
        }
        previewAnimator.animationProgress -= anim.options.frameDuration;
        // Trick it into updating without advancing the animation
        previewAnimator.resume();
        previewAnimator.update(0);
        previewAnimator.pause();
    });
    document.querySelector('#vi-step-anim-forward').addEventListener('click', () => {
        if (!previewAnimator.currentAnimation) {
            stopButton.click();
        } else {
            previewAnimator.animationProgress += anim.options.frameDuration;
        }
        previewAnimator.resume();
        previewAnimator.update(0);
        previewAnimator.pause();
        if (!previewAnimator.currentAnimation) {
            // loop back to the beginning
            stopButton.click();
        }
    });
    const stopButton = document.querySelector('#vi-stop-anim');
    stopButton.addEventListener('click', () => {
        previewAnimator.stop();
        playButton.click();
        // This nonsense, so that stopping resets it to the first frame
        // rather than actually stopping it.
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

                if (previewAnimator.currentAnimation) {
                    const time = previewAnimator.animationProgress;
                    const frame = anim.getFrameNumberAt(time);
                    lastActiveFrameEl?.classList.remove('active')
                    lastActiveFrameEl = frameListEls.headerRow.querySelector(`th:nth-child(${frame + 3})`);
                    lastActiveFrameEl?.classList.add('active');
                }

                if (previewAnimator.playing) {
                    document.querySelector('#vi-play-anim').style.display = 'none';
                    document.querySelector('#vi-pause-anim').style.display = '';
                } else {
                    document.querySelector('#vi-play-anim').style.display = '';
                    document.querySelector('#vi-pause-anim').style.display = 'none';
                }
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
    for (const objName of engineTypes.list(engineState.objects, ['Tilemap', 'Tileset', 'Animation'])) {
        const type = objName.split('::')[0];
        const name = objName.split('::')[1];
        console.log(type, name);
        engineState.objects[type][name].__engine_editing = false;
    }
    engineEvents.emit('refresh objects list');
    const defaultScreen = Object.values(engineState.objects['Screen'])[0];
    editorScreen.setSize(defaultScreen.getSize());
    editorScreen.setScene(previewScene);
}
engineEvents.listen('clear visual editor', () => clearVisualEditor());
