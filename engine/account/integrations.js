
const accountName = localStorage.getItem('accountName');

if (!accountName)  {
    window.location.href = '/engine/account.html';
}

const urlParams = new URLSearchParams(window.location.search);
const githubCode = urlParams.get('code');

document.querySelector('#github-integration-button').onclick = () => {
    window.location.href = 'https://github.com/apps/gameify-gh/installations/new/';
}

if (githubCode) { // Do github integration
    fetch('/api/integrations/github-callback', {
        method: 'POST',
        body: JSON.stringify({
            username: accountName,
            code: githubCode,
            sessionKey: localStorage.getItem('accountSessionKey')
        })
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            document.querySelector('#github-integration-button').innerHTML = 'yay!';
        }
    });
}