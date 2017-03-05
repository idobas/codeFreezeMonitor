module.exports = {
    entry: {
        index: "./js/compiled.js",
        background: "./js/backgroundCompiled.js"
    },
    output: {
        filename: "js/[name].bundle.js"
    },
    node: {
        fs: "empty"
    }
};