
const sendButton = document.querySelector('#send-request-button');

sendButton.onclick = () => {
    sendButton.innerHTML = 'Sending';
    fetch('/api/account/request', {
        method: 'POST',
        body: JSON.stringify({
            name: document.querySelector('#name').value,
            username: document.querySelector('#username').value,
            email: document.querySelector('#email').value,
            reason: document.querySelector('#reason').value,
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.querySelector('.request-received').style.display = 'block';
            document.querySelector('.account-request').style.display = 'none';
    
        } else if (data.error) {
            sendButton.innerText = data.error;
    
        } else {
            sendButton.innerHTML = 'Server Error';
        }
    
    }).catch(() => {
        sendButton.innerHTML = 'Server Error';
    });
}
