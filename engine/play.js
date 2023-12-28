
const embedURL = /* REPLACE=embedURL */'http://localhost:3001'/* END */;

const gameFrame = document.querySelector('#game-frame');
const gameWindow = gameFrame.contentWindow;
gameWindow.location.href = embedURL + '/embed.html' + window.location.hash;

const accountName = window.location.hash.split('/')[0].replace('#', '');
const gameTitle = window.location.hash.split('/')[1];

if (accountName && gameTitle) {
    document.querySelector('#project-name').innerText = accountName + '/' + gameTitle;
    document.querySelector('#open-editor-button').onclick = () => {
        window.location.href = `/engine/engine.html#${accountName}/${gameTitle}`;
    }

} else {
    document.querySelector('#project-name').innerText = 'No open project';
}