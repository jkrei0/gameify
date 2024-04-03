import { gameify } from '/gameify/gameify.js';

let toolStartPos = false;

export const tilemapTools = {
    brush: (position, action, applyAction, applyLast) => {
        toolStartPos = false;

        const inputValue = Number(document.querySelector('#vi-brush-size').value);
        const brushToolRadius = (inputValue+1)/2;

        // Create a circle around the mouse
        for (let tx = position.x - brushToolRadius; tx <= position.x + brushToolRadius; tx++) {
            for (let ty = position.y - brushToolRadius; ty <= position.y + brushToolRadius; ty++) {
                if (new gameify.Vector2d(tx, ty).distanceTo(position) < brushToolRadius-.5) {
                    applyAction(Math.round(tx), Math.round(ty));
                }
            }
        }
    },
    draggableTool: (position, action, applyAction, applyLast, applyPreview, iterFunction) => {
        if (!toolStartPos && action !== 'none') {
            // Start the line
            toolStartPos = position.copy();

        } else if (toolStartPos && action === 'none') {
            // Mouse up, end the line
            iterFunction(toolStartPos.x, toolStartPos.y, position.x, position.y, (x, y) => {
                applyLast(x, y);
            });
            toolStartPos = false;
            return;

        } else if (action === 'none') {
            // Line isn't started, mouse is up, do nothing
            toolStartPos = false;
        }

        // Always show a preview at the mouse position
        applyPreview(position.x, position.y);

        iterFunction(toolStartPos.x, toolStartPos.y, position.x, position.y, (x, y) => {
            applyPreview(x, y);
        });
    },
    line: (position, action, applyAction, applyLast, applyPreview) => {
        tilemapTools.draggableTool(position, action, applyAction, applyLast, applyPreview, raytrace);
    },
    rectangle: (position, action, applyAction, applyLast, applyPreview) => {
        tilemapTools.draggableTool(position, action, applyAction, applyLast, applyPreview, (x0, y0, x1, y1, callback) => {
            // fill the rectangle
            for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
                for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
                    callback(x, y);
                }
            }
        });
    }
}

function raytrace(x0, y0, x1, y1, callback) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let x = x0;
    let y = y0;
    let n = 1 + dx + dy;
    let x_inc = (x1 > x0) ? 1 : -1;
    let y_inc = (y1 > y0) ? 1 : -1;
    let error = dx - dy;
    dx *= 2;
    dy *= 2;

    for (; n > 0; --n) {
        callback(x, y);

        if (error > 0) {
            x += x_inc;
            error -= dy;
        } else {
            y += y_inc;
            error += dx;
        }
    }
}