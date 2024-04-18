
export const engineState = {
    // The list of objects in the project
    // accessed as engineState.objects[type][name]
    objects: {},
    // The list of files in the project
    // Each file is either a string or an Ace editor session
    files: {},
    // The Ace editor
    editor: ace.edit("ace-editor"),
    // Array of folders currently (visually) opened/expanded
    // so the objects list doesn't jump around when it's refreshed
    openFolders: [],
    // The name of the open project
    projectFilename: undefined,
    sanitizedFilename: () => {
        return (engineState.projectFilename || 'gameify_project').toLowerCase().replace(/[^a-zA-z0-9._ ()]/g, '_')
    }
}

engineState.editor.setTheme("ace/theme/dracula");
engineState.editor.setOptions({fontSize: '16px'});