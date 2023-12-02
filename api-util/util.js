import exec from 'child_process';
import path from 'path';

export const gitDirectory = 'project-dir';

export async function parseGfEngineConfig(configText, baseDir = gitDirectory) {
    const config = {
        folder: '.',
        objects: 'objects.gpj',
        ignore: ['.git']
    }
    for (const line of configText.split('\n')) {
        if (line.startsWith('#')) continue;
        const param = line.split(':')[0].trim();
        const value = line.split(':')[1].trim();

        if      (param == 'FOLDER')   config.folder = path.join(baseDir, value);
        else if (param == 'OBJECTS')  config.objects = value;
        else if (param == 'IGNORE')   config.ignore.push(value);
    }
    // Don't include the objects file
    config.ignore.push(config.objects);

    return config;
}

export async function execInDir(command, dir = gitDirectory) {
    return new Promise((resolve, reject) => {
        exec.exec(command, {
            cwd: path.join(process.cwd(), dir)
        }, function(error, stdout, stderr) {
            if (error) {
                reject({ error, stdout, stderr });
            }
            else resolve({ stdout, stderr });
        });
    });
}

/** Check if a file is ignored
 * @param {String} [basePath=''] - directory the file is in. Leave empty if `file` is a full path
 * @param {String} file - The name of the file. Can be a full path, if so, `path` should be empty
 * @param {Object} config - The config object (should contain an array called `ignore`)
 */
export function fileIsIgnored(basePath = '', file, config) {
    if (basePath === '') {
        const parts = file.split('/');
        parts.pop();
        basePath = parts.join('/') + '/';
    }
    if (!basePath.endsWith('/')) basePath += '/';
    if (basePath.startsWith('/')) basePath = basePath.slice(1);

    // MATCH                                                        // TYPE                        EXAMPLE IGNORE
    if (config.ignore.includes(file))               return true;    // filename                    file.txt
    if (config.ignore.includes(file.split('/').pop()))return true;  // filename w/o path           file.txt
    if (config.ignore.includes('/' + file))         return true;    // root filename               /file.txt
    if (config.ignore.includes(basePath + file))        return true;    // path + filename             folder/file.txt
    if (config.ignore.includes('/' + basePath + file))  return true;    // root path + filename        /folder/file.txt
    if (config.ignore.includes(basePath))               return true;    // path                        folder/
    if (config.ignore.includes('/' + basePath))         return true;    // root path                   /folder/
    if (config.ignore.includes(path.extname(file))) return true;    // file extension              .txt
    return false;
}