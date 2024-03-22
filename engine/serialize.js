

export const engineSerialize = {
    objectsList: (objects) => {
        const out = {};
        for (const type in objects) {
            const set = objects[type];
            out[type] = {}
            for (const name in set) {
                const item = set[name];
                const ref = (o) => {
                    return o?.__engine_name;
                }
                if (item.toJSON) {
                    // toJSON(key, ref)
                    // where key is the key (for us, the name of the object)
                    // and ref is a function to generate a reference to another object (non-standard function)
                    out[type][name] = item.toJSON(name, ref);
                } else if (item.serialize) {
                    console.warn(`Object ${type}::${name} is using the old serialization system.`);
                    out[type][name] = item.serialize(ref);
                } else {
                    console.warn(`Cannot save ${type}::${name}`);
                    out[type][name] = false;
                }

                // Keep track of engine data
                out[type][name].__engine_data = {};
                if (item.__engine_folder) {
                    out[type][name].__engine_data.folder = item.__engine_folder
                }
                if (item.__engine_index) {
                    out[type][name].__engine_data.index = item.__engine_index
                }
                if (item.__engine_visible === false) {
                    out[type][name].__engine_data.visible = false;
                }
            }
        }
        return out;
    },

    projectData: (objects, files, integrations) => {
        const data = {
            objects: engineSerialize.objectsList(objects),
            integrations: integrations,
            files: {}
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