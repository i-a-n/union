"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = __importDefault(require("connect"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const serve_static_1 = __importDefault(require("serve-static"));
const vhost_1 = __importDefault(require("vhost"));
const utilities_1 = require("../helper-code/utilities");
// Synchronous function to check for the existence of a direct-child 'html' directory
function containsHtmlDirectory(pathToDirectory) {
    try {
        // Read the contents of the directory synchronously
        const entries = fs_1.default.readdirSync(pathToDirectory, { withFileTypes: true });
        // Check if any entry is a directory named 'html'
        const hasHtmlDir = entries.some((dirent) => dirent.isDirectory() && dirent.name === "html");
        return hasHtmlDir;
    }
    catch (error) {
        console.error("Error checking for html directory:", error);
        return false;
    }
}
/*
 * Core logic of this whole library, arguably. Should return a full express() app, ready to be
 * served via http.
 */
const configureTheApp = () => {
    const app = (0, express_1.default)();
    // Loop through candidate subdirectories and configure each one into `app`
    (0, utilities_1.findDomainSubdirectories)()
        .then((matches) => {
        /*
         * For each valid domain subdirectory, configure it. This part will need to get much more
         * sophisticated eventually. For now, just static serving.
         */
        matches.forEach((match) => {
            const pathToDirectory = path_1.default.join(process.cwd(), match);
            /*
             * We need to use the Express-developed "connect()" middleware thing. See:
             * https://www.npmjs.com/package/connect
             */
            const domainSpecificMiddleware = (0, connect_1.default)();
            /*
             * Now each domain needs to `use()` its own static path. Using the `serve-static`
             * library here because, once again, Express said so:
             * https://www.npmjs.com/package/serve-static
             */
            if (containsHtmlDirectory(pathToDirectory)) {
                domainSpecificMiddleware.use("/", (0, serve_static_1.default)(path_1.default.join(pathToDirectory, "html")));
            }
            else {
                domainSpecificMiddleware.use("/", (0, serve_static_1.default)(pathToDirectory));
            }
            /*
             * And then, you guessed it, we use the Express-developed "vhost" to create a virtual
             * host for this domain-specific middleware we just configured:
             * https://www.npmjs.com/package/vhost
             */
            app.use((0, vhost_1.default)(match, domainSpecificMiddleware));
        });
    })
        .catch((err) => {
        console.error("Error:", err);
    });
    return app;
};
exports.default = configureTheApp;
