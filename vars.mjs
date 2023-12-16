import { replaceVars, getCmdArgs, __dirname } from './node-util.mjs';

const default_env = 'vercel';
const environment = process.argv[2] || default_env;
let modified_vars = false;

const cmdVars = getCmdArgs();

const envVars = {
    local: {
        port: 3000,
        originURL: `'http://localhost:3000'`,

        embedPort: cmdVars.embedPort || process.env.EMBED_PORT || 3001,
        embedURL: cmdVars.embedURL || `'http://localhost:${cmdVars.embedPort || process.env.EMBED_PORT || 3001}'`
    },
    vercel: {
        originURL: `'https://gameify.vercel.app'`,
        embedURL: `'https://gameify-embed.vercel.app'`
    }
}

if (!envVars[environment]) {
    throw new Error(`Unknown environment: ${environment}`);
}

console.log('Running in directory', __dirname);

console.log('Building for envionment:', environment);

replaceVars('/engine/embed/embed.js', envVars[environment]);
replaceVars('/engine/play.js', envVars[environment]);

if (environment !== default_env || modified_vars) {
    console.log('NOTICE: Not in default environment!');
    console.log('NOTICE: Make sure to reset by running `npm run vars` before committing.');
}