
const gameFrame = document.querySelector('#game-frame');
const win = gameFrame.contentWindow;

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1];

const originURL = /* REPLACE=originURL */'https://gameify.vercel.app'/* END */;

if (!accountName || !gameTitle) {
    document.querySelector('#loading-text-short').innerText = 'Invalid link';
    document.querySelector('#loading-text-long').innerHTML = `Missing project or account name.`;
}

window.addEventListener('hashchange', () => {
    window.location.reload();
});

let gameData = {};


window.addEventListener('message', (event) => {
    // We don't care where the origin is, so don't bother checking. If another page embeds this, it's fine.
    gameData = event.data;

    win.location.href = "/game.html";
});

// don't bother looking for nothing
if (accountName && gameTitle) fetch(originURL + `/api/games-store/load-game`, {
    method: 'POST',
    body: JSON.stringify({
        // no session key needed for loading
        username: accountName,
        title: gameTitle
    })
}).then(res=>res.json()).then(result => {
    if (result.error) {
        // capitalize first letter
        document.querySelector('#loading-text-short').innerText = result.error.charAt(0).toUpperCase() + result.error.slice(1);
        document.querySelector('#loading-text-long').innerText = 'There was an error loading this project. Make sure the URL is correct.';
    }

    gameData = result.data;

    win.location.href = "/game.html";
});

const replaceImportPaths = (file) => {
    return file.replaceAll(`from '/gameify/`, `from '` + originURL + `/gameify/`)
               .replaceAll(`from './_out.js'`, `from '` + originURL + `/engine/project/_out.js'`);
}

gameFrame.addEventListener('load', () => {

    if(win.location.href === 'about:blank') return
    if(win.document.body.innerHTML !== 'Gameify!') {
        document.querySelector('#loading-text-short').innerText = 'Loading error';
        document.querySelector('#loading-text-long').innerText = 'Could not load /game.html!';
        return;
    }

    addConsoleHook();

    // Add scripts
    const html = win.document.querySelector('html');
    html.innerHTML = `<!DOCTYPE html><head>
            <title>A Game</title>
        </head>
        <body>
            <div>
                <canvas id="game-canvas"></canvas>
            </div>
        </body>`;
    
    win.__s_objects = gameData.objects;

    const files = gameData.files;
    for (const file in files) {
        if (file.endsWith('.js')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = replaceImportPaths(files[file]);
            win.document.body.appendChild(script);

        } else if (file.endsWith('.css')) {
            const style = document.createElement('style');
            style.innerHTML = files[file];
            win.document.head.appendChild(style);

        }
    }
    document.querySelector('#loading-indicator').style.display = 'none';
});

const addConsoleHook = async () => {
    const newConsole = (function (oldConsole) {
        // Pass logs to parent window
        const log = (t, args, q = {}, pe) => {
            const error = pe || new Error().stack.split('\n')[2];
            const split = error.split(':');

            let message = q ? args : args.map(a => JSON.stringify(a)).join(', ');

            oldConsole.log(...args);

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