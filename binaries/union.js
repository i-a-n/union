#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_HTTPS_PORT = exports.DEFAULT_HTTP_PORT = void 0;
const pm2_1 = __importDefault(require("pm2"));
const configure_1 = __importDefault(require("./server/configure"));
const ssl_1 = __importDefault(require("./server/ssl"));
const lint_1 = __importDefault(require("./commands/lint"));
const logger_1 = __importDefault(require("./helper-code/logger"));
const help_1 = __importDefault(require("./commands/help"));
const status_1 = __importDefault(require("./commands/status"));
const stop_1 = __importDefault(require("./commands/stop"));
exports.DEFAULT_HTTP_PORT = 80;
exports.DEFAULT_HTTPS_PORT = 443;
// Check if it's the child process
function isChildProcess() {
    return process.env.CHILD_PROCESS === "true";
}
// Main logic to handle command-line arguments
const args = process.argv.slice(2); // Remove "node" and script name
switch (args[0]) {
    case "status":
        (0, status_1.default)();
        break;
    case "stop":
        (0, stop_1.default)();
        break;
    case "help":
        (0, help_1.default)();
        break;
    case "lint":
        (0, lint_1.default)();
        break;
    default:
        /**
         * The magic happens in this if-statement. If we are currently in a CHILD_PROCESS,
         * we should run an express server. The trick is, if we are NOT in a CHILD_PROCESS,
         * we need to call this very script using pm2, with env.CHILD_PROCESS = true. That
         * way the script will be "re-run" and daemonized by pm2, but on the second run it
         * will just run an express server! That way with one command, in one file, you can
         * both instantiate a pm2 daemon AND have it call a dynamically-configured server.
         */
        if (isChildProcess()) {
            (0, configure_1.default)()
                .then((httpApp) => {
                const httpPort = args[1] || exports.DEFAULT_HTTP_PORT;
                const httpsApp = (0, ssl_1.default)(httpApp);
                const httpsPort = args[2] || exports.DEFAULT_HTTPS_PORT;
                httpApp.listen(httpPort, () => logger_1.default.printDuringStartup(`union server (http) is running on port ${httpPort}`));
                httpsApp.listen(httpsPort, () => logger_1.default.printDuringStartup(`union server (https) is running on port ${httpsPort}`));
            })
                .catch((error) => console.error("error configuring app: ", error));
        }
        else {
            pm2_1.default.connect((err) => {
                if (err) {
                    console.error("error connecting to daemon manager:", err);
                    process.exit(2);
                }
                pm2_1.default.start({
                    script: __filename,
                    exec_mode: "fork",
                    instances: 1,
                    name: "union",
                    env: {
                        CHILD_PROCESS: "true",
                    },
                    output: ".union/output.log", // Standard output log
                    error: ".union/error.log", // Standard error log
                }, (err, apps) => {
                    pm2_1.default.disconnect(); // Disconnect after starting
                    if (err)
                        throw err;
                });
            });
            console.log("server starting. see the .union directory for startup logs.");
        }
}
