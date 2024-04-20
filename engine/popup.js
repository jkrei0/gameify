

export const popup = {
    /** Show a popup
     * @param {string} titleText - The title of the popup
     * @param {string} [descText] - Paragraph text
     * @param {object} buttons - Buttons { text => function(button, inputValue, selectValue) }
     * @param {string} [inputPlaceholder] - Input placeholder text. Input is hidden if undefined
     * @param {string} [inputText=""] - Initial input text
     * @param {string} [selOptions] - Select options, as HTML
     */
    show: (titleText, descText, buttons, inputPlaceholder, inputText, selOptions) => {
        const container = document.querySelector('#popup');
        container.classList.add('visible');

        const popupContent = container.querySelector('.popup-content');
        popupContent.querySelector('h3').innerHTML = titleText;
        popupContent.querySelector('p').innerHTML = descText;
        const input = popupContent.querySelector('input');
        input.placeholder = inputPlaceholder || 'Input text';
        input.value = inputText || '';
        const select = popupContent.querySelector('select');
        select.innerHTML = selOptions;

        if (inputPlaceholder === undefined) {
            input.style.display = 'none';
        } else {
            input.style.display = 'block';
        }

        if (!selOptions) {
            select.style.display = 'none';
        } else {
            select.style.display = 'block';
        }

        const buttonRow = container.querySelector('.button-row');
        buttonRow.innerHTML = '';

        for (const btnText in buttons) {
            const button = document.createElement('button');
            button.innerHTML = btnText;
            button.onclick = () => {
                container.classList.remove('visible');
                buttons[btnText](btnText, input.value, select.value);
            } 
            buttonRow.appendChild(button);
        }
    },
    /** Force the popup to close. The popup is always automatically closed when any button is pressed. */
    close: () => {
        const container = document.querySelector('#popup');
        container.classList.remove('visible');
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