"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("connect"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const utilities_1 = require("../helper-code/utilities");
const path_1 = __importDefault(require("path"));
const serve_static_1 = __importDefault(require("serve-static"));
const vhost_1 = __importDefault(require("vhost"));
// Async function to find subdirectories matching domain name pattern. Honestly
// not too sure whether async is right here. I think we could use a `syncReaddr`
// or something like that instead of `fs.promises.readdir`, if we start seeing
// odd filesystem bugs, to make it synchronous. That could simplify things and
// I'm sure the speed difference is negligible.
const findDomainSubdirectories = async () => {
    const currentDir = process.cwd();
    const entries = await fs_1.default.promises.readdir(currentDir, {
        withFileTypes: true,
    });
    // Note that this isn't recursive. We're only looking for direct child subdirectories
    // that are domain names, not grandchild and great-great-great-greatgrandchild dirs.
    const directories = entries
        .filter((entry) => entry.isDirectory() && (0, utilities_1.isValidDomain)(entry.name))
        .map((entry) => entry.name);
    return directories;
};
// Core logic of this whole library, arguably. Should return a full express() app, ready to be
// served via http.
const configureTheApp = () => {
    const app = (0, express_1.default)();
    // Loop through candidate subdirectories and configure each one into `app`
    findDomainSubdirectories()
        .then((matches) => {
        // For each valid domain subdirectory, configure it. This part will need to get much more
        // sophisticated eventually. For now, just static serving.
        matches.forEach((match) => {
            // We need to use the Express-developed "connect()" middleware thing. See:
            // https://www.npmjs.com/package/connect
            const domainSpecificMiddleware = (0, connect_1.default)();
            // Now each domain needs to `use()` its own static path. Using the `serve-static`
            // library here because, once again, Express said so:
            // https://www.npmjs.com/package/serve-static
            domainSpecificMiddleware.use("/", (0, serve_static_1.default)(path_1.default.join(process.cwd(), match)));
            // And then, you guessed it, we use the Express-developed "vhost" to create a virtual
            // host for this domain-specific middleware we just configured:
            // https://www.npmjs.com/package/vhost
            app.use((0, vhost_1.default)(match, domainSpecificMiddleware));
        });
    })
        .catch((err) => {
        // Note that I'm afraid this error gets eaten by the pm2 parent process. TODO:
        // make it not do that!
        console.error("Error:", err);
    });
    return app;
};
exports.default = configureTheApp;
