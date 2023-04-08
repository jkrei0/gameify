

export let docs = {
    /** Returns the documentation link to a given concept
     * @package
     * @arg {String} concept - The name of a gameify class or concept, eg "Screen"
     */
    getDocs: function (concept, permalink) {
        let docsPath = "localhost:8080/out/";
        switch (concept) {
            default:
                return `${docsPath + concept}.html#${permalink ? permalink : ""}`;
        }
    },
}