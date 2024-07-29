
import { engineFetch } from '/engine/engine_fetch.js';
engineFetch.setSessionFunction(() => {
    document.querySelector('#sign-out-button').click(); 
});

const accountName = localStorage.getItem('accountName');

if (accountName !== null) {
    document.querySelectorAll('.login-list-item').forEach(el => el.style.display = 'none');

    document.querySelector('#account-name').innerHTML = accountName;

    document.querySelector('#sign-out-button').onclick = () => {
        localStorage.removeItem('accountName');
        localStorage.removeItem('accountSessionKey');
        location.reload();
    }

    const changePasswordButton = document.querySelector('#change-password-button');
    changePasswordButton.onclick = () => {
        const oldPass = document.querySelector('#chp-old-password').value;
        const newPass = document.querySelector('#chp-new-password').value;
        const repeatPass = document.querySelector('#chp-repeat-password').value;

        if (newPass !== repeatPass) {
            changePasswordButton.innerHTML = 'Passwords do not match';
            repeatPass.value = '';
            return;
        }

        changePasswordButton.innerHTML = 'Updating...';
        fetch('/api/games-store/change-password', {
            method: 'POST',
            body: JSON.stringify({
                username: accountName,
                password: oldPass,
                new_password: newPass,
                sessionKey: localStorage.getItem('accountSessionKey'),
            })
        })
        .then (engineFetch.toJson)
        .then(result => {
            if (result.error) {
                engineFetch.checkSessionErrors(result);
            } else if (result.success) {
                changePasswordButton.innerHTML = 'Password updated!';
            } else {
                changePasswordButton.innerHTML = 'Try again';
            }
        })
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
    .then(engineFetch.toJson)
    .then(result => {
        cloudLoadingIndicator.remove();

        if (result.error) {
            engineFetch.checkSessionErrors(result);
        }

        if (!result.games || result.games.length === 0) {
            const message = document.createElement('span');
            message.classList.add('list-item');
            message.innerText = 'No saved projects';
            listElem.appendChild(message);
        }

        for (const game of result.games) {
            const name = game.title
            const button = document.createElement('button');
            button.classList.add('list-item');
            button.onclick = () => {
                window.location.href = `/engine/engine.html#${accountName}/${name}`;
            }
            button.innerText = name;

            const playButton = document.createElement('button');
            playButton.onclick = () => {
                window.open(`${window.location.protocol}//${window.location.host}/engine/play.html#${cloudAccountName}/${name}`, '_blank');
            }
            playButton.classList.add('right');
            playButton.innerText = 'Play';
            button.appendChild(playButton);

            listElem.append(button);
        }
    });

} else {
    document.querySelectorAll('.account-list-item').forEach(el => el.style.display = 'none');

    const loginButton = document.querySelector('#login-button');
    const usernameEl = document.querySelector('#username');
    const passwordEl = document.querySelector('#password');

    usernameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordEl.focus();
    })
    passwordEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginButton.click();
    })

    loginButton.onclick = () => {

        loginButton.innerHTML = 'Authenticating...';

        const username = usernameEl.value;
        const password = passwordEl.value;

        fetch('/api/games-store/login', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(engineFetch.toJson)
        .then(data => {
            if (data.success) {
                localStorage.setItem('accountName', username);
                localStorage.setItem('accountSessionKey', data.sessionKey);
                location.reload();

            } else {
                loginButton.innerHTML = 'Try again';
                if (data.error.includes('server error')) loginButton.innerHTML = 'Server Error';
            }
        }).catch((e) => {
            console.error(e);
            loginButton.innerHTML = 'Server Error';
        });
    }

}
