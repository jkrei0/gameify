let logFunction = () => {};
let notifySessionExpired = () => {};

export const engineFetch = {
    setLogFunction: (fn) => {
        logFunction = fn;
    },
    setSessionFunction: (fn) => {
        notifySessionExpired = fn;
    },
    checkGithubErrors: (result, repo) => {
        if (result.error === 'github unauthorized') {
            logFunction(`Failed to load '${repo}'. To fix this:<br>
                - <a href="https://github.com/login/oauth/authorize?client_id=Iv1.bc0995e7293274ef" target="_blank">Log in to GitHub</a><br>
                - <a href="https://github.com/apps/gameify-gh/installations/new" target="_blank">Check permissions</a><br>
                - Make sure the repo URL is correct`,
            'warn', 'github');
            return true;
    
        } else if (result.error === 'need permissions') {
            logFunction(`Failed to load '${repo}', gameify does not have permission to access it!<br>
                Please <a href="https://github.com/apps/gameify-gh/installations/new" target="_blank">
                   update your github permissions
                </a><br> and try again.<br>`,
            'warn', 'github');
            return true;
        }
        return false;
    },
    checkSessionErrors: (result) => {
        if (result.error === 'session expired'
            || result.error === 'session invalid'
        ) {
            localStorage.removeItem('accountName');
            localStorage.removeItem('accountSessionKey');
            notifySessionExpired();
            return true;
        }
        return false;
    },
    toJson: (res) => {
        try {
            return res.json();
        } catch (e) {
            console.error(e, res);
            return { error: 'malformed response' };
        }
    }
}