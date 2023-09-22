//    localStorage.setItem('saveNames', savedList.join(','))

const accountName = localStorage.getItem('accountName');

if (accountName !== null) {
    document.querySelectorAll('.login-list-item').forEach(el => el.style.display = 'none');

    console.log(accountName);

    document.querySelector('#account-name').innerHTML = accountName;

    document.querySelector('#sign-out-button').onclick = () => {
        localStorage.removeItem('accountName');
        localStorage.removeItem('accountSessionKey');
        location.reload();
    }

} else {
    document.querySelectorAll('.account-list-item').forEach(el => el.style.display = 'none');

    const loginButton = document.querySelector('#login-button');
    loginButton.onclick = () => {

        loginButton.innerHTML = 'Authenticating...';

        const username = document.querySelector('#username').value;
        const password = document.querySelector('#password').value;

        fetch('/api/games-store/login.js', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log(data, data.sessionKey);
            if (data.success) {
                localStorage.setItem('accountName', username);
                localStorage.setItem('accountSessionKey', data.sessionKey);
                location.reload();

            } else {
                loginButton.innerHTML = 'Try again';
            }
        });
    }

}
