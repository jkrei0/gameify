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
        .then (res => res.json())
        .then(result => {
            if (result.error) {
                if (result.error.includes('session')) {
                    document.querySelector('#sign-out-button').click();
                }
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
        }).catch((e) => {
            console.error(e);
            loginButton.innerHTML = 'Server Error';
        });
    }

}
