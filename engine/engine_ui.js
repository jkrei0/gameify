
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