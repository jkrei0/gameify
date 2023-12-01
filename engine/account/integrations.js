
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

const fetchIntegrationStatus = () => {
    fetch('/api/integrations/github-details', {
        method: 'POST',
        body: JSON.stringify({
            username: accountName,
            sessionKey: localStorage.getItem('accountSessionKey')
        })
    })
    .then(res => res.json())
    .then(result => {
        console.log(result);
        if (result.error) {
            if (result.error.includes('session')) {
                window.location.href = '/engine/auth.html';
            }
        }

        if (!result.integration) {
            document.querySelector('#github-integration-button').innerHTML = 'Add Integration';
        } else {
            console.log('listing repos');
            listAvailableRepos();
        }
    });
}
const listAvailableRepos = () => {
    const repoList = document.querySelector('#available-github-repos');
    repoList.style.display = 'block';
    const loadingEl = document.createElement('span');
    loadingEl.classList.add('list-item');
    loadingEl.innerText = 'Loading repos...';
    repoList.appendChild(loadingEl);

    fetch('/api/integrations/github-details', {
        method: 'POST',
        body: JSON.stringify({
            username: accountName,
            sessionKey: localStorage.getItem('accountSessionKey'),
            query: {
                user: true,
                repos: true
            }
        })
    })
    .then(res => res.json())
    .then(result => {
        console.log(result);
        if (result.error) {
            if (result.error.includes('session')) {
                window.location.href = '/engine/auth.html';
            }
            loadingEl.innerHTML = 'Error loading repositories';
        }

        if (result.repos) {
            for (const repo of result.repos) {
                const listItem = document.createElement('span');
                listItem.classList.add('list-item');
                listItem.innerText = repo.full_name;
                repoList.appendChild(listItem);
            }
            loadingEl.remove();
        }

    });
}


const githubIntegrationButton = document.querySelector('#github-integration-button');
githubIntegrationButton.onclick = () => {
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=Iv1.bc0995e7293274ef';
}

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    addGithubIntegration(urlParams.get('code'));

} else if (localStorage.getItem('githubCode')) {
    githubIntegrationButton.onclick = () => {
        addGithubIntegration(localStorage.getItem('githubCode'), /*retry=*/true);
    }
} else {
    // only fetch details if we're not adding an integration
    fetchIntegrationStatus();
}
