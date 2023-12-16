import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

export const __dirname = path.dirname(import.meta.url).replace('file:///', '');

/** Replace text in a file
 * @param {string} filePath - The path to the file
 * @param {string|RegExp} find - String or pattern, like String.prototype.replace()
 * @param {string|Function} replace - String or function, like String.prototype.replace()
 * @param {string} [encoding='utf8'] - The file encoding
 */
export const replaceText = (filePath, find, replace, encoding='utf8') => {
    const absPath = path.join(__dirname, filePath);
    const fileText = fs.readFileSync(
        absPath,
        encoding
    );
    const result = fileText.replace(find, replace);
    fs.writeFileSync(absPath, result, encoding);
}

/** Replace envVars in a file
 * @param {string} filePath - The path to the file
 * @param {object} vars - An object where keys are variable names and values are variable values
 */
export const replaceVars = (filePath, vars) => {
    console.log('Setting vars in', filePath);
    replaceText(filePath, /\/\* ?REPLACE=(\w+) ?\*\/(.*?)\/\* ?END ?\*\//, (match, varGroup, stringGroup) => {
        // from this file, then from .env, then from the default
        const resolved = vars[varGroup] || process.env[varGroup] || stringGroup;
        return `/* REPLACE=${varGroup} */${resolved}/* END */`;
    });
}

export const getCmdArgs = () => {
    const cmdVars = {};
    for (const opt of process.argv) {
        const optName = opt.split('=')[0];
        const value = opt.replace(optName, '').replace('=', '');
        if (!optName || !value) {
            continue;
        }
        modified_vars = true;
        console.log('Set variable', optName, '=', value);
        cmdVars[optName] = value;
    }
    return cmdVars;
}