
export const engineUI = {
    /** Generates a two-input form item
     *
     * @param {string} text - The text to display for the item.
     * @param {string[]} values - The initial values for the two inputs.
     * @param {string} [type='text'] - The type of input to use (i.e. 'text' or 'number').
     * @param {function} [call=()=>{}] - The callback function to execute when the inputs change.
     * @return {HTMLElement[]} An array containing the label, first input, and second input elements.
     */
    twoInputItem: (text, values = ['', ''], type = 'text', call = ()=>{}) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
    
        const xvl = document.createElement('span');
        xvl.classList.add('x-value-label');
        label.appendChild(xvl);
        const input = document.createElement('input');
        input.setAttribute('type', type);
        input.value = values[0];
        if (type === 'number') input.onchange = ()=>{ call(Number(input.value), Number(input2.value)); };
        else input.onchange = ()=>{ call(input.value, input2.value); };
        label.append(input);
    
        const yvl = document.createElement('span');
        yvl.classList.add('y-value-label');
        label.appendChild(yvl);
        const input2 = document.createElement('input');
        input2.setAttribute('type', type);
        input2.value = values[1];
        if (type === 'number') input2.onchange = ()=>{ call(Number(input.value), Number(input2.value)); };
        else input2.onchange = ()=>{ call(input.value, input2.value); };
        label.append(input2);
    
        return [label, input, input2];
    },
    /** Creates an image preview with the specified label and source.
     *
     * @param {string} text - The text to be displayed on the label.
     * @param {string} source - The source URL of the image.
     * @return {Array} An array containing the label and the image element.
     */
    imageItem: (text, source) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
        const image = document.createElement('img');
        image.classList.add('preview');
        image.src = source;
        label.append(image);
        return [label, image];
    },
    /** Generates an audio preview item.
     * @param {string} text - The text to be displayed in the label.
     * @param {string} source - The source URL for the audio element.
     * @return {HTMLElement[]} An array containing the label and the audio element.
     */
    audioItem: (text, source) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
        const audio = document.createElement('audio');
        audio.classList.add('preview');
        audio.src = source;
        audio.volume = 0.1;

        const playpause = document.createElement('button');
        playpause.classList.add('icon-button');
        const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-play" viewBox="0 0 16 16">
            <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
        </svg>`;
        const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
            <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
        </svg>`;
        const brokenIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-file-earmark-x" viewBox="0 0 16 16">
            <path d="M6.854 7.146a.5.5 0 1 0-.708.708L7.293 9l-1.147 1.146a.5.5 0 0 0 .708.708L8 9.707l1.146 1.147a.5.5 0 0 0 .708-.708L8.707 9l1.147-1.146a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146z"/>
            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
        </svg>`
        playpause.innerHTML = playIcon;
        playpause.onclick = () => {
            if (audio.paused) {
                playpause.innerHTML = pauseIcon;
                audio.play().catch(() => {
                    playpause.innerHTML = brokenIcon;
                });
            } else {
                playpause.innerHTML = playIcon;
                audio.pause();
            }
        }

        const volume = document.createElement('input');
        volume.setAttribute('type', 'number');
        volume.value = audio.volume * 100;
        volume.onchange = () => {
            if (volume.value < 1) volume.value = 1;
            if (volume.value  > 100) volume.value = 100;
            audio.volume = volume.value / 100;
        }

        label.append(playpause);
        label.append(volume);
        label.append(audio);
        return [label, audio];
    },
    /** Generates a selection box form item
    *
    * @param {string} text - Label text
    * @param {Array<string>} options - Possible dropdown options
    * @param {function} [call=() => {}] - The callback function to execute when the inputs change.
    * @param {string} selected - The currently selected parameter.
    * @return {Array<HTMLElement>} An array containing the label and input elements.
    */
    selectItem: (text, options, call = () => { }, selected) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
        const input = document.createElement('select');
        input.onchange = () => {
            if (input.value !== 'None::None') {
                input.querySelector('option[value="None::None"]').setAttribute('disabled', true);
            }
            call(input.value);
        };
    
        input.innerHTML += `<option value="None::None" ${selected ? 'disabled' : ''}>- None -</option>`;
        for (const opt of options) {
            input.innerHTML += `<option ${selected === opt ? 'selected' : ''}>${opt}</option>`;
        }
        label.append(input);
        return [label, input];
    },
    /** Generates a label and input element form item.
     * @param {string} text - The label text to display.
     * @param {any} value - The initial value of the input element.
     * @param {string} type - The type of input element to create. Default is 'text'.
     * @param {function} call - The callback function to execute when the input value changes.
     * @return {Array} An array containing the label and input elements.
     */
    inputItem: (text, value, type = 'text', call = ()=>{}) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
        const input = document.createElement('input');
        input.setAttribute('type', type);
        if (value !== undefined) input.value = value;
        if (value !== undefined && type == 'checkbox') input.checked = value;
        if (type === 'file') {
            input.onchange = ()=>{ call(input.files); }
        } else if (type === 'checkbox') {
            input.onchange = ()=>{ call(input.checked); }
        } else if (type === 'number') {
            input.onchange = ()=>{ call(Number(input.value)); }
        } else {
            input.onchange = ()=>{ call(input.value); }
        }
        label.append(input);
        return [label, input];
    },
    /** Creates a form item element with a label and button.
    * @param {string} text - The text to be displayed in the label.
    * @param {string} btn - The text to be displayed in the button.
    * @param {function} call - The function to be called when the button is clicked. Default is an empty function.
    * @return {HTMLElement} - The labeled item element.
    */
    labelItem: (text, btn, call = ()=>{}) => {
        const label = document.createElement('span');
        label.classList.add('list-item');
        label.classList.add('property');
        label.innerHTML = text;
        const button = document.createElement('button');
        button.innerHTML = btn;
        button.onclick = call;
        if (btn !== undefined) label.append(button);
        return label;
    }
}