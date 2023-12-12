
const embedURL = 'http://gameify-embed.vercel.app/embed.html';

const gameFrame = document.querySelector('#game-frame');
const gameWindow = gameFrame.contentWindow;
gameWindow.location.href = embedURL + window.location.hash;