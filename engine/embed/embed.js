
const gameFrame = document.querySelector('#game-frame');
const frameWindow = gameFrame.contentWindow;
// generate an id for each window, so the serviceWorker can keep track of each game
const windowRandomId = Math.floor(Math.random()*10000);

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1]?.replaceAll('%20', ' ');

const originURL = /* REPLACE=originURL */'http://localhost:3000'/* END */;

if (!accountName || !gameTitle) {
    document.querySelector('#loading-text-short').innerText = 'Invalid link';
    document.querySelector('#loading-text-long').innerHTML = `Missing project or account name.`;
}

window.addEventListener('hashchange', () => {
    window.location.reload();
});

let gameData = {};

const replaceImportPaths = (file) => {
    // replace imports that 
    return file.replaceAll(/import.*?from ('|"|`)(?!https?:\/\/)/g, (match) => {
        return match + '/_gamefiles/' + windowRandomId + '/';
    }).replaceAll(/(src|href)=('|"|`)(?!https?:\/\/)/g, (match) => {
        return match + '/_gamefiles/' + windowRandomId + '/';
    });
}

const setGameData = (data) => {
    gameData = data;

    const files = gameData.files;
    for (const file in files) {
        files[file] = replaceImportPaths(files[file]);
    }

    window.addEventListener('message', (event) => {
        if (!event.data.type === 'message') return;

        if (event.data.message === 'ready for files') {
            console.log(files['index.html']);
            frameWindow.location.href = '/_gamefiles/' + windowRandomId + '/index.html';
            document.querySelector('#loading-indicator').style.display = 'none';
        } else if (event.data.message === 'serviceworker error') {
            document.querySelector('#loading-text-short').innerText = 'Loading error';
            document.querySelector('#loading-text-long').innerText = 'Failed to register serviceworker.<br>Please reload or stop/restart the game';
        } else if (event.data.message === 'sw missing gameData') {
            document.querySelector('#loading-indicator').style.display = '';
            document.querySelector('#loading-text-short').innerText = 'Loading error';
            document.querySelector('#loading-text-long').innerText = 'Gamedata error (out-of-order).<br>Please reload or stop/restart the game';
        }
    });

    const workerScript = document.createElement('script');
    workerScript.innerHTML = `
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register('serviceworker.js').then(function(reg){
                if (reg.active) {
                    reg.active.postMessage(JSON.stringify({
                        randomId: ${windowRandomId},
                        files: ${JSON.stringify(files)}
                    }));
                    navigator.serviceWorker.addEventListener("message", (event) => {
                        // foreward messages
                        parent.postMessage(event.data, '*');
                    });
                    parent.postMessage({'type': 'message', message: 'ready for files'}, '*');
                } else {
                    parent.postMessage({'type': 'message', message: 'serviceworker error'}, '*');
                    console.log(reg);
                }
            })
            .catch(function(err){
                parent.postMessage({'type': 'message', message: 'serviceworker error'}, '*');
                console.log('registration failed: ' + err);
            });
        } else {
            parent.postMessage({'type': 'message', message: 'serviceworker error'}, '*');
            console.log('no serviceworker');
        }
    `;
    frameWindow.document.body.appendChild(workerScript);

}

window.addEventListener('message', (event) => {
    if (!event.data.gameData || !event.data.type === 'gameData') return;
    // We don't care where the origin is, so don't bother checking. If another page embeds this, it's fine.
    
    setGameData(event.data.gameData);
});

// don't bother looking for nothing
if (accountName && gameTitle) fetch(originURL + `/api/games-store/load-game`, {
    method: 'POST',
    body: JSON.stringify({
        // no session key needed for loading
        username: accountName,
        title: gameTitle,
    })
}).then(res=>res.json()).then(result => {
    if (result.error) {
        // capitalize first letter
        document.querySelector('#loading-text-short').innerText = result.error.charAt(0).toUpperCase() + result.error.slice(1);
        document.querySelector('#loading-text-long').innerText = 'There was an error loading this project. Make sure the URL is correct.';
        return;
    }

    setGameData(result.data);
});

gameFrame.addEventListener('load', () => {
    if(frameWindow.location.href === 'about:blank') {
        console.warn('Not loading, about:blank!');
        return;
    }

    addConsoleHook();
    frameWindow.__s_objects = gameData.objects;
    if (frameWindow.__set_s_objects) frameWindow.__set_s_objects();
});

const addConsoleHook = async () => {
    const newConsole = (function (oldConsole) {
        // Pass logs to parent window
        const log = (t, args, q = {}, pe) => {
            const error = pe || new Error().stack.split('\n')[2];
            const split = error.split(':');

            let message = q ? args : args.map(a => JSON.stringify(a)).join(', ');

            oldConsole.log(...args, q);

            try {
                window.parent.postMessage({
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
                window.parent.postMessage({
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

        return {
            log: (...args) => { log('log', args); },
            info: (...args) => { log('info', args); },
            debug: (...args) => { log('debug', args); },
            warn: (...args) => { log('warn', args); },
            error: (...args) => {
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
        }
    })(gameFrame.contentWindow.console);

    gameFrame.contentWindow.console = newConsole;
}