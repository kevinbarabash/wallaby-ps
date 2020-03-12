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
            const files = [];

            const promises = wallaby.allFiles.map(file => {
                return file.getContent().then(content => {
                    const match = content.match(/^module ([a-zA-Z][[a-zA-Z0-9\.]+)/m);
                    const name = match[1];
                    if (!name) {
                        throw new Error("module name not found");
                    }
                    console.log(`${file.path} = ${name}`);
                    return name;
                }).then(name => {
                    const indexPath = path.join(__dirname, "output", name, "index.js");
                    if (!fs.existsSync(indexPath)) {
                        throw new Error(`no index.js found for ${name}: ${file.path}`);
                    }

                    const content = fs.readFileSync(indexPath, "utf-8");
                    const sourceMap = fs.readFileSync(path.join(__dirname, "output", name, "index.js.map"), "utf-8");

                    files.push(
                        wallaby.createFile({
                            path: path.join("output", name, "index.js"),
                            original: file,
                            content,
                            sourceMap,
                        }),
                    );

                    const foreignPath = path.join(__dirname, "output", name, "foreign.js");
                    if (fs.existsSync(foreignPath)) {
                        const content = fs.readFileSync(foreignPath, "utf-8");
                        files.push(
                            wallaby.createFile({
                                path: path.join("output", name, "foreign.js"),
                                content,
                            }),
                        );
                    }
                });
            });

            promises.push(
                wallaby.createFile({
                    order: Infinity,
                    path: 'run-tests.js',
                    content: 'const {main} = require("./output/Test.Main/index.js");\nmain();',
                }),
            );

            return Promise.all([...promises, ...files]);
        },
    };
}