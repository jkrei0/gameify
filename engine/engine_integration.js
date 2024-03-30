import { engineSerialize } from './serialize.js';
import { engineState } from './engine_state.js';
import { engineEvents } from './engine_events.js';
import { engineFetch } from './engine_fetch.js';

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

const visualLog = (...args) => engineEvents.emit('visual log', ...args);

export const githubIntegration = {
    pushProject: () => {
        const saved = engineSerialize.projectData(engineState.objects, engineState.files, engineIntegrations.getIntegrations());

        if (engineIntegrations.getProvider() !== 'github') {
            visualLog(`Current project does not have GitHub integration.`, 'error', 'github push');
        }

        const repoName = engineIntegrations.getRepo();
        const commitMessage = prompt('Describe your changes', 'Update project')?.replaceAll(',', '_');
        if (!commitMessage) {
            visualLog(`Github push canceled`, 'warn', 'github push');
            return;
        }

        visualLog(`Pushing changes to GitHub...`, 'info', 'github progress');

        fetch('/api/integrations/github-push-game', {
            method: 'POST',
            body: JSON.stringify({
                username: localStorage.getItem('accountName'),
                sessionKey: localStorage.getItem('accountSessionKey'),
                repo: repoName,
                url: 'https://github.com/' + repoName,
                message: commitMessage,
                data: saved
            })
        })
        .then(engineFetch.toJson)
        .then(result => {
            if (result.error) {
                visualLog(`Failed to push to GitHub.`, 'error', 'github project');
                visualLog(`Failed to push '${repoName}' to GitHub.`, 'error', 'github push');
                if (engineFetch.checkSessionErrors(result)
                    || engineFetch.checkGithubErrors(result, repoName)
                ) {
                    return;
                } else if (result.error.includes('merge conflict')) {
                    visualLog(`Merge conflict`, 'info', 'github project');
                    visualLog(`There was a merge conflict while pushing your changes<br>
                        Your changes were pushed to a new branch, <code>${result.branch}</code><br>
                        You'll need to resolve these issues on your own.`,
                        'warn', 'github push');

                } else visualLog(result.error, 'warn', 'github push');
                return;
            }
            if (result.message.includes('no changes')) {
                visualLog(`Up-to-date with Github`, 'info', 'github project');
                visualLog(`Did not push to GitHub, no changes (your copy is up to date with '${repoName}').`, 'info', 'github push');
            } else {
                visualLog(`Pushed changes to '${repoName}'.`, 'info', 'github progress');
            }
        });
    },
    diffProject: () => {
        const button = document.querySelector('#github-diff-button');
        button.innerHTML = 'Loading...'

        const repo = engineIntegrations.getRepo();
        visualLog(`Loading diff from github: '${repo}' ...`, 'info', 'github diff');

        loadGithubRepo(repo, (result) => {
            engineIntegrations.setDiffContents(result.data);
            listFiles();
            visualLog(`Loaded diff from '${repo}'`, 'info', 'github diff');
            document.querySelector('#diff-objects-button').style.display = '';
            document.querySelector('#diff-objects-button').addEventListener('click', () => {
                engineEvents.emit('show window', 'editor-diff');
                engineIntegrations.showDiff(engineSerialize.objectsList(engineState.objects));
            });
            button.innerHTML = 'Diff';
        }, (result) => {
            button.innerHTML = 'Diff';
        });
    }
}