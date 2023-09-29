
const listeners = {};

export const engineEvents = {
    /** Listen for the specified event and execute the provided callback.
     * When the event is emitted, calls `callback(event, ...args)`
     * @param {string} event - The event to listen for.
     * @param {function} callback - The callback function to execute when the event occurs.
     */
    listen: (event, callback) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
    },
    /**
     * Emits the specified event and passes any additional arguments to the event listeners.
     * @param {string} event - The name of the event to emit.
     * @param {...any} args - Additional arguments to pass to the event listeners.
     */
    emit: (event, ...args) => {
        if (listeners[event]) {
            listeners[event].forEach(listener => {
                listener(event, ...args);
            });
        }
    }
}