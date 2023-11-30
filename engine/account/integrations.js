
const accountName = localStorage.getItem('accountName');

if (!accountName)  {
    window.location.href = '/engine/account.html';
}

/** Connect to server to exchange the code for an access token and complete integration
 * On failure, reloads the page for the user to try again
 * @param {string} code - code from github
 * @param {boolean} reauth - if true, on failure, sends the user back to github
 */
const addGithubIntegration = (code, retry) => {
    // save the code temporarily, in case the user isn't logged in
    localStorage.setItem('githubCode', code);
    document.querySelector('#github-integration-button').innerHTML = 'Linking...';

    fetch('/api/integrations/github-callback', {
        method: 'POST',
        body: JSON.stringify({
            username: accountName,
            code: code,
            sessionKey: localStorage.getItem('accountSessionKey')
        })
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            if (result.error.includes('session')) {
                window.location.href = '/engine/auth.html';
            } else {
                document.querySelector('#github-integration-button').innerHTML = 'An error occurred';
                if (retry) {
                    localStorage.removeItem('githubCode');
                    window.location.href = 'https://github.com/apps/gameify-gh/installations/new/';
                }
            }
        }

        if (result.success) {
            localStorage.removeItem('githubCode');
            document.querySelector('#github-integration-button').innerHTML = 'Github Linked';
        }
    });
}

const githubIntegrationButton = document.querySelector('#github-integration-button');
githubIntegrationButton.onclick = () => {
    window.location.href = 'https://github.com/apps/gameify-gh/installations/new/';
}

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    addGithubIntegration(urlParams.get('code'));

} else if (localStorage.getItem('githubCode')) {
    githubIntegrationButton.onclick = () => {
        addGithubIntegration(localStorage.getItem('githubCode'), /*retry=*/true);
    }
}

console.log(urlParams.get('code'));
