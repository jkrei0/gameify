switch(window.location.protocol) {
    case 'http:':
    case 'https:':
      break;
    case 'file:':
      document.body.innerHTML = `
        <h1>Warning</h1>
        <p>Local File Detected. You'll need to run your game on a web server.<br>
        You can do this with <a href="https://www.npmjs.com/package/http-server">http-server</a> if you have NPM.<br>
        Or run <code>python -m http-server</code> in a terminal if you have Python.</p>`
      break;
 }