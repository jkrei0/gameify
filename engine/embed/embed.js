
const gameFrame = document.querySelector('#game-frame');
const win = gameFrame.contentWindow;

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1];

const originURL = 'http://localhost:3000';

if (!accountName || !gameTitle) {
    document.querySelector('#loading-text-short').innerText = 'Invalid link';
    document.querySelector('#loading-text-long').innerHTML = `Missing project or account name.`;
}

window.addEventListener('hashchange', () => {
    window.location.reload();
});

let gameData = {};

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

    // Add scripts
    const html = win.document.querySelector('html');
    html.innerHTML = `<head>
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