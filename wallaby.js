const fs = require("fs");
const path = require("path");

module.exports = () => {
    return {
        env: {
            type: "node",
        },

        files: [
            "src/**/*.purs",
            ".spago/*/*/src/**/*.purs", // avoid catenable-lists/v5.0.1/benchmarks/src/
        ],

        tests: [
            "test/**/*.purs",
        ],

        postprocessor: function (wallaby) {
            const promises = wallaby.allFiles.map(file => {
                return file.getContent().then(content => {
                    const match = content.match(/^module ([a-zA-Z\.]+)/m);
                    const name = match[1];
                    if (!name) {
                        throw new Error("module name not found");
                    }
                    return name;
                }).then(name => {
                    const indexPath = path.join(__dirname, "output", name, "index.js");
                    if (!fs.existsSync(indexPath)) {
                        throw new Error(`no index.js found for ${name}: ${file.path}`);
                    }

                    const content = fs.readFileSync(path.join(__dirname, "output", name, "index.js"), "utf-8");
                    const sourceMap = fs.readFileSync(path.join(__dirname, "output", name, "index.js.map"), "utf-8");

                    return wallaby.createFile({
                        path: file.path,
                        original: file,
                        content,
                        sourceMap,
                    });
                });
            });

            promises.push(
                wallaby.createFile({
                    order: Infinity,
                    path: 'run-tests.js',
                    content: 'const {main} = require("./output/Test.Main/index.js");\nmain();',
                }),
            );

            return Promise.all(promises);
        },
    };
}