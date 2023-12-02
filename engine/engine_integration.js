
let intData = {};

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
    }
}