const fs = require("fs");
const path = require("path");

const pursCompiler = file => {
    const match = file.content.match(/^module ([a-zA-Z][[a-zA-Z0-9\.]+)/m);
    if (match === null) {
        console.log(file);
        throw new Error("match is null");
    }
    const name = match[1];
    if (!name) {
        throw new Error("module name not found");
    }

    const indexPath = path.join(__dirname, "output", name, "index.js");
    if (!fs.existsSync(indexPath)) {
        throw new Error(`no index.js found for ${name}: ${file.path}`);
    }

    const code = fs.readFileSync(indexPath, "utf-8");
    const map = fs.readFileSync(path.join(__dirname, "output", name, "index.js.map"), "utf-8");
    
    return {
        map,
        code,
    };
};

module.exports = () => {
    return {
        trace: true,

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

        compilers: {
            "**/*.purs": pursCompiler,
            ".spago/**/*.purs": pursCompiler,
        },

        postprocessor: wallaby => {

            const promises = [];

            const outputDir = path.join(__dirname, "output");
            for (const child of fs.readdirSync(path.join(__dirname, "output"))) {
                const childDir = path.join(outputDir, child);
                const stats = fs.lstatSync(childDir);
                if (stats.isDirectory()) {
                    const indexPath = path.join(childDir, "index.js");
                    if (fs.existsSync(indexPath)) {
                        const content = fs.readFileSync(indexPath, "utf-8");
                        promises.push(
                            wallaby.createFile({
                                path: path.join(child, "index.js"),
                                content: content,
                            }),
                        );
                    }
                    
                    const foreignPath = path.join(childDir, "foreign.js");
                    if (fs.existsSync(foreignPath)) {
                        const content = fs.readFileSync(foreignPath, "utf-8");
                        promises.push(
                            wallaby.createFile({
                                path: path.join(child, "foreign.js"),
                                content: content,
                            }),
                        );
                    }
                }
            }

            return Promise.all(promises);
        },
    };
}