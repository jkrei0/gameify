
self.addEventListener('fetch', async function (event) {
    const originURL = /* REPLACE=originURL */'http://localhost:3000'/* END */;

    const url = event.request.url;
    console.log('Looking at', url);

    const respondWithUrl = (fetchUrl) => {
        event.respondWith(
            (async () => {
                // Try to get the response from a cache.
                const cachedResponse = await caches.match(fetchUrl);
                if (cachedResponse) return cachedResponse;
                // Else fetch
                return fetch(fetchUrl);
            })(),
        );
    }

    // Grab the _out.js files and gameify files from the main server
    if (url.endsWith('/_out.js')) {
        const fetchUrl = originURL + '/engine/project/_out.js';
        return respondWithUrl(fetchUrl);
    }
    if (url.includes('/gameify/')) {
        const fetchUrl = originURL + '/gameify/' + url.split('/gameify/')[1];
        return respondWithUrl(fetchUrl);
    }

    // Replace game files
    if (url.includes('/_gamefiles/')) {
        console.log('Loading game file', url);
        const randomId = url.split('_gamefiles/')[1].split('/')[0];
        // remove the /_gamefiles/id and any leading path stuff (./ or /)
        const remainingPath = url.replace(/.*\/_gamefiles\/\d{1,5}\//, '').replace(/^(\.*\/)+/, '');

        if (!self.gameFiles?.[randomId]) {
            postMessage({ type: 'message', message: 'sw missing gameData' });
        }

        const fileText = self.gameFiles[randomId][remainingPath];
        // let the game deal with its 404 error if the file doesn't exist
        if (!fileText) return;

        try {
            let mime = '';
            switch (url.split('.').pop()) {
                case 'css': mime = 'text/css'; break;
                case 'html': mime = 'text/html'; break;
                case 'js': mime = 'text/javascript'; break;
                case 'json': mime = 'application/json'; break;
                case 'svg': mime = 'image/svg+xml'; break;
                case 'png': mime = 'image/png'; break;
                case 'jpeg':
                case 'jpg': mime = 'image/jpeg'; break;
                case 'webp': mime = 'image/webp'; break;
                case 'mp3': mime = 'audio/mpeg'; break;
                case 'mp4': mime = 'video/mp4'; break;
                case 'ogg': mime = 'audio/ogg'; break;
                case 'webm': mime = 'video/webm'; break;
                case 'wav': mime = 'audio/wav'; break;
                default: mime = 'text/plain';
            }
            console.log('Responding with game file', mime, url, remainingPath);
            // We found the file, return it
            const blob = new Blob([fileText], { type: mime });
            const response = new Response(blob, { headers: { contentType: mime }});
            event.respondWith(response);
        } catch (e) {
            console.warn(e);
        }
        return;
    }
});

self.addEventListener('message', function(event){
    var data = JSON.parse(event.data);
    console.log("Received game data:", data, self.gameFiles);
    if (!self.gameFiles) self.gameFiles = {};
    self.gameFiles[data.randomId] = data.files;
});