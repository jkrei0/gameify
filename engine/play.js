
import { serializeObjectsList } from '/engine/serialize.js';

const gameFrame = document.querySelector('#game-frame');
const win = gameFrame.contentWindow;

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1];

if (accountName && gameTitle) {
    document.querySelector('#project-name').innerText = accountName + '/' + gameTitle;

} else {
    document.querySelector('#project-name').innerText = 'No open project';
    document.querySelector('#loading-text-short').innerText = 'Invalid link';
    document.querySelector('#loading-text-long').innerHTML = `
        Project name and/or account name is missing.<br>
        The URL should look like:<br>
        <code>${window.location.host}/engine/play.html#accountName/gameTitle</code>
        `;

}

window.addEventListener('hashchange', () => {
    window.location.reload();
});

let gameData = {};

// don't bother looking for nothing
if (accountName && gameTitle) fetch(`/api/games-store/load-game.js`, {
    method: 'POST',
    body: JSON.stringify({
        // no session key needed for loading
        username: accountName,
        title: gameTitle
    })
}).then(res => res.json()).then(result => {
    if (result.error) {
        // capitalize first letter
        document.querySelector('#loading-text-short').innerText = result.error.charAt(0).toUpperCase() + result.error.slice(1);;
        document.querySelector('#loading-text-long').innerText = 'There was an error loading this project. Make sure the URL is correct.';
    }

    gameData = result.data;

    win.location.href = "/engine/project/;";
});


gameFrame.addEventListener('load', () => {

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

    console.info('GAME START (loading scripts)');
    
    win.__s_objects = gameData.objects;

    const files = gameData.files;
    for (const file in files) {
        if (file.endsWith('.js')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = files[file];
            win.document.body.appendChild(script);

        } else if (file.endsWith('.css')) {
            const style = document.createElement('style');
            style.innerHTML = files[file];
            win.document.head.appendChild(style);

        }
    }

    document.querySelector('#loading-indicator').style.display = 'none';
});