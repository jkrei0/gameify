

const popupQueue = [];

export const popup = {
    /** Show a popup
     * @param {string} titleText - The title of the popup
     * @param {string} [descText] - Paragraph text
     * @param {object} buttons - Buttons { text => function(button, inputValue, selectValue) }
     * @param {string} [inputPlaceholder] - Input placeholder text. Input is hidden if undefined
     * @param {string} [inputText=""] - Initial input text
     * @param {string} [selOptions] - Select options, as HTML, an array, or an object {value: displayText}
     */
    show: async (titleText, descText, buttons, inputPlaceholder, inputText, selOptions) => {
        const container = document.querySelector('#popup');
        if (container.classList.contains('visible')) {
            // only open one popup at a time
            await new Promise((resolve) => {
                popupQueue.push(resolve);
            });
        }
        container.classList.add('visible');

        const popupContent = container.querySelector('.popup-content');
        popupContent.querySelector('h3').innerHTML = titleText;
        popupContent.querySelector('p').innerHTML = descText || '';
        const input = popupContent.querySelector('input');
        input.placeholder = inputPlaceholder || 'Input text';
        input.value = inputText || '';
        const select = popupContent.querySelector('select');

        if (typeof options === 'string') {
            select.innerHTML = selOptions;
        } else if (Array.isArray(selOptions)) {
            select.innerHTML = '';
            select.innerHTML += `<option disabled selected>Select an option</option>`;
            for (const option of selOptions) {
                select.innerHTML += `<option>${option}</option>`;
            }
        } else if (typeof selOptions === 'object') {
            select.innerHTML = '';
            select.innerHTML += `<option disabled selected>Select an option</option>`;
            for (const option in selOptions) {
                select.innerHTML += `<option value="${option}">${selOptions[option]}></option>`;
            }
        }

        if (inputPlaceholder === undefined) {
            input.style.display = 'none';
        } else {
            input.style.display = 'block';
            input.focus();
        }

        if (!selOptions) {
            select.style.display = 'none';
        } else {
            select.style.display = 'block';
            input.focus();
        }

        const buttonRow = container.querySelector('.button-row');
        buttonRow.innerHTML = '';

        let lastButton = undefined;
        for (const btnText in buttons) {
            const button = document.createElement('button');
            button.innerHTML = btnText;
            button.onclick = () => {
                popup.close();
                buttons[btnText](btnText, input.value, select.value);
            } 
            buttonRow.appendChild(button);
            lastButton = button;
        }
        if (!selOptions && !inputPlaceholder) {
            lastButton.focus();
        }

        input.addEventListener('keyup', (evt) => {
            if (evt.key === 'Enter') {
                lastButton.focus();
            }
        });
    },
    showNext: () => {
        const container = document.querySelector('#popup');
        if (container.classList.contains('visible')) {
            console.warn('Attempting to showNext while a popup is visible! Canceled.');
            return;
        }
        if (popupQueue.length > 0) {
            const next = popupQueue.shift();
            next();
        }
    },
    /** Force the popup to close. The popup is always automatically closed when any button is pressed. */
    close: () => {
        const container = document.querySelector('#popup');
        container.classList.remove('visible');
        popup.showNext();
    },
    alert: (title, text, btnText = 'OK') => { 
        return new Promise((resolve, reject) => {
            const buttons = {};
            buttons[btnText] = ()=>{ resolve(true); }

            popup.show(title, text, buttons);
        });
    },
    confirm: (title, text, confirmText = 'OK', cancelText = 'Cancel', altText) => {
        return new Promise((resolve, reject) => {
            const buttons = {};
            buttons[cancelText] = ()=>{ resolve(false); }
            if (altText) buttons[altText] = ()=>{ resolve(altText); }
            buttons[confirmText] = ()=>{ resolve(true); }

            popup.show(title, text, buttons);
        });
    },
    prompt: (title, text, inputText = '', placeholder = 'Enter text', confirmText = 'OK', cancelText = 'Cancel') => {
        return new Promise((resolve, reject) => {
            const buttons = {};
            buttons[cancelText] = ()=>{ resolve(false); }
            buttons[confirmText] = (button, value)=>{ resolve(value); }

            popup.show(title, text, buttons, placeholder, inputText);
        });
    },
    selectPrompt: (title, text, options, inputText, placeholder, confirmText = 'OK', cancelText = 'Cancel') => {
        return new Promise((resolve, reject) => {
            const buttons = {};
            buttons[cancelText] = ()=>{ resolve(false); }
            buttons[confirmText] = (button, value, selectValue)=>{ resolve(value || selectValue); }

            popup.show(title, text, buttons, placeholder, inputText, options);
        });
    }

}