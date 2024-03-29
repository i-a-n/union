"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const basic_auth_1 = __importDefault(require("basic-auth"));
const connect_1 = __importDefault(require("connect"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const serve_static_1 = __importDefault(require("serve-static"));
const vhost_1 = __importDefault(require("vhost"));
const logger_1 = __importDefault(require("../helper-code/logger"));
const tree_traversal_1 = require("../helper-code/tree-traversal");
const utilities_1 = require("../helper-code/utilities");
const _404_1 = __importDefault(require("../html/404"));
// Synchronous function to check for the existence of a direct-child 'html' directory
const containsHtmlDirectory = (pathToDirectory) => {
    try {
        const filesAndFoldersToCheck = fs_1.default.readdirSync(pathToDirectory, {
            withFileTypes: true,
        });
        for (const fileOrFolder of filesAndFoldersToCheck) {
            if (fileOrFolder.name === "html" &&
                (0, utilities_1.isDirectoryOrSymlinkDirectory)(pathToDirectory, fileOrFolder)) {
                return true;
            }
        }
        return false; // No html directory or symlink pointing to a directory found
    }
    catch (error) {
        console.error("error checking for ./html directory:", error);
        return false;
    }
};
/*
 * Core logic of this whole library, arguably. Should return a full express() app, ready to be
 * served via http.
 */
const configureHttpServer = async () => {
    const app = (0, express_1.default)();
    // Loop through candidate subdirectories and configure each one into `app`
    const matches = (0, tree_traversal_1.findDomainSubdirectories)();
    logger_1.default.log({
        locationInCode: "configureHttpServer",
        entry: ["found the following domains to configure: ", matches],
    });
    await Promise.all(matches.map(async (match) => {
        let pathToDomain = path_1.default.join(process.cwd(), match);
        /*
         * We need to use the Express-developed "connect()" middleware thing. See:
         * https://www.npmjs.com/package/connect
         */
        const domainSpecificMiddleware = (0, connect_1.default)();
        // Search for .config files
        const pathToConfigFile = (0, tree_traversal_1.findSingleFile)(pathToDomain, ".union.config.js");
        if (pathToConfigFile && fs_1.default.existsSync(pathToConfigFile)) {
            logger_1.default.log({
                domain: match,
                locationInCode: "configureHttpServer",
                entry: "found config file",
            });
            // Process config file
            try {
                // Dynamically import the config file's exported app
                const importedConfig = await Promise.resolve(`${pathToConfigFile}`).then(s => __importStar(require(s)));
                const customAppConfig = importedConfig.default; // Using default export
                // Use the imported app as middleware
                domainSpecificMiddleware.use(customAppConfig);
            }
            catch (error) {
                console.error(`error importing config file for ${pathToDomain}:`, error);
            }
        }
        /*
         * Each domain needs to `use()` its own static path. Using the `serve-static`
         * library here because, once again, Express said so:
         * https://www.npmjs.com/package/serve-static
         */
        if (containsHtmlDirectory(pathToDomain)) {
            pathToDomain = path_1.default.join(pathToDomain, "html");
        }
        logger_1.default.printDuringStartup(`found domain ${match.toUpperCase()} - serving from ${pathToDomain}`);
        logger_1.default.log({
            locationInCode: "configureHttpServer",
            domain: match,
            entry: `beginning search for per-directory config files in ${pathToDomain}`,
        });
        // Search for .do-not-serve & .union-password files
        Promise.all([
            (0, tree_traversal_1.findFilesRecursive)(pathToDomain, ".do-not-serve"),
            (0, tree_traversal_1.findFilesRecursive)(pathToDomain, ".union-password"),
        ])
            .then((results) => {
            // results is an array containing the results of each promise in the order they were in the array
            const directoriesNotToServe = results[0];
            const directoriesToPasswordProtect = results[1];
            logger_1.default.log({
                locationInCode: "configureHttpServer",
                domain: match,
                entry: [
                    "found these directories not to serve: ",
                    directoriesNotToServe,
                ],
            });
            logger_1.default.log({
                locationInCode: "configureHttpServer",
                domain: match,
                entry: [
                    "found these directories to password protect: ",
                    directoriesToPasswordProtect,
                ],
            });
            directoriesNotToServe.forEach((pathToDoNotServeFile) => {
                // Extract the relative path of the directory containing the .do-not-serve file
                const relativePath = path_1.default.relative(pathToDomain, path_1.default.dirname(pathToDoNotServeFile));
                const routePath = `/${relativePath}/*`; // Format correctly for Express
                // Configure middleware to skip serving this path
                app.use(routePath, (req, res, next) => {
                    return res.status(404).send(_404_1.default);
                });
            });
            directoriesToPasswordProtect.forEach((pathToPasswordFile) => {
                // Read and parse the .union-password file to get credentials
                const passwordContent = fs_1.default.readFileSync(pathToPasswordFile, "utf8");
                const credentialsArray = passwordContent
                    .trim()
                    .split("\n")
                    .map((line) => {
                    const [name, pass] = line.split(":");
                    return { name, pass };
                });
                // Extract the relative path of the directory containing the password file
                const relativePath = path_1.default.relative(pathToDomain, path_1.default.dirname(pathToPasswordFile));
                const routePath = `/${relativePath}`; // Format correctly for Express
                // Configure middleware to not serve the password file
                app.all(`${routePath}/.union-password`, (req, res, next) => res.status(404).send(_404_1.default));
                // Configure middleware to password protect the parent directory and all child directories
                app.all(`${routePath}/*`, (req, res, next) => {
                    const user = (0, basic_auth_1.default)(req);
                    // Check if the user is authenticated
                    const isAuthenticated = credentialsArray.some((credential) => {
                        return (user &&
                            user.name === credential.name &&
                            user.pass === credential.pass);
                    });
                    if (!isAuthenticated) {
                        res.set("WWW-Authenticate", `Basic realm="Protected Area"`);
                        return res.status(401).send("Unauthorized");
                    }
                    next(); // User is authenticated, proceed to next middleware or route handler
                });
            });
        })
            .catch((error) => {
            // If any of the promises rejects, this catch block is executed
            console.error("an error occurred configuring the domain:", error);
        })
            .finally(() => {
            // Serve the domain.
            // TODO: Maybe turn this off if config file is specified?
            // if (!pathToConfigFile) { ...
            domainSpecificMiddleware.use("/", (0, serve_static_1.default)(pathToDomain));
            /*
             * Use the Express-developed "vhost" to create a virtual host for this domain-specific middleware we
             * just configured: https://www.npmjs.com/package/vhost
             */
            app.use((0, vhost_1.default)(match, domainSpecificMiddleware));
        });
    }));
    return app;
};
exports.default = configureHttpServer;
