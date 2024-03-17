
let intData = {};
let diffData = {};
let lastDiffer = undefined;

export const engineIntegrations = {
    getIntegrations: () => {
        return intData;
    },
    getProvider: () => {
        if      (intData.github) return 'github';
        else if (intData.git)    return 'git';
        else                     return undefined;
    },
    getRepo: () => {
        return intData.githubRepo;
    },
    setIntegrations: (data) => {
        intData = data || {};
        diffData = {};
    },
    setDiffContents: (data) => {
        diffData = data || {};
    },
    haveDiff: () => {
        if (intData.git && diffData.objects) return true;
        return false;
    },
    showDiff: async (file, files = []) => {
        if (lastDiffer) lastDiffer.destroy();
        document.querySelector('#diff-filename').innerText = file;

        let currentContents = files[file]?.getValue() || '';
        let githubContents = (diffData.files || {})[file] || '';
        let diffObjectsList = false;
        if (files.length === 0) {
            diffObjectsList = true;
            document.querySelector('#diff-filename').innerText = `objects.gpj`;
            currentContents = JSON.stringify({ "objects": file }, null, 2);
            githubContents = JSON.stringify({ "objects": diffData.objects }, null, 2);
        }
        
        let mode;
        if (diffObjectsList) mode = "ace/mode/json";
        else if (file.endsWith('.js')) mode = "ace/mode/javascript";
        else if (file.endsWith('.css')) mode = "ace/mode/css";
        else if (file.endsWith('.html')) mode = "ace/mode/html";
        const differ = new AceDiff({
            element: '#ace-editor-diff',
            theme: 'ace/theme/dracula',
            diffGranularity: 'specific',
            mode: mode,
            left: {
                content: currentContents,
                copyLinkEnabled: false,
                editable: !diffObjectsList
            },
            right: {
                content: githubContents,
                copyLinkEnabled: false,
                editable: false
            },
        });
        const { left, right } = differ.getEditors();
        left.on('change', () => {
            files[file]?.setValue(left.getValue());
            const changes = differ.getNumDiffs();
            document.querySelector('#diff-num-changes').innerText = changes + ' change' + (changes === 1 ? '' : 's');
        });
        for (const editor of [left, right]) {
            editor.setOptions({fontSize: '16px'})
        }
        setTimeout(() => {
            const changes = differ.getNumDiffs();
            document.querySelector('#diff-num-changes').innerText = changes + ' change' + (changes === 1 ? '' : 's');
        });

        
        lastDiffer = differ;
    }
}