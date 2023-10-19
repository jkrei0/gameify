//    localStorage.setItem('saveNames', savedList.join(','))

const accountName = localStorage.getItem('accountName');

if (accountName !== null) {
    document.querySelectorAll('.login-list-item').forEach(el => el.style.display = 'none');

    document.querySelector('#account-name').innerHTML = accountName;

    document.querySelector('#sign-out-button').onclick = () => {
        localStorage.removeItem('accountName');
        localStorage.removeItem('accountSessionKey');
        location.reload();
    }

    const listElem = document.querySelector('#projects-list');

    const cloudLoadingIndicator = document.createElement('span');
    cloudLoadingIndicator.classList.add('list-item');
    cloudLoadingIndicator.innerHTML = 'Loading cloud saves...';
    listElem.prepend(cloudLoadingIndicator);

    fetch('/api/games-store/list-games', {
        method: 'POST',
        body: JSON.stringify({
            username: accountName,
            sessionKey: localStorage.getItem('accountSessionKey')
        })
    })
    .then(res => res.json())
    .then(result => {
        cloudLoadingIndicator.remove();

        if (result.error) {
            if (result.error.includes('session')) {
                document.querySelector('#sign-out-button').click();
            }
        }

        for (const game of result.games) {
            const name = game.title
            const button = document.createElement('span');
            button.classList.add('list-item');
            button.innerText = name;
            listElem.append(button);
        }
    });

} else {
    document.querySelectorAll('.account-list-item').forEach(el => el.style.display = 'none');

    const loginButton = document.querySelector('#login-button');
    loginButton.onclick = () => {

        loginButton.innerHTML = 'Authenticating...';

        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;

        fetch('/api/games-store/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('accountName', username);
                localStorage.setItem('accountSessionKey', data.sessionKey);
                location.reload();

            } else {
                loginButton.innerHTML = 'Try again';
                if (data.error.includes('server error')) loginButton.innerHTML = 'Server Error';
            }
        }).catch(() => {
            loginButton.innerHTML = 'Server Error';
        });
    }

}
