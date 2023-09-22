

export function serializeObjectsList(objects) {
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
}