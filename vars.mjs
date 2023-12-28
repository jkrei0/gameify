import { replaceVars, getCmdArgs, __dirname } from './node-util.mjs';

const cmdVars = getCmdArgs();

const vercelEnv = process.env.VERCEL_ENV || undefined;
let vercelURL = process.env.VERCEL_BRANCH_URL || cmdVars.vercelURL || 'gameify.vercel.app';
vercelURL = vercelURL.replace('gameify-embed', 'gameify') || cmdVars.vercelEmbedURL || 'gameify-embed.vercel.app';
const vercelEmbedURL = vercelURL.replace('gameify', 'gameify-embed') || cmdVars.vercelEmbedURL || 'gameify-embed.vercel.app';

const default_env = 'vercel';
let environment = process.argv[2] || vercelEnv || default_env;

// Aliases
if (environment === 'development') environment = 'local';
if (environment === 'production') environment = 'vercel';
let modified_vars = false;

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
    },
    preview: {
        originURL: `'https://${vercelURL}'`,
        embedURL: `'https://${vercelEmbedURL}'`
    }
}

if (!envVars[environment]) {
    throw new Error(`Unknown environment: ${environment}`);
}

console.log('Running in directory', __dirname);

console.log('Building for envionment:', environment);

console.log('Using URLs:', envVars[environment].originURL, envVars[environment].embedURL);

replaceVars('./engine/embed/embed.js', envVars[environment]);
replaceVars('./engine/engine.js', envVars[environment]);
replaceVars('./engine/play.js', envVars[environment]);

if (modified_vars) {
    console.log('NOTICE: Not in default environment!');
    console.log('NOTICE: Make sure to reset by running `npm run vars` before committing.');
}