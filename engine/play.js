

const embedURL = 'http://localhost:3001/embed.html';

const gameFrame = document.querySelector('#game-frame');
const gameWindow = gameFrame.contentWindow;
gameWindow.location.href = embedURL + window.location.hash;