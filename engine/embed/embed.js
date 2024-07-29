
const gameFrame = document.querySelector('#game-frame');
const frameWindow = gameFrame.contentWindow;
// generate an id for each window, so the serviceWorker can keep track of each game
const windowRandomId = Math.floor(Math.random()*10000);

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1]?.replaceAll('%20', ' ');

const originURL = /* REPLACE=originURL */'http://localhost:3000'/* END */;

/** Show the message in the box in the center of the screen and set it's text */
const setMessageBoxText = (title, message) => {
    document.querySelector('#loading-indicator').style.display = '';
    document.querySelector('#loading-text-short').innerText = title;
    document.querySelector('#loading-text-long').innerHTML = message;
}

if (!accountName || !gameTitle) {
    setMessageBoxText('Invalid Link', `Missing project or account name.`);
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

    /* Register serviceworker from within the iframe */

    if (!("serviceWorker" in frameWindow.navigator)) {
        console.warn('Browser does not support serviceworker!');
        setMessageBoxText(
            'Unsupported Browser',
            `Y U still using Internet Explorer? Update your browser.<br>
            (navigator.serviceWorker not found)`
        );
        return;
    }

    /* Check if the serviceworker is activated, and start the game once it's good. */
    const checkWorker = (worker) => {
        if (worker.state !== 'activated') return;

        // ALWAYS send data BEFORE reloading the page
        worker.postMessage(JSON.stringify({
            randomId: windowRandomId,
            files: files
        }));

        frameWindow.location.href = '/_gamefiles/' + windowRandomId + '/index.html';
        document.querySelector('#loading-indicator').style.display = 'none';
    }

    /*  */
    frameWindow.navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('sw message:', event.data);
        if (!event.data.type === 'message') return;

        if (event.data.message === 'sw missing gameData') {
            console.error('No gameData!');
            setMessageBoxText('Loading Error', 'Gamedata error (out-of-order).<br>Please reload or stop/restart the game');
        }
    });

    frameWindow.navigator.serviceWorker.register('serviceworker.js').then((reg) => {
        let serviceWorker;
        // Because I can't just *have* the serviceworker  :/
        // So we look for it.
        if (reg.installing) {
            serviceWorker = reg.installing;
        } else if (reg.waiting) {
            serviceWorker = reg.waiting;
        } else if (reg.active) {
            serviceWorker = reg.active;
        }
        if (serviceWorker) {
            checkWorker(serviceWorker);
            serviceWorker.addEventListener("statechange", (_e) => {
                checkWorker(serviceWorker);
            });
        }
    
    }).catch(function(err){
        console.error('ServiceWorker registration failed!', err);
        setMessageBoxText('Loading Error', 'Failed to register serviceworker.<br>Please reload or stop/restart the game');
    });

}

window.addEventListener('message', (event) => {
    if (!event.data.gameData || !event.data.type === 'gameData') return;
    // We don't care where the origin is, so don't bother checking. If another page embeds this, it's fine.
    
    setGameData(event.data.gameData);
});
window.addEventListener('message', (event) => {
    if (event.data.type !== 'consoleHook') return;
    addConsoleHook(event.data.consoleHook);
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

let useConsoleHook = localStorage.getItem('useConsoleHook') === 'true';
window.parent.postMessage({ type: 'consoleHook', consoleHook: useConsoleHook }, '*');
let currentConsoleHook = undefined;
const addConsoleHook = async (enable) => {
    useConsoleHook = enable ?? useConsoleHook;
    localStorage.setItem('useConsoleHook', useConsoleHook);
    if (!useConsoleHook) {
        if (currentConsoleHook) {
            gameFrame.contentWindow.console = currentConsoleHook;
        }
        return;
    }

    const newConsole = (function (oldConsole) {
        currentConsoleHook = oldConsole;

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