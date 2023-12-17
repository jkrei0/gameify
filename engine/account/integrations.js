
import { engineFetch } from '/engine/engine_fetch.js';
engineFetch.setSessionFunction(() => {
    window.location.href = '/engine/auth.html';
});

const accountName = localStorage.getItem('accountName');

if (!accountName)  {
    window.location.href = '/engine/auth.html';
}

const githubIntegrationLink = 'https://github.com/login/oauth/authorize?client_id=Iv1.bc0995e7293274ef';
const githubAppLink = 'https://github.com/apps/gameify-gh/installations/new';

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
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            if (result.error.includes('session')) {
                engineFetch.checkSessionErrors(result);
            } else {
                document.querySelector('#github-integration-button').innerHTML = 'An error occurred';
                if (retry) {
                    localStorage.removeItem('githubCode');
                    window.location.href = githubIntegrationLink;
                }
            }
        }

        if (result.success) {
            localStorage.removeItem('githubCode');
            document.querySelector('#github-integration-button').innerHTML = 'Github Linked';
            listAvailableRepos();
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
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            engineFetch.checkSessionErrors(result);
        }

        if (!result.integration) {
            document.querySelector('#github-integration-button').innerHTML = 'Add Integration';
        } else {
            document.querySelector('#github-integration-button').innerHTML = 'Manage';
            document.querySelector('#github-integration-button').onclick = () => {
                window.location.href = githubAppLink;
            }
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
    .then(engineFetch.toJson)
    .then(result => {
        if (result.error) {
            engineFetch.checkSessionErrors(result);
            loadingEl.innerHTML = 'Error loading repositories';
        }

        const maxRepos = 10;

        const searchItem = document.createElement('input');
        searchItem.classList.add('list-item');
        searchItem.classList.add('property');
        searchItem.style.maxWidth = '100%';
        searchItem.placeholder = 'Search repositories...';
        searchItem.oninput = () => {
            let count = 0;
            if (searchItem.value === '') {
                repoList.querySelectorAll('button').forEach(item => {
                    count += 1;
                    if (count <= maxRepos) item.style.display = '';
                    else item.style.display = 'none';
                });
                loadingEl.innerText = `Showing ${Math.min(count, maxRepos)} of ${result.repos.length}`;
                return;
            }

            repoList.querySelectorAll('button').forEach(item => {
                if (item.innerText.includes(searchItem.value)) {
                    count += 1;
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
            loadingEl.innerText = `Showing ${count} of ${result.repos.length}`;
        }
        repoList.appendChild(searchItem);


        if (result.repos) {
            let count = 0;
            for (const repo of result.repos) {
                count += 1;
                const listItem = document.createElement('button');
                listItem.onclick = () => {
                    window.location.href = '/engine/engine.html#github:' + repo.full_name;
                }
                listItem.classList.add('list-item');
                listItem.classList.add('property');
                listItem.classList.add('no-margin');
                listItem.innerText = repo.full_name;
                if (count > maxRepos) {
                    listItem.style.display = 'none';
                }
                repoList.appendChild(listItem);
            }
            loadingEl.innerText = `Showing ${Math.min(result.repos.length, maxRepos)} of ${result.repos.length}`;
        }

    });
}


const githubIntegrationButton = document.querySelector('#github-integration-button');
githubIntegrationButton.onclick = () => {
    window.location.href = githubIntegrationLink;
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

setTimeout(() => {
    if (githubIntegrationButton.innerHTML === 'Loading...') {
        githubIntegrationButton.innerHTML = 'Add Integration';
    }
}, 5000);