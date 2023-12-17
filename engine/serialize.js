

export const engineSerialize = {
    objectsList: (objects) => {
        const out = {};
        for (const type in objects) {
            const set = objects[type];
            out[type] = {}
            for (const name in set) {
                const item = set[name];
                if (item.serialize) {
                    out[type][name] = item.serialize((o) => {
                        return o?.__engine_name;
                    });
                } else {
                    console.warn(`Cannot save ${type}::${name}`);
                    out[type][name] = false;
                }
            }
        }
        return out;
    },

    projectData: (objects, files, integrations) => {
        const data = {
            objects: engineSerialize.objectsList(objects),
            integrations: integrations,
            files: files
        };
        for (const file in files) {
            if (!files[file].getValue) {
                // getValue doesn't exist if ace hasn't loaded yet,
                // so in this case, just grab the file text this way
                data.files[file] = files[file];
                continue;
            }
            data.files[file] = files[file].getValue();
        }
        return data;
    }
};