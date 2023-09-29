import { gameify } from '/gameify/gameify.js';
import { engineUI } from '/engine/engine_ui.js';
import { engineEvents } from '/engine/engine_events.js';

function list(objects, types) {
    const array = [];
    for (let type of types) {
        for (let name in objects[type]) {
            array.push(type + '::' + name);
        }
    }
    return array;
}

export const engineTypes = {
    get: (type, prop) => {
        if (!engineTypes.types[type]) {
            throw 'Unknown type ' + type;
        }
        if (engineTypes.types[type][prop]) {
            return engineTypes.types[type][prop];
        } else if (engineTypes.types.None[prop]) {
            return engineTypes.types.None[prop];
        } else {
            throw 'Cannot find ' + type + '.' + prop;
        }
    },
    types: {
        'None': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-box" viewBox="0 0 16 16">
                <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
            </svg>`,
            buildUI: (parent, obj) => {
                parent.appendChild(engineUI.labelItem('No options available'));
            },
            newObject: (screen) => {
                return undefined;
            }
        },
        'Tileset': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-grid-3x3" viewBox="0 0 16 16">
                <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V5h4V1H1.5zM5 6H1v4h4V6zm1 4h4V6H6v4zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5v-4zm1 0v4h4v-4H6zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11h-4zm0-1h4V6h-4v4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11v4zm-1 0V1H6v4h4z"/>
            </svg>`,
            buildUI: (parent, obj) => {
                parent.appendChild(engineUI.twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = Number(x);
                    obj.theight = Number(y);
                })[0]);
                parent.appendChild(engineUI.inputItem('File', obj.path, 'text', (v) => {
                    obj.path = v;
                })[0]);
                parent.appendChild(engineUI.inputItem('Upload', undefined, 'file', (files) => {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.addEventListener('load', () => {
                        const dataUrl = reader.result;
                        // just make a new image, so it loads the file
                        obj.changePath(dataUrl);
                        engineEvents.emit('refresh objects list');
                    });
                    reader.readAsDataURL(file);

                })[0]);
                parent.appendChild(engineUI.imageItem('Preview', obj.path)[0]);
            },
            newObject: (_screen) => {
                return new gameify.Tileset('path/to/image.png', 64, 64);
            }
        },
        'Tilemap': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-map" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z"/>
            </svg>`,
            buildUI: (parent, obj, objects) => {
                parent.appendChild(engineUI.labelItem('Edit map', 'Edit', () => {
                    if (!obj.tileset) {
                        visualLog('You need to add a tileset before you can edit the map', 'error', obj.__engine_name);
                        return;
                    }
                    if (obj.__engine_editing) engineEvents.emit('clear visual editor');
                    else engineEvents.emit('edit tilemap', obj);
                }));
                parent.appendChild(engineUI.twoInputItem('Tile Size', [obj.twidth, obj.theight], 'number', (x, y) => {
                    obj.twidth  = Number(x);
                    obj.theight = Number(y);
                })[0]);
                parent.appendChild(engineUI.selectItem('Tileset', list(objects, ['Tileset']), (v) => {
                    obj.setTileset(objects[v.split('::')[0]][v.split('::')[1]]);
                }, obj.tileset?.__engine_name)[0]);
                parent.appendChild(engineUI.selectItem('Screen', list(objects, ['Screen']), (v) => {
                    // Screen.add(obj)
                    objects[v.split('::')[0]][v.split('::')[1]].add(obj);
                }, obj.parent?.__engine_name)[0]);
            },
            newObject: (screen) => {
                const obj = new gameify.Tilemap(64, 64, 0, 0);
                screen.add(obj);
                return obj;
            }
        },
        'Scene': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
            </svg>`,
            buildUI: (parent, obj, objects) => {
                parent.appendChild(engineUI.selectItem('Screen', list(objects, ['Screen']), (v) => {
                    obj.parent = objects[v.split('::')[0]][v.split('::')[1]];
                }, obj.parent?.__engine_name)[0]);
            },
            newObject: (screen) => {
                return new gameify.Scene(null);
            }
        },
        'Screen': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-display" viewBox="0 0 16 16">
                <path d="M0 4s0-2 2-2h12s2 0 2 2v6s0 2-2 2h-4c0 .667.083 1.167.25 1.5H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h.75c.167-.333.25-.833.25-1.5H2s-2 0-2-2V4zm1.398-.855a.758.758 0 0 0-.254.302A1.46 1.46 0 0 0 1 4.01V10c0 .325.078.502.145.602.07.105.17.188.302.254a1.464 1.464 0 0 0 .538.143L2.01 11H14c.325 0 .502-.078.602-.145a.758.758 0 0 0 .254-.302 1.464 1.464 0 0 0 .143-.538L15 9.99V4c0-.325-.078-.502-.145-.602a.757.757 0 0 0-.302-.254A1.46 1.46 0 0 0 13.99 3H2c-.325 0-.502.078-.602.145z"/>
            </svg>`,
            buildUI: (parent, obj, objects) => {
                parent.appendChild(engineUI.inputItem('Canvas', obj.element.id, 'text', (v) => {
                    obj.element = document.getElementById(obj.element.id);
                })[0]);
                parent.appendChild(engineUI.twoInputItem('Size',  [obj.width, obj.height], 'number', (x, y) => {
                    obj.setSize(x, y);
                })[0]);
                parent.appendChild(engineUI.selectItem('Start Scene', list(objects, ['Scene']), (v) => {
                    obj.setScene(objects[v.split('::')[0]][v.split('::')[1]]);
                }, obj.currentScene?.__engine_name)[0]);

                parent.appendChild(engineUI.selectItem('Antialiasing', ['On', 'Off'], (v) => {
                    obj.setAntialiasing(v === 'On');
                }, obj.getAntialiasing() ? 'On' : 'Off')[0]);
            }
        },
        'Image': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16">
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
            </svg>`,
            buildUI: (parent, obj) => {
                let path = obj.path;
                if (path.startsWith('data:')) {
                    path = '[Uploaded file]';
                }

                parent.appendChild(engineUI.inputItem('Path', path, 'text', (v) => {
                    // Prevent accidental changes to uploaded files
                    if (path !== obj.path && !confirm(`Overwrite uploaded file? You can't undo this!`)) {
                        engineEvents.emit('refresh objects list');
                        return;
                    }
                    obj.changePath(v);
                    engineEvents.emit('refresh objects list');
                })[0]);
                parent.appendChild(engineUI.inputItem('Upload', undefined, 'file', (files) => {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.addEventListener('load', () => {
                        const dataUrl = reader.result;
                        // just make a new image, so it loads the file
                        obj.changePath(dataUrl);
                        engineEvents.emit('refresh objects list');
                    });
                    reader.readAsDataURL(file);

                })[0]);
                parent.appendChild(engineUI.imageItem('Preview', obj.path)[0]);

                parent.appendChild(engineUI.inputItem('Crop', obj.getCrop().cropped, 'checkbox', (v) => {
                    console.log('Crop set', v)
                    if (v === false) {
                        obj.uncrop();
                    } else if (v === true) {
                        const pc = obj.getCrop();
                        obj.crop(pc.x, pc.y, pc.width, pc.height);

                    } else console.error('Checkbox value is', v);
                })[0]);
                parent.appendChild(engineUI.twoInputItem('Crop XY',  [obj.getCrop().x, obj.getCrop().y], 'number', (x, y) => {
                    console.log('Crop XY', x, y);
                    obj.crop(x, y, obj.getCrop().width || 0, obj.getCrop().height || 0);
                })[0]);
                parent.appendChild(engineUI.twoInputItem('Crop WH',  [obj.getCrop().width, obj.getCrop().height], 'number', (x, y) => {
                    console.log('Crop WH', x, y);
                    obj.crop(obj.getCrop().x || 0, obj.getCrop().y || 0, x, y);
                })[0]);
            },
            newObject: (_screen) => {
                return new gameify.Image('path/to/image.png');
            }
        },
        'audio.Sound': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-music-note" viewBox="0 0 16 16">
                <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"/>
                <path fill-rule="evenodd" d="M9 3v10H8V3h1z"/>
                <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"/>
            </svg>`,
            buildUI: (parent, obj) => {
                let path = obj.path;
                if (path.startsWith('data:')) {
                    path = '[Uploaded file]';
                }

                parent.appendChild(engineUI.inputItem('Path', path, 'text', (v) => {
                    // Prevent accidental changes to uploaded files
                    if (path !== obj.path && !confirm(`Overwrite uploaded file? You can't undo this!`)) {
                        engineEvents.emit('refresh objects list');
                        return;
                    }
                    obj.changePath(v);
                    engineEvents.emit('refresh objects list');
                })[0]);
                parent.appendChild(engineUI.inputItem('Upload', undefined, 'file', (files) => {
                    const file = files[0];

                    let reader = new FileReader();
                    reader.addEventListener('load', (e) => {
                        const dataUrl = reader.result;
                        obj.changePath(dataUrl);
                        engineEvents.emit('refresh objects list');
                    });
                    reader.readAsDataURL(file);

                })[0]);
                parent.appendChild(engineUI.inputItem('Volume', obj.getVolume()*100, 'number', (v) => {
                    obj.setVolume(v/100);
                })[0]);
                parent.appendChild(engineUI.selectItem('Loop', ['On', 'Off'], (v) => {
                    obj.setLoop(v === 'On');
                }, obj.getLoop() ? 'On' : 'Off')[0]);

                parent.appendChild(engineUI.audioItem('Preview', obj.path)[0]);
            },
            newObject: (screen) => {
                const obj = new gameify.audio.Sound('path/to/sound.mp3');
                screen.audio.add(obj);
                return obj;
            }
        },
        'Sprite': {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
            </svg>`,
            buildUI: (parent, obj, objects) => {

                parent.appendChild(engineUI.selectItem('Image', list(objects, ['Image', 'Tileset']), (v) => {
                    if (v.split('::')[0] === 'Image') {
                        obj.setImage(objects[v.split('::')[0]][v.split('::')[1]]);
                    } else if (v.split('::')[0] === 'Tileset') {
                        const tileset = objects[v.split('::')[0]][v.split('::')[1]];
                        obj.setImage(tileset.getTile(tileX.value, tileY.value));
                        // Nothing special about this format,
                        // But that it identifies a derived image
                        // The name after the :: has no special meaning
                        obj.image.__engine_name = `Tileset/Image::Sprite ${obj.__engine_name}`;
                    }
                    updateTSPos();
                }, obj.image?.__engine_name || obj.image?.tileData.tileset?.__engine_name)[0]);

                const [tileLabel, tileX, tileY] = engineUI.twoInputItem('Tile',  [0, 0], 'number', (x, y) => {
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
                parent.appendChild(tileLabel);

                parent.appendChild(engineUI.twoInputItem('Position',  [obj.position.x, obj.position.y], 'number', (x, y) => {
                    obj.position.x = Number(x);
                    obj.position.y = Number(y);
                })[0]);
                parent.appendChild(engineUI.inputItem('Scale', obj.scale, 'number', (v) => {
                    obj.scale = Number(v);
                })[0]);
                parent.appendChild(engineUI.selectItem('Screen', list(objects, ['Screen']), (v) => {
                    // Screen.add(obj)
                    objects[v.split('::')[0]][v.split('::')[1]].add(obj);
                }, obj.parent?.__engine_name)[0]);
            },
            newObject: (screen) => {
                const obj = new gameify.Sprite(0, 0, undefined);
                screen.add(obj);
                return obj;
            }
        }
    }
}